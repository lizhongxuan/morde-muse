// Scan a livestream session file for absolute claims and promise language.
// Usage: node --experimental-strip-types scripts/morde-verify-livestream.ts <session-file.md>
// Exit 0 when the scan is clean, 1 when any flag is found, 2 on usage or read errors.
// Lines under a heading containing "合规" are the flag list itself, not script
// copy, so they are skipped. One flag per term per line.
import { readFileSync } from "node:fs";

type Severity = "严重" | "注意";

interface Rule {
  term: string;
  pattern: RegExp;
  severity: Severity;
}

// The bare character 最 also appears in harmless words （最近/最后/最终）, so the
// 最 family is matched only as 最 plus a superlative adjective.
const RULES: Rule[] = [
  { term: "最好", pattern: /最好/g, severity: "严重" },
  { term: "最佳", pattern: /最佳/g, severity: "严重" },
  { term: "第一", pattern: /第一/g, severity: "严重" },
  { term: "No.1", pattern: /No\.?\s*1/gi, severity: "严重" },
  { term: "全网最低", pattern: /全网最低/g, severity: "严重" },
  { term: "最低价", pattern: /最低价/g, severity: "严重" },
  { term: "100%", pattern: /100\s*%/g, severity: "严重" },
  { term: "顶级", pattern: /顶级/g, severity: "严重" },
  { term: "国家级", pattern: /国家级/g, severity: "严重" },
  { term: "唯一", pattern: /唯一/g, severity: "严重" },
  { term: "首选", pattern: /首选/g, severity: "严重" },
  { term: "保证", pattern: /保证/g, severity: "严重" },
  { term: "零风险", pattern: /零风险/g, severity: "严重" },
  { term: "绝对", pattern: /绝对/g, severity: "严重" },
  { term: "第一名", pattern: /第一名/g, severity: "严重" },
  { term: "史无前例", pattern: /史无前例/g, severity: "严重" },
  { term: "独家", pattern: /独家/g, severity: "严重" },
  { term: "最…", pattern: /最[便宜划算强高低快新大省]/g, severity: "注意" },
];

const path = process.argv[2];
if (!path) {
  console.error("usage: morde-verify-livestream.ts <session-file.md>");
  process.exit(2);
}

let text: string;
try {
  text = readFileSync(path, "utf8");
} catch (error) {
  console.error(`cannot read file: ${path} (${error instanceof Error ? error.message : String(error)})`);
  process.exit(2);
}

interface Flag {
  line: number;
  term: string;
  severity: Severity;
  content: string;
}

const flags: Flag[] = [];
let inFlagSection = false;
const lines = text.split("\n");
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (/^#{1,6}\s/.test(line)) {
    inFlagSection = line.includes("合规");
    continue;
  }
  if (inFlagSection) continue;
  // Collect every match with its character range, then drop any match that
  // overlaps an already kept one, so one wording yields one flag — e.g.
  // 全网最低价 matches 全网最低, 最低价 and 最… but is flagged once.
  const matches: { start: number; end: number; term: string; severity: Severity }[] = [];
  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let found: RegExpExecArray | null;
    while ((found = rule.pattern.exec(line)) !== null) {
      matches.push({ start: found.index, end: found.index + found[0].length, term: rule.term, severity: rule.severity });
      if (found[0].length === 0) rule.pattern.lastIndex++;
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const kept: typeof matches = [];
  for (const match of matches) {
    if (kept.some((k) => match.start < k.end && k.start < match.end)) continue;
    kept.push(match);
  }
  for (const match of kept) {
    flags.push({ line: i + 1, term: match.term, severity: match.severity, content: line.trim() });
  }
}

if (flags.length === 0) {
  console.log("合规通过，无绝对化用语");
  process.exit(0);
}

for (const flag of flags) {
  console.log(`行 ${flag.line} [${flag.severity}] “${flag.term}” — ${flag.content}`);
}
const severe = flags.filter((flag) => flag.severity === "严重").length;
console.log(`共 ${flags.length} 处 flag（严重 ${severe}，注意 ${flags.length - severe}）`);
process.exit(1);
