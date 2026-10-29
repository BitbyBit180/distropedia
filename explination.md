# Linux Distro Hub (DistroPedia) — Complete Project Explanation

> Presentation-ready walkthrough of every folder and file.
> Stack: **React (Vite) frontend + Django (SQLite) API backend**

## 1. Project Overview — What is this?

**Linux Distro Hub / DistroPedia** is an interactive showcase for Linux distributions:

- Browse **14 Linux distros** (Ubuntu, Debian, Arch, Fedora, Mint, Kali, etc.) as visual cards
- Open a **detail page** per distro: specs, features, install guide (Normal / Dual-boot / VM)
- **Compare up to 4 distros** side-by-side in a spec table
- **Quiz — "Find Your Distro"**: 10 questions → fully-AI verdict (TypeSafe Jev picks from the whole catalogue)
- **AI Chat — DistroPedia AI**: login-protected assistant using Groq + Reddit + web research
- **Community**: Reddit-style forum with per-distro channels, posts, threaded comments, votes, reports, notifications, admin moderation

No react-router — custom `pushState` router. No SDKs for AI — plain HTTP calls to Groq / TypeSafe.

### How the two halves connect

```
Browser (React :5173) -- /api/* --> Django (:8010) --> SQLite (django/db.sqlite3)
        |                                  |
        +-- falls back to local           +-- falls back to static data
            static data if API down            if AI keys missing
```

`frontend/vite.config.js` proxies `/api → http://localhost:8010` in dev.
In production: `VITE_API_URL=https://your-api-host/api` + `CLIENT_URL` in `django/.env`.

### Run it (from repo root)

```bash
# API backend (first run)
cd django
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env        # set JWT_SECRET, GROQ_API_KEY, TYPESAFE_API_KEY (optional)
.venv/bin/python manage.py migrate
.venv/bin/python manage.py seed    # 14 flavours + 14 distros + admin account
.venv/bin/python manage.py runserver 8010    # → http://localhost:8010/api/health

# Frontend (second terminal, repo root)
npm install --prefix frontend
npm run dev                  # → http://localhost:5173
```

---

## 2. Root Level Files

| Path | Purpose |
|---|---|
| `package.json` | Frontend orchestration only. No real code. Scripts: `dev`/`client`, `build`, `preview`. |
| `README.md` | Full setup guide, folder tree, SQLite backup notes, SMTP password-reset notes, complete API table (flavours, distros, quiz, auth, chat, community). |
| `AGENTS.md` | Developer gotchas: `runserver` port 8010, `.env` requirement, `id/init/installGuide ↔ distroId/initSystem/installation` field mapping, custom router warning, fetch-then-fallback pattern, Groq-via-requests, design tokens. |
| `.gitignore` | Ignores `node_modules`, `.env`, `db.sqlite3`, `.venv`, build output. |
| `frontend/` | All client code (React 18 + Vite 6). See §3. |
| `django/` | All API code (Django 5 + SQLite). See §4. |

---

## 3. Frontend — `frontend/`

**Stack:** React 18, Vite 6, Tailwind 3, HeroUI, Framer Motion, Three.js, lucide-react, react-markdown, simple-icons.

### 3.1 Root config files

| File | Explanation |
|---|---|
| `index.html` | Vite entry. Mounts `<div id="root">` → `src/main.jsx`. Loads JetBrains Mono font, favicon `/tux.svg`, title "DistroPedia". |
| `package.json` | Name `linux-distro-hub-frontend`. Scripts `dev/build/preview`. Deps listed above; devDeps `vite, @vitejs/plugin-react, tailwind, postcss, autoprefixer`. |
| `vite.config.js` | Vite + React plugin. Dev proxy `/api → http://localhost:8010` (the Django API). `allowedHosts` for ngrok demos. |
| `tailwind.config.js` | Content: `index.html + src/**/* + @heroui/theme`. `darkMode: class`. Plugin `heroui()`. |
| `postcss.config.js` | `tailwindcss + autoprefixer` processing. |
| `vercel.json` | SPA fallback: all routes rewritten to `/index.html` so the custom router works on refresh; `/api` rewrites to the deployed API host. |
| `hero_bg.html` | Standalone prototype for the hero background (radial gradient + SVG noise + grain). Ported into `src/index.css`. Not imported at runtime. |
| `test.html` | Discarded Tailwind-CDN mockup. Not imported. |
| `flavours-inspiration .png` | Design reference image for Flavours page grid. Not imported. |

### 3.2 `public/` — served as-is, no bundling

