# Linux Distro Hub (DistroPedia) — React + Django

Interactive Linux distribution showcase. **React + Vite frontend, Django + SQLite API backend**.

- **`frontend/`** — React 18 + Vite + Tailwind + Framer Motion (port 5173).
- **`django/`** — Django JSON API on SQLite (port 8010). One `{ success, ... }` envelope,
  consistent status codes, JWT scheme, rate limits and `Retry-After` headers on every route.

## Folder structure

```
linux/                          # repo root (docs + frontend orchestration)
├── package.json                # npm run dev -> frontend
├── frontend/                   # FRONTEND (React + Vite)
│   ├── index.html
│   ├── vite.config.js          # proxies /api -> http://localhost:8010 in dev
│   ├── package.json
│   ├── public/                 # card backgrounds, images, 3D model
│   └── src/
│       ├── App.jsx             # routes: / , /flavours, /distro/:id, /compare, ...
│       ├── main.jsx
│       ├── index.css
│       ├── pages/              # route screens
│       │   ├── HomePage.jsx        # / (wraps HeroSection)
│       │   ├── FlavoursPage.jsx    # /flavours (grid + search + filters)
│       │   └── DistroDetailPage.jsx# /distro/:id (specs + install guide)
│       ├── components/         # reusable UI (HeroSection, Navbar, DistroCard, ...)
│       ├── data/               # offline fallbacks (distros, install guide)
│       ├── hooks/              # useDistros, useDistro (API + fallback)
│       ├── services/           # API clients (fetch-then-fallback to ./data)
│       └── theme/designTokens.js   # shared design tokens
└── django/                     # BACKEND (Django + SQLite)
    ├── manage.py
    ├── requirements.txt
    ├── .env.example            # copy to .env
    ├── apps/
    │   ├── core/               # health, 404 envelope, CORS, rate limit, mailer, errors
    │   ├── catalogue/          # flavours + distros, seed data, install guides
    │   ├── accounts/           # register / login / password reset (bcrypt + JWT)
    │   ├── chat/               # AI chat (Groq, streaming)
    │   ├── community/          # posts, comments, votes, reports, moderation
    │   ├── quiz/               # "Find Your Distro" (Jev AI verdict)
    │   └── ai/                 # Groq client + agents
    └── config/                 # settings + URL table (the API route map)
```

## Getting started

Two processes: **the Django API** and **the Vite dev server**.

### 1. Django backend (first run)

```bash
cd django
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed     # 14 flavours + 14 distros + admin account
.venv/bin/python manage.py runserver 8010
```

Even on this repo's machine (Debian/Ubuntu without `python3-venv`), this works:

```bash
python3 -m venv --without-pip .venv
curl -sS https://bootstrap.pypa.io/get-pip.py -o /tmp/get-pip.py
.venv/bin/python /tmp/get-pip.py && .venv/bin/pip install -r requirements.txt
```

### 2. Frontend

```bash
npm install --prefix frontend   # first run
npm run dev                     # -> http://localhost:5173
```

The frontend calls `/api/...` which Vite proxies to `http://localhost:8010` (see
`frontend/vite.config.js`). If the API is down, every
`frontend/src/services/*` module falls back to local `frontend/src/data/distros.js`
so the UI never breaks.

In production set `VITE_API_URL=https://your-api-host/api` (in `frontend/.env`).
`CLIENT_URL` in `django/.env` is the one origin allowed to call the API
cross-origin (CORS), default `http://localhost:5173`.

### Backups (SQLite)

There is no automatic backup — schedule one wherever the app runs, or a dropped
file means re-seeding from scratch (user accounts, chats, and community content
are NOT in the seed). Copy `django/db.sqlite3` while the server is idle:

```bash
# nightly copy (cron example, keeps 7 days)
cp django/db.sqlite3 /var/backups/linux_hub/db-$(date +%F).sqlite3
find /var/backups/linux_hub -maxdepth 1 -mtime +7 -delete
```

For hot servers prefer `sqlite3 django/db.sqlite3 ".backup /path/backup.sqlite3"`
so you never copy a mid-write file.

### Password reset delivery

