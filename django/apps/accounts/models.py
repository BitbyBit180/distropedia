"""Accounts for the AI assistant + community.

Rules: unique lowercase email, bcrypt password hash
(never serialised), null/empty hash for Google-only accounts, admin flag, and a
hashed single-use 6-digit reset token with an expiry.
"""

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    def get_by_natural_key(self, username):
        return self.get(**{self.model.USERNAME_FIELD: (username or "").strip().lower()})

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_admin", True)
        if extra_fields.get("is_admin") is not True:
            raise ValueError("Superuser must have is_admin=True")
        return self.create_user(email, password, **extra_fields)


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

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: list[str] = []

    class Meta:
        db_table = "users"

    @property
    def is_staff(self):
        return bool(self.is_admin)

    @property
    def is_superuser(self):
        return bool(self.is_admin)

    @property
    def is_active(self):
        return True

    def has_perm(self, perm, obj=None):
        return bool(self.is_admin)

    def has_module_perms(self, app_label):
        return bool(self.is_admin)

    def save(self, *args, **kwargs):
        if self.email:
            self.email = self.email.strip().lower()
        if self.name:
            self.name = self.name.strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
