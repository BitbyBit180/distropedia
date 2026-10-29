# AGENTS.md — Linux Distro Hub (DistroPedia)

React SPA + Django JSON API.

- `frontend/` — React 18 + Vite + Tailwind + Framer Motion; served on `:5173` in dev.
- `django/` — Django + SQLite JSON API on `:8010`. One `{ success, ... }` envelope shape,
  consistent status codes, JWT scheme, rate limits and `Retry-After` headers across every
  route.

## Commands (run from repo root)

- `npm install --prefix frontend` — install frontend deps
- `npm run dev` — frontend on `:5173` (root `package.json` forwards to `frontend/`)
- `npm --prefix frontend run build` — the only build step; also the verification

### Django API (run from `django/`)

- setup: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && cp .env.example .env && .venv/bin/python manage.py migrate && .venv/bin/python manage.py seed`
- **this machine has no `python3-venv`/ensurepip**: `python3 -m venv --without-pip .venv`, then `curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py && .venv/bin/python /tmp/get-pip.py`, then install requirements
- `.venv/bin/python manage.py runserver 8010` — the API on `:8010`

No tests, linter, typecheck, or CI exist. Verify with `npm --prefix frontend run build`,
`manage.py check`, and `curl localhost:8010/api/health`.

## Gotchas

- **Frontend → API wiring**: `frontend/vite.config.js` proxies `/api` → `http://localhost:8010`.
  Django CORS allows `CLIENT_URL` (default `http://localhost:5173`). In production set
  `VITE_API_URL=https://your-api-host/api` in `frontend/.env`.
- **`runserver` defaults to `:8000`** — always pass `8010` to match the Vite proxy. If a
  stale server holds the port, `fuser -k 8010/tcp`.
- **`.env`**: copy `django/.env.example` → `django/.env`. `JWT_SECRET` signs API bearer
  tokens; `DJANGO_SECRET_KEY` signs sessions; `GROQ_API_KEY` (+ optional `_2…_5`, comma
  lists allowed — 429/401 auto-rotates to the next key) enables AI chat and
  `TYPESAFE_API_KEY` enables the quiz verdict (both degrade gracefully without it — chat
  returns 503, quiz returns `ai:false`).
- **Field-name mapping**: frontend `id` / `init` / `installGuide` ↔ DB `distroId` /
  `initSystem` / `installation` (names kept for API compatibility). The controllers in
  `apps/catalogue/api.py` translate both directions — keep using their helpers.
- **fetch-then-fallback**: every `frontend/src/services/*` module falls back to local
  static data when the API is down — preserve that pattern so the UI never breaks offline.
- **Two collections, one key**: `flavours` (lean cards) vs `distros` (full detail + guides),
  linked by `distroId`. Three synced copies when adding a distro: the DB (via
  `manage.py seed`), `django/apps/catalogue/data/distros.json` (API fallback) and
  `frontend/src/data/distros.js` (UI fallback) — update all three.
- **Quiz is fully AI**: `frontend/src/utils/distroQuiz.js` holds questions only (no scores).
  `POST /api/quiz/recommend` sends readable answers; Jev picks from the whole catalogue.
  No shortlist, no fallback ranking — AI failure is an error + retry.
- **Groq via plain `requests`** (`django/apps/ai/`) — no SDK dependency. Model from
  `GROQ_MODEL`.
- **Styling**: shared tokens in `frontend/src/theme/designTokens.js` (`THEME`, `MONO`,
  `LINE`); one burnt-orange accent, JetBrains Mono, inline-style components. Don't
  hardcode hexes.
- **No react-router.** Custom pushState router in `frontend/src/App.jsx`: adding a page
  means extending `normalizeRoute` (pathname + hash) AND the `isX` checks AND the render
  ternary. A route missing from `normalizeRoute` silently falls back to `/`.

## Architecture

- Two processes: Vite (`:5173`) serves the React app; Django (`:8010`) serves only `/api`.
  Anything under `/api` that doesn't match returns the `{ success: false }` 404 envelope;
  non-`/api` paths return a plain 404.
- API access: `import.meta.env.VITE_API_URL || '/api'`; dev proxies `/api` → `:8010`
  (`frontend/vite.config.js`). The API route map is `django/config/urls.py`.
- SQLite file at `django/db.sqlite3`; bcrypt password hashes at cost 10; HS256 JWT
  bearer tokens carrying `{ id }`, expiring after 7 days.
- Data model: `flavours` and `distros` collections linked by `distroId`.
