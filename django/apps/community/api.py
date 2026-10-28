"""Community API — posts, threaded comments, votes, stats, reports,
notifications and the admin audit trail.

Everything here sits behind `protect` in Express, so every route is auth=True;
the admin routes additionally require requireAdmin. Messages, status codes,
pagination limits and optimistic-UI payload shapes match
backend/src/controllers/communityController.js.
"""

import math
from datetime import datetime, timezone

from django.db.models import Count, Q

from apps.community.models import Comment, Notification, Post, Report
from apps.community.voting import apply_vote, user_vote, user_votes_by_target
from apps.core.audit import is_admin_on_others_content, log_admin_action
from apps.core.errors import ApiError, endpoint, parse_id
from apps.core.ratelimit import (
    COMMENT_LIMIT,
    POST_LIMIT,
    SUGGEST_CHANNEL_LIMIT,
    VOTE_LIMIT,
)
from apps.core.serialize import iso
from config import settings


def _page_params(request, default_limit, max_limit=50):
    """page/limit parsing with the same floors and ceilings Express applied."""
    try:
        page = max(int(request.GET.get("page", "1") or 1), 1)
    except (TypeError, ValueError):
        page = 1
    try:
        limit = int(request.GET.get("limit", str(default_limit)) or default_limit)
    except (TypeError, ValueError):
        limit = default_limit
    limit = min(max(limit, 1), max_limit)
    return page, limit


def _validated_title(body, optional=False):
    raw = (body or {}).get("title")
    if raw is None and optional:
        return None
    title = str(raw or "").strip()
    if len(title) < 3 or len(title) > 150:
        raise ApiError("Title must be between 3 and 150 characters", 400)
    return title


def _validated_link_url(body, optional=False):
    import re

    raw = (body or {}).get("linkUrl")
    if raw is None and optional:
        return None
    link = str(raw or "").strip()
    if link and not re.match(r"^https?://", link, re.I):
        raise ApiError("linkUrl must start with http:// or https://", 400)
    return link


def _validated_channel(body):
    from apps.catalogue.models import Flavour

    channel = str((body or {}).get("channel", "")).strip().lower()
    if not channel:
        raise ApiError("Channel is required", 400)
    if channel != "general" and not Flavour.objects.filter(distro_id=channel).exists():
        raise ApiError("Unknown channel", 400)
    return channel


def _post_json(post, votes=None, user=None):
    vote = (votes or {}).get(post.pk, 0) if votes is not None else user_vote(user.pk, "post", post.pk)
    return post.json(user_vote=vote)


def _hot_score(post, now):
    """hotScore = (score*2 + commentCount + 1) / (hoursOld + 2)^1.4"""
    hours_old = (now - post.created_at).total_seconds() / 3600
    return (post.score * 2 + post.comment_count + 1) / ((hours_old + 2) ** 1.4)


# ------------------------------------------------------------------ stats ---


@endpoint(methods=("GET",), auth=True)
def stats(request, body, user):
    channel = (request.GET.get("channel") or "").lower()
    posts = Post.objects.filter(channel=channel) if channel and channel != "all" else Post.objects.all()
    post_ids = list(posts.values_list("pk", flat=True))
    return {
        "success": True,
        "data": {
            "posts": len(post_ids),
            "comments": Comment.objects.filter(post_id__in=post_ids).count(),
        },
    }


# ------------------------------------------------------------------ posts ---


@endpoint(methods=("GET", "POST"), auth=True)
def posts(request, body, user):
    if request.method == "POST":
        return create_post_payload(request, body, user)

    channel = (request.GET.get("channel") or "all").lower()
    sort = request.GET.get("sort") or "hot"
    search = (request.GET.get("search") or "").strip()
    page, limit = _page_params(request, 10)

    rows = Post.objects.filter(channel=channel) if channel != "all" else Post.objects.all()
    if search:
        # Title + body match so search finds discussions, not just headlines.
        rows = rows.filter(Q(title__icontains=search) | Q(body__icontains=search))

    total = rows.count()
    total_pages = math.ceil(total / limit) if limit else 0

    if sort == "hot":
        now = datetime.now(timezone.utc)
        ranked = sorted(
            rows.select_related("author"),
            key=lambda post: (-_hot_score(post, now), post.pk),
        )
        window = ranked[(page - 1) * limit : (page - 1) * limit + limit]
    else:
        order = "-created_at" if sort == "new" else "-score"
        window = list(
            rows.select_related("author").order_by(order, "pk")[
                (page - 1) * limit : (page - 1) * limit + limit
            ]
        )

    votes = user_votes_by_target(user.pk, "post", [post.pk for post in window])
    return {
        "success": True,
        "data": {
            "posts": [post.json(user_vote=votes.get(post.pk, 0)) for post in window],
            "page": page,
            "totalPages": total_pages,
            "hasMore": page * limit < total,
        },
    }


