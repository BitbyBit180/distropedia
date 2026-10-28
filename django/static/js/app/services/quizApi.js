import { DP_ENV } from "dp/core/config.js";
const API_BASE = DP_ENV.VITE_API_URL || "/api";
const VERDICT_TTL = 10 * 60 * 1e3;
const verdictCache = /* @__PURE__ */ new Map();
const hashRequest = ({ answers }) => JSON.stringify(answers);
async function getAiRecommendation({ answers }) {
  const key = hashRequest({ answers });
  const hit = verdictCache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.value;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3e4);
  try {
    const res = await fetch(`${API_BASE}/quiz/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
      signal: ctrl.signal
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.message || `Quiz AI failed (${res.status})`);
    }
    if (json?.ai) verdictCache.set(key, { value: json, expiresAt: Date.now() + VERDICT_TTL });
    return json;
  } finally {
    clearTimeout(timer);
  }
}
export {
  getAiRecommendation
};
