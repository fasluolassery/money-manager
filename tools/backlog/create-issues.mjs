import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const REPO = "fasluolassery/money-manager";
const MILESTONES = {
  m1: "M1: Setup and login",
  m2: "M2: Transactions and categories",
  m3: "M3: Views",
  m4: "M4: Bills",
  m5: "M5: Lending",
  m6: "M6: Savings goals",
  m7: "M7: Backup and account",
};
const dryRun = process.argv.includes("--dry");
const update = process.argv.includes("--update");
const here = (file) => new URL(file, import.meta.url);
const gh = (args) => execFileSync("gh", args, { encoding: "utf8" }).trim();

function parse(block) {
  const [headerText, ...rest] = block.trim().split(/\n\s*\n/);
  const header = Object.fromEntries(
    headerText.split("\n").map((line) => {
      const i = line.indexOf(": ");
      return [line.slice(0, i).trim(), line.slice(i + 2).trim()];
    }),
  );
  const list = (value, sep) => (value ? value.split(sep).map((s) => s.trim()).filter(Boolean) : []);
  return {
    key: header.key,
    title: header.title,
    milestone: MILESTONES[header.milestone],
    labels: list(header.labels, "|"),
    deps: list(header.deps, ","),
    flags: list(header.flags, ","),
    implements: list(header.implements === "none" ? "" : header.implements, ","),
    decisions: list(header.decisions === "none" ? "" : header.decisions, ","),
    hasTraceability: "implements" in header && "decisions" in header,
    body: rest.join("\n\n").trim(),
  };
}

const issues = readFileSync(here("./issues.md"), "utf8").split(/^@@@ issue\s*$/m).slice(1).map(parse);
for (const signoff of issues.filter((x) => x.key.endsWith("-signoff"))) {
  const sameMilestone = issues.filter((x) => x.milestone === signoff.milestone && x.key !== signoff.key).map((x) => x.key);
  signoff.deps = [...new Set([...signoff.deps, ...sameMilestone])];
}
const statePath = here("./created.json");
const created = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {};

const latest = Number(gh(["api", `repos/${REPO}/issues?state=all&per_page=1&sort=created&direction=desc`, "--jq", ".[0].number"]));
let next = latest + 1;
const numberOf = new Map();
for (const issue of issues) numberOf.set(issue.key, created[issue.key] ?? next++);

const keys = new Set(issues.map((issue) => issue.key));
if (keys.size !== issues.length) throw new Error("Duplicate keys");
for (const [i, issue] of issues.entries()) {
  if (!issue.key || !issue.title || !issue.milestone) throw new Error(`Issue ${i + 1} is missing key, title or milestone`);
  if (!issue.hasTraceability) throw new Error(`${issue.key}: missing "implements:" or "decisions:" header (use "none")`);
  for (const dep of issue.deps) {
    if (!keys.has(dep)) throw new Error(`${issue.key}: unknown dependency "${dep}"`);
    if (dep === issue.key) throw new Error(`${issue.key}: depends on itself`);
  }
  for (const [, ref] of issue.body.matchAll(/\{\{([\w-]+)\}\}/g)) {
    if (!keys.has(ref)) throw new Error(`${issue.key}: unknown reference "{{${ref}}}"`);
  }
}

function addCriteria(body, lines) {
  if (!lines.length) return body;
  return body.replace("## Acceptance criteria\n\n", `## Acceptance criteria\n\n${lines.map((l) => `- [ ] ${l}`).join("\n")}\n`);
}

