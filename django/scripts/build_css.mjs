#!/usr/bin/env node
/**
 * Compile the Tailwind utilities the ported tree uses.
 *
 * The class names are the design, so this runs the *original* pipeline — the
 * frontend's own tailwind.config.js (HeroUI plugin, darkMode: class, the same
 * content globs over src/** and @heroui/theme) — and writes the result to
 * static/css/tailwind.css. index.css is copied separately; both are linked in
 * spa.html in the same order the Vite bundle had them.
 *
 *   node django/scripts/build_css.mjs
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
const frontend = join(repo, "frontend");
const outDir = join(repo, "django", "static", "css");
const tailwindOut = join(outDir, "tailwind.css");
const indexOut = join(outDir, "index.css");

mkdirSync(outDir, { recursive: true });

// Only the directives: index.css is served as its own file, so it must not be
// inlined here as well (the original bundle had them concatenated).
const input = "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n";
const tmp = join(mkdtempSync(join(tmpdir(), "dp-tailwind-")), "input.css");
writeFileSync(tmp, input);

const cli = join(frontend, "node_modules", ".bin", "tailwindcss");
const run = spawnSync(cli, ["-c", "tailwind.config.js", "-i", tmp, "-o", tailwindOut, "--minify"], {
  cwd: frontend,
  encoding: "utf8",
});
if (run.status !== 0) {
  console.error(run.stderr || run.stdout);
  throw new Error("tailwindcss failed");
}

writeFileSync(indexOut, readFileSync(join(frontend, "src", "index.css"), "utf8"));

const kb = (f) => `${(readFileSync(f).byteLength / 1024).toFixed(1)} kB`;
console.log(`tailwind.css → ${kb(tailwindOut)}\nindex.css    → ${kb(indexOut)}`);
