import json
import os
import re
from pathlib import Path

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

DATA_FILE = (
    Path(__file__).resolve().parent.parent.parent.parent.parent
    / "apps"
    / "catalogue"
    / "data"
    / "distros.json"
)


# The seed JSON keeps the frontend's camelCase keys; the columns are snake_case.
CAMEL_TO_DB = {
    "id": "distro_id",
    "init": "init_system",
    "basedOn": "based_on",
    "pkgMgr": "pkg_mgr",
    "downloadUrl": "download_url",
    "releaseModel": "release_model",
    "latestVersion": "latest_version",
    "minRam": "min_ram",
    "minDisk": "min_disk",
    "installCmd": "install_cmd",
    "cardBg": "card_bg",
    "keyFeatures": "key_features",
}


def _to_db(entry):
    """Rename to column names: id->distroId, init->initSystem,
    installation holds the guide (frontend keys stay id/init/installGuide)."""
    data = {CAMEL_TO_DB.get(k, k): v for k, v in entry.items()}
    data["init_system"] = data.get("init_system") or "systemd"
    return data


FLAVOUR_FIELDS = [
    "distro_id",
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


class Command(BaseCommand):
    help = "Seed distros + flavours (wipe-then-insert), and create the admin user."

    def add_arguments(self, parser):
        parser.add_argument(
            "--destroy", action="store_true", help="Wipe distros + flavours and stop."
        )
        parser.add_argument(
            "--email", default=os.environ.get("ADMIN_EMAIL", "admin@distropedia.local")
        )
        parser.add_argument(
            "--password", default=os.environ.get("ADMIN_PASSWORD", "admin1234")
        )

    def handle(self, *args, **opts):
        from apps.catalogue.models import Distro, Flavour

        Distro.objects.all().delete()
        Flavour.objects.all().delete()

        if opts["destroy"]:
            self.stdout.write("Destroyed all distros + flavours")
            return

        raw = json.loads(DATA_FILE.read_text())
        docs = [_to_db(entry) for entry in raw]
        Distro.objects.bulk_create([Distro(**doc) for doc in docs])
        Flavour.objects.bulk_create(
            [
                # absent keys (angle, cardBg on some entries) take the
                # column default rather than being stored as null.
                Flavour(**{f: doc[f] for f in FLAVOUR_FIELDS if f in doc})
                for doc in docs
            ]
        )
        self.stdout.write(
            f"Seeded {Distro.objects.count()} distros + {Flavour.objects.count()} flavours"
        )

        from apps.accounts.models import User

        email = opts["email"].strip().lower()
        user = User.objects.filter(email=email).first()
        if user is None:
            user = User(email=email)
        user.name = user.name or "Admin"
        # bcrypt at cost 10 — the same hasher the register endpoint uses
        user.password = make_password(opts["password"], hasher="bcrypt")
        user.is_admin = True
        user.save()
        self.stdout.write(f"Admin user ready: {email} / {opts['password']}")
