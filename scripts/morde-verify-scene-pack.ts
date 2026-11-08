// Verify a Morde scene pack example parses with the upstream team-file
// parser. Read-only: it parses a file and prints the counts, and never
// starts a server or touches live app data.
// Usage: node --experimental-strip-types scripts/morde-verify-scene-pack.ts <path-to-.md>
import { readFileSync } from "node:fs";

import { parsePackageDocument } from "../shared/package-format.ts";

const path = process.argv[2];
if (!path) {
  console.error("usage: morde-verify-scene-pack.ts <scene-pack.md>");
  process.exit(2);
}
const text = readFileSync(path, "utf8");
let document;
try {
  document = parsePackageDocument(text, { trust: "file" });
} catch (error) {
  console.error(`parse failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
const pkg = document.package;
console.log(JSON.stringify({
  id: pkg.id,
  name: pkg.name,
  release: pkg.release,
  agents: pkg.agents.map((agent) => agent.key),
  rooms: (pkg.rooms ?? []).map((room) => room.key),
  playbooks: (pkg.playbooks ?? []).map((playbook) => playbook.key),
  routines: (pkg.routines ?? []).map((routine) => routine.key),
  skills: (pkg.skills?.entries ?? []).map((skill) => skill.name),
}, null, 2));