def create_post_payload(request, body, user):
    from apps.ai.moderation_agent import screen_content

    channel = _validated_channel(body)
    title = _validated_title(body)
    link_url = _validated_link_url(body)
    content = (body or {}).get("body") or ""

    post = Post.objects.create(
        author=user, channel=channel, title=title, body=content, link_url=link_url
    )
    # AI first-pass triage (fire-and-forget, queue-only — never blocks).
    screen_content("post", post.pk, title=title, body=content)
    return {"success": True, "data": post.json(user_vote=0)}, 201


@endpoint(methods=("GET", "PUT", "DELETE"), auth=True)
def post_detail(request, body, user, post_id=None):
    pk = parse_id(post_id)
    post = Post.objects.select_related("author").filter(pk=pk).first()
    if post is None:
        raise ApiError("Post not found", 404)

    if request.method == "GET":
        shaped = post.json(user_vote=user_vote(user.pk, "post", post.pk))

        comments = list(
            Comment.objects.filter(post=post).select_related("author").order_by("created_at", "pk")
        )
        votes = user_votes_by_target(user.pk, "comment", [comment.pk for comment in comments])
        shaped_comments = [
            comment.json(user_vote=votes.get(comment.pk, 0), with_replies=True)
            for comment in comments
        ]
        by_id = {comment["id"]: comment for comment in shaped_comments}

        # Build the tree: parent null -> root; otherwise nested under its parent.
        tree = []
        for comment in shaped_comments:
            parent = by_id.get(comment["parent"]) if comment["parent"] else None
            if parent:
                parent["replies"].append(comment)
            else:
                tree.append(comment)
        return {"success": True, "data": {"post": shaped, "comments": tree}}

    if request.method == "PUT":
        if post.author_id != user.pk and not user.is_admin:
            raise ApiError("You can only edit your own posts", 403)

        title = _validated_title(body, optional=True)
        if title is not None:
            post.title = title
        if "body" in (body or {}):
            post.body = (body or {}).get("body") or ""
        link_url = _validated_link_url(body, optional=True)
        if link_url is not None:
            post.link_url = link_url
        post.save()

        owner_id = post.author_id
        if is_admin_on_others_content(user, owner_id):
            log_admin_action(
                user.pk, "post.update", "post", post.pk, str(post.title or "")[:140]
            )
        return {
            "success": True,
            "data": post.json(user_vote=user_vote(user.pk, "post", post.pk)),
        }

    if post.author_id != user.pk and not user.is_admin:
        raise ApiError("You can only delete your own posts", 403)

    comment_ids = list(Comment.objects.filter(post=post).values_list("pk", flat=True))
    Comment.objects.filter(post=post).delete()
    from apps.community.models import Vote

    Vote.objects.filter(
        Q(target_type="post", target_id=post.pk)
        | Q(target_type="comment", target_id__in=comment_ids)
    ).delete()
    if is_admin_on_others_content(user, post.author_id):
        log_admin_action(user.pk, "post.delete", "post", post.pk, str(post.title or "")[:140])
    post.delete()
    return {"success": True, "message": "Post deleted"}


@endpoint(methods=("POST",), auth=True, limiter=VOTE_LIMIT)
def post_vote(request, body, user, post_id=None):
    value = _vote_value(body)
    pk = parse_id(post_id)
    if not Post.objects.filter(pk=pk).exists():
        raise ApiError("Post not found", 404)
    return {"success": True, "data": apply_vote(user.pk, "post", pk, value)}


def _vote_value(body):
    raw = (body or {}).get("value")
    try:
        value = int(raw) if isinstance(raw, (int, str)) and not isinstance(raw, bool) else None
        if isinstance(raw, float) and float(raw).is_integer():
            value = int(raw)
    except (TypeError, ValueError):
        value = None
    if value not in (1, -1, 0):
        raise ApiError("value must be 1, -1, or 0 (0 removes your vote)", 400)
    return value


# --------------------------------------------------------------- comments ---


