"""GET/POST/PUT/DELETE for /api/flavours and /api/distros.

Response envelopes, query-parameter handling, status codes and Cache-Control
values are the API contract, including the `id` / `init` / `installGuide`
<-> `distro_id` / `init_system` / `installation` translation.
"""

from apps.catalogue.models import Distro, Flavour
from apps.core.errors import ApiError, endpoint, set_cache_control
from apps.core.serialize import iso

from django.core.exceptions import ValidationError
from django.db.models import Q

FLAVOUR_CACHE = "public, max-age=60, stale-while-revalidate=300"
CATEGORY_CACHE = "public, max-age=300, stale-while-revalidate=600"


def _camel(value, optional_angle=True):
    """Shape a row for the API: frontend key names, internals hidden."""
    data = {
        "distroId": value.distro_id,
        "name": value.name,
        "accent": value.accent,
        "tagline": value.tagline or "",
        "basedOn": value.based_on,
        "pkgMgr": value.pkg_mgr,
        "category": value.category,
        "popular": value.popular,
        "website": value.website or "",
        "downloadUrl": value.download_url or "",
        "cardBg": value.card_bg or "",
        "preview": value.preview or "",
        "id": value.distro_id,
    }
    # An absent `angle` is omitted entirely rather than sent as null.
    if value.angle is not None:
        data["angle"] = value.angle
    if hasattr(value, "init_system"):
        data["init"] = value.init_system or "systemd"
        data["desktop"] = value.desktop or ""
        data["releaseModel"] = value.release_model or ""
        data["latestVersion"] = value.latest_version or ""
        data["minRam"] = value.min_ram or ""
        data["minDisk"] = value.min_disk or ""
        data["license"] = value.license or ""
        data["architectures"] = value.architectures or ""
        data["installCmd"] = value.install_cmd or ""
        data["description"] = value.description or ""
        data["keyFeatures"] = value.key_features or []
        if value.installation:
            data["installGuide"] = value.installation
    data["createdAt"] = iso(value.created_at)
    data["updatedAt"] = iso(value.updated_at)
    return data


def _to_db(body, *, strip_id=False, allow_init=True):
    """Frontend keys -> database columns."""
    data = dict(body or {})
    mapped = {}
    if data.get("id") and not data.get("distroId"):
        data["distroId"] = data["id"]
    if data.get("init") and not data.get("initSystem"):
        data["initSystem"] = data["init"]
    if data.get("installGuide") and not data.get("installation"):
        data["installation"] = data["installGuide"]

    fields = {
        "distroId": "distro_id",
        "name": "name",
        "accent": "accent",
        "tagline": "tagline",
        "basedOn": "based_on",
        "initSystem": "init_system",
        "pkgMgr": "pkg_mgr",
        "desktop": "desktop",
        "category": "category",
        "popular": "popular",
        "angle": "angle",
        "website": "website",
        "downloadUrl": "download_url",
        "releaseModel": "release_model",
        "latestVersion": "latest_version",
        "minRam": "min_ram",
        "minDisk": "min_disk",
        "license": "license",
        "architectures": "architectures",
        "installCmd": "install_cmd",
        "cardBg": "card_bg",
        "preview": "preview",
        "description": "description",
        "keyFeatures": "key_features",
        "installation": "installation",
    }
    for key, column in fields.items():
        if key in data:
            mapped[column] = data[key]
    # Column constraints: distroId is trimmed+lowercased, name trimmed.
    if isinstance(mapped.get("distro_id"), str):
        mapped["distro_id"] = mapped["distro_id"].strip().lower()
    if isinstance(mapped.get("name"), str):
        mapped["name"] = mapped["name"].strip()
    if not allow_init:
        mapped.pop("init_system", None)
        mapped.pop("installation", None)
    if strip_id:
        mapped.pop("distro_id", None)
    return mapped


# Required fields, checked the same way:
# an empty/missing value on create (or on an update that touches the field)
# is a 400 "Validation failed", not a 500.
REQUIRED_COLUMNS = {"distro_id": "distroId", "name": "name"}


def _validate_required(mapped, creating=False):
    errors = []
    for column, label in REQUIRED_COLUMNS.items():
        if not creating and column not in mapped:
            continue
        if not (mapped.get(column) or "").strip():
            errors.append(f"{label} is required")
    if errors:
        raise ValidationError(errors)


def _find_distro(key, model):
    lowered = (key or "").lower()
    found = model.objects.filter(distro_id=lowered).first()
    if found is None:
        found = model.objects.filter(name__iexact=lowered).first()
    return found


# ---------------------------------------------------------------- flavours ---


@endpoint(methods=("GET", "POST"))
def flavours_collection(request, body, user):
    if request.method == "POST":
        payload = _to_db(body)
        _validate_required(payload, creating=True)
        flavour = Flavour.objects.create(**payload)
        return {"success": True, "data": _camel(flavour)}, 201

    search = request.GET.get("search", "")
    category = request.GET.get("category", "")
    popular = request.GET.get("popular")
    page = request.GET.get("page", "1")
    limit = request.GET.get("limit", "50")
    sort = request.GET.get("sort", "")

    rows = Flavour.objects.all()
    conditions = Q()
    if category and category != "All":
        conditions &= Q(category=category)
    if popular == "true":
        conditions &= Q(popular=True)
    elif popular == "false":
        conditions &= Q(popular=False)
    if search and search.strip():
        term = search.strip()
        conditions &= (
            Q(name__icontains=term)
            | Q(tagline__icontains=term)
            | Q(based_on__icontains=term)
            | Q(pkg_mgr__icontains=term)
            | Q(category__icontains=term)
        )
    rows = rows.filter(conditions)

    try:
        page_num = max(int(page) or 1, 1)
    except (TypeError, ValueError):
        page_num = 1
    try:
        limit_num = min(max(int(limit) or 50, 1), 100)
    except (TypeError, ValueError):
        limit_num = 50

    if sort == "name":
        rows = rows.order_by("name", "pk")
    elif sort == "newest":
        rows = rows.order_by("-created_at", "pk")
    else:
        rows = rows.order_by("pk")

    total = rows.count()
    window = rows[(page_num - 1) * limit_num : (page_num - 1) * limit_num + limit_num]
    data = [_camel(row) for row in window]

    set_cache_control(request, FLAVOUR_CACHE)
    return {
        "success": True,
        "count": len(data),
        "total": total,
        "page": page_num,
        "pages": (total + limit_num - 1) // limit_num if limit_num else 0,
        "data": data,
    }


