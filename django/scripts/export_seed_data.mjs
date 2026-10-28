// Dev-only helper: emits the canonical seed JSON from the existing JS data so
// the Django seed cannot drift from the Mongo seed. Node is never needed at
// runtime — the committed distros.json is the source of truth afterwards.
//
//   node django/scripts/export_seed_data.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { DISTROS } from "../../backend/src/data/distros.js";
import { buildInstallGuide } from "../../backend/src/data/installGuide.js";

const here = dirname(fileURLToPath(import.meta.url));
const outFile = join(here, "..", "apps", "catalogue", "data", "distros.json");

// Keep each entry exactly as the frontend data object reads (id / init /
// installGuide style) and attach the guide the Express seed stored as
// `installation`.
const entries = DISTROS.map((distro) => ({
  ...distro,
  init: distro.init || "systemd",
  installation: buildInstallGuide(distro),
}));

mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} distros -> ${outFile}`);
