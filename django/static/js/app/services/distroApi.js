import { DP_ENV } from "dp/core/config.js";
import { DISTROS, POPULAR_DISTROS } from "../data/distros.js";
import { cached, peek } from "../utils/apiCache.js";
const API_BASE = DP_ENV.VITE_API_URL || "/api";
const CATALOGUE_TTL = 5 * 60 * 1e3;
async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`API ${res.status}: ${url}`);
  return res.json();
}
const normalize = (doc) => {
  if (!doc || typeof doc !== "object") return doc;
  const { distroId, _id, __v, initSystem, ...rest } = doc;
  return {
    ...rest,
    id: doc.id || distroId || _id,
    init: doc.init || initSystem || "systemd"
  };
};
const distrosKey = ({ search = "", category = "All" } = {}) => `distros:list:${search.toLowerCase().trim()}|${category}`;
async function getDistros({ search = "", category = "All" } = {}) {
  try {
    return await cached(distrosKey({ search, category }), CATALOGUE_TTL, async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "All") params.set("category", category);
      params.set("limit", "100");
      const json = await fetchJSON(`${API_BASE}/flavours?${params.toString()}`);
      return (json.data || []).map(normalize);
    });
  } catch {
    const stale = peek(distrosKey({ search, category }));
    if (stale) return stale;
    const q = search.toLowerCase().trim();
    return DISTROS.filter((d) => {
      const matchesSearch = !q || d.name.toLowerCase().includes(q) || d.tagline.toLowerCase().includes(q) || d.basedOn.toLowerCase().includes(q) || d.pkgMgr.toLowerCase().includes(q) || d.category.toLowerCase().includes(q);
      const matchesCategory = category === "All" || d.category === category;
      return matchesSearch && matchesCategory;
    });
  }
}
async function getDistroById(id) {
  const key = `distros:detail:${String(id || "").toLowerCase()}`;
  try {
    return await cached(key, CATALOGUE_TTL, async () => {
      const json = await fetchJSON(`${API_BASE}/distros/${encodeURIComponent(id)}`);
      return normalize(json.data);
    });
  } catch {
    const stale = peek(key);
    if (stale) return stale;
    return DISTROS.find(
      (d) => d.id.toLowerCase() === String(id).toLowerCase() || d.name.toLowerCase() === String(id).toLowerCase()
    ) || DISTROS[0];
  }
}
async function getDistrosForCompare(ids = []) {
  const wanted = ids.filter(Boolean);
  if (wanted.length === 0) return [];
  const key = `distros:compare:${wanted.map((id) => String(id).toLowerCase()).join(",")}`;
  try {
    return await cached(key, CATALOGUE_TTL, async () => {
      const params = new URLSearchParams({ ids: wanted.join(",") });
      const json = await fetchJSON(`${API_BASE}/distros/compare?${params.toString()}`);
      return (json.data || []).map(normalize);
    });
  } catch {
    const stale = peek(key);
    if (stale) return stale;
    const lower = wanted.map((id) => id.toLowerCase());
    return DISTROS.filter((d) => lower.includes(d.id.toLowerCase()));
  }
}
async function getPopularDistros() {
  try {
    return await cached("distros:popular", CATALOGUE_TTL, async () => {
      const json = await fetchJSON(`${API_BASE}/flavours/popular`);
      return (json.data || []).map(normalize);
    });
  } catch {
    return peek("distros:popular") || POPULAR_DISTROS;
  }
}
async function getCategories() {
  try {
    return await cached("distros:categories", CATALOGUE_TTL, async () => {
      const json = await fetchJSON(`${API_BASE}/flavours/categories`);
      return json.data || ["All"];
    });
  } catch {
    return peek("distros:categories") || [
      "All",
      "Debian / Ubuntu",
      "Arch",
      "Red Hat / Fedora",
      "Security",
      "Independent"
    ];
  }
}
const peekDistros = (opts) => peek(distrosKey(opts));
const peekPopularDistros = () => peek("distros:popular");
const peekCategories = () => peek("distros:categories");
const peekDistroById = (id) => peek(`distros:detail:${String(id || "").toLowerCase()}`);
const peekDistrosForCompare = (ids = []) => peek(
  `distros:compare:${ids.filter(Boolean).map((id) => String(id).toLowerCase()).join(",")}`
);
export {
  getCategories,
  getDistroById,
  getDistros,
  getDistrosForCompare,
  getPopularDistros,
  peekCategories,
  peekDistroById,
  peekDistros,
  peekDistrosForCompare,
  peekPopularDistros
};