| File | Explanation |
|---|---|
| `tux.svg` | Favicon + fallback Tux penguin logo. |
| `tux/scene.gltf` + `scene.bin` + `license.txt` | 3D Tux model loaded by `Tux3DCanvas.jsx` via `/tux/scene.gltf`. |
| `same-bg.webp` | Neutral default card background used by `DistroCard.jsx`. |
| `ubuntu-card-bg.webp`, `debian-card-bg.webp`, `fedora-card-bg.webp`, `arch-card-bg.webp`, `mint-card-bg.webp`, `kali-card-bg.webp` | Per-distro hover backgrounds, referenced via `distro.cardBg`. |
| `install-guide/normal_step1_download.png` … `normal_step5_firstboot.png` | 5 visuals for Normal install (download ISO → flash USB → UEFI → partition → first boot). Shown on Detail page. |
| `install-guide/dual_step1_diskmgmt.png` … `dual_step5_grub.png` | 5 visuals for Dual-boot with Windows (disk mgmt → fast startup → Rufus → alongside → GRUB). |
| `install-guide/vm_step1_virtualbox.png` … `vm_step5_additions.png` | 5 visuals for VM install (VirtualBox → profile → storage → running → guest additions). |

### 3.3 `src/` core

| File | Explanation |
|---|---|
| `src/main.jsx` | ReactDOM entry. Wraps `<App/>` in `HeroUIProvider`, imports `index.css`. |
| `src/App.jsx` | **Custom router (no react-router).** `normalizeRoute()` maps pathname+hash → route, `navigate()` uses `pushState`, lazy-loads 9 pages in `Suspense(PageSkeleton)`. Routes: `/` (Home), `/flavours`, `/distro/:id`, `/compare`, `/quiz`, `/login`, `/chat`, `/community`, `/community/:id`. |
| `src/index.css` | Tailwind directives + global JetBrains Mono + `.hero-bg/.grain-*` backgrounds + `.dp-md` chat markdown + `.dp-skeleton` shimmer + custom scrollbar. |
| `src/theme/designTokens.js` | Single design source of truth. Exports `THEME, LINE, LINE_SOFT, CONNECTOR, MONO, RADIUS, BADGE` — burnt-orange accent, mono font. Imported by almost every component. Don't hardcode hexes. |

### 3.4 `src/data/` — offline fallbacks

| File | Explanation |
|---|---|
| `src/data/distros.js` | Mirror of all 14 distros. Exports `DISTROS, POPULAR_DISTROS`. Used when API is down. Must stay in sync with `django/apps/catalogue/data/distros.json`. |
| `src/data/installGuide.js` | Exports `getInstallationData(distro)` building `normal/dual/vm` 5-step guides. Fallback when `distro.installGuide` missing from API. Source of truth: `django/apps/catalogue/guides.py`. |

### 3.5 `src/utils/`

| File | Explanation |
|---|---|
| `src/utils/distroQuiz.js` | Questions only (no scores). Exports `QUIZ_QUESTIONS` (10 questions, bare labels). Jev picks the winner from the full catalogue. |
| `src/utils/timeAgo.js` | Exports `timeAgo(date)` → `just now / 5m / 3h / 2d / Jan 5`. Used by community feed/comments/notifications. |

### 3.6 `src/services/` — all use `VITE_API_URL || /api`, all fetch-then-fallback

| File | Explanation |
|---|---|
| `src/services/distroApi.js` | Catalogue API: `getDistros, getDistroById, getDistrosForCompare, getPopularDistros, getCategories`. Falls back to static data + normalizes `distroId→id, initSystem→init`. |
| `src/services/authApi.js` | Auth + `localStorage dp_token/dp_user`. `getToken/getUser/setAuth/clearAuth/register/login/me/forgotPassword/resetPassword/verifyResetToken`. |
| `src/services/chatApi.js` | Protected chat CRUD: `listChats/createChat/getChat/renameChat/deleteChat/sendMessage`. Used by `ChatPage`. |
| `src/services/communityApi.js` | Protected forum: posts CRUD + votes, comments CRUD + votes, `getChannelStats, suggestChannel, createReport, getNotifications/markRead/markAllRead`. |
| `src/services/quizApi.js` | `getAiRecommendation({answers})` → `POST /quiz/recommend` (30s abort, 10-min verdict cache). Throws on failure → error panel with retry. |

### 3.7 `src/hooks/`

| File | Explanation |
|---|---|
| `src/hooks/useAuth.js` | Synced auth state via listener set. Returns `{user, token, login, register, logout}`. Wraps `authApi`. |
| `src/hooks/useDistros.js` | Catalogue loader. Returns `{distros, popularDistros, categories, loading}` + `DEFAULT_CATEGORIES`. Used by Flavours/Compare/Community/Quiz. |
| `src/hooks/useDistro.js` | Single-distro detail. Returns `{distro, otherDistros, loading}`. Used by `DistroDetailPage`. |
| `src/hooks/useCompare.js` | Compare loader. Returns `{distros, loading}` + `MAX_COMPARE=4`. Used by `ComparePage`. |
| `src/hooks/useMedia.js` | `useMedia(query)` → bool media-query hook. Used by `Navbar/CommunityShell/ChatPage` for responsive layout. |

### 3.8 `src/components/` — shared UI

