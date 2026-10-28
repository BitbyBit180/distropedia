"""AI assistant conversations.

Messages were an embedded array in Mongo (no per-message id), so they are rows
here but serialised back as bare `{ role, content, sources }` objects — the
shape the chat UI reads.
"""

from django.db import models


class Chat(models.Model):
    user = models.ForeignKey(
        "accounts.User", on_delete=models.CASCADE, related_name="chats"
    )
    title = models.CharField(max_length=120, default="New chat")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "chats"
        ordering = ["-updated_at", "pk"]

    def messages_json(self):
        """Embedded-array shape: no ids, no timestamps, insertion order."""
        return [
            {"role": message.role, "content": message.content, "sources": message.sources or []}
            for message in self.chatmessage_set.all().order_by("pk")
        ]


class ChatMessage(models.Model):
    ROLE_CHOICES = [("user", "user"), ("assistant", "assistant")]

    chat = models.ForeignKey(Chat, on_delete=models.CASCADE)
    role = models.CharField(max_length=9, choices=ROLE_CHOICES)
    content = models.TextField(blank=True, default="")
    # [{title, url}] — the Reddit / web sources an answer used
    sources = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chat_messages"
        ordering = ["pk"]
