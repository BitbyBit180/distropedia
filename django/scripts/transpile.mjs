#!/usr/bin/env node
/**
 * frontend/src (React/JSX) → django/static/js/app (plain ES modules).
 *
 * The design is the contract, so the ported tree is not re-typed by hand: this
 * runs the real esbuild JSX transform over the untouched sources and only
 * rewrites what the browser cannot resolve on its own —
 *
 *   'react'            → dp/core/react.js   (the h()/hooks runtime)
 *   'lucide-react'     → dp/core/icons.js   (generated from the same package)
 *   'framer-motion'    → dp/core/motion.js  (rAF tween engine)
 *   'react-markdown'   → dp/core/markdown.js(marked token renderer)
 *   '@heroui/react'    → dp/core/heroui.js  (same DOM + slot classes)
 *   './X.jsx'          → './X.js'
 *   import.meta.env.X  → DP_ENV.X           (window.__dpConfig)
 *
 * `App.jsx`/`main.jsx` are excluded: the router and the mount call are written
 * by hand under static/js/core + static/js/main.js because they used class
 * components, `lazy` and `Suspense`, which the runtime replaces with dynamic
 * import() and a try/catch.
 *
 *   node django/scripts/transpile.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
const srcDir = join(repo, "frontend", "src");
const outDir = join(repo, "django", "static", "js", "app");

const esbuild = await import(
  pathToFileURL(join(repo, "frontend", "node_modules", "esbuild", "lib", "main.js")).href
);

const BARE = {
  react: "dp/core/react.js",
  "lucide-react": "dp/core/icons.js",
  "framer-motion": "dp/core/motion.js",
  "react-markdown": "dp/core/markdown.js",
  "remark-gfm": "dp/core/markdown.js",
  "@heroui/react": "dp/core/heroui.js",
  three: "three",
  "three/examples/jsm/loaders/GLTFLoader.js": "three/addons/loaders/GLTFLoader.js",
  "three/examples/jsm/controls/OrbitControls.js": "three/addons/controls/OrbitControls.js",
};

const SKIP = new Set(["App.jsx", "main.jsx"]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.jsx?$/.test(entry) && !SKIP.has(entry)) out.push(full);
  }
  return out;
}

/** Rewrite module specifiers to the browser-resolvable set. */
function rewriteSpecifiers(code) {
  const problems = [];
  let out = code.replace(
    /(from\s*|import\s*\(?\s*)(["'])([^"']+)\2/g,
    (_match, prefix, quote, spec) => {
      let target = spec;
      if (BARE[spec]) target = BARE[spec];
      else if (spec.startsWith(".")) target = spec.replace(/\.jsx$/, ".js");
      else if (spec.startsWith("three/")) target = spec.replace("three/examples/jsm/", "three/addons/");
      else if (!spec.startsWith("dp/")) problems.push(spec);
      return `${prefix}${quote}${target}${quote}`;
    }
  );
  // Side-effect imports (`import './index.css'`) have no `from`; drop CSS.
  out = out.replace(/^\s*import\s*["'][^"']*\.css["']\s*;?\s*$/gm, "");
  return { code: out, problems };
}

/** Guarantee `import React, {...} from 'dp/core/react.js'` for the JSX output. */
function ensureReactDefault(code) {
  if (!/React\.createElement|React\.Fragment/.test(code)) return code;
  const shim = "dp/core\\/react\\.js";
  if (new RegExp(`^\\s*import\\s+React[,{\\s]`, "m").test(code)) return code;
  const namedOnly = code.match(new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*["']${shim}["']`));
  if (namedOnly) {
    return code.replace(namedOnly[0], `import React, {${namedOnly[1]}} from "dp/core/react.js"`);
  }
  const bare = code.match(new RegExp(`import\\s*["']${shim}["']`));
  if (bare) {
    return code.replace(bare[0], `import React from "dp/core/react.js"`);
  }
  return `import React from "dp/core/react.js";\n${code}`;
}

rmSync(outDir, { recursive: true, force: true });

const files = walk(srcDir);
const report = [];

for (const file of files) {
  const rel = relative(srcDir, file).split(sep).join("/");
  const raw = readFileSync(file, "utf8");

  const usesEnv = /import\.meta\.env\.[A-Z0-9_]+/.test(raw);
  let source = raw.replace(/import\.meta\.env\.([A-Z0-9_]+)/g, "DP_ENV.$1");

  const { code: rewritten, problems } = rewriteSpecifiers(source);
  if (problems.length) {
    throw new Error(`${rel}: un-mapped bare specifier(s): ${[...new Set(problems)].join(", ")}`);
  }
  source = rewritten;

  if (usesEnv) {
    source = `import { DP_ENV } from 'dp/core/config.js';\n${source}`;
  }

  const transformed = esbuild.transformSync(source, {
    loader: file.endsWith(".jsx") ? "jsx" : "js",
    format: "esm",
    target: "es2022",
    jsx: "transform",
    jsxFactory: "React.createElement",
    jsxFragment: "React.Fragment",
    legalComments: "none",
  });

  const final = ensureReactDefault(transformed.code);
  const dest = join(outDir, rel.replace(/\.jsx$/, ".js"));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, final);
  report.push(`${rel} → ${relative(repo, dest)} (${final.split("\n").length} lines)`);
}

console.log(report.join("\n"));
console.log(`\ntranspiled ${files.length} modules into ${relative(repo, outDir)}`);
