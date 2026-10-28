"""Distro (full detail) + Flavour (lean catalogue) — the same two collections
the Mongo backend used, linked by `distro_id`.

Field-name mapping preserved from the original: frontend `id` / `init` /
`installGuide` <-> database `distro_id` / `init_system` / `installation`
(`init` was reserved by Mongoose; the API layer translates both directions in
apps.catalogue.api).
"""

from django.db import models


class Distro(models.Model):
    # slug, e.g. "ubuntu" — matches the frontend `distro.id`
    distro_id = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    accent = models.CharField(max_length=16, default="#E95420")
    tagline = models.TextField(blank=True, default="")
    based_on = models.CharField(max_length=80, default="Independent")
    init_system = models.CharField(max_length=40, default="systemd")
    pkg_mgr = models.CharField(max_length=60, default="apt")
    desktop = models.CharField(max_length=120, blank=True, default="")
    category = models.CharField(max_length=60, default="Independent", db_index=True)
    popular = models.BooleanField(default=False, db_index=True)
    angle = models.FloatField(null=True, blank=True, default=None)
    website = models.TextField(blank=True, default="")
    download_url = models.TextField(blank=True, default="")
    release_model = models.CharField(max_length=120, blank=True, default="")
    latest_version = models.CharField(max_length=120, blank=True, default="")
    min_ram = models.CharField(max_length=120, blank=True, default="")
    min_disk = models.CharField(max_length=120, blank=True, default="")
    license = models.CharField(max_length=120, blank=True, default="")
    architectures = models.CharField(max_length=200, blank=True, default="")
    install_cmd = models.TextField(blank=True, default="")
    card_bg = models.CharField(max_length=200, blank=True, default="")
    preview = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    key_features = models.JSONField(default=list, blank=True)
    # Step-by-step install guides { normal, dual, vm } — stored per distro so
    # detail content lives in the DB, not hardcoded in the client.
    installation = models.JSONField(null=True, blank=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "distros"
        # Natural seed order, like the Mongo collection returned it.
        ordering = ["pk"]

    def __str__(self):
        return self.distro_id


class Flavour(models.Model):
    distro_id = models.CharField(max_length=64, unique=True)
    name = models.CharField(max_length=120)
    accent = models.CharField(max_length=16, default="#E95420")
    tagline = models.TextField(blank=True, default="")
    based_on = models.CharField(max_length=80, default="Independent")
    pkg_mgr = models.CharField(max_length=60, default="apt")
    category = models.CharField(max_length=60, default="Independent", db_index=True)
    popular = models.BooleanField(default=False, db_index=True)
    angle = models.FloatField(null=True, blank=True, default=None)
    website = models.TextField(blank=True, default="")
    download_url = models.TextField(blank=True, default="")
    card_bg = models.CharField(max_length=200, blank=True, default="")
    preview = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "flavours"
        ordering = ["pk"]

    def __str__(self):
        return self.distro_id
