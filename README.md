# Linux Distro Hub (DistroPedia) — MERN Stack

Interactive Linux distribution showcase. **MongoDB + Express + React + Node (MERN)**.

- **`frontend/`** — React 18 + Vite + Tailwind + Framer Motion (port 5173).
- **`backend/`** — Express + Mongoose REST API (port 5000).
- Root `package.json` only orchestrates the two (`npm run dev`, `npm run server`, …).

## Folder structure

```
linux/                          # repo root (orchestration + docs)
├── package.json                # root scripts: dev / server / seed / install:all
├── frontend/                   # FRONTEND (client)
│   ├── index.html
│   ├── vite.config.js          # proxies /api -> http://localhost:5000 in dev
│   ├── package.json
│   ├── public/                 # card backgrounds, images, 3D model
│   └── src/
│       ├── App.jsx             # routes: / , /flavours, /distro/:id
│       ├── main.jsx
│       ├── index.css
│       ├── pages/              # route screens
│       │   ├── HomePage.jsx        # / (wraps HeroSection)
│       │   ├── FlavoursPage.jsx    # /flavours (grid + search + filters)
│       │   └── DistroDetailPage.jsx# /distro/:id (specs + install guide)
│       ├── components/         # reusable UI (HeroSection, Navbar,
│       │                       # DistroCard, DistroModal, Tux3DCanvas, ...)
│       ├── data/               # offline fallbacks (distros, install guide)
│       ├── hooks/              # useDistros, useDistro (API + fallback)
│       ├── services/distroApi.js   # API client
│       └── theme/designTokens.js   # shared design tokens
└── backend/                    # BACKEND (Express + MongoDB)
    ├── server.js               # entry: cors, json, /api/health, /api/distros
    ├── package.json
    ├── .env.example            # copy to .env
    └── src/
        ├── config/db.js        # mongoose connect
        ├── models/
        │   ├── Flavour.js      # `flavours` collection: lean cards catalogue
        │   └── Distro.js       # `distros` collection: full detail + guides
        ├── controllers/
        │   ├── flavourController.js
        │   └── distroController.js
        ├── routes/             # flavourRoutes (/api/flavours), distroRoutes (/api/distros)
        ├── middleware/errorMiddleware.js
        ├── data/
        │   ├── distros.js      # seed data
        │   └── installGuide.js # guide builder (detail content source of truth)
        └── utils/
            ├── asyncHandler.js
            └── seed.js         # npm run seed (seeds both collections)
```

## Getting started (full MERN)

All commands run from the **repo root**.

### 1. Install everything
```bash
npm run install:all
# = frontend install + backend install
```

### 2. Start MongoDB
Local default: `mongodb://127.0.0.1:27017/linux_hub`
- Local: run `mongod`, **or**
- Atlas: paste your URI into `backend/.env` as `MONGO_URI=...`

```bash
cp backend/.env.example backend/.env
```

### 3. Seed the database (14 flavours + 14 distro details with guides)
```bash
npm run seed
```

### 4. Run backend + frontend (two terminals)
```bash
npm run server   # backend  -> http://localhost:5000/api/health
npm run dev      # frontend -> http://localhost:5173
```

Frontend calls `/api/flavours/...` (catalogue) and `/api/distros/:id` (detail), proxied to :5000 in dev.
If the API is down, `frontend/src/services/distroApi.js` falls back to local `frontend/src/data/distros.js` so the UI never breaks.

In production set `VITE_API_URL=https://your-api-host/api` (in `frontend/.env`) and `CLIENT_URL` in `backend/.env`.

### Backups (MongoDB)

There is no automatic backup — schedule one wherever Mongo runs, or a dropped
database means re-seeding from scratch (user accounts, chats, and community
content are NOT in the seed):