| File | Explanation |
|---|---|
| `src/components/Navbar.jsx` | Fixed glass pill nav. Props `currentRoute/onNavigate/searchQuery/onSearchChange`. Search mode on Flavours page + mobile hamburger. |
| `src/components/HeroSection.jsx` | Landing hero: 8-distro orbital ring around `Tux3DCanvas`, SVG dashed connectors, hover preview, mobile chips + bottom sheet. Rendered by `HomePage`. |
| `src/components/DistroCard.jsx` | Catalogue card with cursor-origin circular wipe to `cardBg`. Props `distro/onExplore`. Used by `FlavoursPage`. |
| `src/components/DistroModal.jsx` | Framer detail modal (banner, specs grid, website CTA, Esc/backdrop close). Legacy — detail is now a page, currently unused. |
| `src/components/DistroIcon.jsx` | Simple-Icons SVG logos. Exports `OFFICIAL_DISTRO_LOGOS` + `DistroIcon({name, accent, size})`. Used everywhere a logo appears. |
| `src/components/Skeleton.jsx` | Shimmer placeholders: `Skeleton, TextLines, PageSkeleton, DistroCardSkeleton, DistroGridSkeleton, DistroDetailSkeleton, CompareTableSkeleton, PostRowSkeleton, CommunityFeedSkeleton, RailListSkeleton, PostDetailSkeleton, ChatListSkeleton, ChatMessagesSkeleton, QuizResultSkeleton`. |
| `src/components/Tux3DCanvas.jsx` | Three.js interactive Tux (OrbitControls, parallax, float, accent light from `activeDistro`). Props `activeDistro/size/isMobile`. Used by `HeroSection`. |

### 3.9 `src/components/community/` — forum UI

| File | Explanation |
|---|---|
| `community/Avatar.jsx` | `UserAvatar({name, size})` (hue-hash letter) + `ChannelAvatar({channel, distro})` (distro logo or globe). |
| `community/PostCard.jsx` | Feed row: meta, title, link, 2-line preview, vote/comments/share/edit/delete. Exports `PostCard + RowAction`. |
| `community/CommentItem.jsx` | Recursive threaded comment with vote/reply/edit/collapse. Used by `PostDetailPage`. |
| `community/CommunityShell.jsx` | 3-column frame `[nav\|feed\|rail]` + hero bg. Exports `CommunityShell + RailCard`. |
| `community/CommunityNav.jsx` | Left nav + `MobileChannelBar`. Props `distros/channel/onNavigate/onChannel/onCreatePost`. |
| `community/CommunitySidebar.jsx` | Right-rail cards: `AboutCommunity/AboutChannel/RecentPosts/CommunityRules`. Fetches stats via `communityApi`. |
| `community/VotePill.jsx` | Horizontal `▲ score ▼` pill with per-post vote lock. |
| `community/NotificationBell.jsx` | Bell with unread badge + dropdown, 30s poll via `getNotifications`. Prop `onOpenPost`. |
| `community/ReportButton.jsx` | Flag → reason dropdown → `createReport`. Used on posts/comments. |

### 3.10 `src/pages/` — routed by `App.jsx`

| File / Route | Explanation |
|---|---|
| `src/pages/HomePage.jsx` → `/` | Thin wrapper rendering `HeroSection`. |
| `src/pages/FlavoursPage.jsx` → `/flavours` | Catalogue with search + category pills, Popular + All grids, quiz CTA. Uses `useDistros/DistroCard/Navbar`. |
| `src/pages/DistroDetailPage.jsx` → `/distro/:id` | Full-bleed banner, spec matrix, tabbed install guide (`normal/dual/vm`) with copyable commands + lightbox, side-dock scrollspy. Uses `useDistro/getInstallationData`. |
| `src/pages/ComparePage.jsx` → `/compare?ids=` | Picker (max 4) + spec table (`COMPARE_ROWS`). Uses `useDistros/useCompare`. |
| `src/pages/QuizPage.jsx` → `/quiz` | 10-step wizard → waits for Jev verdict (`quizApi`) → winner + runners-up + compare/community actions. AI failure shows an error panel with retry (no hardcoded guess). |
| `src/pages/AuthPage.jsx` → `/login` | Login/register + forgot → 6-box OTP → reset. Exports `AuthPage + OtpInput/ForgotResetView`. Uses `useAuth/authApi`. |
| `src/pages/ChatPage.jsx` → `/chat` | DistroPedia AI: sidebar history (rename/delete/collapse/drawer), markdown + `CodeBlock/TableBlock`, typewriter reveal, copy/download `.md`. Guards to `AuthPage` when no token. |
| `src/pages/CommunityPage.jsx` → `/community` | Feed with channel/sort/debounced search, `Composer` + AI `suggestChannel`, optimistic voting, pagination. |
| `src/pages/PostDetailPage.jsx` → `/community/:id` | Single post (markdown `CodeBlock`), edit/delete dialogs, comment composer + Best/New + search, optimistic nested replies/votes. |

---

## 4. API Backend — `django/`

**Stack:** Django 5 (Python), SQLite, PyJWT, bcrypt (via Django hashers), requests. No templates, no admin, no static files — it serves only `/api`. No tests/linter.

### 4.1 Root files

