"""Accounts for the AI assistant + community.

Same rules as the Mongo User: unique lowercase email, bcrypt password hash
(never serialised), null/empty hash for Google-only accounts, admin flag, and a
hashed single-use 6-digit reset token with an expiry.
"""

from django.contrib.auth.base_user import AbstractBaseUser
from django.db import models


class User(AbstractBaseUser):
    email = models.CharField(max_length=254, unique=True)
    # AbstractBaseUser's `password` holds the bcrypt hash; "" means the account
    # has no password (Google-only), matching the old `passwordHash: null`.
    name = models.CharField(max_length=120, blank=True, default="")
    is_admin = models.BooleanField(default=False)
    # Google `sub`; unique and nullable so password-only accounts never collide.
    google_id = models.CharField(max_length=64, null=True, blank=True, unique=True)
    reset_token_hash = models.CharField(max_length=64, null=True, blank=True, default=None)
    reset_token_expiry = models.DateTimeField(null=True, blank=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "users"

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        if self.name:
            self.name = self.name.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
