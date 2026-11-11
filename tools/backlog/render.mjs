function addCriteria(body, lines) {
  if (!lines.length) return body;
  return body.replace(
    "## Acceptance criteria\n\n",
    `## Acceptance criteria\n\n${lines.map((l) => `- [ ] ${l}`).join("\n")}\n`,
  );
}

// Acceptance criteria added by an issue's flags and by sign-off issues.
function flagCriteria(issue) {
  const has = (flag) => issue.flags.includes(flag);
  const extra = [];
  if (has("versioned")) {
    extra.push(
      "Every edit and delete requires the record's current `version`; a stale one returns `409 STALE_RECORD` and changes nothing (DESIGN 4.7, API test).",
    );
  }
  if (has("idempotent")) {
    extra.push(
      "Every create endpoint accepts an `idempotencyKey`; repeating it returns the existing item and creates nothing (DESIGN 6.4, API test).",
    );
  }
  if (has("api")) {
    extra.push(
      "Every response goes through its shared response schema via `respond`; no internal field (`userId`, `nameLower`, `idempotencyKey`, raw `_id`) appears, checked by API tests (DESIGN 6.6).",
      "New or changed endpoints appear in `docs/openapi.json` (DESIGN 6.8).",
    );
  }
  if (has("collection")) {
    extra.push(
      "Each new collection has its MongoDB `$jsonSchema` validator; a test shows a direct insert of invalid data is rejected (DESIGN 5.6).",
    );
  }
  if (has("property")) {
    extra.push(
      "Property-based tests (fast-check) cover the invariants of this logic (DESIGN 10.8).",
    );
  }
  if (has("seed"))
    extra.push(
      "`pnpm seed:dev` is extended with realistic sample data for this feature (DESIGN 11.8).",
    );
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
  return extra;
}

function definitionOfDone(issue, ref) {
  const has = (flag) => issue.flags.includes(flag);
  return [
    "All acceptance criteria are met",
    !has("nocode") && "Tests required by Spec Rule 16 for this area are written and pass",
    issue.implements.length > 0 &&
      "Tests carry the requirement IDs listed under Traceability in their names, and `TRACEABILITY.md` is regenerated (DESIGN 10.8)",
    has("preci")
      ? `The checks that exist so far pass locally (CI arrives in ${ref("ci")})`
      : "Every CI gate passes",
    has("ui") && "Works on a phone-sized and a laptop-sized screen",
    has("ui") &&
      "Matches UI.md: tokens, screen states, motion, copy and the accessibility baseline",
    !has("nocode") &&
      "Errors are handled as in DESIGN.md Section 9; no third-party error text reaches the user (9.6)",
    !has("nocode") &&
      !has("preci") &&
      "The code rules and import boundaries in DESIGN.md 10.4 pass",
    has("api") &&
      "API responses go through their response schemas, with no internal fields (DESIGN.md 6.6)",
    !has("nocode") &&
      "Names follow DESIGN.md 10.9 and the SPEC glossary; any new dependency is justified (10.10)",
    !has("nocode") &&
      "Follows the engineering principles in DESIGN.md 15: size guidance, no listed code smells, no speculative code, composition, branded types",
    "Refactors are in their own pull request, never mixed with behaviour changes (DESIGN.md 15.8)",
    "No decision (`D-…`) was changed silently; a changed decision was updated in SPEC.md or DESIGN.md 1 first",
    "SPEC.md / DESIGN.md / UI.md updated if behaviour or design changed",
    "Merged through a squash-merged pull request that closes this issue",
  ]
    .filter(Boolean)
    .map((item) => `- [ ] ${item}`)
    .join("\n");
}

function traceability(issue) {
  return [
    `- **Implements:** ${issue.implements.length ? issue.implements.join(", ") : "no product requirement directly (infrastructure or verification)"}`,
    `- **Decisions:** ${issue.decisions.length ? issue.decisions.join(", ") : "none"}`,
    "- Requirement IDs are defined in SPEC.md and decision IDs in SPEC.md (D-01–D-27) and DESIGN 1 (D-28 onward). Tests for this issue carry the requirement IDs in their names (DESIGN 10.8).",
  ].join("\n");
}

export function renderIssue(issue, { issues, numberOf }) {
  const ref = (key) => `#${numberOf.get(key)}`;
  const body = addCriteria(
    issue.body.replace(/\{\{([\w-]+)\}\}/g, (_, key) => ref(key)),
    flagCriteria(issue),
  );
  const deps = issue.deps.length
    ? issue.deps
        .map((d) => `- Blocked by ${ref(d)} (${issues.find((x) => x.key === d).title})`)
        .join("\n")
    : "None.";
  return `${body}\n\n## Traceability\n\n${traceability(issue)}\n\n## Dependencies\n\n${deps}\n\n## Definition of done\n\nSee DESIGN.md Sections 10.5–10.7.\n\n${definitionOfDone(issue, ref)}\n`;
}
