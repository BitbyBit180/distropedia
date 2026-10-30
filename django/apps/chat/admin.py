"""Unfold Django Admin registration for AI Chatbot conversations and messages."""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.contrib.filters.admin import ChoicesDropdownFilter, RangeDateTimeFilter
from unfold.decorators import action, display

from apps.chat.models import Chat, ChatMessage


class ChatMessageInline(TabularInline):
    model = ChatMessage
    extra = 0
    fields = ("role", "content", "display_sources", "created_at")
    readonly_fields = ("created_at", "display_sources")

    def display_sources(self, instance: ChatMessage):
        count = len(instance.sources or [])
        return f"{count} source(s)"
    display_sources.short_description = _("Citations")


@admin.register(Chat)
class ChatAdmin(ModelAdmin):
    list_display = (
        "title",
        "display_user",
        "display_message_count",
        "updated_at",
        "created_at",
    )
    list_filter = (
        ("created_at", RangeDateTimeFilter),
        ("updated_at", RangeDateTimeFilter),
    )
    search_fields = ("title", "user__email", "user__name")
    ordering = ("-updated_at",)
    readonly_fields = ("created_at", "updated_at")
    inlines = [ChatMessageInline]

    fieldsets = (
        (
            _("Conversation Details"),
            {
                "fields": ("title", "user"),
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

    actions = ["clear_messages"]

    @display(description=_("User"))
    def display_user(self, instance: Chat):
        return instance.user.email

    @display(description=_("Messages"), label=True)
    def display_message_count(self, instance: Chat):
        count = instance.chatmessage_set.count()
        return f"{count} msgs"

    @action(description=_("Clear all messages in selected conversations"))
    def clear_messages(self, request, queryset):
        total_cleared = 0
        for chat in queryset:
            count, _ = chat.chatmessage_set.all().delete()
            total_cleared += count
        self.message_user(
            request, f"Cleared {total_cleared} message(s) across selected chats."
        )


@admin.register(ChatMessage)
class ChatMessageAdmin(ModelAdmin):
    list_display = (
        "display_chat",
        "display_role",
        "display_content_snippet",
        "display_sources_count",
        "created_at",
    )
    list_filter = (
        ("role", ChoicesDropdownFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("content", "chat__title", "chat__user__email")
    ordering = ("-created_at",)
    readonly_fields = ("created_at",)

    fieldsets = (
        (
            _("Message"),
            {
                "fields": ("chat", "role", "content", "sources"),
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

    @display(description=_("Chat Session"))
    def display_chat(self, instance: ChatMessage):
        return f"#{instance.chat.id} {instance.chat.title}"

    @display(
        description=_("Role"),
        label={
            "user": "info",
            "assistant": "success",
        },
    )
    def display_role(self, instance: ChatMessage):
        return instance.role

    @display(description=_("Content Snippet"))
    def display_content_snippet(self, instance: ChatMessage):
        text = instance.content or ""
        return (text[:80] + "…") if len(text) > 80 else text

    @display(description=_("Sources"), label=True)
    def display_sources_count(self, instance: ChatMessage):
        count = len(instance.sources or [])
        return f"{count} refs" if count > 0 else "None"
