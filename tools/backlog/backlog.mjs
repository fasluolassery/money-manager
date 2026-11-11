import { readFileSync } from "node:fs";

const MILESTONES = {
  m1: "M1: Setup and login",
  m2: "M2: Transactions and categories",
  m3: "M3: Views",
  m4: "M4: Bills",
  m5: "M5: Lending",
  m6: "M6: Savings goals",
  m7: "M7: Backup and account",
};

const splitList = (value, sep) =>
  value
    ? value
        .split(sep)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

function parseEntry(block) {
  const [headerText, ...rest] = block.trim().split(/\n\s*\n/);
  const header = Object.fromEntries(
    headerText.split("\n").map((line) => {
      const i = line.indexOf(": ");
      return [line.slice(0, i).trim(), line.slice(i + 2).trim()];
    }),
  );
  return {
    key: header.key,
    title: header.title,
    milestone: MILESTONES[header.milestone],
    labels: splitList(header.labels, "|"),
    deps: splitList(header.deps, ","),
    flags: splitList(header.flags, ","),
    implements: splitList(header.implements === "none" ? "" : header.implements, ","),
    decisions: splitList(header.decisions === "none" ? "" : header.decisions, ","),
    hasTraceability: "implements" in header && "decisions" in header,
    body: rest.join("\n\n").trim(),
  };
}

// A milestone's sign-off issue depends on every other issue in that milestone.
export function readBacklog(path) {
  const issues = readFileSync(path, "utf8")
    .split(/^@@@ issue\s*$/m)
    .slice(1)
    .map(parseEntry);
  for (const signoff of issues.filter((x) => x.key.endsWith("-signoff"))) {
    const sameMilestone = issues
      .filter((x) => x.milestone === signoff.milestone && x.key !== signoff.key)
      .map((x) => x.key);
    signoff.deps = [...new Set([...signoff.deps, ...sameMilestone])];
  }
  return issues;
}

function validateEntry(issue, position, keys) {
  if (!issue.key || !issue.title || !issue.milestone)
    throw new Error(`Issue ${position} is missing key, title or milestone`);
  if (!issue.hasTraceability)
    throw new Error(`${issue.key}: missing "implements:" or "decisions:" header (use "none")`);
  for (const dep of issue.deps) {
    if (!keys.has(dep)) throw new Error(`${issue.key}: unknown dependency "${dep}"`);
    if (dep === issue.key) throw new Error(`${issue.key}: depends on itself`);
  }
  for (const [, ref] of issue.body.matchAll(/\{\{([\w-]+)\}\}/g)) {
    if (!keys.has(ref)) throw new Error(`${issue.key}: unknown reference "{{${ref}}}"`);
  }
}

export function validateBacklog(issues) {
  const keys = new Set(issues.map((issue) => issue.key));
  if (keys.size !== issues.length) throw new Error("Duplicate keys");
  for (const [i, issue] of issues.entries()) validateEntry(issue, i + 1, keys);
}

export function dependencyOrder(issues) {
  const order = [];
  const state = new Map();
  const visit = (key, path) => {
    if (state.get(key) === "done") return;
    if (state.get(key) === "visiting")
      throw new Error(`Dependency cycle: ${[...path, key].join(" -> ")}`);
    state.set(key, "visiting");
    for (const dep of issues.find((x) => x.key === key).deps) visit(dep, [...path, key]);
    state.set(key, "done");
    order.push(key);
  };
  for (const issue of issues) visit(issue.key, []);
  return order;
}
