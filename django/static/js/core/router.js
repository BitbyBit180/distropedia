/**
 * The pushState router — App.jsx, ported without react-router (there never was
 * any) and without `lazy`/`Suspense`/class components, which this runtime
 * replaces with dynamic import() and a plain render guard.
 *
 * Route table, alias handling, hash fallbacks, the per-route remount and the
 * "failed to load → reload" recovery all behave as they did in the original.
 */
import React, { useState, useEffect } from "./react.js";
import { PageSkeleton } from "../app/components/Skeleton.js";

const CHUNK_RETRY_KEY = "dp_chunk_retried";

// Route-split, like the original: a page module is fetched the first time its
// route is visited and cached afterwards (Vite emitted one chunk per page).
const LOADERS = {
  "/": () => import("../app/pages/HomePage.js"),
  "/flavours": () => import("../app/pages/FlavoursPage.js"),
  "/distro": () => import("../app/pages/DistroDetailPage.js"),
  "/compare": () => import("../app/pages/ComparePage.js"),
  "/login": () => import("../app/pages/AuthPage.js"),
  "/chat": () => import("../app/pages/ChatPage.js"),
  "/quiz": () => import("../app/pages/QuizPage.js"),
  "/community": () => import("../app/pages/CommunityPage.js"),
  "/community/": () => import("../app/pages/PostDetailPage.js"),
};

const cache = new Map();

/** @param {() => Promise<{default: Function}>} importer */
async function loadWithRetry(importer) {
  try {
    return await importer();
  } catch (err) {
    if (!sessionStorage.getItem(CHUNK_RETRY_KEY)) {
      sessionStorage.setItem(CHUNK_RETRY_KEY, "1");
      window.location.reload();
      // Reload takes over; never resolve so no half-rendered page flashes in.
      return new Promise(() => {});
    }
    throw err;
  }
}

export function normalizeRoute(pathname, hash) {
  const path = (pathname || "").toLowerCase();
  const h = (hash || "").toLowerCase();

  if (path === "/flavours" || path === "/flavors" || h === "#/flavours" || h === "#/flavors") {
    return "/flavours";
  }
  if (path.startsWith("/distro/")) {
    return pathname;
  }
  if (h.startsWith("#/distro/")) {
    return h.replace("#", "");
  }
  if (path === "/compare" || path.startsWith("/compare?") || h === "#/compare" || h.startsWith("#/compare?")) {
    return path === "/compare" || path.startsWith("/compare?") ? pathname + window.location.search : h.replace("#", "");
  }
  if (path === "/community" || h === "#/community" || path.startsWith("/community?") || h.startsWith("#/community?")) {
    return path.startsWith("/community") || path === "/community"
      ? pathname + window.location.search
      : h.replace("#", "");
  }
  if (path.startsWith("/community/")) {
    return pathname;
  }
  if (h.startsWith("#/community/")) {
    return h.replace("#", "");
  }
  if (path === "/login" || h === "#/login") {
    return "/login";
  }
  if (path === "/chat" || h === "#/chat") {
    return "/chat";
  }
  if (path === "/quiz" || h === "#/quiz") {
    return "/quiz";
  }
  return "/";
}

export function currentRoute() {
  return normalizeRoute(window.location.pathname, window.location.hash);
}

function loaderFor(route) {
  if (route.startsWith("/community/")) return LOADERS["/community/"];
  if (route.startsWith("/distro/")) return LOADERS["/distro"];
  if (route.startsWith("/compare")) return LOADERS["/compare"];
  return LOADERS[route] || LOADERS["/"];
}

const MONO = "'JetBrains Mono', monospace";