| File | Explanation |
|---|---|
| `manage.py` | Django CLI entry. `migrate`, `seed`, `runserver 8010`. |
| `requirements.txt` | `Django, bcrypt, PyJWT, requests, python-dotenv`. |
| `.env.example` | Template: `DEBUG, ALLOWED_HOSTS, CLIENT_URL, DJANGO_SECRET_KEY, JWT_SECRET, GROQ_API_KEY/MODEL, TYPESAFE_API_KEY/MODEL, SMTP_* / RESET_DELIVERY, ADMIN_EMAIL/PASSWORD`. Copy to `.env`. |
| `config/settings.py` | SECRET_KEY/DEBUG from env, SQLite DB file, the custom bcrypt-at-cost-10 hasher, JWT + AI-key + SMTP knobs, `APP_ENV` (stack traces only outside production). |
| `config/urls.py` | The entire route table (the API contract). Static segments (`popular`, `categories`, `compare`) are registered **before** `<key>`, so those words are never treated as a distro id. `^api(?:/\|$)` is the 404 envelope. |

### 4.2 `apps/core/` — cross-cutting infrastructure

| File | Explanation |
|---|---|
| `apps/core/errors.py` | `@endpoint(methods=…)` decorator wraps every route: auth first, then rate limiter (key = user id or IP), then the handler; converts `ApiError/validation/integrity` failures into the `{success:false, message}` envelope (+ `stack` outside production). Also `read_body`, `json_payload`, `error_payload`, `parse_id` (uncastable id → 400). |
| `apps/core/security.py` | Bearer-token auth: `issue_token(user_id)` (HS256 JWT `{id, exp}`, 7 days) + `authenticate_request` (`jwt.decode`) + `require_admin` (403). |
| `apps/core/ratelimit.py` | In-memory sliding-window limiter (single process). Presets: `VOTE (60/m), POST (5/10m), COMMENT (20/10m), QUIZ (20/m), CHAT_MESSAGE (30/m), AUTH (30/15m), SUGGEST_CHANNEL (20/m)`. Sets `Retry-After` on 429. |
| `apps/core/middleware.py` | `ApiCorsMiddleware` — preflight answered before routing with 204 + Access-Control headers; only `CLIENT_URL` origin allowed. |
| `apps/core/serialize.py` | Shared JSON shaping: `iso()` dates (`2026-10-28T19:37:00.123Z`), hides DB internals, keeps frontend key names. |
| `apps/core/mailer.py` | `deliver_reset_token({email, token})` via SMTP if configured, else console log (refuses in production without SMTP). |
| `apps/core/views.py` | `GET /api/health` + the `/api` 404 envelope. |

### 4.3 `apps/catalogue/` — models + endpoints (tables named `flavours` / `distros`)

| File | Explanation |
|---|---|
| `apps/catalogue/models.py` | `Flavour` (lean cards: `distro_id unique, name, accent, tagline, based_on, pkg_mgr, category, popular, angle, website, download_url, card_bg, preview`) + `Distro` (full detail: above + `init_system, desktop, release_model, latest_version, min_ram/min_disk, license, architectures, install_cmd, description, key_features[], installation`). Two tables, one key: `distro_id`. |
| `apps/catalogue/api.py` | `flavours_collection(?search,category,popular,page,limit,sort)` (case-insensitive `icontains` search), `flavours_popular`, `flavours_categories`, `flavour_by_key`, `distro_by_key` (by `distroId` or name; builds the guide on-the-fly if missing), `distros_compare(?ids= max 4)`, admin CRUD via `_to_db` (`id→distro_id, init→init_system, installGuide→installation`) and `_camel` (shapes rows back to frontend keys). |
| `apps/catalogue/guides.py` | **Single source of truth** for install content: `build_install_guide(distro)` → `{normal, dual, vm}` 5-step guides (pkgMgr-aware `updateCmd`). Stored in `installation`, served as `installGuide`. |
| `apps/catalogue/static_data.py` | Static catalogue fallback (`data/distros.json`) served when the DB is unreachable — the API never breaks. |
| `apps/catalogue/management/commands/seed.py` | `manage.py seed` — maps `id→distroId, init→initSystem`, bakes `build_install_guide` into `installation`, projects lean fields into `flavours` (14+14), creates the admin account (bcrypt cost 10). |

### 4.4 `apps/accounts/` — auth

| File | Explanation |
|---|---|
| `apps/accounts/models.py` | Custom user: unique lowercase email, bcrypt password hash (never serialised), null/empty hash for Google-only accounts, `is_admin`, hashed single-use 6-digit reset token + expiry. |
| `apps/accounts/api.py` | `register` / `login` (same message for wrong email vs wrong password — no enumeration), `google` (tokeninfo verification, links by verified email), `me`, `forgot_password` / `verify_reset_token` / `reset_password` (sha256-hashed OTP, 15-min expiry, constant-time compare). All behind `AUTH_LIMIT`. |
| `apps/accounts/hashers.py` | `Bcrypt10PasswordHasher` — Django's bcrypt pinned to cost 10 so hashes read `$2b$10$…`. |

### 4.5 `apps/chat/` + `apps/ai/` — AI assistant

