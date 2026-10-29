"""Static catalogue fallback — mirrors `frontend/src/data/distros.js`.

When the DB is unreachable the API serves this seeded array instead; it lives
in `data/distros.json` so a DB outage (or a fresh database before
`manage.py seed`) never breaks the API.
"""

import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent / "data" / "distros.json"

_cache = None


def static_distros():
    global _cache
    if _cache is None:
        with DATA_FILE.open(encoding="utf-8") as handle:
            _cache = json.load(handle)
    return _cache
