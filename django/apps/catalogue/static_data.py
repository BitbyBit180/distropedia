"""Static catalogue fallback — the twin of `backend/src/data/distros.js`.

The Express controllers caught a DB failure and served the seeded JS array
instead; here the same array lives in `data/distros.json`, generated once from
that JS source (see `django/scripts/export_seed_data.mjs`) so both stacks read
identical data.
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