function render(issue) {
  const ref = (key) => `#${numberOf.get(key)}`;
  const has = (flag) => issue.flags.includes(flag);
  let body = issue.body.replace(/\{\{([\w-]+)\}\}/g, (_, key) => ref(key));
  const extra = [];
  if (has("versioned")) {
    extra.push("Every edit and delete requires the record's current `version`; a stale one returns `409 STALE_RECORD` and changes nothing (DESIGN 4.7, API test).");
  }
  if (has("idempotent")) {
    extra.push("Every create endpoint accepts an `idempotencyKey`; repeating it returns the existing item and creates nothing (DESIGN 6.4, API test).");
  }
  if (has("api")) {
    extra.push(
      "Every response goes through its shared response schema via `respond`; no internal field (`userId`, `nameLower`, `idempotencyKey`, raw `_id`) appears, checked by API tests (DESIGN 6.6).",
      "New or changed endpoints appear in `docs/openapi.json` (DESIGN 6.8).",
    );
  }
  if (has("collection")) {
    extra.push("Each new collection has its MongoDB `$jsonSchema` validator; a test shows a direct insert of invalid data is rejected (DESIGN 5.6).");
  }
  if (has("property")) {
    extra.push("Property-based tests (fast-check) cover the invariants of this logic (DESIGN 10.8).");
  }
  if (has("seed")) extra.push("`pnpm seed:dev` is extended with realistic sample data for this feature (DESIGN 11.8).");
  if (issue.key.endsWith("-signoff")) {
    extra.push(
      "Manual accessibility baseline check (UI.md Section 8) passed on this milestone's new screens.",
      "Performance budget checked (DESIGN 12): Lighthouse mobile LCP ≤ 2.5 s, API p95 ≤ 300 ms from the logs.",
      "The Risks section in SPEC.md reviewed and updated.",
      "The audit checklist (DESIGN 13) run on the code built so far; every finding fixed or filed as an issue.",
      "The root `package.json` version bumped to the release's `X.Y.0` before tagging, so Settings shows it (DESIGN 10.7).",
      "This milestone is added to `tools/docs/finished-milestones.json`, and `node tools/docs/check.mjs --ci` passes: every Must requirement it implements has a test carrying its ID (SPEC Rule 16, DESIGN 10.8).",
    );
  }
  body = addCriteria(body, extra);
  const deps = issue.deps.length
    ? issue.deps.map((d) => `- Blocked by ${ref(d)} (${issues.find((x) => x.key === d).title})`).join("\n")
    : "None.";
  const dod = [
    "All acceptance criteria are met",
    !has("nocode") && "Tests required by Spec Rule 16 for this area are written and pass",
    issue.implements.length > 0 && "Tests carry the requirement IDs listed under Traceability in their names, and `TRACEABILITY.md` is regenerated (DESIGN 10.8)",
    has("preci") ? `The checks that exist so far pass locally (CI arrives in ${ref("ci")})` : "Every CI gate passes",
    has("ui") && "Works on a phone-sized and a laptop-sized screen",
    has("ui") && "Matches UI.md: tokens, screen states, motion, copy and the accessibility baseline",
    !has("nocode") && "Errors are handled as in DESIGN.md Section 9; no third-party error text reaches the user (9.6)",
    !has("nocode") && !has("preci") && "The code rules and import boundaries in DESIGN.md 10.4 pass",
    has("api") && "API responses go through their response schemas, with no internal fields (DESIGN.md 6.6)",
    !has("nocode") && "Names follow DESIGN.md 10.9 and the SPEC glossary; any new dependency is justified (10.10)",
    !has("nocode") && "Follows the engineering principles in DESIGN.md 15: size guidance, no listed code smells, no speculative code, composition, branded types",
    "SPEC.md / DESIGN.md / UI.md updated if behaviour or design changed",
    "Merged through a squash-merged pull request that closes this issue",
  ]
    .filter(Boolean)
    .map((item) => `- [ ] ${item}`)
    .join("\n");
  const trace = [
    `- **Implements:** ${issue.implements.length ? issue.implements.join(", ") : "no product requirement directly (infrastructure or verification)"}`,
    `- **Decisions:** ${issue.decisions.length ? issue.decisions.join(", ") : "none"}`,
    "- Requirement IDs are defined in SPEC.md and decision IDs in SPEC.md (D-01–D-27) and DESIGN 1 (D-28 onward). Tests for this issue carry the requirement IDs in their names (DESIGN 10.8).",
  ].join("\n");
  return `${body}\n\n## Traceability\n\n${trace}\n\n## Dependencies\n\n${deps}\n\n## Definition of done\n\nSee DESIGN.md Sections 10.5–10.7.\n\n${dod}\n`;
}