@endpoint(methods=("POST",), auth=True, limiter=COMMENT_LIMIT)
def post_comments(request, body, user, post_id=None):
    from apps.ai.moderation_agent import screen_content

    pk = parse_id(post_id)
    post = Post.objects.filter(pk=pk).first()
    if post is None:
        raise ApiError("Post not found", 404)

    content = str((body or {}).get("body", "")).strip()
    if not content or len(content) > 5000:
        raise ApiError("Comment body is required (1-5000 characters)", 400)

    parent_id = (body or {}).get("parentId") or None
    if parent_id:
        parent = Comment.objects.filter(pk=parse_id(parent_id)).first()
        if parent is None or parent.post_id != post.pk:
            raise ApiError("Parent comment does not belong to this post", 400)
        parent_id = parent.pk

    comment = Comment.objects.create(
        post=post, author=user, parent_id=parent_id, body=content
    )
    Post.objects.filter(pk=post.pk).update(comment_count=post.comment_count + 1)

    # Notify the post author and (for replies) the parent author — never self.
    try:
        recipients = {}
        if post.author_id and post.author_id != user.pk:
            recipients[post.author_id] = "reply" if parent_id else "comment"
        if parent_id:
            parent_author = Comment.objects.filter(pk=parent_id).values_list("author_id", flat=True).first()
            if parent_author and parent_author != user.pk:
                recipients[parent_author] = "reply"
        for recipient_id, note_type in recipients.items():
            Notification.objects.create(
                user_id=recipient_id,
                type=note_type,
                actor=user,
                post=post,
                comment=comment,
            )
    except Exception:  # noqa: BLE001 - notifications must never fail the comment
        pass

    comment.refresh_from_db()
    screen_content("comment", comment.pk, body=content)
    return {"success": True, "data": comment.json(user_vote=0)}, 201


@endpoint(methods=("PUT", "DELETE"), auth=True)
def comment_detail(request, body, user, comment_id=None):
    pk = parse_id(comment_id)
    comment = Comment.objects.select_related("author").filter(pk=pk).first()
    if comment is None:
        raise ApiError("Comment not found", 404)

    if request.method == "PUT":
        if comment.author_id != user.pk and not user.is_admin:
            raise ApiError("You can only edit your own comments", 403)
        content = str((body or {}).get("body", "")).strip()
        if not content or len(content) > 5000:
            raise ApiError("Comment body is required (1-5000 characters)", 400)
        comment.body = content
        comment.save()
        if is_admin_on_others_content(user, comment.author_id):
            log_admin_action(
                user.pk, "comment.update", "comment", comment.pk, str(content)[:140]
            )
        return {
            "success": True,
            "data": comment.json(user_vote=user_vote(user.pk, "comment", comment.pk)),
        }

    if comment.author_id != user.pk and not user.is_admin:
        raise ApiError("You can only delete your own comments", 403)

    # Collect the comment plus all descendants (replies of replies included).
    ids, frontier = [comment.pk], [comment.pk]
    while frontier:
        children = list(
            Comment.objects.filter(parent_id__in=frontier).values_list("pk", flat=True)
        )
        frontier = children
        ids.extend(children)

    post_id = comment.post_id
    Comment.objects.filter(pk__in=ids).delete()
    from apps.community.models import Vote

    Vote.objects.filter(target_type="comment", target_id__in=ids).delete()
    Post.objects.filter(pk=post_id).update(comment_count=max(comment.post.comment_count - len(ids), 0))
    if is_admin_on_others_content(user, comment.author_id):
        log_admin_action(
            user.pk, "comment.delete", "comment", comment.pk, str(comment.body or "")[:140]
        )

    extra = (
        f" (with {len(ids) - 1} {'repl' + ('y' if len(ids) == 2 else 'ies')})"
        if len(ids) > 1
        else ""
    )
    return {"success": True, "message": f"Comment deleted{extra}"}


@endpoint(methods=("POST",), auth=True, limiter=VOTE_LIMIT)
def comment_vote(request, body, user, comment_id=None):
    value = _vote_value(body)
    pk = parse_id(comment_id)
    if not Comment.objects.filter(pk=pk).exists():
        raise ApiError("Comment not found", 404)
    return {"success": True, "data": apply_vote(user.pk, "comment", pk, value)}


# ----------------------------------------------------------------- admin ---


@endpoint(methods=("GET",), auth=True, admin=True)
def admin_audit(request, body, user):
    page, limit = _page_params(request, 20, max_limit=100)
    rows = _audit_queryset()
    total = rows.count()
    window = list(rows[(page - 1) * limit : (page - 1) * limit + limit])
    return {
        "success": True,
        "data": {
            "logs": [row.json() for row in window],
            "page": page,
            "totalPages": math.ceil(total / limit),
            "hasMore": page * limit < total,
        },
    }


def _audit_queryset():
    from apps.community.models import AuditLog

    return AuditLog.objects.select_related("actor").order_by("-created_at", "pk")


