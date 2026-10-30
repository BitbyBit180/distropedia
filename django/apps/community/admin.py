"""Unfold Django Admin registration for Community (Posts, Comments, Votes, Reports, Notifications, Audit Log)."""

from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import (
    BooleanRadioFilter,
    ChoicesDropdownFilter,
    RangeDateTimeFilter,
)
from unfold.decorators import action, display

from apps.community.models import AuditLog, Comment, Notification, Post, Report, Vote


class CommentInline(TabularInline):
    model = Comment
    extra = 0
    fields = ("author", "body", "score", "created_at")
    readonly_fields = ("created_at",)
    show_change_link = True


@admin.register(Post)
class PostAdmin(ModelAdmin):
    list_display = (
        "title",
        "display_author",
        "display_channel",
        "display_score",
        "comment_count",
        "display_has_link",
        "created_at",
    )
    list_filter = (
        "channel",
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("title", "body", "author__email", "author__name", "channel")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "comment_count")
    inlines = [CommentInline]

    fieldsets = (
        (
            _("Post Content"),
            {
                "fields": ("title", "author", "channel", "body", "link_url"),
            },
        ),
        (
            _("Engagement Metrics"),
            {
                "fields": ("score", "comment_count"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = ["reset_score", "move_to_general"]

    @display(description=_("Author"))
    def display_author(self, instance: Post):
        return instance.author.name or instance.author.email

    @display(description=_("Channel"), label=True)
    def display_channel(self, instance: Post):
        return instance.channel

    @display(description=_("Score"), label={"0": "secondary"})
    def display_score(self, instance: Post):
        return f"{instance.score:+d}" if instance.score != 0 else "0"

    @display(description=_("Has Link"), boolean=True)
    def display_has_link(self, instance: Post):
        return bool(instance.link_url)

    @action(description=_("Reset score to 0"))
    def reset_score(self, request, queryset):
        count = queryset.update(score=0)
        self.message_user(request, f"Reset score to 0 for {count} post(s).")

    @action(description=_("Move to 'general' channel"))
    def move_to_general(self, request, queryset):
        count = queryset.update(channel="general")
        self.message_user(request, f"Moved {count} post(s) to #general.")


@admin.register(Comment)
class CommentAdmin(ModelAdmin):
    list_display = (
        "display_body_snippet",
        "display_author",
        "display_post_link",
        "display_parent",
        "display_score",
        "created_at",
    )
    list_filter = (("created_at", RangeDateTimeFilter),)
    search_fields = ("body", "author__email", "author__name", "post__title")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Comment Content"),
            {
                "fields": ("post", "author", "parent", "body", "score"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = ["reset_score"]

    @display(description=_("Comment Excerpt"))
    def display_body_snippet(self, instance: Comment):
        text = instance.body or ""
        return (text[:70] + "…") if len(text) > 70 else text

    @display(description=_("Author"))
    def display_author(self, instance: Comment):
        return instance.author.name or instance.author.email

    @display(description=_("Post"))
    def display_post_link(self, instance: Comment):
        title = instance.post.title
        snippet = (title[:35] + "…") if len(title) > 35 else title
        url = reverse("admin:community_post_change", args=[instance.post.pk])
        return format_html('<a href="{}" class="text-primary-600 hover:underline">{}</a>', url, snippet)

    @display(description=_("Parent"))
    def display_parent(self, instance: Comment):
        return f"#{instance.parent_id}" if instance.parent_id else "—"

    @display(description=_("Score"), label=True)
    def display_score(self, instance: Comment):
        return f"{instance.score:+d}" if instance.score != 0 else "0"

    @action(description=_("Reset score to 0"))
    def reset_score(self, request, queryset):
        count = queryset.update(score=0)
        self.message_user(request, f"Reset score to 0 for {count} comment(s).")


@admin.register(Vote)
class VoteAdmin(ModelAdmin):
    list_display = (
        "user",
        "display_target_type",
        "target_id",
        "display_value",
        "created_at",
    )
    list_filter = (
        ("target_type", ChoicesDropdownFilter),
        ("value", ChoicesDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("user__email", "target_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Vote Information"),
            {
                "fields": ("user", "target_type", "target_id", "value"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    @display(description=_("Target"), label=True)
    def display_target_type(self, instance: Vote):
        return instance.target_type

    @display(
        description=_("Vote"),
        label={
            "+1": "success",
            "-1": "danger",
        },
    )
    def display_value(self, instance: Vote):
        return f"+{instance.value}" if instance.value > 0 else str(instance.value)


@admin.register(Report)
class ReportAdmin(ModelAdmin):
    list_display = (
        "id",
        "display_status",
        "display_reason",
        "display_source",
        "display_target_type",
        "display_target_link",
        "display_reporter",
        "created_at",
    )
    list_filter = (
        ("status", ChoicesDropdownFilter),
        ("reason", ChoicesDropdownFilter),
        ("source", ChoicesDropdownFilter),
        ("target_type", ChoicesDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("detail", "reporter__email", "target_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at", "display_target_detail")

    fieldsets = (
        (
            _("Report Details"),
            {
                "fields": (
                    "status",
                    "reason",
                    "source",
                    "reporter",
                    "target_type",
                    "target_id",
                    "detail",
                    "display_target_detail",
                ),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = ["mark_resolved", "mark_dismissed", "reopen_report"]

    @display(
        description=_("Status"),
        label={
            "open": "danger",
            "resolved": "success",
            "dismissed": "secondary",
        },
    )
    def display_status(self, instance: Report):
        return instance.status

    @display(
        description=_("Reason"),
        label={
            "spam": "danger",
            "harassment": "danger",
            "off-topic": "warning",
            "wrong-channel": "warning",
            "other": "secondary",
        },
    )
    def display_reason(self, instance: Report):
        return instance.reason

    @display(
        description=_("Source"),
        label={
            "ai": "warning",
            "user": "info",
        },
    )
    def display_source(self, instance: Report):
        return instance.source

    @display(description=_("Target Type"), label=True)
    def display_target_type(self, instance: Report):
        return instance.target_type

    @display(description=_("Target Item"))
    def display_target_link(self, instance: Report):
        try:
            if instance.target_type == "post":
                post = Post.objects.filter(pk=instance.target_id).first()
                if post:
                    url = reverse("admin:community_post_change", args=[post.pk])
                    return format_html(
                        '<a href="{}" class="text-primary-600 hover:underline">Post #{}: {}</a>',
                        url,
                        post.pk,
                        post.title[:30],
                    )
            elif instance.target_type == "comment":
                comment = Comment.objects.filter(pk=instance.target_id).first()
                if comment:
                    url = reverse("admin:community_comment_change", args=[comment.pk])
                    return format_html(
                        '<a href="{}" class="text-primary-600 hover:underline">Comment #{}: {}</a>',
                        url,
                        comment.pk,
                        comment.body[:30],
                    )
        except Exception:
            pass
        return f"{instance.target_type} #{instance.target_id}"

    @display(description=_("Reporter"))
    def display_reporter(self, instance: Report):
        if not instance.reporter:
            return format_html('<span class="text-subtle italic">Auto (AI Agent)</span>')
        return instance.reporter.email

    @display(description=_("Target Preview"))
    def display_target_detail(self, instance: Report):
        try:
            if instance.target_type == "post":
                post = Post.objects.filter(pk=instance.target_id).first()
                if post:
                    return format_html(
                        "<div><strong>Title:</strong> {}<br><strong>Author:</strong> {}<br><strong>Body:</strong> {}</div>",
                        post.title,
                        post.author.email,
                        post.body,
                    )
            elif instance.target_type == "comment":
                comment = Comment.objects.filter(pk=instance.target_id).first()
                if comment:
                    return format_html(
                        "<div><strong>Author:</strong> {}<br><strong>Post:</strong> {}<br><strong>Body:</strong> {}</div>",
                        comment.author.email,
                        comment.post.title,
                        comment.body,
                    )
        except Exception:
            pass
        return "Target record not found."

    @action(description=_("Mark selected reports as RESOLVED"))
    def mark_resolved(self, request, queryset):
        count = queryset.update(status="resolved")
        self.message_user(request, f"Marked {count} report(s) as resolved.")

    @action(description=_("Mark selected reports as DISMISSED"))
    def mark_dismissed(self, request, queryset):
        count = queryset.update(status="dismissed")
        self.message_user(request, f"Dismissed {count} report(s).")

    @action(description=_("Reopen selected reports"))
    def reopen_report(self, request, queryset):
        count = queryset.update(status="open")
        self.message_user(request, f"Reopened {count} report(s).")


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    list_display = (
        "user",
        "display_type",
        "actor",
        "display_post_link",
        "display_read",
        "created_at",
    )
    list_filter = (
        ("type", ChoicesDropdownFilter),
        ("read", BooleanRadioFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("user__email", "actor__email", "post__title")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)

    fieldsets = (
        (
            _("Notification Details"),
            {
                "fields": ("user", "type", "actor", "post", "comment", "read"),
            },
        ),
        (
            _("Timestamps"),
            {
                "classes": ("collapse",),
                "fields": ("created_at",),
            },
        ),
    )

    actions = ["mark_read", "mark_unread"]

    @display(
        description=_("Type"),
        label={
            "reply": "info",
            "comment": "secondary",
        },
    )
    def display_type(self, instance: Notification):
        return instance.type

    @display(description=_("Post"))
    def display_post_link(self, instance: Notification):
        if not instance.post:
            return "—"
        url = reverse("admin:community_post_change", args=[instance.post.pk])
        title = instance.post.title
        snippet = (title[:30] + "…") if len(title) > 30 else title
        return format_html('<a href="{}" class="text-primary-600 hover:underline">{}</a>', url, snippet)

    @display(description=_("Read"), boolean=True)
    def display_read(self, instance: Notification):
        return instance.read

    @action(description=_("Mark selected as READ"))
    def mark_read(self, request, queryset):
        count = queryset.update(read=True)
        self.message_user(request, f"Marked {count} notification(s) as read.")

    @action(description=_("Mark selected as UNREAD"))
    def mark_unread(self, request, queryset):
        count = queryset.update(read=False)
        self.message_user(request, f"Marked {count} notification(s) as unread.")


@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    list_display = (
        "actor",
        "display_action",
        "display_target_type",
        "target_id",
        "display_detail_snippet",
        "created_at",
    )
    list_filter = (
        ("action", ChoicesDropdownFilter),
        ("target_type", ChoicesDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("actor__email", "actor__name", "detail", "target_id")
    ordering = ("-created_at",)
    readonly_fields = (
        "actor",
        "action",
        "target_type",
        "target_id",
        "detail",
        "created_at",
    )

    fieldsets = (
        (
            _("Audit Event"),
            {
                "fields": (
                    "actor",
                    "action",
                    "target_type",
                    "target_id",
                    "detail",
                    "created_at",
                ),
            },
        ),
    )

    def has_add_permission(self, request):
        # Audit records are immutable system snapshots
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser

    @display(
        description=_("Action"),
        label={
            "post.update": "warning",
            "post.delete": "danger",
            "comment.update": "warning",
            "comment.delete": "danger",
        },
    )
    def display_action(self, instance: AuditLog):
        return instance.action

    @display(description=_("Target Type"), label=True)
    def display_target_type(self, instance: AuditLog):
        return instance.target_type

    @display(description=_("Detail Excerpt"))
    def display_detail_snippet(self, instance: AuditLog):
        text = instance.detail or ""
        return (text[:80] + "…") if len(text) > 80 else text