const order = [];
const state = new Map();
const visit = (key, path) => {
  if (state.get(key) === "done") return;
  if (state.get(key) === "visiting") throw new Error(`Dependency cycle: ${[...path, key].join(" -> ")}`);
  state.set(key, "visiting");
  for (const dep of issues.find((x) => x.key === key).deps) visit(dep, [...path, key]);
  state.set(key, "done");
  order.push(key);
};
for (const issue of issues) visit(issue.key, []);

if (dryRun && process.argv.includes("--order")) {
  const ms = (key) => issues.find((x) => x.key === key).milestone.slice(0, 2);
  for (const key of order) console.log(`${ms(key)}  #${numberOf.get(key)}  ${issues.find((x) => x.key === key).title}`);
  process.exit(0);
}

if (process.argv.includes("--verify")) {
  const live = JSON.parse(
    gh(["api", "--paginate", `repos/${REPO}/issues?state=all&per_page=100`, "--jq", "[.[] | select(.pull_request == null) | {number, title, body, state, milestone: .milestone.title, labels: [.labels[].name]}]"])
      .replace(/\]\s*\[/g, ","),
  );
  const byNumber = new Map(live.map((x) => [x.number, x]));
  const problems = [];
  for (const issue of issues) {
    const n = created[issue.key];
    const l = byNumber.get(n);
    if (!l) { problems.push(`${issue.key}: not on GitHub`); continue; }
    if (l.title !== issue.title) problems.push(`#${n} title differs`);
    if ((l.body ?? "").trim() !== render(issue).trim()) problems.push(`#${n} body differs`);
    if (l.milestone !== issue.milestone) problems.push(`#${n} milestone: live "${l.milestone}" vs "${issue.milestone}"`);
    const a = [...l.labels].sort().join("|"), b = [...issue.labels].sort().join("|");
    if (a !== b) problems.push(`#${n} labels: live [${a}] vs [${b}]`);
    if (l.state !== "open" && l.state !== "closed") problems.push(`#${n} has unexpected state "${l.state}"`);
  }
  const known = new Set(Object.values(created));
  for (const l of live) if (!known.has(l.number)) problems.push(`#${l.number} exists on GitHub but not in the backlog: ${l.title}`);
  const tracked = live.filter((l) => known.has(l.number));
  const closed = tracked.filter((l) => l.state === "closed").length;
  console.log(
    problems.length
      ? problems.join("\n")
      : `OK: all ${issues.length} issues match GitHub exactly (${tracked.length - closed} open, ${closed} closed)`,
  );
  process.exit(problems.length ? 1 : 0);
}

if (dryRun) {
  for (const issue of issues) {
    const isNew = !created[issue.key];
    console.log(`#${numberOf.get(issue.key)}${isNew ? " (new)" : ""} [${issue.milestone}] ${issue.title}`);
  }
  console.log(`\n${issues.length} issues valid. Next free number on GitHub: ${latest + 1}.`);
  writeFileSync(here("./preview.md"), render(issues.find((x) => x.key === "tx-api")));
  process.exit(0);
}

const bodyPath = fileURLToPath(here("./body.tmp.md"));

for (const issue of issues) {
  const onlyIndex = process.argv.indexOf("--only");
  const only = onlyIndex > -1 ? process.argv[onlyIndex + 1].split(",") : null;
  if (only && !only.includes(issue.key)) continue;
  if (created[issue.key]) {
    if (update) {
      writeFileSync(bodyPath, render(issue));
      gh(["issue", "edit", String(created[issue.key]), "--repo", REPO, "--body-file", bodyPath, "--milestone", issue.milestone]);
      console.log(`updated #${created[issue.key]} ${issue.title}`);
    }
    continue;
  }
  writeFileSync(bodyPath, render(issue));
  const args = ["issue", "create", "--repo", REPO, "--title", issue.title, "--body-file", bodyPath, "--milestone", issue.milestone];
  for (const label of issue.labels) args.push("--label", label);
  const actual = Number(gh(args).split("/").pop());
  const expected = numberOf.get(issue.key);
  created[issue.key] = actual;
  writeFileSync(statePath, JSON.stringify(created, null, 2));
  console.log(`#${actual} ${issue.title}`);
  if (actual !== expected) throw new Error(`Expected #${expected} for ${issue.key} but got #${actual}; stopping so references stay correct`);
}
console.log(`\nDone: ${Object.keys(created).length} issues.`);