@endpoint(methods=("GET",), auth=True, admin=True)
def admin_reports(request, body, user):
    status = (request.GET.get("status") or "open").lower()
    rows = Report.objects.all()
    if status in ("open", "resolved", "dismissed"):
        rows = rows.filter(status=status)
    source = (request.GET.get("source") or "").lower()
    if source in ("user", "ai"):
        rows = rows.filter(source=source)

    page, limit = _page_params(request, 20, max_limit=100)
    total = rows.count()
    window = list(rows.select_related("reporter").order_by("-created_at", "pk")[
        (page - 1) * limit : (page - 1) * limit + limit
    ])
    return {
        "success": True,
        "data": {
            "reports": [report.json() for report in window],
            "page": page,
            "totalPages": math.ceil(total / limit),
            "hasMore": page * limit < total,
        },
    }


@endpoint(methods=("PATCH",), auth=True, admin=True)
def admin_report_detail(request, body, user, report_id=None):
    status = (body or {}).get("status")
    if status not in ("resolved", "dismissed"):
        raise ApiError("status must be resolved or dismissed", 400)
    report = Report.objects.select_related("reporter").filter(pk=parse_id(report_id)).first()
    if report is None:
        raise ApiError("Report not found", 404)
    report.status = status
    report.save()
    return {"success": True, "data": report.json()}


# ---------------------------------------------------------------- reports ---


@endpoint(methods=("POST",), auth=True, limiter=COMMENT_LIMIT)
def reports(request, body, user):
    target_type = (body or {}).get("targetType")
    if target_type not in ("post", "comment"):
        raise ApiError("targetType must be post or comment", 400)

    model = Post if target_type == "post" else Comment
    target_id = (body or {}).get("targetId")
    try:
        target = model.objects.select_related("author").filter(pk=parse_id(target_id)).first()
    except ApiError:
        target = None
    if target is None:
        raise ApiError("Post not found" if target_type == "post" else "Comment not found", 404)

    if target.author_id == user.pk:
        raise ApiError("You cannot report your own content", 400)

    reason = (body or {}).get("reason")
    if reason not in ("spam", "harassment", "off-topic", "wrong-channel", "other"):
        raise ApiError(
            "reason must be spam, harassment, off-topic, wrong-channel, or other", 400
        )

    detail = str((body or {}).get("detail", "")).strip()[:500]
    if Report.objects.filter(
        reporter=user, target_type=target_type, target_id=target.pk
    ).exists():
        raise ApiError("You have already reported this", 409)

    report = Report.objects.create(
        reporter=user, target_type=target_type, target_id=target.pk, reason=reason, detail=detail
    )
    return {"success": True, "data": report.json()}, 201


# --------------------------------------------------------- notifications ---


@endpoint(methods=("GET",), auth=True)
def notifications(request, body, user):
    page, limit = _page_params(request, 15)
    rows = Notification.objects.filter(user=user).select_related("actor", "post")
    total = rows.count()
    unread = rows.filter(read=False).count()
    window = list(rows.order_by("-created_at", "pk")[(page - 1) * limit : (page - 1) * limit + limit])
    return {
        "success": True,
        "data": {
            "notifications": [note.json() for note in window],
            "unreadCount": unread,
            "page": page,
            "totalPages": math.ceil(total / limit),
            "hasMore": page * limit < total,
        },
    }


@endpoint(methods=("PATCH",), auth=True)
def notification_read(request, body, user, notification_id=None):
    note = Notification.objects.filter(pk=parse_id(notification_id), user=user).first()
    if note is None:
        raise ApiError("Notification not found", 404)
    note.read = True
    note.save(update_fields=["read"])
    # findOneAndUpdate returns the raw doc: actor/post stay as plain ids here.
    return {
        "success": True,
        "data": {
            "user": note.user_id,
            "type": note.type,
            "actor": note.actor_id,
            "post": note.post_id,
            "comment": note.comment_id,
            "read": note.read,
            "createdAt": iso(note.created_at),
            "id": note.pk,
        },
    }


@endpoint(methods=("PATCH",), auth=True)
def notifications_read_all(request, body, user):
    Notification.objects.filter(user=user, read=False).update(read=True)
    return {"success": True, "message": "All notifications marked as read"}


# ------------------------------------------------------------------ quiz-y ---


@endpoint(methods=("POST",), auth=True, limiter=SUGGEST_CHANNEL_LIMIT)
def suggest_channel(request, body, user):
    from apps.ai.channel_suggest_agent import suggest_channel as _suggest

    title = str((body or {}).get("title", "")).strip()
    content = str((body or {}).get("body", "")).strip()
    if len(title) < 3:
        raise ApiError(
            "A title of at least 3 characters is needed to suggest a channel", 400
        )
    if not (settings.TYPESAFE_API_KEY or "").strip():
        raise ApiError("Channel suggestions are unavailable right now", 503)
    try:
        result = _suggest(title=title, body=content)
    except ApiError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise ApiError(str(exc) or "Channel suggestion failed. Please try again.", 502)
    return {"success": True, "data": result}
