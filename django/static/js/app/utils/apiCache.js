const store = /* @__PURE__ */ new Map();
const inflight = /* @__PURE__ */ new Map();
const PERSIST_RE = /^(distros:|community:posts:|community:post:|community:stats:|chat:)/;
const LS_KEY = "dp_api_cache_v1";
const MAX_PERSIST = 60;
const STALE_WINDOW = 10 * 60 * 1e3;
let hydrated = false;
function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const entries = JSON.parse(raw);
    if (!Array.isArray(entries)) return;
    const now = Date.now();
    for (const [k, v] of entries) {
      if (typeof k === "string" && v && typeof v.expiresAt === "number" && v.expiresAt > now - STALE_WINDOW && !store.has(k)) {
        store.set(k, v);
      }
    }
  } catch {
  }
}
function persist() {
  try {
    const now = Date.now();
    for (const [k, v] of store) {
      if (!v || v.expiresAt < now - STALE_WINDOW) store.delete(k);
    }
    const out = [];
    for (const [k, v] of store) {
      if (out.length >= MAX_PERSIST) break;
      if (PERSIST_RE.test(k) && v.expiresAt > now - STALE_WINDOW) out.push([k, v]);
    }
    localStorage.setItem(LS_KEY, JSON.stringify(out));
  } catch {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
    }
  }
}
function setCache(key, value, ttlMs) {
  hydrate();
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  persist();
}
function peek(key) {
  hydrate();
  const hit = store.get(key);
  if (!hit) return void 0;
  if (Date.now() > hit.expiresAt) return void 0;
  return hit.value;
}
function peekStale(key) {
  hydrate();
  return store.get(key)?.value;
}
function invalidate(prefix) {
  hydrate();
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  persist();
}
async function cached(key, ttlMs, fetcher) {
  const hit = peek(key);
  if (hit !== void 0) return hit;
  if (inflight.has(key)) return inflight.get(key);
  const p = fetcher().then(
    (value) => {
      inflight.delete(key);
      setCache(key, value, ttlMs);
      return value;
    },
    (err) => {
      inflight.delete(key);
      throw err;
    }
  );
  inflight.set(key, p);
  return p;
}
export {
  cached,
  invalidate,
  peek,
  peekStale,
  setCache
};