| File | Explanation |
|---|---|
| `apps/chat/models.py` | `Chat` (user, title) + `Message` rows serialised back as bare `{role, content, sources}` objects — the shape the chat UI reads. |
| `apps/chat/api.py` | Chat CRUD (ownership → 404), `chat_messages` pipeline: save user msg → parallel `search_reddit + run_web_research` (thread pool) → `synthesize_answer` → `filter_sources` → save assistant msg. Also `chat_message_stream` (SSE). |
| `apps/ai/groq_client.py` | Groq via plain `requests` — `chat_completion` / `chat_completion_stream`. Key pool (`GROQ_API_KEY` + `_2…_5`, comma lists); 429/401 cools a key down. Model from `GROQ_MODEL`. |
| `apps/ai/jev_client.py` | TypeSafe `system_one({state, questions, model})`. Typed judgments only. Model from `TYPESAFE_MODEL` (default `jev-latest`). |
| `apps/ai/reddit.py` | `search_reddit(query)` — `search.json?q=+linux`, up to 4 posts + top-3 comments, 8s cap, never raises. |
| `apps/ai/web_research_agent.py` | `run_web_research({question, history})` — Groq recall (temp 0.3), empty on fail. Runs parallel with Reddit. |
| `apps/ai/synthesizer_agent.py` | `synthesize_answer({question, history, reddit_results, web_findings, web_sources})` — final Markdown + Sources section (+ a stream variant). |
| `apps/ai/citation_agent.py` | `filter_sources({question, sources})` — Jev Noul per source, keep ≥0.3, never strip all. |
| `apps/ai/quiz_agent.py` | `recommend_distro({answers, catalogue})` — one Jev Choice over the full catalogue + code-derived `runners_up, explanation, strengths, tip`. `MIN_TOP_PROBABILITY=0.15`. |
| `apps/ai/moderation_agent.py` | `screen_content(...)` — one batched Jev request judging spam / abusive / off-topic (threshold 0.7) → `Report(source:'ai')`, fire-and-forget. |
| `apps/ai/channel_suggest_agent.py` | `suggest_channel({title, body})` — Jev Choice over `general + distroIds`. |

### 4.6 `apps/community/` — Reddit-style forum

| File | Explanation |
|---|---|
| `apps/community/models.py` | `Post` (author, channel = `general`\|`distroId`, title≤150, body≤10k, link_url, score, comment_count; `Meta.indexes` on `channel+created_at` / `channel+score`), `Comment` (one nesting level via `parent`), `Vote` (unique per user+target; `apply_vote` moves the denormalised score), `Notification`, `Report` (source `user`\|`ai`, reason enum, status `open/resolved/dismissed`), `AuditLog` (append-only). |
| `apps/community/api.py` | Full forum API: feed (`?channel, sort:hot\|new\|top, search, page`), post CRUD (delete cascades), comment CRUD (recursive delete), votes, `stats`, `suggest_channel`, `reports`, `notifications` (+ read/read-all), admin `audit` + `reports` triage. |

### 4.7 `apps/quiz/`

| File | Explanation |
|---|---|
| `apps/quiz/api.py` | `POST /api/quiz/recommend` (public, always 200): loads catalogue (DB → static fallback), `sanitize_order` validates Jev's pick against it; no key / error / low confidence → `{ai:false, winner:null}` fallback. Fully AI — no scoring. |

---

## 5. Key API Endpoints (for demo)

```
GET  /api/health
GET  /api/flavours?search=&category=&popular=true&sort=name
GET  /api/flavours/popular
GET  /api/flavours/categories
GET  /api/distros/:id              (by distroId or name, includes installGuide)
GET  /api/distros/compare?ids=a,b,c,d
POST /api/quiz/recommend           { answers[] } → fully-AI verdict
POST /api/auth/register|login      → { token, user }
GET  /api/auth/me                  (Bearer)
GET|POST /api/chat                 (Bearer)
POST /api/chat/:id/messages        { content } → Reddit + web agents → reply
GET  /api/community/posts?channel=&sort=hot|new|top&search=&page=
POST /api/community/posts          { channel, title, body?, linkUrl? }
```

Graceful degradation: quiz returns `{ai:false}` without `TYPESAFE_API_KEY`; chat returns 503 without `GROQ_API_KEY`; frontend falls back to static data if the API is down; the API itself falls back to `data/distros.json` if the DB is down.

---

## 6. Suggested 5-Minute Presentation Flow

1. **Hook (30s):** "Choosing a Linux distro is overwhelming — DistroPedia is an interactive guide: browse, compare, quiz, ask AI, discuss."
2. **Browse (1m):** Home orbital hero (Three.js Tux) → Flavours grid + search/filter → Detail page specs + install-guide tabs with images + copyable commands.
3. **Decide (1m):** Compare 4 distros side-by-side → Quiz wizard → show Jev AI verdict with probabilities.
4. **Ask + Discuss (1m):** Login → AI chat (Reddit + Groq synthesis with sources) → Community post/vote/comment per distro channel.
5. **Under the hood (1m):** React + Django diagram, two-tables-one-key (`flavours` vs `distros` via `distro_id`), custom router, fetch-then-fallback, plain-requests AI clients, JWT + rate limits + moderation pipeline. Close with `manage.py seed / runserver` + `npm run dev`.

