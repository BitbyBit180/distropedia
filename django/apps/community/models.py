"""Reddit-style community: posts per distro channel, threaded comments,
one vote per user per target, reports (user- or AI-generated), notifications
and the append-only admin audit log.

`score` stays denormalised on the target rows and is moved by
apps.community.voting.apply_vote — a deliberate trade-off (no transaction; the
unique vote index keeps the write idempotent).
"""

from django.db import models


class Post(models.Model):
    author = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="posts"
    )
    # 'general' or a distro slug from the flavours catalogue
    channel = models.CharField(max_length=64, db_index=True)
    title = models.CharField(max_length=150)
    body = models.TextField(blank=True, default="")
    link_url = models.TextField(blank=True, default="")
    score = models.IntegerField(default=0, db_index=True)
    comment_count = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "posts"
        indexes = [
            models.Index(fields=["channel", "-created_at"]),
            models.Index(fields=["channel", "-score"]),
        ]
        # 'hot' recomputes its score in Python, so it needs a stable fallback.
        ordering = ["-created_at", "pk"]

    def json(self, user_vote=0, populate_author=True):
        from apps.core.serialize import author_json, user_json

        author = self.author
        data = {
            "author": author_json(author) if populate_author else author.pk,
            "channel": self.channel,
            "title": self.title,
            "body": self.body or "",
            "linkUrl": self.link_url or "",
            "score": self.score,
            "commentCount": self.comment_count,
            "createdAt": _iso(self.created_at),
            "updatedAt": _iso(self.updated_at),
            "id": self.pk,
        }
        if user_vote is not None:
            data["userVote"] = user_vote
        return data


class Comment(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="comments"
    )
    # null = top-level comment; set = reply to that comment
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )
    body = models.TextField()
    score = models.IntegerField(default=0, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "comments"
        ordering = ["pk"]

    def json(self, user_vote=0, with_replies=False):
        data = {
            "post": self.post_id,
            "author": {"name": self.author.name, "id": self.author.pk},
            "parent": self.parent_id,
            "body": self.body,
            "score": self.score,
            "createdAt": _iso(self.created_at),
            "updatedAt": _iso(self.updated_at),
            "id": self.pk,
            "userVote": user_vote,
        }
        if with_replies:
            data["replies"] = []
        return data


class Vote(models.Model):
    TARGETS = [("post", "post"), ("comment", "comment")]

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    target_type = models.CharField(max_length=7, choices=TARGETS)
    target_id = models.PositiveIntegerField()
    value = models.SmallIntegerField()  # 1 or -1

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "votes"
        constraints = [
            models.UniqueConstraint(
                fields=["user", "target_type", "target_id"], name="one_vote_per_target"
            )
        ]


class Report(models.Model):
    TARGETS = [("post", "post"), ("comment", "comment")]
    REASONS = [
        ("spam", "spam"),
        ("harassment", "harassment"),
        ("off-topic", "off-topic"),
        ("wrong-channel", "wrong-channel"),
        ("other", "other"),
    ]
    STATUSES = [("open", "open"), ("resolved", "resolved"), ("dismissed", "dismissed")]

    # null for AI-generated flags (source='ai')
    reporter = models.ForeignKey(
        "accounts.User", null=True, blank=True, on_delete=models.SET_NULL
    )
    source = models.CharField(max_length=4, choices=[("user", "user"), ("ai", "ai")], default="user")
    target_type = models.CharField(max_length=7, choices=TARGETS)
    target_id = models.PositiveIntegerField()
    reason = models.CharField(max_length=13, choices=REASONS)
    detail = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=9, choices=STATUSES, default="open", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reports"
        constraints = [
            models.UniqueConstraint(
                fields=["reporter", "target_type", "target_id"],
                name="one_report_per_target",
            )
        ]
        ordering = ["-created_at", "pk"]

    def json(self):
        return {
            "reporter": (
                {"name": self.reporter.name, "id": self.reporter.pk} if self.reporter else None
            ),
            "source": self.source,
            "targetType": self.target_type,
            "targetId": self.target_id,
            "reason": self.reason,
            "detail": self.detail or "",
            "status": self.status,
            "createdAt": _iso(self.created_at),
            "updatedAt": _iso(self.updated_at),
            "id": self.pk,
        }


class Notification(models.Model):
    TYPES = [("reply", "reply"), ("comment", "comment")]

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="notifications")
    type = models.CharField(max_length=7, choices=TYPES)
    actor = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="+")
    post = models.ForeignKey(Post, on_delete=models.CASCADE)
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE)
    read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        indexes = [models.Index(fields=["user", "-created_at"])]
        ordering = ["-created_at", "pk"]

    def json(self):
        return {
            "user": self.user_id,
            "type": self.type,
            "actor": {"name": self.actor.name, "id": self.actor.pk},
            "post": {"title": self.post.title, "channel": self.post.channel, "id": self.post_id}
            if self.post_id
            else None,
            "comment": self.comment_id,
            "read": self.read,
            "createdAt": _iso(self.created_at),
            "id": self.pk,
        }


class AuditLog(models.Model):
    ACTIONS = [
        ("post.update", "post.update"),
        ("post.delete", "post.delete"),
        ("comment.update", "comment.update"),
        ("comment.delete", "comment.delete"),
    ]

    actor = models.ForeignKey("accounts.User", on_delete=models.CASCADE)
    action = models.CharField(max_length=14, choices=ACTIONS)
    target_type = models.CharField(max_length=7, choices=Vote.TARGETS)
    target_id = models.PositiveIntegerField()
    # Snapshot for context after the target row is gone (title/body excerpt).
    detail = models.CharField(max_length=300, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at", "pk"]

    def json(self):
        return {
            "actor": {"name": self.actor.name, "id": self.actor.pk},
            "action": self.action,
            "targetType": self.target_type,
            "targetId": self.target_id,
            "detail": self.detail or "",
            "createdAt": _iso(self.created_at),
            "id": self.pk,
        }


def _iso(value):
    from apps.core.serialize import iso

    return iso(value)
