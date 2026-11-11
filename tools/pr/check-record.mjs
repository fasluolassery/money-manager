// Checks a pull request's verification record (DESIGN 10.7) against its issue.
// Usage: node tools/pr/check-record.mjs <pull request number>  (CI passes PR_NUMBER instead)
import { execFileSync } from "node:child_process";

const TITLE = /^(feat|fix|chore|docs|test|refactor|ci|perf)(\([a-z0-9-]+\))?!?: \S/;
const BRANCH = /^(\d+)-[a-z0-9-]+$/;
const SECTIONS = ["Acceptance criteria", "Definition of done"];
const BOT_AUTHORS = new Set(["dependabot[bot]"]);

const gh = (args) => execFileSync("gh", args, { encoding: "utf8" }).trim();
const api = (path) => JSON.parse(gh(["api", path]));

function findSection(markdown, heading) {
  const lines = (markdown ?? "").split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (start === -1) return null;
  const end = lines.findIndex((line, i) => i > start && line.startsWith("## "));
  return lines.slice(start + 1, end === -1 ? undefined : end);
}

const stripBold = (text) => text.replaceAll("**", "").trim();

function parseItems(lines) {
  const found = [];
  for (const line of lines) {
    const box = line.match(/^- \[( |x|X)\] (.*)$/);
    if (box) found.push({ ticked: box[1] !== " ", text: stripBold(box[2]), more: [] });
    else if (found.length && /^\s+\S/.test(line)) found.at(-1).more.push(line.trim());
  }
  return found;
}

function checkLine(expected, prItems, heading) {
  const wanted = expected.replace(/\.$/, "");
  const item = prItems.find((candidate) => candidate.text.startsWith(wanted));
  if (!item) return `${heading}: missing the issue's line "${expected}"`;
  const rest = item.text.slice(wanted.length).replace(/^[\s.:—–-]+/, "");
  const evidence = [rest, ...item.more].join(" ");
  if (/\w{2,}/.test(evidence)) return null;
  return item.ticked
    ? `${heading}: ticked without evidence: "${expected}"`
    : `${heading}: unticked without a reason: "${expected}"`;
}

function checkSections(prBody, issueBody) {
  const problems = [];
  for (const heading of SECTIONS) {
    const issueLines = findSection(issueBody, heading);
    const prLines = findSection(prBody, heading);
    if (!issueLines) continue;
    if (!prLines) {
      problems.push(`the description has no "## ${heading}" section`);
      continue;
    }
    const prItems = parseItems(prLines);
    for (const expected of parseItems(issueLines).map((item) => item.text)) {
      const problem = checkLine(expected, prItems, heading);
      if (problem) problems.push(problem);
    }
  }
  return problems;
}

function checkRecord(pr, issue) {
  const problems = [];
  if (!TITLE.test(pr.title))
    problems.push(`title "${pr.title}" isn't Conventional Commits with a type from DESIGN 10.7`);
  const closes = [...(pr.body ?? "").matchAll(/\bCloses #(\d+)\b/gi)].map((m) => Number(m[1]));
  if (!closes.includes(issue.number))
    problems.push(`the description doesn't say "Closes #${issue.number}" (the branch's issue)`);
  const typeLabel = issue.labels.find((label) => label.startsWith("type: "));
  if (typeLabel && !pr.labels.includes(typeLabel))
    problems.push(`the pull request lacks the issue's label "${typeLabel}"`);
  return [...problems, ...checkSections(pr.body, issue.body)];
}

function load(number) {
  const repo =
    process.env.GITHUB_REPOSITORY ??
    gh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"]);
  const raw = api(`repos/${repo}/pulls/${number}`);
  const pr = {
    title: raw.title,
    body: raw.body,
    branch: raw.head.ref,
    author: raw.user.login,
    labels: raw.labels.map((label) => label.name),
  };
  const issueNumber = Number(pr.branch.match(BRANCH)?.[1]);
  if (!issueNumber) return { pr, issue: null };
  const rawIssue = api(`repos/${repo}/issues/${issueNumber}`);
  const issue = {
    number: issueNumber,
    body: rawIssue.body,
    labels: rawIssue.labels.map((label) => label.name),
  };
  return { pr, issue };
}

function main() {
  const number = process.argv[2] ?? process.env.PR_NUMBER;
  if (!/^\d+$/.test(number ?? "")) {
    console.error("Usage: node tools/pr/check-record.mjs <pull request number>");
    process.exit(2);
  }
  let loaded;
  try {
    loaded = load(number);
  } catch {
    console.error(
      `Couldn't read pull request #${number} or its issue from GitHub (is gh signed in?).`,
    );
    process.exit(2);
  }
  const { pr, issue } = loaded;
  if (BOT_AUTHORS.has(pr.author)) {
    console.log(`OK: #${number} is from ${pr.author}, which has no issue; not checked.`);
    return;
  }
  const problems = issue
    ? checkRecord(pr, issue)
    : [`branch "${pr.branch}" isn't <issue number>-<slug> (DESIGN 10.7)`];
  if (problems.length) {
    console.log(
      `#${number}: the pull request record has ${problems.length} problem(s):\n- ${problems.join("\n- ")}`,
    );
    process.exit(1);
  }
  console.log(`OK: #${number}'s record matches issue #${issue.number}.`);
}

main();