`POST /api/auth/forgot-password` issues a 15-minute token and hands it to
`django/apps/core/mailer.py`, which sends via SMTP (`SMTP_HOST/PORT/SECURE/USER/PASS/FROM`
in `django/.env` — Gmail works with an App Password). With no SMTP configured,
development prints the token to the server log (`RESET_DELIVERY=console`); in
production delivery refuses loudly instead of dropping the reset.

## API quick reference

| Method | Path | Notes |
|---|---|---|
| GET | `/api/health` | health check |
| GET | `/api/flavours?search=&category=&popular=true&sort=name` | catalogue list/search/filter (Flavours page) |
| GET | `/api/flavours/popular` | popular only |
| GET | `/api/flavours/categories` | `["All", ...]` |
| GET | `/api/distros/:id` | by `distroId` or name — includes full `installGuide` (Detail page) |
| GET | `/api/distros/compare?ids=a,b,c,d` | side-by-side spec comparison (max 4, ordered) |
| POST | `/api/quiz/recommend` | Jev "Find Your Distro" pick (public; `{ answers[] }` → `{ ai, winner, runnersUp, probabilities, confidence, explanation, strengths, tip }`; fully AI, no scoring table) |
| POST/PUT/DELETE | `/api/flavours...`, `/api/distros...` | admin CRUD per collection |

### Auth & AI chat (JWT-protected)

Set `JWT_SECRET` and `GROQ_API_KEY` in `django/.env` (optional `GROQ_MODEL`, default `openai/gpt-oss-120b`; comma-separated lists allowed — 429/401 rotates keys). The quiz verdict uses Jev instead: set `TYPESAFE_API_KEY` (optional `TYPESAFE_MODEL`, default `jev-latest`).

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register` `{ name, email, password }` | → `{ token, user }` |
| POST | `/api/auth/google` `{ credential }` | Google One Tap ID token → find-or-link-or-create → `{ token, user }` |
| POST | `/api/auth/login` `{ email, password }` | → `{ token, user }` |
| GET | `/api/auth/me` | current user (Bearer token) |
| GET/POST | `/api/chat` | list chats / create empty chat |
| GET/DELETE | `/api/chat/:id` | full chat / delete chat |
| PUT | `/api/chat/:id/rename` `{ title }` | rename a chat |
| POST | `/api/chat/:id/messages` `{ content }` | runs the pipeline: Reddit agent + web-research agent (parallel, Groq) → synthesizer; returns the assistant reply with sources |

### Community (JWT-protected, per-distro channels)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/community/posts?channel=&sort=hot\|new\|top&search=&page=` | feed; channels are `general`, a `distroId`, or `all` |
| POST | `/api/community/posts` `{ channel, title, body?, linkUrl? }` | create a post (text + optional link) |
| GET | `/api/community/posts/:id` | post + threaded comments (one nesting level) |
| PUT/DELETE | `/api/community/posts/:id` | edit/delete (author or admin; delete cascades) |
| POST | `/api/community/posts/:id/vote` `{ value: 1\|-1\|0 }` | up / down / un-vote |
| POST | `/api/community/posts/:id/comments` `{ body, parentId? }` | comment or reply |
| PUT/DELETE | `/api/community/comments/:id` | edit/delete (author or admin) |
| POST | `/api/community/comments/:id/vote` `{ value: 1\|-1\|0 }` | comment voting |
| POST | `/api/community/suggest-channel` `{ title, body? }` | Jev channel suggestion for a draft (suggestion only) |
| POST | `/api/community/reports` `{ targetType, targetId, reason, detail? }` | report a post/comment (one per user/target; user + AI flags share the queue) |
| GET | `/api/community/notifications` | own reply/comment notifications + `unreadCount` |
| PATCH | `/api/community/notifications/:id/read`, `/read-all` | mark read |
| GET | `/api/community/admin/audit` | admin-only append-only moderation log |
| GET/PATCH | `/api/community/admin/reports?status=&source=` | admin triage queue (user + AI flags), resolve/dismiss |

## Verification

- `npm --prefix frontend run build` — the frontend builds
- `cd django && .venv/bin/python manage.py check` — the API imports cleanly
- `curl http://localhost:8010/api/health` — the API answers
