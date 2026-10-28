/**
 * Build-time configuration that Vite used to inline (`import.meta.env.*`).
 * Django injects `window.__dpConfig` from settings in templates/spa.html, and
 * the transpiled sources keep their `import.meta.env.X` expressions verbatim —
 * the build rewrites them to `DP_ENV.X`.
 */
const injected = (typeof window !== "undefined" && window.__dpConfig) || {};

export const DP_ENV = new Proxy(
  {},
  {
    get: (_target, key) => (key === "MODE" ? (injected.MODE || "production") : injected[key]),
    has: (_target, key) => true,
  }
);

export default DP_ENV;
