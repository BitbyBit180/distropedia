"""Project URL table — the whole /api surface.

Route order matters: static segments (`popular`, `categories`, `compare`) are
matched before `<key>`, so those words are never treated as a distro id.
"""

from django.urls import re_path

from apps.accounts import api as accounts_api
from apps.catalogue import api as catalogue_api
from apps.chat import api as chat_api
from apps.community import api as community_api
from apps.core.views import api_not_found, health
from apps.quiz import api as quiz_api

SLASH = r"/?$"

urlpatterns = [
    # ---- health ----
    re_path(r"^api/health" + SLASH, health),

    # ---- flavours (lean catalogue) ----
    re_path(r"^api/flavours/popular" + SLASH, catalogue_api.flavours_popular),
    re_path(r"^api/flavours/categories" + SLASH, catalogue_api.flavours_categories),
    re_path(r"^api/flavours" + SLASH, catalogue_api.flavours_collection),
    re_path(r"^api/flavours/(?P<key>[^/]+)" + SLASH, catalogue_api.flavour_by_key),

    # ---- distros (full detail) ----
    re_path(r"^api/distros/compare" + SLASH, catalogue_api.distros_compare),
    re_path(r"^api/distros" + SLASH, catalogue_api.distros_collection),
    re_path(r"^api/distros/(?P<key>[^/]+)" + SLASH, catalogue_api.distro_by_key),

    # ---- auth ----
    re_path(r"^api/auth/register" + SLASH, accounts_api.register),
    re_path(r"^api/auth/login" + SLASH, accounts_api.login),
    re_path(r"^api/auth/google" + SLASH, accounts_api.google),
    re_path(r"^api/auth/forgot-password" + SLASH, accounts_api.forgot_password),
    re_path(r"^api/auth/verify-reset-token" + SLASH, accounts_api.verify_reset_token),
    re_path(r"^api/auth/reset-password" + SLASH, accounts_api.reset_password),
    re_path(r"^api/auth/me" + SLASH, accounts_api.me),

    # ---- chat (all protected) ----
    re_path(r"^api/chat" + SLASH, chat_api.chat_collection),
    re_path(
        r"^api/chat/(?P<chat_id>[^/]+)/messages/stream" + SLASH, chat_api.chat_message_stream
    ),
    re_path(r"^api/chat/(?P<chat_id>[^/]+)/messages" + SLASH, chat_api.chat_messages),
    re_path(r"^api/chat/(?P<chat_id>[^/]+)/rename" + SLASH, chat_api.chat_rename),
    re_path(r"^api/chat/(?P<chat_id>[^/]+)" + SLASH, chat_api.chat_detail),

    # ---- community (all protected) ----
    re_path(r"^api/community/stats" + SLASH, community_api.stats),
    re_path(r"^api/community/admin/audit" + SLASH, community_api.admin_audit),
    re_path(
        r"^api/community/admin/reports/(?P<report_id>[^/]+)" + SLASH,
        community_api.admin_report_detail,
    ),
    re_path(r"^api/community/admin/reports" + SLASH, community_api.admin_reports),
    re_path(r"^api/community/reports" + SLASH, community_api.reports),
    re_path(
        r"^api/community/notifications/read-all" + SLASH, community_api.notifications_read_all
    ),
    re_path(
        r"^api/community/notifications/(?P<notification_id>[^/]+)/read" + SLASH,
        community_api.notification_read,
    ),
    re_path(r"^api/community/notifications" + SLASH, community_api.notifications),
    re_path(r"^api/community/suggest-channel" + SLASH, community_api.suggest_channel),
    re_path(r"^api/community/posts/(?P<post_id>[^/]+)/vote" + SLASH, community_api.post_vote),
    re_path(
        r"^api/community/posts/(?P<post_id>[^/]+)/comments" + SLASH, community_api.post_comments
    ),
    re_path(r"^api/community/posts/(?P<post_id>[^/]+)" + SLASH, community_api.post_detail),
    re_path(r"^api/community/posts" + SLASH, community_api.posts),
    re_path(
        r"^api/community/comments/(?P<comment_id>[^/]+)/vote" + SLASH, community_api.comment_vote
    ),
    re_path(r"^api/community/comments/(?P<comment_id>[^/]+)" + SLASH, community_api.comment_detail),

    # ---- quiz (public) ----
    re_path(r"^api/quiz/recommend" + SLASH, quiz_api.recommend),

    # ---- anything not under /api -> 404 (the API is the only thing served) ----
    re_path(r"^api(?:/|$)", api_not_found),
]
