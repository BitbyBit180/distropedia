"""Admin action logging — auditLog.js twin.

Audit writes must never fail the admin's own request, so every error is
swallowed. `is_admin_on_others_content` is the only case worth auditing: an
admin acting on content they do not own.
"""

import logging

log = logging.getLogger("audit")


def log_admin_action(actor_id, action, target_type, target_id, detail=""):
    if not (actor_id and action and target_type and target_id):
        return
    try:
        from apps.community.models import AuditLog

        AuditLog.objects.create(
            actor_id=actor_id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=detail,
        )
    except Exception:  # noqa: BLE001 - fire-and-forget by design
        log.exception("audit write failed")


def is_admin_on_others_content(user, owner_id):
    if not (user and getattr(user, "is_admin", False)):
        return False
    try:
        return str(owner_id) != str(user.pk)
    except Exception:  # noqa: BLE001 - matches the JS `catch { return true }`
        return True
