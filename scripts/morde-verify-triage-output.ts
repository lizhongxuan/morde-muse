// Verify a triage output directory against the dev-away-from-desk output
// contract: an applicable .patch, test evidence with a zero exit code and
// quoted output, and an approval record before anything may merge.
// Read-only: it never applies a patch or touches the repository.
// Usage: node --experimental-strip-types scripts/morde-verify-triage-output.ts <output-dir> [--repo <path>]
// Exit codes: 0 mergeable, 1 patch or evidence invalid, 2 valid but unapproved.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

function fail(message: string): never {
  console.error(`triage-output: ${message}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const dir = args.find((arg) => !arg.startsWith("--"));
if (!dir) {
  console.error("usage: morde-verify-triage-output.ts <output-dir> [--repo <path>]");
  process.exit(2);
}
const repoIndex = args.indexOf("--repo");
const repo = repoIndex >= 0 ? args[repoIndex + 1] : process.cwd();
if (repoIndex >= 0 && !repo) fail("--repo needs a path");
const outputDir = resolve(dir);
if (!existsSync(outputDir) || !statSync(outputDir).isDirectory()) {
  fail(`not a directory: ${outputDir}`);
}
const files = readdirSync(outputDir);

// (a) At least one non-empty .patch that applies cleanly to the repo.
const patches = files.filter((file) => file.endsWith(".patch"));
if (patches.length === 0) fail("no .patch file in the output directory");
for (const patch of patches) {
  const patchPath = join(outputDir, patch);
  if (statSync(patchPath).size === 0) fail(`empty patch: ${patch}`);
  try {
    execFileSync("git", ["-C", repo, "apply", "--check", "--", patchPath], { stdio: "pipe" });
  } catch {
    fail(`patch does not apply cleanly to ${repo}: ${patch} (git apply --check failed)`);
  }
}
console.log(`patch: ${patches.join(", ")} — git apply --check passed against ${repo}`);

// (b) Test evidence: a command line, an exit code of 0, and quoted output.
const evidencePath = join(outputDir, "test-evidence.md");
if (!existsSync(evidencePath)) fail("missing test-evidence.md");
const evidence = readFileSync(evidencePath, "utf8");
if (!/^[$] .+/m.test(evidence)) fail("test-evidence.md has no test command line (a line starting with '$ ')");
const exitMatch = evidence.match(/exit code:\s*(\d+)/i);
if (!exitMatch) fail("test-evidence.md states no exit code");
if (exitMatch[1] !== "0") fail(`test-evidence.md reports a failing exit code: ${exitMatch[1]}`);
const fenced = evidence.match(/```[\s\S]*?```/g) ?? [];
if (!fenced.some((block) => block.replace(/```/g, "").trim().length > 0)) {
  fail("test-evidence.md has no quoted output (an empty fenced code block)");
}
console.log("evidence: test-evidence.md — command found, exit code 0, quoted output present");

// (c) Approval record: approver, decision, time. Without it nothing merges.
const approvalPath = join(outputDir, "approval.md");
if (!existsSync(approvalPath)) {
  console.log("approval: missing — 未审批，不可合并");
  process.exit(2);
}
const approval = readFileSync(approvalPath, "utf8");
for (const field of ["approver", "decision", "time"]) {
  if (!new RegExp(`^${field}\\s*:`, "im").test(approval)) {
    console.log(`approval: incomplete (missing ${field}) — 未审批，不可合并`);
    process.exit(2);
  }
}
const decision = approval.match(/^decision\s*:\s*(.+)$/im)?.[1]?.trim().toLowerCase() ?? "";
if (decision !== "approve") {
  console.log(`approval: decision is "${decision}", not approve — 不可合并`);
  process.exit(2);
}
console.log("approval: present, decision approve — 可合并");
