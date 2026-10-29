# Feature: Distro Detail + Install Guides

**What:** Full-bleed banner, spec matrix, tabbed guides (Normal / Dual-boot / VM) with copyable commands, images, lightbox, scrollspy side-dock.
**Route:** `/distro/:id`. **API:** `GET /api/distros/:id` (by `distroId` or name, includes `installGuide`).

## User flow
1. Click card → `/distro/ubuntu`.
2. `useDistro` shows local data instantly, then swaps in API data.
3. Tabs switch `normal | dual | vm` — each 5 steps with `cmd`, `tip`/`warning`, images from `public/install-guide/`.
4. Copy button copies terminal command; image click opens lightbox (Esc closes).

## Code chain
```
DistroDetailPage.jsx:86  useDistro(distroId)
  → hooks/useDistro.js:16        findLocal() instant → getDistroById() replace
  → services/distroApi.js:53     fetchJSON('/api/distros/<id>') → normalize()
  → controllers/distroController.js:22  findOne by distroId OR name
  → if (!installation) buildInstallGuide() on-the-fly
  → models/Distro.js:76          shapeJSON: {id, init, installGuide}
  → data/installGuide.js:13      pkgMgr-aware commands (apt/pacman/dnf/zypper)
```

Key snippets:
```js
// installGuide.js — content source of truth, never hardcoded in client
const updateCmd = pkgMgr==='apt' ? 'sudo apt update && sudo apt upgrade -y'
  : pkgMgr==='pacman' ? 'sudo pacman -Syu' : ...;

# catalogue/models.py — the field mapping (id/init/installGuide <-> distroId/initSystem/installation)
ret.id = ret.distroId; ret.init = ret.initSystem; ret.installGuide = ret.installation;

// DistroDetailPage.jsx:37 — API sends string keys, client maps to icons
const MODE_ICONS = { laptop: Laptop, split: Split, box: Box };
```

## Files involved
- Frontend: `src/pages/DistroDetailPage.jsx`, `src/hooks/useDistro.js`, `src/data/installGuide.js` (offline fallback `getInstallationData`), `public/install-guide/*` (15 images).
- API: `django/apps/catalogue/api.py`, `django/apps/catalogue/models.py`, `django/apps/catalogue/guides.py` (guide builder), `django/apps/catalogue/management/commands/seed.py` (bakes `installation` into the DB).

## How to demo / viva line
"Guides live in the DB as `installation`, served as `installGuide`. Commands adapt to the package manager." Open `django/apps/catalogue/guides.py` and `django/apps/catalogue/models.py`.
