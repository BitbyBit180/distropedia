"""Dashboard callbacks and badges for the Django Unfold Admin Panel.

Aggregates system-wide analytics, key performance indicators (KPIs),
moderation queue statuses, and quick action shortcuts across DistroPedia.
"""

from datetime import datetime, timedelta, timezone
from django.conf import settings
from django.urls import reverse_lazy


def environment_callback(request):
    """Returns environment label and badge style (info, warning, danger, success)."""
    env_name = getattr(settings, "APP_ENV", "development").upper()
    badge_variant = "warning" if settings.DEBUG else "success"
    return [env_name, badge_variant]


def pending_reports_badge(request):
    """Badge for open reports waiting in moderation queue."""
    try:
        from apps.community.models import Report

        count = Report.objects.filter(status="open").count()
        return str(count) if count > 0 else None
    except Exception:
        return None


def total_users_badge(request):
    """Badge displaying total registered user count."""
    try:
        from apps.accounts.models import User

        count = User.objects.count()
        return str(count)
    except Exception:
        return None


def total_distros_badge(request):
    """Badge displaying total Linux distributions count."""
    try:
        from apps.catalogue.models import Distro

        count = Distro.objects.count()
        return str(count)
    except Exception:
        return None


def dashboard_callback(request, context):
    """Custom dashboard callback injecting KPIs and recent activity."""
    try:
        from apps.accounts.models import User
        from apps.catalogue.models import Distro, Flavour
        from apps.chat.models import Chat, ChatMessage
        from apps.community.models import Post, Comment, Report, AuditLog
        from apps.learning.models import (
            LearningPlan,
            Lesson,
            ExerciseAttempt,
            AssessmentAttempt,
        )

        now = datetime.now(timezone.utc)
        one_week_ago = now - timedelta(days=7)

        # Quick KPIs
        total_users = User.objects.count()
        new_users_week = User.objects.filter(created_at__gte=one_week_ago).count()
        total_distros = Distro.objects.count()
        popular_distros = Distro.objects.filter(popular=True).count()
        total_flavours = Flavour.objects.count()

        total_posts = Post.objects.count()
        total_comments = Comment.objects.count()
        open_reports = Report.objects.filter(status="open").count()
        resolved_reports = Report.objects.filter(status="resolved").count()

        total_plans = LearningPlan.objects.count()
        total_lessons = Lesson.objects.count()
        total_exercise_attempts = ExerciseAttempt.objects.count()
        passed_exercises = ExerciseAttempt.objects.filter(passed=True).count()

        total_chats = Chat.objects.count()
        total_messages = ChatMessage.objects.count()

        recent_reports = list(
            Report.objects.filter(status="open")
            .select_related("reporter")
            .order_by("-created_at")[:5]
        )
        recent_posts = list(
            Post.objects.select_related("author").order_by("-created_at")[:5]
        )
        recent_users = list(User.objects.order_by("-created_at")[:5])

        context["stats"] = {
            "users": {
                "total": total_users,
                "new_this_week": new_users_week,
            },
            "catalogue": {
                "distros": total_distros,
                "popular": popular_distros,
                "flavours": total_flavours,
            },
            "community": {
                "posts": total_posts,
                "comments": total_comments,
                "open_reports": open_reports,
                "resolved_reports": resolved_reports,
            },
            "learning": {
                "plans": total_plans,
                "lessons": total_lessons,
                "exercise_attempts": total_exercise_attempts,
                "passed_exercises": passed_exercises,
            },
            "chat": {
                "chats": total_chats,
                "messages": total_messages,
            },
            "system": {
                "client_url": getattr(settings, "CLIENT_URL", "http://localhost:5173"),
                "environment": getattr(settings, "APP_ENV", "development"),
                "debug": settings.DEBUG,
            },
        }
        context["recent_reports"] = recent_reports
        context["recent_posts"] = recent_posts
        context["recent_users"] = recent_users
    except Exception as exc:
        context["stats_error"] = str(exc)

    return context
