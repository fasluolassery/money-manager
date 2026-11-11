# AGENTS.md

How to work in this repository, for AI agents and humans. This file only points at the rules; the rules themselves live in `SPEC.md`, `DESIGN.md` and `UI.md`, and those win if anything here seems to disagree.

## Before you start

1. **Read the sources of truth.** `SPEC.md` (what and why: requirements `FR-…`, decisions `D-01`–`D-27`, assumptions `A-…`, open questions `Q-…`, scope, glossary), `DESIGN.md` (how it's built: decisions `D-28` onward) and `UI.md` (how it looks, feels and reads). Their order of precedence is the table at the top of `SPEC.md`: **the spec wins** when they disagree.
2. **Work only from a GitHub issue** that is in **Ready** on the board and meets the definition of ready ([DESIGN 10.6](DESIGN.md#106-definition-of-ready)). The issue's scope, acceptance criteria and **Traceability** section (requirement and decision IDs) define the work.
3. **Pre-flight check** ([DESIGN 10.7](DESIGN.md#107-git-conventions-and-releases)): re-read the issue as it is on GitHub now, every section and decision named in its Scope and Traceability, [DESIGN 10.5–10.7](DESIGN.md#105-definition-of-done) and [15](DESIGN.md#15-engineering-principles), and this file. Check rules against their current text, never from memory.
4. **Stop and ask the user** instead of guessing when:
   - an assumption (`A-…`) looks wrong, or an open question (`Q-…`) blocks the work;
   - the work would change a decision (`D-…`); decisions bind until their entry is changed first, with a new date;
   - the docs contradict each other, or the issue contradicts the docs;
   - the work would touch anything out of scope ([Spec Rule 17](SPEC.md#rule-17-out-of-scope-first-version)). Out-of-scope features get no partial support, hidden flags or placeholders.

## Workflow ([DESIGN 10.7](DESIGN.md#107-git-conventions-and-releases))

- **One issue, one branch, one pull request.** Branch `<issue>-<slug>`, e.g. `12-frontend-skeleton`.
- **Conventional Commits** for commits and the PR title (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`, `ci:`, `perf:`).
- The PR description contains `Closes #<issue>`. Merge with **squash merge** only.
- **Refactors go in their own PR**, never mixed with behaviour changes ([DESIGN 15.8](DESIGN.md#158-refactoring)).
- **Docs change in the same PR** as the behaviour or design they describe. When the code is right and the docs are wrong, fix the docs; otherwise fix the code.
- **Issues are generated, never edited on GitHub by hand.** Change `tools/backlog/issues.md`, then, from your branch and before merging, run `node tools/backlog/create-issues.mjs --update --only <key>` and re-run CI; CI fails while they disagree. Adding an issue to a milestone changes that milestone's sign-off issue (it depends on every issue in its milestone), so update the sign-off too.

## Rules that are never optional

Each line links to the full rule. Read the section before touching that area.

**Backend**
- Layers and what each may and may not do: routes → service → repository and domain ([DESIGN 4.2](DESIGN.md#42-layers)); one folder per feature ([4.1](DESIGN.md#41-feature-modules)); plain functions and factories, **no classes except errors** ([4.3](DESIGN.md#43-code-style)); the module map says who owns what ([14](DESIGN.md#14-module-map)).
- **Ownership:** every query filters by `userId`, which comes from the session, never the request body; another user's record is a `404` ([4.5](DESIGN.md#45-ownership-rule)).
- Multi-record writes run in one DB transaction ([4.6](DESIGN.md#46-cross-feature-writes-and-db-transactions)).
- **Every change sends the record's `version`;** stale ones get `409 STALE_RECORD` ([4.7](DESIGN.md#47-stale-edits-record-versions)). **Every create accepts an `idempotencyKey`** ([6.4](DESIGN.md#64-duplicate-protection)).

**Money and dates**
- Money is **integer paise**; calendar dates are `YYYY-MM-DD` strings; both use branded types ([DESIGN 5.1](DESIGN.md#51-conventions), [15.5](DESIGN.md#155-strong-types-instead-of-bare-primitives)). No money arithmetic outside `packages/shared/src/money.ts`; no date logic outside `dates.ts`; no clock in domain functions.
- Count money **exactly** as [Spec Rule 9, Counting money](SPEC.md#counting-money) defines; format it as [Spec Rule 14](SPEC.md#rule-14-formatting-and-calendar) defines.

**API and errors**
- REST under `/api/v1` with the `{ success, data | error }` envelope ([DESIGN 6.1–6.3](DESIGN.md#61-conventions)).
- **Responses only through `respond` and a response schema;** never raw documents or internal fields (`userId`, `nameLower`, `idempotencyKey`, `_id`) ([6.6](DESIGN.md#66-response-shapes-no-data-leakage)).
- **Error discipline:** throw the domain errors in [9.2](DESIGN.md#92-error-types); translate library errors at the boundary; take messages from the shared catalogue; **no third-party error text ever reaches the user** ([9.6](DESIGN.md#96-error-discipline)).

**Security** — headers, CSP with no inline scripts, query-injection rules ([DESIGN 7.6](DESIGN.md#76-security-hardening)); sessions, Origin check, rate limits, `trust proxy` ([7.3](DESIGN.md#73-sessions), [7.4](DESIGN.md#74-protecting-the-api)); never log bodies, cookies, names or emails ([9.4](DESIGN.md#94-logging)); never commit secrets.

**Frontend and UI**
- Server data lives only in TanStack Query; filters in the URL; query keys from the factory; each mutation lists what it refreshes ([DESIGN 8.11](DESIGN.md#811-frontend-data-rules)).
- **Build UI to `UI.md`:** semantic tokens only ([UI 4](UI.md#4-design-tokens)); every screen state ([5.1](UI.md#51-screen-states)); the shared components ([5.3](UI.md#53-component-inventory)) on exactly the shadcn/ui primitives mapped in [5.5](UI.md#55-shadcnui-primitives); motion ([6](UI.md#6-motion)); feedback ([7](UI.md#7-feedback)); the accessibility baseline ([8](UI.md#8-accessibility-baseline)); copy ([9](UI.md#9-copy-and-tone)).
- Stay inside the performance budget ([DESIGN 12](DESIGN.md#12-performance-budget)).

**Code quality**
- The enforced code rules and import boundaries ([DESIGN 10.4](DESIGN.md#104-code-rules-enforced-by-tooling)); a disabled rule needs a comment saying why.
- Names follow [10.9](DESIGN.md#109-naming-conventions) and the glossary's "In code" column in `SPEC.md`; new dependencies follow [10.10](DESIGN.md#1010-dependency-policy).
- The engineering principles: single responsibility and size guidance, no duplication, YAGNI, composition, branded types, defensive engineering, no listed code smells ([DESIGN 15](DESIGN.md#15-engineering-principles)).

## Tests and traceability

- Write the tests [Spec Rule 16](SPEC.md#rule-16-testing) requires, following the testing discipline: never mock the database, use test data builders, inject time ([DESIGN 10.8](DESIGN.md#108-testing-discipline)).
- **Every test name carries the requirement IDs it proves:** `it("[FR-8.4] rejects a repayment larger than the remaining amount")`.
- After changing the docs, issues or tests, run `node tools/docs/check.mjs` to regenerate `TRACEABILITY.md`, and commit the result. Never edit `TRACEABILITY.md` by hand.

## Before opening a pull request

- The issue's acceptance criteria and the definition of done hold ([DESIGN 10.5](DESIGN.md#105-definition-of-done)).
- **The pull request description is the verification record** ([DESIGN 10.7](DESIGN.md#107-git-conventions-and-releases)): an Acceptance criteria section and a Definition of done section, copied from the issue, each line ticked **with its evidence** or marked **N/A with a reason**; anything unmet stays unticked and says why. New dependencies are justified there too ([10.10](DESIGN.md#1010-dependency-policy)). **Never tick checkboxes in the issue itself.**
- These pass locally:
  - `node tools/docs/check.mjs --ci`: references, IDs and traceability.
  - `node tools/backlog/create-issues.mjs --verify`: every GitHub issue matches `tools/backlog/issues.md`.
  - From issue #2 onward, the workspace checks listed in the README (type check, lint, tests, build). Don't invent commands that don't exist yet.

## Before merging

**Pre-merge check** ([DESIGN 10.7](DESIGN.md#107-git-conventions-and-releases)):

- Re-read the rule behind each definition-of-done line before ticking it, and quote the evidence.
- Review the whole diff against the code smells ([DESIGN 15.7](DESIGN.md#157-code-smells-that-are-not-allowed)) and the audit checklist rows for the areas it touches ([13](DESIGN.md#13-audit-checklist)).
- No refactor mixed with a behaviour change ([15.8](DESIGN.md#158-refactoring)). Docs changed with the code.
- CI is green on the last commit. Tooling changes are also verified in a fresh clone.

## Where things live

The full layout is in [DESIGN 3](DESIGN.md#3-repo-structure). Shared code goes only in `packages/shared`; apps never import each other; planning tools are in `tools/backlog/` and `tools/docs/`.
