// Checks that SPEC.md, DESIGN.md, UI.md, the backlog source and the tests agree, and generates TRACEABILITY.md.
//   node tools/docs/check.mjs        regenerate TRACEABILITY.md and report problems
//   node tools/docs/check.mjs --ci   report problems, and fail if TRACEABILITY.md is out of date
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const read = (file) => readFileSync(join(root, file), "utf8");
const ci = process.argv.includes("--ci");
const problems = [];

const spec = read("SPEC.md");
const design = read("DESIGN.md");
const ui = read("UI.md");
const backlog = read("tools/backlog/issues.md");
const created = JSON.parse(read("tools/backlog/created.json"));
const finished = JSON.parse(read("tools/docs/finished-milestones.json"));

const frKey = (id) => id.slice(3).split(".").map(Number);
const byFr = (a, b) => {
  const [x1, y1] = frKey(a);
  const [x2, y2] = frKey(b);
  return x1 - x2 || y1 - y2;
};

function expandIds(text) {
  const ids = new Set();
  for (const m of text.matchAll(/FR-(\d+)\.(\d+)–FR-(\d+)\.(\d+)/g)) {
    if (m[1] !== m[3]) continue;
    for (let n = Number(m[2]); n <= Number(m[4]); n++) ids.add(`FR-${m[1]}.${n}`);
  }
  for (const m of text.matchAll(/FR-\d+\.\d+/g)) ids.add(m[0]);
  return [...ids];
}

// Requirements: "**FR-x.y**" defines one; "**(Should)**" right after marks it Should.
const requirements = new Map();
for (const line of spec.split("\n")) {
  for (const m of line.matchAll(/\*\*(FR-\d+\.\d+)\*\*/g)) {
    const id = m[1];
    if (requirements.has(id)) problems.push(`SPEC.md: ${id} is defined twice`);
    const after = line.slice(m.index + m[0].length);
    const should = /^\s*\*\*\(Should\)\*\*/.test(after);
    const summary = after
      .replace(/\*\*\(Should\)\*\*/, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/\|/g, "/")
      .trim()
      .replace(/^[:—-]\s*/, "");
    requirements.set(id, { id, kind: should ? "Should" : "Must", summary: summary.length > 110 ? `${summary.slice(0, 107)}…` : summary });
  }
}

