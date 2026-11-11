import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dependencyOrder, readBacklog, validateBacklog } from "./backlog.mjs";
import { renderIssue } from "./render.mjs";

const REPO = "fasluolassery/money-manager";
const dryRun = process.argv.includes("--dry");
const update = process.argv.includes("--update");
const here = (file) => new URL(file, import.meta.url);
const gh = (args) => execFileSync("gh", args, { encoding: "utf8" }).trim();

const issues = readBacklog(here("./issues.md"));
const statePath = here("./created.json");
const created = existsSync(statePath) ? JSON.parse(readFileSync(statePath, "utf8")) : {};

const latest = Number(
  gh([
    "api",
    `repos/${REPO}/issues?state=all&per_page=1&sort=created&direction=desc`,
    "--jq",
    ".[0].number",
  ]),
);
let next = latest + 1;
const numberOf = new Map();
for (const issue of issues) numberOf.set(issue.key, created[issue.key] ?? next++);

validateBacklog(issues);
const order = dependencyOrder(issues);
const render = (issue) => renderIssue(issue, { issues, numberOf });

function printOrder() {
  const ms = (key) => issues.find((x) => x.key === key).milestone.slice(0, 2);
  for (const key of order)
    console.log(`${ms(key)}  #${numberOf.get(key)}  ${issues.find((x) => x.key === key).title}`);
}

function liveProblems(issue, live) {
  const n = created[issue.key];
  if (!live) return [`${issue.key}: not on GitHub`];
  const problems = [];
  if (live.title !== issue.title) problems.push(`#${n} title differs`);
  if ((live.body ?? "").trim() !== render(issue).trim()) problems.push(`#${n} body differs`);
  if (live.milestone !== issue.milestone)
    problems.push(`#${n} milestone: live "${live.milestone}" vs "${issue.milestone}"`);
  const a = [...live.labels].sort().join("|"),
    b = [...issue.labels].sort().join("|");
  if (a !== b) problems.push(`#${n} labels: live [${a}] vs [${b}]`);
  if (live.state !== "open" && live.state !== "closed")
    problems.push(`#${n} has unexpected state "${live.state}"`);
  return problems;
}

function verify() {
  const live = JSON.parse(
    gh([
      "api",
      "--paginate",
      `repos/${REPO}/issues?state=all&per_page=100`,
      "--jq",
      "[.[] | select(.pull_request == null) | {number, title, body, state, milestone: .milestone.title, labels: [.labels[].name]}]",
    ]).replace(/\]\s*\[/g, ","),
  );
  const byNumber = new Map(live.map((x) => [x.number, x]));
  const problems = issues.flatMap((issue) => liveProblems(issue, byNumber.get(created[issue.key])));
  const known = new Set(Object.values(created));
  for (const l of live)
    if (!known.has(l.number))
      problems.push(`#${l.number} exists on GitHub but not in the backlog: ${l.title}`);
  const tracked = live.filter((l) => known.has(l.number));
  const closed = tracked.filter((l) => l.state === "closed").length;
  console.log(
    problems.length
      ? problems.join("\n")
      : `OK: all ${issues.length} issues match GitHub exactly (${tracked.length - closed} open, ${closed} closed)`,
  );
  return problems.length ? 1 : 0;
}

function preview() {
  for (const issue of issues) {
    const isNew = !created[issue.key];
    console.log(
      `#${numberOf.get(issue.key)}${isNew ? " (new)" : ""} [${issue.milestone}] ${issue.title}`,
    );
  }
  console.log(`\n${issues.length} issues valid. Next free number on GitHub: ${latest + 1}.`);
  writeFileSync(here("./preview.md"), render(issues.find((x) => x.key === "tx-api")));
}

const bodyPath = fileURLToPath(here("./body.tmp.md"));

function updateIssue(issue) {
  writeFileSync(bodyPath, render(issue));
  gh([
    "issue",
    "edit",
    String(created[issue.key]),
    "--repo",
    REPO,
    "--body-file",
    bodyPath,
    "--milestone",
    issue.milestone,
  ]);
  console.log(`updated #${created[issue.key]} ${issue.title}`);
}

function createIssue(issue) {
  writeFileSync(bodyPath, render(issue));
  const args = ["issue", "create", "--repo", REPO, "--title", issue.title];
  args.push("--body-file", bodyPath, "--milestone", issue.milestone);
  for (const label of issue.labels) args.push("--label", label);
  const actual = Number(gh(args).split("/").pop());
  const expected = numberOf.get(issue.key);
  created[issue.key] = actual;
  writeFileSync(statePath, JSON.stringify(created, null, 2));
  console.log(`#${actual} ${issue.title}`);
  if (actual !== expected)
    throw new Error(
      `Expected #${expected} for ${issue.key} but got #${actual}; stopping so references stay correct`,
    );
}

function sync() {
  const onlyIndex = process.argv.indexOf("--only");
  const only = onlyIndex > -1 ? process.argv[onlyIndex + 1].split(",") : null;
  for (const issue of issues) {
    if (only && !only.includes(issue.key)) continue;
    if (!created[issue.key]) createIssue(issue);
    else if (update) updateIssue(issue);
  }
  console.log(`\nDone: ${Object.keys(created).length} issues.`);
}

if (dryRun && process.argv.includes("--order")) printOrder();
else if (process.argv.includes("--verify")) process.exit(verify());
else if (dryRun) preview();
else sync();
