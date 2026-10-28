#!/usr/bin/env node
/**
 * Vendor three.js (and only the addon modules the app imports) into
 * static/vendor so the SPA loads it from Django instead of a CDN.
 *
 * The addons use relative imports (GLTFLoader → ../utils/BufferGeometryUtils.js)
 * and bare `three`, which the import map in spa.html resolves. Copying must
 * therefore follow the whole relative-import closure, not just the two files
 * the app names — the walk below does exactly that.
 *
 *   node django/scripts/vendor_three.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
const pkg = join(repo, "frontend", "node_modules", "three");
const outDir = join(repo, "django", "static", "vendor");

const VERSION = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8")).version;

// The two entry points the ported components import, plus the build itself.
const seeds = [
  join(pkg, "build", "three.module.js"),
  join(pkg, "examples", "jsm", "loaders", "GLTFLoader.js"),
  join(pkg, "examples", "jsm", "controls", "OrbitControls.js"),
];

/** Destination path: build/ sits at the vendor root, examples/jsm/ under three/. */
function destFor(src) {
  if (src.startsWith(join(pkg, "build"))) return join(outDir, src.slice(join(pkg, "build").length + 1));
  return join(outDir, "three", src.slice(join(pkg, "examples", "jsm").length + 1));
}

const seen = new Set();
const queue = [...seeds];

while (queue.length) {
  const src = resolve(queue.shift());
  if (seen.has(src)) continue;
  seen.add(src);

  const code = readFileSync(src, "utf8");
  for (const [, , spec] of code.matchAll(/from\s*(["'])(\.[^"']+)\1/g)) {
    queue.push(resolve(dirname(src), spec));
  }
  const dest = destFor(src);
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, code);
}

console.log(`vendored three r${VERSION}: ${seen.size} modules into static/vendor`);