---

# PART B — Detailed Code Walkthrough (Viva: "Show code for X")

> How to use this: if they ask "show code for ___", open the file listed, show the snippet, explain the 3-line connection chain underneath it.

## B1. App startup + custom router — code for routing

**Files:** `frontend/src/main.jsx` → `frontend/src/App.jsx:16-53,60-118`

```jsx
// main.jsx — entry
ReactDOM.createRoot(document.getElementById('root')).render(
  <HeroUIProvider><App /></HeroUIProvider>
);

// App.jsx — NO react-router, custom pushState router
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const FlavoursPage = lazy(() => import('./pages/FlavoursPage.jsx'));
// ... 9 pages lazy-loaded → one chunk per page

function normalizeRoute(pathname, hash) {
  if (path === '/flavours') return '/flavours';
  if (path.startsWith('/distro/')) return pathname; // /distro/:id
  if (path === '/quiz') return '/quiz';
  // ... compare, community, chat, login
  return '/'; // unknown → home (silent fallback!)
}

const navigate = (path) => {
  window.history.pushState({}, '', path);
  setCurrentRoute(path);
};
```

**Explain:** `index.html #root → main.jsx → App.jsx`. `normalizeRoute` maps URL → route string, `navigate` pushes history + sets state, render ternary picks the page. Lazy + `Suspense(PageSkeleton)` keeps initial bundle small. Gotcha: forgetting `normalizeRoute` makes a route silently fall back to `/`.

## B2. Frontend → Backend connection — code for API wiring

**Files:** `frontend/vite.config.js:7-15`, `frontend/src/services/distroApi.js:5-11`, `django/config/urls.py`

```js
// vite.config.js — dev only
server: { proxy: { '/api': { target: 'http://localhost:8010' } } }

// every services/*.js — same pattern
const API_BASE = import.meta.env.VITE_API_URL || '/api';
async function fetchJSON(url) {
  const res = await fetch(url);           // → /api/flavours?... → :8010
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}
```

**Explain:** Browser calls `/api/...`. In dev Vite proxies to Django `:8010`; in prod `VITE_API_URL` points to the hosted API. `django/config/urls.py` maps every route, and `ApiCorsMiddleware` allows the `CLIENT_URL` origin (preflight answered before routing).

## B3. Browse catalogue — code for Flavours list (full vertical slice)

**Chain:** `FlavoursPage.jsx:82` → `hooks/useDistros.js:19-42` → `services/distroApi.js:29-51` → `django/apps/catalogue/api.py (flavours_collection)` → `models.py (Flavour)` → SQLite `flavours`

```jsx
// FlavoursPage.jsx
const { distros, popularDistros, categories, loading } = useDistros();
// filters locally, renders <DistroCard onExplore={(d)=>onNavigate(`/distro/${d.id}`)} />

// useDistros.js — starts with static data so page never blanks
const [distros, setDistros] = useState(DISTROS);
useEffect(() => {
  Promise.allSettled([getDistros(), getPopularDistros(), getCategories()])
    .then(([d,p,c]) => { /* replace only on fulfilled */ });
}, []);

// distroApi.js — try API, catch → static filter
const json = await fetchJSON(`${API_BASE}/flavours?search=..&limit=100`);
return (json.data || []).map(normalize);
// catch { return DISTROS.filter(...) }  ← offline fallback

# catalogue/api.py — real DB query (Django ORM)
conditions = Q()
if popular == "true": conditions &= Q(popular=True)
if search:            conditions &= Q(name__icontains=term) | Q(tagline__icontains=term)
total = Flavour.objects.filter(conditions).count()
flavours = Flavour.objects.filter(conditions)[offset:offset+limit]
return {"success": True, "count": …, "total": …, "page": …, "pages": …, "data": flavours}
```

**Explain:** Hook owns loading state, service owns fetch-then-fallback, the view owns the ORM filter/pagination, the model row is shaped into `{id,...}` by `_camel`. Same pattern repeats for popular + categories.

## B4. Detail page + install guide — code for specs/guides

**Chain:** `DistroDetailPage.jsx:86-87` → `hooks/useDistro.js:16-43` → `distroApi.getDistroById` → `django/apps/catalogue/api.py (distro_by_key)` → `guides.py` + `models.py`