```bash
# nightly dump (cron example, keeps 7 days)
mongodump --uri="mongodb://127.0.0.1:27017/linux_hub" --out="/var/backups/linux_hub/$(date +%F)"
find /var/backups/linux_hub -maxdepth 1 -mtime +7 -exec rm -rf {} +

# restore
mongorestore --uri="mongodb://127.0.0.1:27017/linux_hub" /var/backups/linux_hub/<date>/linux_hub
```

Atlas users: enable Continuous Backups in the cluster settings instead.

### Password reset delivery

`POST /api/auth/forgot-password` issues a 15-minute token and hands it to
`backend/src/utils/mailer.js`, which sends via SMTP (`SMTP_HOST/PORT/SECURE/USER/PASS/FROM`
in `backend/.env` — Gmail works with an App Password). With no SMTP configured,
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

Set `JWT_SECRET` and `GROQ_API_KEY` in `backend/.env` (optional `GROQ_MODEL`, default `openai/gpt-oss-120b`). The quiz verdict uses Jev instead: set `TYPESAFE_API_KEY` (optional `TYPESAFE_MODEL`, default `jev-latest`).

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

See `backend/README.md` for details and curl examples.

## Django port (`django/`)

The same app on one server: Django serves the JSON API **and** the pages. The
API keeps the Express contract route-for-route (same paths, `{ success, ... }`
envelopes, status codes, JWT scheme, rate limits and `Retry-After` headers), and
the pages render pixel-identically to the React original — `frontend/src/**` is
the design contract and is never edited for the port.

MongoDB becomes SQLite, and the browser gets no bundler and no React:
`django/static/js/core/react.js` is a small stand-in runtime (`h`, hooks, keyed
reconciler, effects), `scripts/transpile.mjs` turns the untouched JSX into
browser modules, and shims replace `lucide-react`, `framer-motion`,
`react-markdown` and `@heroui/react`.

### Run it

```bash
cd django
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env                       # dev placeholders; fill in AI keys if wanted
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed            # 14 flavours + 14 distros + admin account
node scripts/transpile.mjs                 # frontend/src JSX  -> static/js/app/*.js
node scripts/build_css.mjs                 # static/css/tailwind.css + index.css
node scripts/vendor_three.mjs              # three.js + the addons the 3D hero imports
node scripts/gen_icons.mjs                 # static/js/core/icons.js from lucide-react
.venv/bin/python manage.py runserver 8010
```

Then open `http://localhost:8010`. Every page route — `/`, `/flavours`,
`/distro/:id`, `/compare`, `/login`, `/chat`, `/community`, `/community/:id`,
`/quiz` — is served by the SPA shell and routed client-side with pushState,
exactly like the Vite app. `GROQ_API_KEY` (chat) and `TYPESAFE_API_KEY` (quiz
verdict, channel suggestions) work the same as in `backend/.env`; without them
those endpoints degrade or fail with the same messages.

`CLIENT_URL` (default `http://localhost:5173`) is the one origin allowed to call
`/api` cross-origin, mirroring `cors({ origin: CLIENT_URL })` — so the Vite dev
server can be pointed at this backend with
`VITE_API_URL=http://localhost:8010/api` for side-by-side comparison.

### After changing anything

| You edited | Re-run |
|---|---|
| `frontend/src/**` (pages, components, services) | `node django/scripts/transpile.mjs` |
| `frontend/src/index.css` or the Tailwind config | `node django/scripts/build_css.mjs` |
| the 3D hero's three.js imports | `node django/scripts/vendor_three.mjs` |
| icon usage in a component | `node django/scripts/gen_icons.mjs` |
| `django/apps/**` | nothing — but restart `runserver` if you use `--noreload` |

### Checking the port

- `http://localhost:8010/static/_probe.html` runs the runtime self-test (21
  checks over rendering, keyed diffing, controlled inputs, refs, effects and
  event-flush ordering) and prints PASS/FAIL lines; results also sit in
  `window.__probe`.
- Compare a page against the React app: load the same route on both, diff the
  visible text and the tag/class census. The ported pages are DOM-for-DOM equal
  (node counts and every class list match); the only text that can drift is
  relative timestamps like "2m ago".