/** The RouteErrorBoundary card, byte-for-byte the same styles. */
function ReloadCard() {
  return React.createElement(
    "div",
    {
      style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#161B22",
        padding: 24,
      },
    },
    React.createElement(
      "div",
      { style: { textAlign: "center", maxWidth: 420 } },
      React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "1rem",
            fontWeight: 800,
            color: "#F0F4F8",
            margin: "0 0 8px",
          },
        },
        "This page failed to load"
      ),
      React.createElement(
        "p",
        {
          style: {
            fontFamily: MONO,
            fontSize: "0.76rem",
            color: "#8B949E",
            margin: "0 0 20px",
            lineHeight: 1.6,
          },
        },
        "Usually a stale update or a broken connection. Reloading fixes it."
      ),
      React.createElement(
        "button",
        {
          type: "button",
          onClick: () => {
            sessionStorage.removeItem(CHUNK_RETRY_KEY);
            window.location.reload();
          },
          style: {
            fontFamily: MONO,
            fontSize: "0.8rem",
            fontWeight: 700,
            color: "#fff",
            background: "linear-gradient(135deg, #E05A38 0%, #b83d25 100%)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 9999,
            padding: "10px 24px",
            cursor: "pointer",
          },
        },
        "Reload page"
      )
    )
  );
}

export function App() {
  const [route, setRoute] = useState(currentRoute);
  // `page` is the component while loaded, null while fetching, `Error` if the
  // fetch failed after the automatic retry — the three Suspense/boundary states.
  const [page, setPage] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const handlePopState = () => setRoute(currentRoute());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // A route that rendered fine clears the retry flag, so the next real load
  // failure gets its one automatic reload again.
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_RETRY_KEY);
  }, [route]);

  useEffect(() => {
    let cancelled = false;
    const importer = loaderFor(route);
    setFailed(false);
    const known = cache.get(importer);
    if (known) {
      // A component *is* a function, so the value goes through the updater form
      // — `setPage(known)` would be read as "compute the next state from the old".
      setPage(() => known);
      return () => {
        cancelled = true;
      };
    }
    setPage(null);
    loadWithRetry(importer)
      .then((mod) => {
        if (cancelled) return;
        cache.set(importer, mod.default);
        setPage(() => mod.default);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [route]);

  const go = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setRoute(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isFlavours = route === "/flavours" || route === "/flavors";
  const isCompare = route === "/compare" || route.startsWith("/compare?");
  const compareQuery = isCompare ? route.slice("/compare".length) : "";
  const isDistroDetail = route.startsWith("/distro/");
  const distroId = isDistroDetail ? route.replace("/distro/", "").split("/")[0] : null;
  const isLogin = route === "/login";
  const isChat = route === "/chat";
  const isQuiz = route === "/quiz";
  const isCommunity = route === "/community" || route.startsWith("/community?");
  const communityQuery = isCommunity ? route.slice("/community".length) : "";
  const isPostDetail = route.startsWith("/community/");
  const postId = isPostDetail ? route.replace("/community/", "").split("/")[0] : null;

  let content;
  if (failed) {
    content = React.createElement(ReloadCard, null);
  } else if (!page) {
    content = React.createElement(PageSkeleton, null);
  } else if (isDistroDetail) {
    content = React.createElement(page, { distroId, onNavigate: go });
  } else if (isFlavours) {
    content = React.createElement(page, { onNavigate: go });
  } else if (isCompare) {
    content = React.createElement(page, { query: compareQuery, onNavigate: go });
  } else if (isLogin) {
    content = React.createElement(page, { onAuthSuccess: () => go("/chat"), onNavigate: go });
  } else if (isChat) {
    content = React.createElement(page, { onNavigate: go });
  } else if (isQuiz) {
    content = React.createElement(page, { onNavigate: go });
  } else if (isCommunity) {
    content = React.createElement(page, { query: communityQuery, onNavigate: go });
  } else if (isPostDetail) {
    content = React.createElement(page, { postId, onNavigate: go });
  } else {
    content = React.createElement(page, { onNavigate: go });
  }

  // The route is the boundary's key: navigating away gives the next page a
  // clean try after a failed one.
  return React.createElement(
    "div",
    { className: "min-h-screen bg-transparent text-[#F0F4F8]", key: route },
    content
  );
}

export default App;