// Decisions: "### D-nn Title" in SPEC.md; "- **ID:** D-nn." under a "### 1.x Title" heading in DESIGN.md.
const decisions = new Map();
for (const m of spec.matchAll(/^### (D-\d{2}) (.+)$/gm)) {
  if (decisions.has(m[1])) problems.push(`${m[1]} is defined twice`);
  decisions.set(m[1], { id: m[1], title: m[2].trim(), where: "SPEC.md" });
}
let heading = "";
for (const line of design.split("\n")) {
  const h = line.match(/^### (\d+\.\d+) (.+)$/);
  if (h) heading = `${h[1]} ${h[2]}`;
  const d = line.match(/^- \*\*ID:\*\* (D-\d{2})\./);
  if (d) {
    if (decisions.has(d[1])) problems.push(`${d[1]} is defined twice`);
    decisions.set(d[1], { id: d[1], title: heading.replace(/^\d+\.\d+ /, ""), where: `DESIGN ${heading.split(" ")[0]}` });
  }
}

// Every mention of a requirement or decision ID must exist.
const sources = { "SPEC.md": spec, "DESIGN.md": design, "UI.md": ui, "tools/backlog/issues.md": backlog };
for (const [file, text] of Object.entries(sources)) {
  for (const id of expandIds(text)) if (!requirements.has(id)) problems.push(`${file}: unknown requirement ${id}`);
  for (const m of text.matchAll(/\bD-(\d{2})\b/g)) if (!decisions.has(`D-${m[1]}`)) problems.push(`${file}: unknown decision D-${m[1]}`);
}

// Section references between the documents.
const headings = (text) => new Set([...text.matchAll(/^#{2,3} (?:Rule )?(\d+(?:\.\d+)?)[.:]?\s/gm)].map((m) => m[1]));
const D = headings(design);
const U = headings(ui);
const S = headings(spec);
const refFiles = { ...sources, ".github/ISSUE_TEMPLATE/task.yml": read(".github/ISSUE_TEMPLATE/task.yml") };
for (const [file, text] of Object.entries(refFiles)) {
  for (const m of text.matchAll(/DESIGN(?:\.md)?(?: Sections?)? (\d+(?:\.\d+)?)/g)) if (!D.has(m[1])) problems.push(`${file}: DESIGN ${m[1]} doesn't exist`);
  for (const m of text.matchAll(/UI(?:\.md)?(?: Section)? (\d+(?:\.\d+)?)/g)) if (!U.has(m[1])) problems.push(`${file}: UI.md ${m[1]} doesn't exist`);
  for (const m of text.matchAll(/(?:Spec|SPEC) Rule (\d+)/g)) if (!S.has(m[1])) problems.push(`${file}: Spec Rule ${m[1]} doesn't exist`);
  const own = file === "DESIGN.md" ? D : file === "UI.md" ? U : null;
  if (own) for (const m of text.matchAll(/\(Sections? (\d+(?:\.\d+)?)/g)) if (!own.has(m[1])) problems.push(`${file}: its own Section ${m[1]} doesn't exist`);
  if (file === "SPEC.md") for (const m of text.matchAll(/\(Rule (\d+)/g)) if (!S.has(m[1])) problems.push(`SPEC.md: Rule ${m[1]} doesn't exist`);
}

// Module map: DESIGN.md section 14 tables, first column = module or part.
const modules = new Map();
const moduleSection = design.split(/^## 14\. /m)[1] ?? "";
if (!moduleSection) problems.push("DESIGN.md: section 14 (module map) not found");
for (const line of moduleSection.split("\n")) {
  if (!line.startsWith("|") || /^\|\s*-/.test(line)) continue;
  const name = line.split("|")[1].trim().replace(/`/g, "");
  if (name === "Module" || name === "Part") continue;
  for (const id of expandIds(line)) {
    if (!modules.has(id)) modules.set(id, new Set());
    modules.get(id).add(name);
  }
}

// Issues: implements headers in the backlog source, numbered by created.json.
const issues = new Map();
for (const block of backlog.split(/^@@@ issue\s*$/m).slice(1)) {
  const head = block.trim().split(/\n\s*\n/)[0];
  const field = (name) => head.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]?.trim() ?? "";
  const key = field("key");
  const number = created[key];
  const ref = number ? `#${number}` : `(${key}, not yet on GitHub)`;
  for (const id of expandIds(field("implements"))) {
    if (!issues.has(id)) issues.set(id, []);
    issues.get(id).push({ ref, milestone: field("milestone") });
  }
}

// Tests: files named *.test.* or *.spec.* whose text contains "[FR-x.y]".
const tests = new Map();
const walk = (dir) => {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name.startsWith(".")) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full);
    else if (/\.(test|spec)\.[cm]?[tj]sx?$/.test(name)) {
      for (const m of readFileSync(full, "utf8").matchAll(/\[(FR-\d+\.\d+)\]/g)) {
        if (!requirements.has(m[1])) problems.push(`${relative(root, full)}: test names unknown requirement ${m[1]}`);
        if (!tests.has(m[1])) tests.set(m[1], new Set());
        tests.get(m[1]).add(relative(root, full));
      }
    }
  }
};
for (const dir of ["apps", "packages", "e2e"]) walk(join(root, dir));

// Coverage rules.
for (const r of requirements.values()) {
  if (r.kind !== "Must") continue;
  if (!issues.has(r.id)) problems.push(`${r.id} (Must) is implemented by no issue`);
  if (!modules.has(r.id)) problems.push(`${r.id} (Must) belongs to no module in DESIGN 14`);
  const inFinished = (issues.get(r.id) ?? []).some((i) => finished.includes(i.milestone));
  if (inFinished && !tests.has(r.id)) problems.push(`${r.id} (Must) is in a finished milestone but no test carries its ID`);
}

// Generate TRACEABILITY.md (deterministic: no dates).
const ids = [...requirements.keys()].sort(byFr);
const count = (pred) => ids.filter((id) => pred(requirements.get(id))).length;
const lines = [
  "# Traceability",
  "",
  "**Generated by `node tools/docs/check.mjs` — do not edit by hand.** Sources: requirement IDs in SPEC.md, the module map in DESIGN 14, the `implements:` headers in `tools/backlog/issues.md`, and test names containing `[FR-x.y]` (DESIGN 10.8).",
  "",
  "## Summary",
  "",
  "| Measure | Count |",
  "| --- | --- |",
  `| Requirements | ${ids.length} (${count((r) => r.kind === "Must")} Must, ${count((r) => r.kind === "Should")} Should) |`,
  `| With at least one issue | ${count((r) => issues.has(r.id))} |`,
  `| With a module | ${count((r) => modules.has(r.id))} |`,
  `| With at least one test | ${count((r) => tests.has(r.id))} |`,
  `| Finished milestones | ${finished.length ? finished.join(", ") : "none yet"} |`,
  "",
  "## Requirements",
  "",
  "| ID | Kind | Requirement | Issues | Modules | Tests |",
  "| --- | --- | --- | --- | --- | --- |",
];
for (const id of ids) {
  const r = requirements.get(id);
  const iss = (issues.get(id) ?? []).map((i) => i.ref).join(", ") || "**none**";
  const mods = [...(modules.get(id) ?? [])].join(", ") || "**none**";
  const tst = [...(tests.get(id) ?? [])].sort().join("<br>") || "not yet";
  lines.push(`| ${id} | ${r.kind} | ${r.summary} | ${iss} | ${mods} | ${tst} |`);
}
lines.push("", "## Decisions", "", "| ID | Decision | Recorded in |", "| --- | --- | --- |");
for (const d of [...decisions.values()].sort((a, b) => a.id.localeCompare(b.id))) lines.push(`| ${d.id} | ${d.title} | ${d.where} |`);
const generated = `${lines.join("\n")}\n`;

const tracePath = join(root, "TRACEABILITY.md");
if (ci) {
  if (!existsSync(tracePath) || readFileSync(tracePath, "utf8") !== generated) problems.push("TRACEABILITY.md is out of date: run node tools/docs/check.mjs");
} else {
  writeFileSync(tracePath, generated);
}

const unique = [...new Set(problems)];
console.log(`${ids.length} requirements, ${decisions.size} decisions, ${issues.size} requirements with issues, ${tests.size} with tests.`);
if (unique.length) {
  console.log(`\n${unique.length} problem(s):\n- ${unique.join("\n- ")}`);
  process.exit(1);
}
console.log(ci ? "OK: docs, IDs, references and traceability are consistent." : "OK: TRACEABILITY.md regenerated; everything is consistent.");
