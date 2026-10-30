"""Unfold Django Admin registration for Linux Distros and Flavours Catalogue."""

from django.contrib import admin
from django.utils.html import format_html
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin
from unfold.contrib.filters.admin import (
    BooleanRadioFilter,
    RangeDateTimeFilter,
)
from unfold.decorators import action, display

from apps.catalogue.models import Distro, Flavour


FLAVOUR_SYNC_FIELDS = [
    "name",
    "accent",
    "tagline",
    "based_on",
    "pkg_mgr",
    "category",
    "popular",
    "angle",
    "website",
    "download_url",
    "card_bg",
    "preview",
]


@admin.register(Distro)
class DistroAdmin(ModelAdmin):
    list_display = (
        "distro_id",
        "name",
        "display_accent",
        "display_category",
        "based_on",
        "pkg_mgr",
        "init_system",
        "display_popular",
        "latest_version",
        "display_links",
    )
    list_filter = (
        ("popular", BooleanRadioFilter),
        "category",
        "pkg_mgr",
        "init_system",
        "based_on",
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = (
        "distro_id",
        "name",
        "tagline",
        "description",
        "pkg_mgr",
        "desktop",
        "category",
    )
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Identity & Classification"),
            {
                "fields": (
                    "distro_id",
                    "name",
                    "tagline",
                    "category",
                    "popular",
                    "angle",
                ),
                "description": _("Distro unique slug and display taxonomy."),
            },
        ),
        (
            _("Architecture & Ecosystem"),
            {
                "fields": (
                    "based_on",
                    "init_system",
                    "pkg_mgr",
                    "desktop",
                    "architectures",
                    "release_model",
                    "latest_version",
                ),
            },
        ),
        (
            _("Theming & Visual Media"),
            {
                "fields": ("accent", "card_bg", "preview"),
                "description": _(
                    "Primary branding color hex, background badge/artwork, and screenshot preview URL."
                ),
            },
        ),
        (
            _("System Requirements & License"),
            {
                "fields": ("min_ram", "min_disk", "license"),
            },
        ),
        (
            _("Installation Command & Web Resources"),
            {
                "fields": ("install_cmd", "website", "download_url"),
            },
        ),
        (
            _("Guides & Extended Content (JSON)"),
            {
                "classes": ("collapse",),
                "fields": ("description", "key_features", "installation"),
                "description": _(
                    "Deep documentation, bullet points, and step-by-step install guides (normal, dual, vm)."
                ),
            },
        ),
        (
            _("Metadata"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = [
        "mark_popular",
        "unmark_popular",
        "sync_to_flavours",
        "duplicate_distro",
    ]

    @display(description=_("Accent Color"))
    def display_accent(self, instance: Distro):
        color = instance.accent or "#E95420"
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="inline-block w-4 h-4 rounded-full border border-base-300 dark:border-base-700 shadow-xs" style="background-color: {};"></span>'
            '<span class="font-mono text-xs text-subtle">{}</span>'
            "</div>",
            color,
            color,
        )

    @display(description=_("Category"), label=True)
    def display_category(self, instance: Distro):
        return instance.category

    @display(description=_("Popular"), boolean=True)
    def display_popular(self, instance: Distro):
        return instance.popular

    @display(description=_("Links"))
    def display_links(self, instance: Distro):
        links = []
        if instance.website:
            links.append(
                format_html(
                    '<a href="{}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline inline-flex items-center gap-1 text-xs">'
                    '<span class="material-symbols-outlined text-sm!">language</span>Web</a>',
                    instance.website,
                )
            )
        if instance.download_url:
            links.append(
                format_html(
                    '<a href="{}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline inline-flex items-center gap-1 text-xs">'
                    '<span class="material-symbols-outlined text-sm!">download</span>ISO</a>',
                    instance.download_url,
                )
            )
        if not links:
            return "—"
        return format_html('<div class="flex items-center gap-3">{}</div>', format_html(" ".join([str(l) for l in links])))

    @action(description=_("Mark as popular"))
    def mark_popular(self, request, queryset):
        queryset.update(popular=True)
        # Keep flavours synchronized
        for d in queryset:
            Flavour.objects.filter(distro_id=d.distro_id).update(popular=True)
        self.message_user(request, f"Marked {queryset.count()} distro(s) as popular.")

    @action(description=_("Unmark popular"))
    def unmark_popular(self, request, queryset):
        queryset.update(popular=False)
        for d in queryset:
            Flavour.objects.filter(distro_id=d.distro_id).update(popular=False)
        self.message_user(request, f"Unmarked popular status for {queryset.count()} distro(s).")

    @action(description=_("Sync selected Distros to Flavours catalogue"))
    def sync_to_flavours(self, request, queryset):
        synced_count = 0
        for distro in queryset:
            flavour_data = {
                field: getattr(distro, field)
                for field in FLAVOUR_SYNC_FIELDS
                if hasattr(distro, field)
            }
            Flavour.objects.update_or_create(
                distro_id=distro.distro_id,
                defaults=flavour_data,
            )
            synced_count += 1
        self.message_user(
            request, f"Successfully synchronized {synced_count} distro(s) to flavours catalogue."
        )

    @action(description=_("Duplicate selected Distros"))
    def duplicate_distro(self, request, queryset):
        cloned = 0
        for d in queryset:
            new_id = f"{d.distro_id}-copy"
            counter = 1
            while Distro.objects.filter(distro_id=new_id).exists():
                new_id = f"{d.distro_id}-copy-{counter}"
                counter += 1

            new_distro = Distro.objects.get(pk=d.pk)
            new_distro.pk = None
            new_distro.distro_id = new_id
            new_distro.name = f"{d.name} (Copy)"
            new_distro.save()
            cloned += 1
        self.message_user(request, f"Duplicated {cloned} distro(s).")


@admin.register(Flavour)
class FlavourAdmin(ModelAdmin):
    list_display = (
        "distro_id",
        "name",
        "display_accent",
        "display_category",
        "based_on",
        "pkg_mgr",
        "display_popular",
        "display_website",
    )
    list_filter = (
        ("popular", BooleanRadioFilter),
        "category",
        "pkg_mgr",
        "based_on",
        ("created_at", RangeDateTimeFilter),
    )
    search_fields = ("distro_id", "name", "tagline", "category", "pkg_mgr")
    ordering = ("name",)
    readonly_fields = ("created_at", "updated_at")

    fieldsets = (
        (
            _("Flavour Card Data"),
            {
                "fields": (
                    "distro_id",
                    "name",
                    "tagline",
                    "category",
                    "popular",
                    "angle",
                ),
            },
        ),
        (
            _("Architecture & Repos"),
            {
                "fields": ("based_on", "pkg_mgr"),
            },
        ),
        (
            _("Visuals & External Links"),
            {
                "fields": ("accent", "card_bg", "preview", "website", "download_url"),
            },
        ),
        (
            _("Metadata"),
            {
                "classes": ("collapse",),
                "fields": ("created_at", "updated_at"),
            },
        ),
    )

    actions = [
        "mark_popular",
        "unmark_popular",
        "pull_from_distro",
    ]

    @display(description=_("Accent Color"))
    def display_accent(self, instance: Flavour):
        color = instance.accent or "#E95420"
        return format_html(
            '<div class="flex items-center gap-2">'
            '<span class="inline-block w-4 h-4 rounded-full border border-base-300 dark:border-base-700 shadow-xs" style="background-color: {};"></span>'
            '<span class="font-mono text-xs text-subtle">{}</span>'
            "</div>",
            color,
            color,
        )

    @display(description=_("Category"), label=True)
    def display_category(self, instance: Flavour):
        return instance.category

    @display(description=_("Popular"), boolean=True)
    def display_popular(self, instance: Flavour):
        return instance.popular

    @display(description=_("Website"))
    def display_website(self, instance: Flavour):
        if not instance.website:
            return "—"
        return format_html(
            '<a href="{}" target="_blank" rel="noopener noreferrer" class="text-primary-600 hover:underline inline-flex items-center gap-1 text-xs">'
            '<span class="material-symbols-outlined text-sm!">open_in_new</span>Visit</a>',
            instance.website,
        )

    @action(description=_("Mark as popular"))
    def mark_popular(self, request, queryset):
        queryset.update(popular=True)
        for f in queryset:
            Distro.objects.filter(distro_id=f.distro_id).update(popular=True)
        self.message_user(request, f"Marked {queryset.count()} flavour(s) as popular.")

    @action(description=_("Unmark popular"))
    def unmark_popular(self, request, queryset):
        queryset.update(popular=False)
        for f in queryset:
            Distro.objects.filter(distro_id=f.distro_id).update(popular=False)
        self.message_user(request, f"Unmarked popular status for {queryset.count()} flavour(s).")

    @action(description=_("Pull updates from parent Distro record"))
    def pull_from_distro(self, request, queryset):
        pulled = 0
        for f in queryset:
            distro = Distro.objects.filter(distro_id=f.distro_id).first()
            if distro:
                for field in FLAVOUR_SYNC_FIELDS:
                    if hasattr(distro, field):
                        setattr(f, field, getattr(distro, field))
                f.save()
                pulled += 1
        self.message_user(request, f"Updated {pulled} flavour(s) from Distro catalogue.")
