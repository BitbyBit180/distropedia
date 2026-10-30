"""Unfold Django Admin registration for Accounts (Users and Admins)."""

from datetime import datetime, timezone
from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import identify_hasher
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import BooleanRadioFilter, RangeDateTimeFilter
from unfold.decorators import action, display

from apps.accounts.models import User


class UserAdminForm(forms.ModelForm):
    class Meta:
        model = User
        fields = "__all__"
        widgets = {
            "password": forms.PasswordInput(render_value=False),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields["password"].required = False
            self.fields["password"].help_text = _(
                "Leave blank to keep existing password hash. Enter a new password to reset it."
            )


@admin.register(User)
class UserAdmin(ModelAdmin):
    form = UserAdminForm
    list_display = (
        "email",
        "name",
        "display_is_admin",
        "display_auth_provider",
        "display_reset_active",
        "created_at",
    )
    list_filter = (
        ("is_admin", BooleanRadioFilter),
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("email", "name", "google_id")
    ordering = ("-created_at",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Identity & Credentials"),
            {
                "fields": ("email", "name", "password"),
                "description": _("User login credentials. Email is case-insensitive."),
            },
        ),
        (
            _("Permissions & Access"),
            {
                "fields": ("is_admin",),
                "description": _(
                    "Grants full administrative access to this Unfold control center."
                ),
            },
        ),
        (
            _("OAuth & Password Reset"),
            {
                "classes": ("collapse",),
                "fields": ("google_id", "reset_token_hash", "reset_token_expiry"),
                "description": _(
                    "OAuth subject identifiers and hashed single-use 6-digit recovery tokens."
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

    actions = [
        "promote_to_admin",
        "revoke_admin",
        "clear_reset_token",
    ]

    def save_model(self, request, obj, form, change):
        raw_password = form.cleaned_data.get("password")
        if raw_password:
            # Check if this is already an encrypted hash or a new plaintext password
            is_hash = False
            try:
                identify_hasher(raw_password)
                is_hash = True
            except ValueError:
                is_hash = False

            if not is_hash:
                obj.set_password(raw_password)
        elif not change:
            # New user with no password
            obj.set_unusable_password()
        super().save_model(request, obj, form, change)

    @display(description=_("Admin"), boolean=True)
    def display_is_admin(self, instance: User):
        return instance.is_admin

    @display(
        description=_("Auth Provider"),
        label={
            "Google": "info",
            "Password": "secondary",
            "None": "warning",
        },
    )
    def display_auth_provider(self, instance: User):
        if instance.google_id:
            return "Google"
        if instance.has_usable_password() or instance.password:
            return "Password"
        return "None"

    @display(description=_("Reset Active"), boolean=True)
    def display_reset_active(self, instance: User):
        if not instance.reset_token_hash or not instance.reset_token_expiry:
            return False
        return instance.reset_token_expiry > datetime.now(timezone.utc)

    @action(description=_("Grant administrative access"))
    def promote_to_admin(self, request, queryset):
        count = queryset.update(is_admin=True)
        self.message_user(
            request, f"Granted admin access to {count} selected user(s)."
        )

    @action(description=_("Revoke administrative access"))
    def revoke_admin(self, request, queryset):
        # Prevent demoting the requesting user itself
        safe_qs = queryset.exclude(pk=request.user.pk)
        count = safe_qs.update(is_admin=False)
        self.message_user(
            request, f"Revoked admin access for {count} user(s)."
        )

    @action(description=_("Clear active password reset tokens"))
    def clear_reset_token(self, request, queryset):
        count = queryset.update(reset_token_hash=None, reset_token_expiry=None)
        self.message_user(
            request, f"Cleared reset tokens for {count} user(s)."
        )