```js
// useDistro.js
const [distro, setDistro] = useState(() => findLocal(distroId)); // instant
useEffect(() => { getDistroById(distroId).then(setDistro); }, [distroId]);

// catalogue/api.py — distro_by_key
distro = Distro.objects.filter(distro_id=key).first() or lookup by name
if not distro.installation:
    distro.installation = build_install_guide(distro)  # on-the-fly
return {"success": True, "data": _camel(distro)}  # {id, init, installGuide}

// guides.py — source of truth, pkgMgr-aware
updateCmd = "sudo apt update && sudo apt upgrade -y" if pkg_mgr == "apt" \
    else "sudo pacman -Syu" if pkg_mgr == "pacman" else "sudo dnf upgrade …"
return {"normal": {steps: [5]}, "dual": {steps: [5]}, "vm": {steps: [5]}}

# catalogue/api.py — _camel, the field-mapping helper
data["id"] = row.distro_id; data["init"] = row.init_system
data["installGuide"] = row.installation
```

**Explain:** Detail content lives in the DB (`installation` column), not hardcoded in the client. The API exposes the frontend's key names (`id`/`init`/`installGuide`) via `_camel`. Frontend `DistroDetailPage` tabs `normal/dual/vm` render steps + copyable `cmd` + images from `public/install-guide/`.

## B5. Seed — code for how DB gets the 14 distros

**File:** `django/apps/catalogue/management/commands/seed.py`

```python
def _to_db(entry):
    distro_id = entry["id"]
    init_system = entry.get("init") or "systemd"
    installation = build_install_guide(entry)   # guides baked in
    return {CAMEL_TO_DB.get(k, k): v for k, v in entry.items()}

for doc in docs:
    Distro.objects.update_or_create(distro_id=…, defaults=…)      # 14 details
    Flavour.objects.update_or_create(distro_id=…, defaults=lean)  # 14 cards
# + admin account: make_password(ADMIN_PASSWORD, hasher="bcrypt")
```

**Explain:** `manage.py seed` upserts both tables from one source, baking `build_install_guide` into `installation`. One key links them: `distro_id`. `frontend/src/data/distros.js` and `django/apps/catalogue/data/distros.json` must stay in sync.

## B6. Quiz end-to-end — fully AI, no scoring table

**Chain:** `utils/distroQuiz.js` (questions only) → `pages/QuizPage.jsx` → `services/quizApi.js` → `django/apps/quiz/api.py` → `apps/ai/quiz_agent.py` → `apps/ai/jev_client.py`

```js
// 1. Questions only — options are bare labels, zero points anywhere
export const QUIZ_QUESTIONS = [{ id: 'experience', question: '...', options: [{ label: '...' }] }, ...];

// 2. QuizPage sends readable answers only — no shortlist is computed
const readable = QUIZ_QUESTIONS.map((q) => ({ questionId: q.id, question: q.question, answer: ... }));
getAiRecommendation({ answers: readable })  // throws → error panel + retry (keeps answers)

# 3. quiz/api.py — always 200, ai:false means error (never a guess)
if not settings.TYPESAFE_API_KEY: return fallback(NO_KEY_MESSAGE)
winner, top_probability = recommend_distro(answers, catalogue)
if not winner or top_probability < MIN_TOP_PROBABILITY: return fallback("AI was unsure")

# 4. quiz_agent — ONE Jev Choice over the whole 14-distro catalogue
data = system_one(state={"answers": answers},
                  questions={"best_distro": {"type": "choice", "instructions": rubric, "criteria": criteria}})
# criteria = { ubuntu:"Ubuntu — ... | category | desktop | release | min RAM", ... }
# runners-up = 2nd/3rd probability; strengths = catalogue taglines;
# explanation = user profile + winner tagline; tip = FIRST_STEP_TIPS[winner]
```

**Explain:** No scoring table exists anywhere. The API validates Jev's pick against the catalogue via `sanitize_order`. Key missing / error / low confidence → `{ai:false, winner:null}` → frontend shows an error panel with Try again (answers kept) and Retake.

## B7. Auth — code for login/JWT/protect

**Chain:** `pages/AuthPage.jsx` → `hooks/useAuth.js` → `services/authApi.js:48-91` → `django/apps/accounts/api.py` → `apps/core/security.py`

```js
// authApi.js — token in localStorage
headers.Authorization = `Bearer ${getToken()}`; // dp_token
```

```python
# accounts/api.py — register
user = User(email=email, password=make_password(password, hasher="bcrypt"))
# login: same message for wrong email vs wrong password (no enumeration)
# forgot-password: 6-digit OTP, sha256 hash + 15min expiry, mailer or console

# core/security.py — issue + protect
token = jwt.encode({"id": str(user.id), "exp": …}, settings.JWT_SECRET, algorithm="HS256")
decoded = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
request.user = User.objects.get(id=decoded["id"])   # community/chat routes are auth=True
```

**Explain:** `useAuth` syncs `dp_token/dp_user` across components. Every chat/community request carries Bearer. Mismatch on private chats returns 404 (not 403) to avoid leaking existence.

## B8. AI Chat — code for multi-agent pipeline

**Chain:** `pages/ChatPage.jsx` → `services/chatApi.js:77-83` → `django/apps/chat/api.py` → `apps/ai/{reddit,web_research_agent,synthesizer_agent,citation_agent}.py` → `apps/ai/groq_client.py`

