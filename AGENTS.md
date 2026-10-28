# AGENTS.md — Linux Distro Hub (DistroPedia)

MERN showcase app. Root `package.json` only orchestrates; real code lives in `frontend/` and `backend/`.
`django/` is a parallel port of the same app: Django + SQLite serving the identical JSON API and the same pages without React or a bundler.

## Commands (run from repo root)

- `npm run install:all` — install both packages
- `npm run seed` — seed MongoDB (14 flavours + 14 distro details)
- `npm run server` — backend on `:5000` (`node --watch server.js`)
- `npm run dev` — frontend on `:5173`
- `npm --prefix frontend run build` — only verification available

### Django port (run from `django/`)

- setup: `python3 -m venv .venv && .venv/bin/pip install -r requirements.txt && cp .env.example .env && .venv/bin/python manage.py migrate && .venv/bin/python manage.py seed`
- `.venv/bin/python manage.py runserver 8010` — API **and** pages on one origin
- `node scripts/transpile.mjs` — `frontend/src/**.jsx|js` → `static/js/app/*.js` (run after ANY frontend source edit)
- `node scripts/build_css.mjs` — `static/css/tailwind.css` + `index.css`
- `node scripts/vendor_three.mjs` — three.js + the addons the 3D hero imports (closure walk of `from './…'`)
- `node scripts/gen_icons.mjs` — `static/js/core/icons.js` from the lucide icons the components use
- `node scripts/export_seed_data.mjs` — regenerate `apps/catalogue` seed JSON from `frontend/src/data/distros.js`

No tests, linter, typecheck, or CI exist. Verify with `vite build` (frontend) and `node --check <file>` + `curl localhost:5000/api/health` (backend). For the port: `curl localhost:8010/api/health`, `manage.py check`, and the runtime self-test at `http://localhost:8010/static/_probe.html` (reads `window.__probe`; 21 checks).

## Gotchas

- **Port 5000 busy (`EADDRINUSE`)**: `node --watch` keeps old servers alive. `fuser -k 5000/tcp` or kill the stale `node server.js` before restarting.
- **Backend needs MongoDB + `.env`**: copy `backend/.env.example` → `backend/.env`. `MONGO_URI` defaults to local; `GROQ_API_KEY` (+ optional `_2…_5`, comma lists allowed — 429/401 auto-rotates to the next key) enables AI chat and `TYPESAFE_API_KEY` (Jev) enables the quiz verdict (both degrade gracefully without it — quiz returns `ai:false`, chat returns 503).
- **Field-name mapping**: frontend `id` / `init` / `installGuide` ↔ DB `distroId` / `initSystem` (`init` is a reserved Mongoose method) / `installation`. Controllers already translate both directions — keep using their helpers.
- **`frontend/src` is the port's design contract.** The Django pages are transpiled from it, so fixing a visual difference means changing the React source and re-running `transpile.mjs` — never hand-editing `django/static/js/app/` (that tree is generated and gets overwritten).
- **`runserver --noreload`** must be restarted after editing templates (`django/templates/spa.html`) or Python; static JS/CSS are picked up per request.
- **The port is compared against the live React app**, not against memory: run Vite on `:5173` with `VITE_API_URL=http://localhost:8010/api` and both stacks share one API + one JWT, then diff per-route text and tag/class census. Relative timestamps ("2m ago") are the only expected text drift.
- **`django/.env`, `db.sqlite3`, `.venv/` stay untracked** (see `django/.gitignore`); `django/.env.example` carries dev placeholders only.

## Architecture

- **No react-router.** Custom pushState router in `frontend/src/App.jsx`: adding a page means extending `normalizeRoute` (pathname + hash) AND the `isX` checks AND the render ternary. A route missing from `normalizeRoute` silently falls back to `/`. The port mirrors this in `django/static/js/core/router.js` — a new route must be added to **both** (`normalizeRoute`, `LOADERS`, the ternary).
- **API access**: `import.meta.env.VITE_API_URL || '/api'`; dev proxies `/api` → `:5000` (`frontend/vite.config.js`). Every `frontend/src/services/*` module follows fetch-then-fallback-to-static-data — preserve that pattern so the UI never breaks offline. The transpiler rewrites `import.meta.env.X` to the `window.__dpConfig` values Django injects into `spa.html`.
- **Port runtime** (`django/static/js/core/react.js`): `h()`/`createElement` vnodes, a keyed differ, hooks (`useState/useRef/useMemo/useCallback/useEffect`) and `mount/unmount`. Discrete events flush pending renders synchronously before returning (React's sync-priority behavior) — scripts that type into a field and click submit in one task depend on it. Shims: `core/icons.js`, `core/motion.js` (framer-motion subset: `useScroll`/`useTransform`, `whileHover`, `layout` FLIP, `AnimatePresence`), `core/markdown.js`, `core/heroui.js`.
- **Two collections, one key**: `flavours` (lean cards) vs `distros` (full detail + guides), linked by `distroId`. Seed keeps them in sync — in Django both live in `apps/catalogue` keyed by `distro_id`.
- **Quiz is fully AI**: `frontend/src/utils/distroQuiz.js` holds questions only (no scores). `POST /api/quiz/recommend` sends readable answers; Jev picks from the whole catalogue. No shortlist, no fallback ranking — AI failure is an error + retry.
- **Groq via plain `fetch`** (`backend/src/services/groqClient.js`) — OpenAI-compatible, no SDK dependency. Model from `GROQ_MODEL`. The port uses `requests` in `apps/ai/`.
- **Styling**: shared tokens in `frontend/src/theme/designTokens.js` (`THEME`, `MONO`, `LINE`); one burnt-orange accent, JetBrains Mono, inline-style components. Don't hardcode hexes.
- **Data mirrors**: `frontend/src/data/distros.js` and `backend/src/data/distros.js` both hold the 14 seeded distros — keep them in sync when adding one; `django/scripts/export_seed_data.mjs` feeds the same JSON to SQLite.