@endpoint(methods=("GET",))
def flavours_popular(request, body, user):
    rows = Flavour.objects.filter(popular=True).order_by("name", "pk")
    data = [_camel(row) for row in rows]
    set_cache_control(request, FLAVOUR_CACHE)
    return {"success": True, "count": len(data), "data": data}


@endpoint(methods=("GET",))
def flavours_categories(request, body, user):
    categories = (
        Flavour.objects.exclude(category__isnull=True)
        .exclude(category="")
        # clear Meta ordering, else DISTINCT also keys on pk and repeats values
        .order_by()
        .values_list("category", flat=True)
        .distinct()
    )
    set_cache_control(request, CATEGORY_CACHE)
    return {"success": True, "data": ["All", *sorted(categories)]}


@endpoint(methods=("GET", "PUT", "DELETE"))
def flavour_by_key(request, body, user, key=None):
    flavour = _find_distro(key, Flavour)

    if request.method == "GET":
        if flavour is None:
            raise ApiError(f"Flavour '{key}' not found", 404)
        return {"success": True, "data": _camel(flavour)}

    if request.method == "PUT":
        if flavour is None:
            raise ApiError(f"Flavour '{key}' not found", 404)
        updates = _to_db(body, strip_id=True, allow_init=False)
        _validate_required(updates)
        for column, value in updates.items():
            setattr(flavour, column, value)
        flavour.save()
        return {"success": True, "data": _camel(flavour)}

    if flavour is None:
        raise ApiError(f"Flavour '{key}' not found", 404)
    flavour.delete()
    return {"success": True, "message": f"Flavour '{key.lower()}' deleted"}


# ----------------------------------------------------------------- distros ---


@endpoint(methods=("POST",))
def distros_collection(request, body, user):
    payload = _to_db(body)
    _validate_required(payload, creating=True)
    distro = Distro.objects.create(**payload)
    return {"success": True, "data": _camel(distro)}, 201


COMPARE_COLUMNS = [
    "distro_id",
    "name",
    "accent",
    "tagline",
    "based_on",
    "init_system",
    "pkg_mgr",
    "desktop",
    "category",
    "release_model",
    "latest_version",
    "min_ram",
    "min_disk",
    "license",
    "architectures",
    "install_cmd",
    "website",
    "download_url",
    "preview",
]


@endpoint(methods=("GET",))
def distros_compare(request, body, user):
    ids = [part.strip().lower() for part in request.GET.get("ids", "").split(",") if part.strip()]
    if not ids:
        raise ApiError(
            "Provide up to 4 distro ids, e.g. /api/distros/compare?ids=ubuntu,arch", 400
        )
    if len(ids) > 4:
        raise ApiError("Cannot compare more than 4 distros", 400)

    rows = Distro.objects.filter(distro_id__in=ids)
    by_id = {row.distro_id: row for row in rows}
    # .select(COMPARE_FIELDS) — only these keys exist on compare rows, so the
    # detail-only fields (and timestamps) are absent from the payload.
    lean = {
        "id",
        "distroId",
        "name",
        "accent",
        "tagline",
        "basedOn",
        "init",
        "pkgMgr",
        "desktop",
        "category",
        "releaseModel",
        "latestVersion",
        "minRam",
        "minDisk",
        "license",
        "architectures",
        "installCmd",
        "website",
        "downloadUrl",
        "preview",
    }
    data = []
    for distro_id in ids:
        row = by_id.get(distro_id)
        if row is None:
            continue
        shaped = _camel(row)
        data.append({key: value for key, value in shaped.items() if key in lean})

    set_cache_control(request, FLAVOUR_CACHE)
    return {"success": True, "count": len(data), "data": data}


@endpoint(methods=("GET", "PUT", "DELETE"))
def distro_by_key(request, body, user, key=None):
    distro = _find_distro(key, Distro)

    if request.method == "GET":
        if distro is None:
            raise ApiError(f"Distro '{key}' not found", 404)
        if not distro.installation:
            # Docs created before guides existed get one built on the fly.
            from apps.catalogue.guides import build_install_guide

            distro.installation = build_install_guide(distro)
        set_cache_control(request, FLAVOUR_CACHE)
        return {"success": True, "data": _camel(distro)}

    if request.method == "PUT":
        if distro is None:
            raise ApiError(f"Distro '{key}' not found", 404)
        updates = _to_db(body)
        _validate_required(updates)
        for column, value in updates.items():
            setattr(distro, column, value)
        distro.save()
        return {"success": True, "data": _camel(distro)}

    if distro is None:
        raise ApiError(f"Distro '{key}' not found", 404)
    distro.delete()
    return {"success": True, "message": f"Distro '{key.lower()}' deleted"}