```python
# chat/api.py — chat_messages, the pipeline
chat_message = Message.objects.create(chat=chat, role="user", content=content)  # save first → retry-safe
with ThreadPoolExecutor() as pool:                                              # PARALLEL
    reddit_future = pool.submit(search_reddit, content)      # ~8s cap, never raises
    web_future    = pool.submit(run_web_research, question, history)  # Groq recall
answer = synthesize_answer(question, history, reddit_results, web_findings, web_sources)
sources = dedupe(answer.sources + reddit_threads[:3])
sources = filter_sources(question, sources)          # Jev Noul ≥0.3 keeps
Message.objects.create(chat=chat, role="assistant", content=answer.content, sources=sources)

# ai/groq_client.py — plain requests, no SDK
requests.post("https://api.groq.com/openai/v1/chat/completions",
              headers={"Authorization": f"Bearer {key}"},
              json={"model": settings.GROQ_MODEL, "messages": messages}, timeout=…)
```

**Explain:** Two researchers run in parallel (Reddit real threads + Groq web-recall), synthesizer writes Markdown + Sources, citation agent drops off-topic sources. No key → 503 fast-fail before saving. Frontend renders markdown + `CodeBlock` + typewriter + `.md` download.

## B9. Community — code for posts/votes/moderation

**Chain:** `pages/CommunityPage.jsx` → `services/communityApi.js` → `django/apps/community/api.py` → `models.py` + `apps/ai/{moderation_agent,channel_suggest_agent}.py`

```python
# community/api.py — routes are auth=True with granular rate limits
@api_view(["GET", "POST"])  # posts — POST_LIMIT: 5/10m
@api_view(["POST"])         # post vote — VOTE_LIMIT: 60/m
@api_view(["POST"])         # comment — COMMENT_LIMIT: 20/10m

# Vote model — one vote per user/target, unique constraint
UniqueConstraint(fields=["user", "target_type", "target_id"])
# apply_vote moves the denormalised score on the target row

# add_comment writes Notification for the post author; screen_content runs
# fire-and-forget: ONE batched Jev request (spam/abusive/off-topic ≥0.7) → Report(source="ai")
# suggest_channel: Jev Choice over general+distroIds
```

**Explain:** Channels are `general` or a `distroId` (validated against flavours). Sort `hot|new|top`, threaded comments (one nesting level via `parent`), optimistic UI voting, reports queue + admin audit log.

## B10. Styling + cards — code for theme

**Files:** `frontend/src/theme/designTokens.js:6-24`, `frontend/src/components/DistroCard.jsx:9-49`

```js
export const THEME = { bg:'#161B22', bgCard:'#1C2229', accent:'#E05A38',
  textMain:'#F0F4F8', textMuted:'#8B949E' };
// one burnt-orange accent, JetBrains Mono — never hardcode hexes

// DistroCard hover: circular wipe from cursor point
coloredLayerRef.current.animate(
  [{ clipPath:`circle(0px at ${x}px ${y}px)` },
   { clipPath:`circle(600px at ${x}px ${y}px)` }], { duration:1500, fill:'forwards' });
```

## Viva cheat-sheet — 1-line answers + file to open

| If they ask... | Answer | Open |
|---|---|---|
| Where does routing happen? | Custom `normalizeRoute` + `pushState`, no react-router | `frontend/src/App.jsx:16` |
| How does frontend talk to backend? | `VITE_API_URL \|\| /api`, Vite proxy in dev | `frontend/vite.config.js:10`, `services/distroApi.js:5` |
| What if API is down? | Every service try/catch → static `data/distros.js` | `services/distroApi.js:37` |
| What if the DB is down? | API falls back to static `data/distros.json` | `django/apps/catalogue/static_data.py` |
| Why two tables? | `flavours` lean cards vs `distros` full detail, linked by `distro_id` | `django/apps/catalogue/management/commands/seed.py` |
| Why `init_system` not `init`? | Column name; the API maps it to the frontend's `init` key | `django/apps/catalogue/api.py` (`_camel` / `_to_db`) |
| Where is quiz scoring? | Nowhere — questions only in frontend, Jev Choice over full catalogue, failure = error + retry | `utils/distroQuiz.js`, `apps/ai/quiz_agent.py` |
| How does quiz AI work? | One Jev Choice over all 14; code derives runners/strengths/explanation from probabilities + catalogue | `apps/ai/quiz_agent.py` |
| How does chat AI work? | Parallel Reddit + Groq research → Groq synthesis → Jev citation filter | `django/apps/chat/api.py` |
| How is auth done? | bcrypt (cost 10) + JWT 7d, Bearer in `authenticate_request`, `dp_token` in localStorage | `apps/accounts/api.py`, `apps/core/security.py` |
| How is spam handled? | Rate limits + Jev moderation → `reports` + admin audit log | `apps/core/ratelimit.py`, `apps/ai/moderation_agent.py` |
| How are AI calls made? | Plain `requests`, no SDKs; keys degrade gracefully | `apps/ai/groq_client.py`, `apps/ai/jev_client.py` |
| How to verify? | `npm --prefix frontend run build`, `manage.py check`, `curl /api/health` | `AGENTS.md` |
