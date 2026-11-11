Backlog source: the single source for every GitHub issue (SPEC.md, "How these documents fit together").
Each issue starts with "@@@ issue", then header lines, a blank line, then the body.
Headers: key, title, milestone (m1–m7), labels (separated by " | "), deps (comma-separated keys),
flags (preci, ui, nocode, versioned, idempotent, api, collection, property, seed),
implements (requirement IDs from SPEC.md, or "none"), decisions (decision IDs, or "none").
{{key}} in a body becomes that issue's number.
Run: node tools/backlog/create-issues.mjs --dry | --order | --verify | --update [--only key,key].

@@@ issue
key: agents-md
title: Add AGENTS.md with project conventions
milestone: m1
labels: type: docs | size: S
flags: preci, nocode
implements: none
decisions: D-35, D-39, D-40, D-44, D-45, D-49

## Context

Most of this project is built with AI agents in Cursor. Without a conventions file, every new chat starts without knowing the spec, the design or the rules, and the code drifts from the design. `AGENTS.md` is read automatically by agents at the start of every task.

## Scope

Create `AGENTS.md` at the repo root that tells any agent (and any human) to:

- Read `SPEC.md` and `DESIGN.md` before starting; the spec wins when they disagree.
- Follow the backend layers and their rules (DESIGN 4.2), the feature module layout (DESIGN 4.1) and the ownership rule (DESIGN 4.5).
- Store money as integer paise and calendar dates as `YYYY-MM-DD` strings (DESIGN 5.1).
- Use the response envelope and error types (DESIGN 6.2, 9.2); no classes except errors (DESIGN 4.3).
- Write the tests required by Spec Rule 16 and meet the definition of done (DESIGN 10.5).
- Follow the definition of ready and the git conventions (DESIGN 10.6, 10.7): one issue per branch named `<issue>-<slug>`, Conventional Commit PR titles, `Closes #<issue>`, squash merge.
- Send the record's `version` on every edit and handle `409 STALE_RECORD` (DESIGN 4.7).
- Follow the security rules (DESIGN 7.6) and stay inside the performance budget (DESIGN 12).
- Follow the error discipline (DESIGN 9.6): throw domain errors, translate library errors at the boundary, never let third-party error text reach the user, take messages from the shared catalogue.
- Follow the enforced code rules and import boundaries (DESIGN 10.4).
- Send responses only through response schemas; never return raw documents or internal fields (DESIGN 6.6).
- Count money exactly as Spec Rule 9, Counting money, defines; use the SPEC glossary's words and its "In code" names.
- Treat decisions (`D-…`) as binding; never change one silently. Stop and ask if an assumption (`A-…`) looks wrong or an open question (`Q-…`) blocks the work.
- Put the requirement IDs (`FR-…`) a test proves into its name (DESIGN 10.8), and regenerate `TRACEABILITY.md` with `node tools/docs/check.mjs`.
- Follow the frontend data rules (DESIGN 8.11), testing discipline (10.8), naming conventions (10.9) and dependency policy (10.10).
- Follow the engineering principles (DESIGN 15): single responsibility and size guidance, no duplication, YAGNI, composition, branded types, defensive engineering, no listed code smells, refactors in their own pull request.
- Build UI to `UI.md`.
- Update `SPEC.md` / `DESIGN.md` in the same pull request when behaviour or design changes.

## Acceptance criteria

- [ ] `AGENTS.md` exists at the repo root and covers every point in Scope.
- [ ] It links to the relevant SPEC/DESIGN sections instead of copying them, so there is one source of truth.
- [ ] It is under about 150 lines.

## Out of scope

- Cursor-specific rule files (`.cursor/rules`). Can be added later if `AGENTS.md` isn't enough.

@@@ issue
key: monorepo
title: Set up the pnpm monorepo skeleton
milestone: m1
labels: type: infra | size: M
flags: preci
implements: none
decisions: D-32, D-33

## Context

DESIGN 1.5 and 3 define a pnpm workspaces monorepo with `apps/api`, `apps/web` and `packages/shared`. Everything else builds on this.

## Scope

- `pnpm-workspace.yaml` with `apps/*` and `packages/*`.
- Root `package.json`: `private`, `"type": "module"`, `packageManager` pinned to pnpm 10, `engines.node` 24, and scripts `dev`, `build`, `typecheck`, `test` that run across workspaces (DESIGN 1.6).
- `.nvmrc` with Node 24.
- TypeScript project references built with `tsc -b`: `shared` and `api` compile to `dist/` with declarations (`moduleResolution: "NodeNext"`); `web` uses `"Bundler"` (DESIGN 1.6).
- `.gitignore` additions for the new tooling: `*.tsbuildinfo`, `playwright-report/`, `test-results/`.
- `tsconfig.base.json` with `strict`, `noUncheckedIndexedAccess` and `noFallthroughCasesInSwitch` (DESIGN 10.4); each workspace's `tsconfig.json` extends it.
- Packages `@money-manager/api`, `@money-manager/web`, `@money-manager/shared`, each with a placeholder `src/index.ts`.
- `api` and `web` depend on `shared` with `workspace:*`.
- `README.md`: what the project is, install and run commands, links to SPEC, DESIGN and UI.md, and the **prerequisites**: Node.js 24, pnpm 10, git, gitleaks (for the pre-commit hook, DESIGN 10.1), and optionally the GitHub CLI.

## Acceptance criteria

- [ ] `pnpm install` on a fresh clone completes without errors or warnings about missing peers.
- [ ] `pnpm typecheck` passes for all three workspaces.
- [ ] `api` and `web` each import an exported constant from `@money-manager/shared` and type-check.
- [ ] Folder layout matches DESIGN 3.
- [ ] `README.md` lets someone go from clone to `pnpm typecheck` passing.

## Out of scope

- Express, React or any runtime code ({{api-skeleton}}, {{web-skeleton}}).
- Lint and test tooling ({{biome}}, {{vitest}}).

@@@ issue
key: biome
title: Add Biome and the pre-commit hook
milestone: m1
labels: type: infra | area: ci | size: S
deps: monorepo
flags: preci
implements: none
decisions: D-44, D-50

## Context

Gate 1 (DESIGN 10.1) formats and lints changed files before every commit. DESIGN 10.4 lists the code rules Biome enforces.

## Scope

- `biome.json` at the root: formatter on, recommended lint rules, and as errors: `noExplicitAny`, `noConsole`, `noDefaultExport` (override for tool config files), `noProcessEnv` (override for `apps/api/src/config.ts` and the Vite config), `noFloatingPromises`, `noDangerouslySetInnerHtml`, `useExhaustiveSwitchCases`, and `noExcessiveCognitiveComplexity` with a maximum of 15 (DESIGN 15.1).
- Confirm each rule exists in the installed Biome version (some may be in the nursery group). If one doesn't, record the replacement in DESIGN 10.4.
- Root scripts: `lint` (`biome check .`) and `format` (`biome check --write .`).
- husky + lint-staged: the pre-commit hook runs `biome check --write` on staged files only.
- **gitleaks** in the same hook, scanning staged changes for secrets (DESIGN 10.1).
- A `prepare` script so hooks install automatically on `pnpm install`.

## Acceptance criteria

- [ ] Committing an unformatted file formats it automatically and the commit succeeds.
- [ ] Committing a file with a lint error (e.g. an explicit `any`) is blocked with a readable message.
- [ ] Each rule in DESIGN 10.4 that Biome owns fails on a sample violation (verified, then removed); config files with a default export pass.
- [ ] `pnpm lint` passes on the whole repo.
- [ ] Hooks work on a fresh clone after `pnpm install`, with no manual step.
- [ ] Committing a file containing a fake API key is blocked by gitleaks.
- [ ] Without gitleaks installed, the hook stops with a message explaining how to install it (DESIGN 10.1).

## Out of scope

- Running Biome in CI ({{ci}}).

@@@ issue
key: vitest
title: Set up Vitest and the domain coverage gate
milestone: m1
labels: type: test | area: ci | size: S
deps: monorepo
flags: preci
implements: none
decisions: D-44

## Context

Spec Rule 16 requires unit and API tests. DESIGN 10.2 requires at least 90% line and branch coverage on `*.domain.ts` files.

## Scope

- Vitest configured for all workspaces, runnable from the root with `pnpm test`.
- `pnpm test:coverage` with the v8 provider and thresholds of 90% lines and 90% branches applied to `**/*.domain.ts`.
- A placeholder test in `packages/shared` so the runner has something to run.
- `fast-check` installed for property-based tests, with one sample property test (DESIGN 10.8).

## Acceptance criteria

- [ ] `pnpm test` runs tests in every workspace and passes.
- [ ] A sample `*.domain.ts` file below 90% coverage makes `pnpm test:coverage` fail (verified, then removed).
- [ ] Files that are not `*.domain.ts` don't count toward the threshold.

## Out of scope

- The API test harness with MongoDB ({{db}}).

@@@ issue
key: ci
title: Add the GitHub Actions CI workflow
milestone: m1
labels: type: infra | area: ci | size: M
deps: biome, vitest
flags: preci
implements: none
decisions: D-44, D-45, D-49

## Context

Gate 2 (DESIGN 10.2): every pull request and every push to `main` runs the full set of checks. Nothing merges or deploys without passing.

## Scope

`.github/workflows/ci.yml`, triggered on `pull_request` and on `push` to `main`, with **one job named `ci`** (a stable name for branch protection and Railway's "wait for CI"):

1. Checkout, Node from `.nvmrc` (24), pnpm 10 with dependency caching.
2. `pnpm install --frozen-lockfile`
3. gitleaks over the pull request's commits (DESIGN 10.2)
4. `biome ci`
5. `pnpm typecheck`
6. `pnpm test`
7. `pnpm test:coverage`
8. `pnpm test:api` (passes with no tests until {{db}} adds the harness)
9. `pnpm audit --prod --audit-level=high` (DESIGN 7.6)
10. `pnpm build`

Later issues add the token check ({{ui-tokens}}), the bundle budget ({{web-skeleton}}), the boundary and discipline checks ({{boundaries}}), the OpenAPI drift check ({{api-contract}}), the documentation and traceability checks ({{docs-checks}}) and end-to-end tests ({{e2e-setup}}) to this job.

## Acceptance criteria

- [ ] This workflow is added through a pull request, and CI is green on that pull request.
- [ ] A throwaway commit with a lint error, a type error and a failing test each turns CI red (verified one at a time, then reverted).
- [ ] The job appears in GitHub as `ci`.
- [ ] A cached run is noticeably faster than the first run.

## Out of scope

- Branch protection ({{protection}}).
- Deployment ({{deploy}}).

@@@ issue
key: protection
title: Protect main and add the PR template and Dependabot
milestone: m1
labels: type: infra | area: ci | size: S
deps: ci
implements: none
decisions: D-45

## Context

Gate 3 (DESIGN 10.3): changes reach `main` only through pull requests with green CI. DESIGN 10.4 adds Dependabot.

**Plan limitation to resolve first:** GitHub only enforces branch protection and rulesets on **private** repositories with a paid plan (GitHub Pro or higher). On GitHub Free, decide one of: upgrade to Pro, make the repo public, or follow the workflow by convention without enforcement. Record the decision in DESIGN 10.3.

## Scope

- Branch protection or a ruleset on `main` (if the plan allows): require a pull request, require the `ci` status check, block force pushes and deletion. No required reviewers.
- `.github/pull_request_template.md`: summary, `Closes #`, then the verification record from DESIGN 10.7: an **Acceptance criteria** section and a **Definition of done** section, where each line is ticked with its evidence or marked N/A with a reason.
- `.github/dependabot.yml`: weekly updates for npm (pnpm lockfile) and GitHub Actions.
- Repo settings (DESIGN 10.7): squash merge only (merge commits and rebase merges disabled), PR title as the squash commit title, automatically delete merged branches.
- `.github/release.yml`: groups generated release notes by the `type:` labels.

## Acceptance criteria

- [ ] The plan decision is recorded in DESIGN 10.3.
- [ ] Only squash merging is offered on pull requests, and merged branches are deleted.
- [ ] A draft release's generated notes are grouped by type.
- [ ] If enforced: a direct push to `main` is rejected, and a pull request with red CI cannot be merged.
- [ ] New pull requests open with the template.
- [ ] Dependabot appears under the repo's Insights → Dependency graph → Dependabot, with no config errors.

## Out of scope

- Release automation.

@@@ issue
key: shared-helpers
title: Add shared money and date helpers
milestone: m1
labels: type: feature | area: shared | size: L
deps: vitest
flags: property
implements: FR-9.1, FR-9.2, FR-9.3, FR-9.4, FR-9.5, FR-9.7, FR-9.8, FR-14.1, FR-14.2, FR-14.3, FR-14.4, FR-14.5
decisions: D-16, D-33, D-39, D-50

## Context

Money and dates are the easiest places to introduce bugs. Spec Rules 9, 14 and 16 and DESIGN 5.1 define how they're stored and shown. Both frontend and backend use these helpers, so they live in `packages/shared`.

## Scope

`packages/shared/src/money.ts`:
- `parseRupees(input)`: typed rupees to integer paise. `"125.50"` → `12550`, `"125.5"` → `12550`, `"125"` → `12500`. Rejects empty, non-numeric, negative, more than 2 decimals, and above ₹1,00,00,000.
- `formatRupees(paise)`: `12550` → `₹125.50`, `125000` → `₹1,250`, `10000000` → `₹1,00,000`, `-200000` → `−₹2,000` (with the true minus sign `−`, U+2212). Paise shown only when non-zero (Spec Rule 14).
- `formatRupeesCompact(paise)` for chart axes: `95000` → `₹950`, `1850000` → `₹18.5K`, `12000000` → `₹1.2L`, `1500000000` → `₹1.5Cr` (UI.md 4.10).
- `MAX_AMOUNT_PAISE` constant.

`packages/shared/src/dates.ts`:
- `CalendarDate` type for `YYYY-MM-DD` strings and `isCalendarDate(value)`.
- `todayIn(timezone, now)`: today's calendar date in an IANA timezone, using the built-in `Intl.DateTimeFormat`. No date library (DESIGN 1.6).
- `monthOf(date)` → `YYYY-MM`; `monthBounds(month)` → first and last day.
- `formatListDate(date)` → `10 Nov 2026`; `formatFormDate(date)` → `10/11/2026`.

`packages/shared/src/schemas/common.ts`: Zod schemas for
- amount (positive integer paise ≤ max) and the **signed** opening balance (−max to +max)
- calendar date, month and IANA timezone
- a "not in the future" check for money-event dates, given today's date in the user's timezone (Spec Rule 9)
- trimmed and Unicode-normalized (NFC) text with the limits from Spec Rule 9 (category name, bill/goal name, person, payee, note)
- **branded types** (DESIGN 15.5): `Paise`, `CalendarDate`, `Month` and one id type per entity, created only by these schemas and helpers
- every rule with a plain-English message, plus a global Zod error map whose fallback is "This value isn't valid" (DESIGN 9.6)

`packages/shared/src/assert-never.ts`: the `assertNever` helper for exhaustive `switch` statements (DESIGN 10.4).

## Acceptance criteria

- [ ] Unit tests cover every example above.
- [ ] No floating-point drift: parsing `"0.10"` and `"0.20"` and adding the results gives exactly `30`.
- [ ] `todayIn("Asia/Kolkata", …)` returns the previous day at 18:29 UTC and the next day at 18:31 UTC (midnight IST is 18:30 UTC).
- [ ] February in leap and non-leap years has the correct last day in `monthBounds`.
- [ ] Indian digit grouping is correct for 4 to 9 digit amounts, positive and negative.
- [ ] Negative amounts format as `−₹2,000` (minus sign before the ₹), never `₹-2,000`.
- [ ] No Zod default message can come out of any shared schema (test: every failing case returns one of our messages).
- [ ] Text is trimmed before length checks ("  Food  " is "Food").

## Out of scope

- Bill due-date rolling ({{bills-domain}}) and month comparison ranges ({{reports-domain}}).

@@@ issue
key: api-skeleton
title: Create the Express server skeleton
milestone: m1
labels: type: infra | area: api | size: M
deps: monorepo
implements: FR-10.6, FR-10.11, FR-11.2, FR-11.3
decisions: D-28, D-29, D-47

## Context

DESIGN 1.2, 2, 9.4 and 11.4: one Express 5 process serves the built frontend and the API, validates its config at startup, and logs structured JSON with a request id.

## Scope

- Express 5 in `apps/api`. `app.ts` exports `createApp()`; `main.ts` starts listening. API tests use `createApp()` without a port.
- `config.ts`: Zod-validated environment variables used so far (`NODE_ENV`, `PORT`, `APP_URL`, `LOG_LEVEL`). Invalid or missing → the process exits with a clear message.
- pino + pino-http: a request id per request (returned in `X-Request-Id`), logging method, path, status and duration. Cookies, auth headers and bodies are never logged.
- Serves `apps/web/dist` as static files, with every non-`/api` path falling back to `index.html`.
- `GET /api/health` returns `200 { status: "ok" }` (database check added in {{db}}).
- `pnpm dev` runs the API with file watching; production runs the compiled `node apps/api/dist/main.js` (DESIGN 1.6). Graceful shutdown on `SIGTERM`.
- `trust proxy` set to `1`, and no CORS middleware (DESIGN 7.4).
- `helmet` with the security headers and Content Security Policy from DESIGN 7.6; `X-Powered-By` removed.
- `Cache-Control` headers from DESIGN 6.7: `no-store` on every `/api/*` response, `no-cache` on `index.html` and the service worker, long-lived `immutable` on hashed assets.
- Unhandled rejections and exceptions are logged, then the process exits (DESIGN 9.3).
- `apps/api/.env.example`.

## Acceptance criteria

- [ ] Starting without a required variable exits with a message naming the variable.
- [ ] `GET /api/health` returns 200.
- [ ] Every request produces one log line with request id, method, path, status and duration, and no cookie, auth header or body content (checked in a test).
- [ ] `GET /some/client/route` returns `index.html` once the web build exists.
- [ ] `SIGTERM` closes the server cleanly.
- [ ] A test checks every header in DESIGN 7.6 on a response; HSTS only when `NODE_ENV=production`.
- [ ] A test checks the `Cache-Control` value for an API response, `index.html` and a hashed asset.

## Out of scope

- Error envelope and validation ({{api-errors}}).
- MongoDB ({{db}}).

@@@ issue
key: api-errors
title: Add error types, the response envelope and validation middleware
milestone: m1
labels: type: infra | area: api | size: L
deps: api-skeleton, vitest
implements: none
decisions: D-39

## Context

DESIGN 6.2, 9.1, 9.2 and 9.3 define one response envelope, one set of error types and one error middleware. Every feature depends on them.

## Scope

- `packages/shared/src/errors.ts`: the closed union of error codes and the default message for each (DESIGN 6.2, 9.6), written per UI.md 9.2.
- `apps/api/src/errors.ts`: `AppError` and every subclass in DESIGN 9.2 (`ValidationError`, `UnauthenticatedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `StaleRecordError`, `PayloadTooLargeError`, `RuleViolationError`, `RateLimitedError`).
- JSON body limit of 100 KB; invalid JSON → `400 VALIDATION_ERROR`, too large → `413 PAYLOAD_TOO_LARGE`, both with catalogue messages.
- Every failure response includes `error.requestId` (DESIGN 6.2).
- `validate` uses **strict** Zod schemas: unknown keys are rejected, and object values where a string or number is expected fail (DESIGN 7.6, query injection).
- A helper that sends `{ success: true, data }`.
- Error middleware, registered last, mapping errors exactly as DESIGN 9.3: `AppError`, `ZodError`, body-parser errors, and anything else as `500` with the catalogue message and the request id. Only `AppError` messages and our schema messages ever reach the client (DESIGN 9.6).
- `validate({ body, query, params })` middleware using Zod schemas; parsed values replace the raw ones.
- Unknown `/api/*` routes return `404 NOT_FOUND` in the envelope.

## Acceptance criteria

- [ ] Supertest tests cover each error type → status, code and envelope shape.
- [ ] A Zod failure returns `400` with one `details` entry per invalid field.
- [ ] A `500` response contains no stack trace or internal message, but does contain the request id; the full error is logged.
- [ ] An async route that throws is handled by the middleware (Express 5 behaviour) without any wrapper.
- [ ] A body like `{ "name": { "$gt": "" } }` or one with an unknown key returns `400`, never reaches the service.
- [ ] Invalid JSON returns `400` and a 101 KB body returns `413`, both in the envelope with catalogue messages.
- [ ] **No leakage:** a route that throws a raw library error (a fake MongoDB error, a plain `Error` with a secret-looking message) returns only the catalogue message and the request id; the original is in the logs.

## Out of scope

- Frontend error display ({{web-skeleton}}).

@@@ issue
key: db
title: Connect MongoDB and set up the API test harness
milestone: m1
labels: type: infra | area: db | area: api | size: M
deps: api-errors, ci
implements: FR-2.1, FR-9.9, FR-9.11, FR-9.12, FR-11.1
decisions: D-31, D-36, D-50

## Context

DESIGN 4.6, 5.1 and 10.2: one MongoDB client, a transaction helper, indexes created at startup, and API tests against an in-memory replica set (transactions need one).

## Scope

- `db/client.ts`: one `MongoClient` connected at startup and closed on shutdown, with a 5-second server-selection and 10-second connect timeout; aggregations use a 10-second `maxTimeMS` (DESIGN 15.6). `MONGODB_URI` added to config.
- `db/transaction.ts`: `withTransaction(async (session) => …)`.
- `db/indexes.ts`: `ensureIndexes()` run at startup; modules register their indexes **and `$jsonSchema` validators** here (DESIGN 5.6).
- `test-support/`: test data builders (`buildX({ ...overrides })`) and a fixed clock for API tests (DESIGN 10.8).
- `db/errors.ts`: the driver-error translation every repository uses (DESIGN 9.6): a duplicate-key error on a named unique index becomes a `ConflictError` with a specific message, or a lookup of the existing record for an idempotency key; other driver errors are rethrown as they are.
- `GET /api/health` pings the database: `200` when reachable, `503` when not.
- Test harness: `mongodb-memory-server` replica set started once per run, a fresh database per test file, a helper that builds the app against it. `pnpm test:api` runs only API tests.
- Development Atlas connection string documented in `.env.example` (no real value).

## Acceptance criteria

- [ ] The server refuses to start if it can't connect to MongoDB at boot.
- [ ] `/api/health` returns `503` when the database becomes unreachable (tested by stopping the in-memory server).
- [ ] A test proves `withTransaction` rolls back the first write when the second throws.
- [ ] A test inserts a duplicate on a unique index and gets a `ConflictError`, not a MongoDB error.
- [ ] `pnpm test:api` runs in CI without Docker, and the CI step from {{ci}} now runs real tests.

## Out of scope

- Any app collection (added by each feature).

@@@ issue
key: container
title: Set up the awilix container and module conventions
milestone: m1
labels: type: infra | area: api | size: S
deps: db
implements: none
decisions: D-35

## Context

DESIGN 4.1, 4.3 and 4.4: feature modules made of factory functions, wired together by an awilix container.

## Scope

- `container.ts`: registers config, logger, db client and every module's repository and service factory as singletons.
- Routes resolve their service from the container.
- A `users` module skeleton (`users.routes.ts`, `users.service.ts`, `users.repository.ts`) following DESIGN 4.1, with no endpoints yet.
- A test helper that builds a container with overrides (fakes or the test database).

## Acceptance criteria

- [ ] A unit test builds a container with a fake repository and calls a service function through it.
- [ ] Only repository files import the MongoDB client or collections (checked by a lint rule or a simple test that scans imports).
- [ ] Adding a new module needs changes only in its own folder plus one registration line in `container.ts`.

## Out of scope

- User endpoints ({{onboarding}}).

@@@ issue
key: web-skeleton
title: Create the frontend skeleton
milestone: m1
labels: type: infra | area: web | size: M
deps: monorepo, api-skeleton
flags: ui
implements: FR-3.5
decisions: D-34, D-42, D-43, D-50

## Context

DESIGN 8.1, 8.2, 8.4, 8.6 and 8.8 define the frontend stack, folder layout, API client and theme.

## Scope

- Vite + React + TypeScript in `apps/web`, folder layout from DESIGN 8.2.
- Tailwind CSS and shadcn/ui, with these components to start: button, input, card, sheet, dialog, toast (sonner).
- React Router (`createBrowserRouter`) and a TanStack Query provider: reads retry up to 2 times, writes never retry automatically.
- `lib/api-client.ts`: same-origin `/api/v1`, cookies included, unwraps `{ success, data }`, throws `ApiError` (code, message, details, request id), redirects to `/sign-in` on `401`, and gives up after 15 seconds with `NETWORK_ERROR` and the "request timed out" message (DESIGN 15.6, UI.md 9.3). Every other failure also becomes an `ApiError`: no response → `NETWORK_ERROR`; a non-envelope response → `INTERNAL_ERROR`; messages from the shared catalogue (DESIGN 8.4, 9.6).
- `lib/query-keys.ts`: the query key factory, shaped `[feature, ...scope]` (DESIGN 8.11).
- TanStack Query refetches on window focus; mutation hooks declare the query groups they refresh (DESIGN 8.11).
- Vite dev server proxies `/api` to the local API.
- Theme: follow device, light or dark; stored in `localStorage`; `dark` class on `<html>`, set before first paint by the external `public/theme-init.js`, never an inline script (DESIGN 7.6, 8.6).
- Tailwind CSS 4 and React Router 7 in data mode (`createBrowserRouter`), per DESIGN 1.6.
- A test that the built `index.html` contains no inline `<script>` (DESIGN 7.6).
- `browserslist` for the last 2 versions of Chrome, Edge, Firefox and Safari; `viewport-fit=cover` and safe-area padding helpers (DESIGN 8.9).
- Route-level lazy loading with React Router (DESIGN 8.10).
- `size-limit` check on the built app, failing CI above 200 KB of gzipped initial JavaScript (DESIGN 12).
- The production build is served by the API (from {{api-skeleton}}).

## Acceptance criteria

- [ ] `pnpm dev` runs web and API together, and the web app can call `/api/health` through the proxy.
- [ ] Unit tests for `api-client`: unwraps success, throws `ApiError` with code and field details, redirects on `401`, turns a `fetch` `TypeError` into `NETWORK_ERROR` and an HTML `502` into `INTERNAL_ERROR`, never exposing their original messages.
- [ ] The theme choice survives a reload; "follow device" reacts to the OS setting changing.
- [ ] `pnpm build` then starting the API serves the app at `/`.
- [ ] `size-limit` runs in CI and fails when the budget is exceeded (verified with a deliberately large import, then removed).
- [ ] A lazy route's code is in its own chunk in the build output.

## Out of scope

- Navigation and screens ({{app-shell}}).
- UI.md design tokens, font and icons ({{ui-tokens}}), motion ({{ui-motion}}) and shared components ({{ui-components}}).

@@@ issue
key: app-shell
title: Build the app shell and navigation
milestone: m1
labels: type: feature | area: web | size: M
deps: web-skeleton, ui-components
flags: ui
implements: FR-3.2, FR-3.3, FR-3.8, FR-4.6, FR-12.1, FR-12.2
decisions: D-43

## Context

Spec Rule 12, DESIGN 8.3 and 8.6, and UI.md 3.1, 3.8 and 6.3: five sections, a bottom tab bar on phones and a sidebar on laptops, an Add button on every screen, and an offline banner (Spec Rule 3).

## Scope

- The three layouts from UI.md 4.8 (phone, medium, wide), following the wireframes in UI.md 3.1 and 3.8, and the navigation icons from UI.md 4.9.
- Routes from DESIGN 8.3 with placeholder pages; Plan has Bills, Goals and Lending tabs.
- Add button (`fab` variant, UI.md 5.3): floating on phones, in the top bar on laptops; opens an empty `ResponsiveDrawer` placeholder. It always adds a transaction, on every screen (UI.md 3.5).
- Page transitions from UI.md 6.3: cross-fade between tabs, slide-in for detail screens.
- `OfflineBanner` driven by the browser's online/offline events.
- Error boundary page (`ErrorState` with **Retry**) and a 404 page, with their illustrations and copy (UI.md 4.6, 9.3).
- Every route sets the browser tab title in the format from UI.md 4.11 (`Reports · Money Manager`; Home is `Money Manager`).

## Acceptance criteria

- [ ] Every route is reachable from the navigation on phone and laptop sizes, with the active section highlighted.
- [ ] The Add button is visible on every screen.
- [ ] Going offline shows the banner; coming back online hides it.
- [ ] Refreshing on a deep link (e.g. `/plan/bills`) works in the production build.
- [ ] Navigation is usable with the keyboard and has accessible labels.

## Out of scope

- Real screen content (later milestones) and the real Add form ({{add-tx}}).

@@@ issue
key: pwa
title: Make the app installable as a PWA
milestone: m1
labels: type: feature | area: web | size: S
deps: app-shell
flags: ui
implements: FR-3.1, FR-3.6, FR-3.7
decisions: D-04, D-05

## Context

Spec Rule 3 and DESIGN 8.7: installable on phones, no offline data, never cache API responses.

## Scope

- The app icon from UI.md 4.7: one SVG, exported as the favicon and the 192px, 512px and maskable icons.
- `vite-plugin-pwa`: manifest with name "Money Manager", short name "MoneyMgr", theme and background colour `#FAF9FC`, and 192px, 512px and maskable icons (UI.md 4.11, DESIGN 8.7). The service worker is registered from an external script file, never inline (DESIGN 7.6).
- `<meta name="theme-color">` set by `theme-init.js` before first paint and updated by the theme switch, so the browser bar matches the background in the chosen theme (DESIGN 8.7).
- Service worker precaches the app's own files only; `/api` requests are network-only.
- "Update available, reload" prompt when a new version is deployed.

## Acceptance criteria

- [ ] Chrome DevTools reports the app as installable with no manifest warnings.
- [ ] After using the app, Cache Storage contains no `/api` responses.
- [ ] A new build shows the update prompt, and reloading loads the new version.
- [ ] Installing on an Android phone works (verified after {{deploy}}).

## Out of scope

- Offline data or background sync (Spec Rule 17).

@@@ issue
key: deploy
title: Deploy the walking skeleton to production
milestone: m1
labels: type: infra | area: deploy | size: M
deps: db, pwa, protection
implements: FR-2.2, FR-10.1, FR-10.2
decisions: D-28, D-46, D-27

## Context

DESIGN 11: Railway (Hobby, Singapore) and two MongoDB Atlas projects, auto-deploying from `main` only after CI passes. Deploying a near-empty app now means deployment problems surface while there's almost nothing to debug.

## Scope

- Atlas: two projects (development and production), each with a free cluster in or near Singapore, a database user with a long random password, and network access open to all IPs (DESIGN 11.2).
- Railway: a project on the Hobby plan, one service in Singapore, connected to the GitHub repo's `main` branch with "wait for CI" enabled.
- Build command `pnpm build`; start command runs the API.
- Health check path `/api/health`.
- Railway email notifications for failed deploys and crashes (DESIGN 11.7).
- Production environment variables set in Railway; `.env.example` complete.
- README: deployment, environment variables and rollback steps.

## Acceptance criteria

- [ ] **Before deploying:** the final app name is confirmed (Spec Rule 1). If it changes, SPEC Rule 1, UI.md 4.11, the manifest and every other use are updated in the same pull request.
- [ ] Merging to `main` deploys automatically, but only after the `ci` check passes.
- [ ] The Railway URL serves the app shell over HTTPS.
- [ ] `/api/health` returns 200 in production.
- [ ] Rollback steps are documented and tried once (redeploy the previous deployment).
- [ ] Actual monthly cost is checked against the ₹500 budget and noted in DESIGN 11.6.

## Out of scope

- A custom domain (Spec Rule 17 / DESIGN 11.6).

@@@ issue
key: auth-server
title: Add Better Auth with Google sign-in on the server
milestone: m1
labels: type: feature | area: auth | area: api | size: L
deps: container, deploy
implements: FR-2.3, FR-2.4, FR-10.7, FR-10.8, FR-10.10
decisions: D-03, D-30, D-41, D-47, D-48

## Context

Spec Rules 2 and 10, DESIGN 1.3 and 7: Google-only sign-in through Better Auth, sessions in MongoDB with sliding 30-day expiry, and every `/api/v1` route protected.

## Scope

- Google Cloud: OAuth client with `email` and `profile` scopes; local and production callback URLs; consent screen in **Testing** status with my account as a test user, showing the app name, my email as the support contact and the app icon as the logo (DESIGN 7.5).
- Better Auth mounted at `/api/auth/*` with the MongoDB adapter and the Google provider.
- Sessions: 30-day expiry, extended at most once a day, no cookie caching. Cookies `httpOnly`, `Secure` in production, `SameSite=Lax`. Trusted origin = `APP_URL`.
- `requireAuth` middleware on `/api/v1`: puts the user id on the request, or returns `401 UNAUTHENTICATED`.
- Origin check on `POST`, `PATCH` and `DELETE`: a missing or foreign `Origin` is rejected with `403 FORBIDDEN` (`ForbiddenError`, DESIGN 6.2, 9.2).
- Auth adapter (`auth/`): app code calls Better Auth only through it, and it translates Better Auth failures into `UnauthenticatedError` or a logged `500` (DESIGN 9.6).
- Rate limits with the defaults from DESIGN 7.4: Better Auth's limiter on `/api/auth/*` (30 per 5 minutes per IP); `express-rate-limit` on `/api/v1` (300 per 5 minutes per user, or per IP when signed out), returning `429 RATE_LIMITED` in the envelope. A small helper lets a route add a tighter per-user limit on top (used by {{backup}} and {{delete-account}}, DESIGN 7.4).
- Web auth client: any failure from `/api/auth/*` shows a catalogue message, never Better Auth's text (DESIGN 9.6).
- Config: `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
- Test helper: create a user with a valid session cookie, for API tests (used by every isolation test from now on).

## Acceptance criteria

- [ ] Signing in with Google locally and in production creates a user and a session in MongoDB.
- [ ] A Google account that isn't a test user can't sign in.
- [ ] Any `/api/v1` request without a valid session returns `401` in the envelope.
- [ ] A `POST` with a foreign `Origin` returns `403`.
- [ ] Exceeding the rate limit returns `429` in the envelope.
- [ ] A test shows a session used after more than a day is extended, and one unused for 30 days is rejected.
- [ ] No secret is committed; `.env.example` lists the new variables.

## Out of scope

- Sign-in screen and route guards ({{auth-web}}).
- Profile creation ({{onboarding}}).

@@@ issue
key: auth-web
title: Add the sign-in screen, route guards and logout
milestone: m1
labels: type: feature | area: auth | area: web | size: M
deps: auth-server, app-shell
flags: ui
implements: FR-2.3
decisions: D-03, D-41

## Context

DESIGN 7.1 and 8.3: a sign-in screen, guards that keep signed-out users out, and logout.

## Scope

- `/sign-in` with a "Continue with Google" button using Better Auth's React client.
- Route guard: signed-out users go to `/sign-in`, then return to the page they originally requested.
- Logout (current session only) in Settings, returning to `/sign-in`.
- Session state available to the app (e.g. the user's name for the shell).

## Acceptance criteria

- [ ] Visiting `/` signed out redirects to `/sign-in`.
- [ ] After signing in, the user lands on the originally requested route.
- [ ] After logout, API calls return `401` and the app shows `/sign-in`.
- [ ] Sign-in works in production in a phone browser and in the installed PWA.

## Out of scope

- Log out of all devices ({{logout-all}}).

@@@ issue
key: onboarding
title: Create the profile on first sign-in and build the welcome screen
milestone: m1
labels: type: feature | area: api | area: web | area: db | size: M
deps: auth-web, shared-helpers, ui-inputs, versioning, api-contract
flags: versioned, api, collection
implements: FR-5.4, FR-8.9, FR-9.8, FR-9.14, FR-13.1, FR-13.2, FR-13.3, FR-13.4
decisions: D-02, D-19

## Context

Spec Rule 13 and DESIGN 5.3 and 7.2: on first sign-in, create the profile and default categories, then ask for the opening balance. `ensureProfile` must be safe to call any number of times.

## Scope

API (`users` and `categories` modules):
- `profiles` collection and `categories` collection, with their unique indexes (DESIGN 5.4).
- `ensureProfile(userId)`: creates the profile (timezone `Asia/Kolkata`, opening balance 0, currency `INR`, `onboardedAt` null) and the default categories from Spec Rule 5, each with its emoji, plus the built-in 🤝 Lending category (type `both`). Does nothing if the profile exists.
- Called from a Better Auth after-user-created hook, and from `requireAuth` when a signed-in user has no profile.
- `GET /me` and `PATCH /me` (timezone, opening balance, opening balance date). `PATCH /me` sets `onboardedAt` the first time.

Web:
- `MoneyInput` component (DESIGN 8.5), reused by every money field later.
- `/welcome` (UI.md 2.3): "Hi Save" greeting, detected timezone with a **Change** option, opening balance (default ₹0; may be negative, Spec Rule 9), date (default today), **Continue** and **Skip** (Skip sends the timezone only).
- Guard: `onboardedAt` null → `/welcome`.

## Acceptance criteria

- [ ] First sign-in creates exactly one profile and 11 categories (8 expense, 2 income, Lending), each with the emoji from Spec Rule 5.
- [ ] Calling `ensureProfile` twice creates nothing new; deleting a profile by hand and calling the API recreates it.
- [ ] `/welcome` appears only until it's completed or skipped.
- [ ] Invalid timezone, non-integer amount, an amount beyond ±₹1,00,00,000 or a future opening date returns `400`; a negative opening balance is accepted.
- [ ] API tests: `/me` only ever reads and changes the signed-in user's own profile.

## Out of scope

- Editing these settings later in Settings ({{settings}}).

@@@ issue
key: m1-signoff
title: Milestone 1 sign-off
milestone: m1
labels: type: chore | size: S
deps: onboarding
implements: FR-3.4
decisions: D-01

## Context

Spec Rule 15, milestone 1: "Done when: I can sign in on my phone and my laptop and see an empty Home screen."

## Scope

- Home shows a greeting and an empty state ("No transactions yet").
- Verify the full flow in production on a phone (installed PWA) and a laptop.
- Write down anything learned and update SPEC/DESIGN.
- Tag `v0.1.0` and publish a GitHub release with notes.

## Acceptance criteria

- [ ] Signed in on phone and laptop in production; both show the empty Home screen.
- [ ] Every other milestone 1 issue is closed.
- [ ] `v0.1.0` release published.

@@@ issue
key: tx-api
title: Add the transactions API: create, read and edit
milestone: m2
labels: type: feature | area: api | area: db | size: L
deps: onboarding
flags: versioned, api, collection
implements: FR-4.1, FR-4.2, FR-4.3, FR-4.4, FR-4.5, FR-4.10, FR-4.11, FR-4.12, FR-4.14, FR-5.1, FR-9.1, FR-9.3, FR-9.6, FR-9.7
decisions: D-06, D-07, D-08, D-16, D-22, D-37, D-38

## Context

Spec Rules 4 and 9, DESIGN 5.3, 5.4, 6.3, 6.4 and 6.5: manual income and expense transactions, with duplicate protection and cursor pagination.

## Scope

- `transactions` collection with its indexes (DESIGN 5.4), including the partial unique `idempotencyKey` index.
- Shared Zod schemas for create and update in `packages/shared`.
- `POST /transactions`: validates Spec Rule 4 (amount, date not in the future in the user's timezone, payee ≤ 100, note ≤ 500); the category must exist, belong to the user and match the type. The built-in Lending category can't be used for manual transactions (`422`, SPEC Rule 4).
- Same `idempotencyKey` twice → returns the existing transaction, creates nothing.
- `GET /transactions` with cursor pagination (DESIGN 6.3), excluding trashed transactions.
- `GET /transactions/:id`, `PATCH /transactions/:id` (manual transactions only; others → `422`). `PATCH` may switch the type between expense and income, but only together with a category of the new type (`422` otherwise, Spec Rule 4).

## Acceptance criteria

- [ ] Each Spec Rule 4 validation has a passing API test.
- [ ] A retried create with the same `idempotencyKey` returns the same transaction and the count doesn't change.
- [ ] Pagination: 120 transactions come back in exactly 3 pages with no duplicates or gaps, even when a new transaction is added between pages.
- [ ] Isolation: for every endpoint, user B can't read or change user A's transactions (`404`).
- [ ] Amounts are stored as integers; a float amount returns `400`.

## Out of scope

- Delete and Trash ({{trash}}), filters and search ({{tx-filters}}).

@@@ issue
key: trash
title: Add the Trash: delete, restore and permanent delete
milestone: m2
labels: type: feature | area: api | area: db | size: M
deps: tx-api
flags: versioned, api
implements: FR-9.25, FR-9.26, FR-9.27
decisions: D-15

## Context

Spec Rule 9 (Deleting) and DESIGN 2 and 5.4: deleting moves to a Trash, which empties itself after 30 days through a TTL index.

## Scope

- `DELETE /transactions/:id`: sets `deletedAt` (manual transactions only).
- `GET /transactions/trash` with cursor pagination, newest deletion first, using the `{ userId, deletedAt }` index (DESIGN 5.4, 6.3).
- `POST /transactions/:id/restore` and `DELETE /transactions/:id/permanent` (only for trashed transactions).
- TTL index on `deletedAt`, 30 days.
- Trashed transactions are excluded from every list and total.

## Acceptance criteria

- [ ] A trashed transaction disappears from `GET /transactions` and appears in the Trash.
- [ ] Restoring brings it back unchanged.
- [ ] Permanent delete on a transaction that isn't in the Trash returns `422`.
- [ ] The TTL index exists with a 30-day expiry (checked in a test against the index list).
- [ ] Bill and lending transactions can't be trashed (`422`).
- [ ] Isolation tests for every endpoint.

@@@ issue
key: categories-api
title: Add the categories API
milestone: m2
labels: type: feature | area: api | size: M
deps: tx-api
flags: versioned, idempotent, api
implements: FR-5.2, FR-5.3, FR-5.5, FR-5.6, FR-5.7, FR-5.8, FR-8.9
decisions: D-10, D-50

## Context

Spec Rule 5 (Categories) and DESIGN 6.5: create, rename and delete categories, with reassignment when deleting a category in use.

## Scope

- `GET /categories`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`.
- Names: 1–40 characters, unique per user ignoring case (`409`).
- Emoji: required on create, changeable with `PATCH`; must be exactly one emoji (Spec Rule 5, DESIGN 5.3).
- `PATCH` can change name, emoji and type (DESIGN 6.5).
- Type: expense or income; it can change only while the category has no transactions (`422`).
- Lending can't be renamed or deleted (`422`).
- Delete: if any transaction (including trashed ones) uses the category, `moveToCategoryId` of the same type is required; moving and deleting happen in one DB transaction.

## Acceptance criteria

- [ ] Creating "food" when "Food" exists returns `409`.
- [ ] An empty emoji, plain text or two emoji in the emoji field returns `400`.
- [ ] "Café" typed with a precomposed "é" and with "e" plus a combining accent counts as the same name (`409` on the second, FR-9.5).
- [ ] Deleting a used category without `moveToCategoryId` returns `422`; with it, all its transactions move and the category is gone.
- [ ] A failure during reassignment leaves everything unchanged (transaction rollback test).
- [ ] Isolation tests for every endpoint, including moving into another user's category.

## Out of scope

- Reassigning bills ({{bills-api}} extends this).

@@@ issue
key: balance
title: Add the overall balance
milestone: m2
labels: type: feature | area: api | size: M
deps: trash
flags: api, property
implements: FR-9.13, FR-9.15, FR-9.16, FR-9.17, FR-9.18
decisions: D-08

## Context

Spec Rule 9 (Overall balance): opening balance plus income minus expenses, counting only transactions on or after the opening balance date.

## Scope

- `calculateBalance(openingBalance, openingDate, transactions)` as a domain function, with unit tests.
- The repository computes the totals with a MongoDB aggregation (not by loading every transaction).
- `GET /home`, returning `{ balance }` for now.
- A balance card on Home.

## Acceptance criteria

- [ ] Unit tests: transactions before the opening date are ignored; trashed ones are ignored; the balance can go negative.
- [ ] An API test with known data returns the exact expected balance.
- [ ] Domain coverage ≥ 90%.

@@@ issue
key: add-tx
title: Build the Add transaction sheet
milestone: m2
labels: type: feature | area: web | size: L
deps: tx-api, app-shell, onboarding, ui-inputs
flags: ui
implements: FR-4.6, FR-4.7, FR-4.8, FR-4.9, FR-4.14, FR-12.2
decisions: D-09

## Context

Spec Rule 4 (Speed, Validation, Failed saves), DESIGN 8.4 and 8.5, and UI.md 2.1, 2.3 and 3.2. This is the most-used screen in the app, and the 5-second rule depends on it.

## Scope

- The Add button opens a `ResponsiveDrawer`: Drawer below `md`, centred Dialog from `md` up (UI.md 4.8, 5.3). Layout from the wireframe in UI.md 3.2.
- `SegmentedControl` **Expense | Income**, default Expense.
- `MoneyInput` at `amount-xl`, focused on open, with the decimal keypad on phones.
- `CategoryPicker`: a grid of `CategoryTile`s, 4 per row; only categories of the selected type, ordered by most recent use among the latest 100 transactions, then alphabetically. Lending is never shown. Selecting a tile plays the selection pop (UI.md 6.3).
- **More** expands payee, note and a `DateField` (Today / Yesterday / calendar; default today in the user's timezone).
- **Save** is disabled until the amount is valid and a category is selected; Enter on the keypad also saves once a category is selected.
- A `idempotencyKey` is generated when the form opens and reused on **Retry**.
- Inline field errors; on failure, a toast and **Retry** with the form kept intact.
- On success: the sheet closes, the toast "Expense saved · Undo" (or "Income saved · Undo") appears (Undo moves it to the Trash, UI.md 7.1), and related queries refresh. Saving never waits for an animation (UI.md 6.5).
- First-run Home empty state with **Add your first expense**, opening this sheet (UI.md 2.3).

## Acceptance criteria

- [ ] Amount, one category tap and Save takes at most 3 taps after typing the amount.
- [ ] Timed on a real phone: under 5 seconds from tapping Add to the "Expense saved" toast.
- [ ] Turning the network off before Save shows the error with **Retry**; turning it back on and retrying saves exactly one transaction.
- [ ] Server validation errors appear under the matching fields.
- [ ] The form is fully usable with the keyboard on a laptop.

@@@ issue
key: tx-screens
title: Build the transactions list, edit and Trash screens
milestone: m2
labels: type: feature | area: web | size: M
deps: trash, add-tx, e2e-setup
flags: ui
implements: FR-4.4, FR-5.1, FR-12.4
decisions: D-15, D-22

## Context

Spec Rules 5 and 12, DESIGN 8.3, and UI.md 2.2, 3.3 and 3.8: the transaction list grouped by date with daily totals, editing, and the Trash.

## Scope

- `/transactions` (UI.md 3.3): `TransactionRow`s grouped by date with a daily **spent** total as defined in Spec Rule 9, Counting money (no minus sign), infinite scroll using the cursor. In the wide layout (`lg` and up), a table with date, category, payee, note and amount columns (UI.md 3.8, 4.8).
- Tapping a manual transaction opens the same form prefilled, with Delete. Switching the type in the edit form clears the category so one of the new type must be picked (Spec Rule 4).
- **Touch:** swipe a row left to reveal Delete; releasing past 40% of the row deletes (UI.md 6.3). **Mouse:** a ⋯ menu on hover with Edit and Delete (UI.md 2.2).
- Delete moves to the Trash and shows "Moved to Trash · Undo" (Undo restores); the row collapses out (UI.md 6.3).
- Bill and lending transactions show a `Badge`, can't be swiped, and open a read-only sheet linking to their source.
- `/transactions/trash` (reached from the header ⋯ menu): restore, and delete permanently with `ConfirmDialog`.
- Empty states for both screens, with the copy from UI.md 9.3.

## Acceptance criteria

- [ ] Scrolling loads further pages with no duplicates.
- [ ] Playwright end-to-end tests on both viewports: add an expense, edit it, delete it, and undo the delete (Spec Rule 16).
- [ ] Edit, delete, Undo, restore and permanent delete all work and update the list without a manual refresh.
- [ ] Amounts and dates use Spec Rule 14 formatting.

@@@ issue
key: payees
title: Add payee autocomplete
milestone: m2
labels: type: feature | area: api | area: web | size: S
deps: tx-api, add-tx
flags: ui, api
implements: FR-4.13
decisions: none

## Context

Spec Rule 4 (Payee autocomplete).

## Scope

- `GET /transactions/payees?q=`: up to 10 distinct payees starting with `q` (ignoring case), most recently used first. Input is escaped before being used in a query.
- Suggestions under the payee field in the Add and edit forms.

## Acceptance criteria

- [ ] Typing "sw" suggests "Swiggy" if it has been used before.
- [ ] Special characters in `q` (e.g. `.*`) don't break the query or match everything.
- [ ] Isolation: suggestions never include another user's payees.

@@@ issue
key: settings
title: Build Settings: categories, opening balance, timezone and theme
milestone: m2
labels: type: feature | area: web | size: M
deps: categories-api, balance
flags: ui
implements: FR-5.5, FR-9.8, FR-9.14, FR-12.7
decisions: D-10

## Context

Spec Rule 12 (Settings) and Spec Rule 5 (Categories).

## Scope

- `/settings` (layout from UI.md 3.7): opening balance and date (via `PATCH /me`), timezone picker (a searchable Command list of IANA names; changing it never changes saved dates, Spec Rule 9), theme control (RadioGroup), logout, and the app version at the bottom (UI.md 4.11, DESIGN 10.7).
- `/settings/categories`: lists by type with each emoji; add, rename and change emoji (with `EmojiPicker`, UI.md 5.4); delete with a "move transactions to" picker in a `ConfirmDialog` when needed. Lending is shown as built-in and locked.

## Acceptance criteria

- [ ] Changing the opening balance updates the Home balance immediately.
- [ ] Deleting a used category requires choosing a target category of the same type.
- [ ] Duplicate names show the server's `409` message inline.

@@@ issue
key: m2-signoff
title: Milestone 2 sign-off
milestone: m2
labels: type: chore | size: S
deps: tx-screens, payees, settings
implements: FR-2.2, FR-4.9
decisions: D-01

## Context

Spec Rule 15, milestone 2: "Done when: I can add an expense on my phone in under 5 seconds, and it appears on my laptop."

## Scope

- Verify in production on both devices; the laptop shows the new expense on refocus or refresh.
- Update SPEC/DESIGN with anything learned.
- Tag `v0.2.0` and publish a release.

## Acceptance criteria

- [ ] Under 5 seconds on the phone, visible on the laptop.
- [ ] Every other milestone 2 issue is closed.
- [ ] `v0.2.0` release published.

@@@ issue
key: tx-filters
title: Add filters and search to the transactions list
milestone: m3
labels: type: feature | area: api | area: web | size: M
deps: tx-screens
flags: ui, api
implements: FR-5.10
decisions: none

## Context

Spec Rule 5 (Transaction list): filter by date range and category, search by note or payee.

## Scope

- `GET /transactions` accepts `from`, `to`, `categoryId` and `q` (case-insensitive substring of note or payee, escaped), combined with cursor pagination.
- Filters and search in the UI, stored in the URL's search params (DESIGN 8.3), with a "Clear" action.

## Acceptance criteria

- [ ] Every combination of filters returns exactly the matching transactions (API tests with fixture data).
- [ ] Refreshing or sharing the URL keeps the filters.
- [ ] Special characters in the search don't break the query.

@@@ issue
key: reports-domain
title: Add the reports domain functions
milestone: m3
labels: type: feature | area: api | size: M
deps: shared-helpers
flags: property
implements: FR-5.9, FR-5.16, FR-9.19, FR-9.20, FR-9.21, FR-9.23, FR-9.24
decisions: D-11

## Context

Spec Rule 5 (Views) and Spec Rule 16: month comparison uses the same date range, and the rules for short months are easy to get wrong.

## Scope

`reports.domain.ts`:
- `comparisonRange(month, today)`: for the current month, the 1st to today against the same days of the previous month; past months in full; the earlier range stops at its month's last day if shorter.
- `trendMonths(endMonth, count)`: the list of months for the bar chart.
- Pure helpers to shape aggregation results into summary, comparison and trend responses.

## Acceptance criteria

- [ ] Unit tests: 10 Nov → 1–10 Nov vs 1–10 Oct; 31 Mar → 1–31 Mar vs 1–28/29 Feb; a past month → full vs full; January compares with the previous December.
- [ ] Domain coverage ≥ 90%.

@@@ issue
key: reports-api
title: Add the reports API
milestone: m3
labels: type: feature | area: api | size: M
deps: reports-domain, trash
flags: api
implements: FR-5.11, FR-5.12, FR-5.13, FR-5.14, FR-5.15, FR-5.16, FR-8.15, FR-9.19, FR-9.20, FR-9.22
decisions: D-14, D-23

## Context

DESIGN 6.5 (Reports) and Spec Rules 5 and 8.

## Scope

- `GET /reports/summary?month=`: spent per category with shares, plus spent, income and left over; also `firstMonth` and `lastMonth` for the month picker; a month outside that range returns `400` (Spec Rule 5, DESIGN 6.5).
- `GET /reports/trend?months=6` (maximum 12).
- `GET /reports/comparison?month=`.
- `includeLending` on all three, default `true`.
- Every figure follows Spec Rule 9, Counting money (spent, income, left over, top categories, percentages).
- MongoDB aggregations filtered by user, `deletedAt: null` and date range, in the user's timezone.

## Acceptance criteria

- [ ] With a known fixture month, every report returns the exact expected numbers.
- [ ] `includeLending=false` excludes Lending transactions from every total.
- [ ] Isolation tests for every endpoint.

@@@ issue
key: reports-screen
title: Build the Reports screen
milestone: m3
labels: type: feature | area: web | size: L
deps: reports-api
flags: ui
implements: FR-5.11, FR-5.12, FR-5.13, FR-5.14, FR-5.15, FR-5.16, FR-8.15, FR-12.5
decisions: D-14, D-23, D-24

## Context

Spec Rules 5, 8 and 12: the main "where does my money go" screen (Spec Rule 1).

## Scope

- Layout from the wireframe in UI.md 3.4.
- Month picker, stored in the URL (`?month=`), limited to `firstMonth`–`lastMonth`; the arrow at either end is disabled (Spec Rule 5).
- Chart formatting from UI.md 4.10: compact axis labels, full amounts in tooltips and lists, dark-theme palette.
- Monthly summary: each category with emoji, amount and share of the total.
- Spent, income and **left over**, with left over's `+`/`−` sign from Spec Rule 14.
- Pie chart for the month and bar chart for the last 6 months (Recharts through shadcn/ui's Chart, UI.md 5.5), using the chart palette from UI.md 4.1; categories beyond the 8 largest are grouped as "Everything else" in the pie (not "Other", which is a real category).
- Comparison with increase/decrease indicators in **neutral grey**, never red or green (UI.md 1.4, 3.4).
- Lending toggle (Switch) applying to every section, stored in the URL.
- Empty states.

## Acceptance criteria

- [ ] Numbers on screen match the API for a fixture month.
- [ ] Charts are readable on a phone screen and have text alternatives.
- [ ] The toggle and month survive a refresh.

@@@ issue
key: home-month
title: Add month totals and top categories to Home
milestone: m3
labels: type: feature | area: api | area: web | size: M
deps: reports-api, balance
flags: ui, api
implements: FR-9.19, FR-9.22, FR-12.3
decisions: D-14

## Context

Spec Rule 12 (Home).

## Scope

- `GET /home` adds this month's spent and income, the top 3 categories and the 5 most recent transactions, using the user's timezone. All figures follow Spec Rule 9, Counting money, and **include Lending** (Home has no toggle).
- Home layout from UI.md 3.1: balance on a small line, **spent this month** as the `display`-size hero number, income below it; top categories; recent transactions with **See all**.
- Tapping the top card opens Reports for this month (UI.md 2.7).
- After I add or change a transaction, the hero number counts to its new value (UI.md 6.3), but not on page load.

## Acceptance criteria

- [ ] Totals match the Reports summary for the current month.
- [ ] A transaction added at 23:50 IST counts in the correct month.
- [ ] Recent shows exactly the 5 newest non-trashed transactions.

@@@ issue
key: m3-signoff
title: Milestone 3 sign-off and two weeks of daily use
milestone: m3
labels: type: chore | size: S
deps: tx-filters, reports-screen, home-month
implements: FR-1.1
decisions: D-01

## Context

Spec Rule 15, milestone 3: "Done when: totals for a month of sample data match my own manual calculation." Then two weeks of daily use before milestone 4.

## Scope

- Extend `pnpm seed:dev` (from {{seed-dev}}) with one fixed month of sample data.
- A short sheet of expected totals for that month, calculated by hand (DESIGN 11.8).
- Compare every report against the sheet.
- Tag `v0.3.0` and publish a release.
- Use the app daily for two weeks; turn findings into new issues or SPEC changes.

## Acceptance criteria

- [ ] Every report matches the hand-calculated totals.
- [ ] `v0.3.0` release published.
- [ ] Findings from two weeks of use are recorded as issues or spec updates.

@@@ issue
key: bills-domain
title: Add the bills domain functions
milestone: m4
labels: type: feature | area: api | size: M
deps: shared-helpers
flags: property
implements: FR-7.3, FR-7.4, FR-7.5, FR-7.6, FR-7.8, FR-7.9, FR-7.10, FR-7.16
decisions: D-13, D-21

## Context

Spec Rule 7 (Due dates, Reminders) and Spec Rule 16. Due dates on the 29th–31st are the trickiest logic in the app.

## Scope

`bills.domain.ts`:
- `nextDueDate(dueDate, dueDay, frequency)`: adds 1 or 3 months on `dueDay`, falling back to the month's last day when shorter.
- `billStatus(bill, today)`: `paused`, `overdue`, `upcoming` (within 3 days) or `later`.

## Acceptance criteria

- [ ] Unit tests: 31 Jan → 28 Feb (2027) / 29 Feb (2028) → 31 Mar; 30 Nov quarterly → 28 Feb → 30 May; 15th stays the 15th.
- [ ] Status tests at exactly 3 days before, on the due date and one day after.
- [ ] Domain coverage ≥ 90%.

@@@ issue
key: bills-api
title: Add the bills API: create, read, edit and delete
milestone: m4
labels: type: feature | area: api | area: db | size: M
deps: bills-domain, categories-api
flags: versioned, seed, idempotent, api, collection
implements: FR-5.8, FR-7.1, FR-7.2, FR-7.6, FR-7.17, FR-9.4, FR-9.28
decisions: D-13, D-21

## Context

Spec Rule 7, DESIGN 5.3, 5.4 and 6.5.

## Scope

- `bills` and `billCycles` collections with their indexes, including the unique `{ billId, dueDate }`.
- `GET /bills` (with status from the user's "today"), `POST /bills`, `GET /bills/:id` (with cycle history, newest first), `PATCH /bills/:id`, `DELETE /bills/:id`.
- `dueDay` is taken from the first due date; whenever `PATCH` changes `nextDueDate`, `dueDay` becomes the new date's day (Spec Rule 7). Category defaults to Bills if it exists, and must be an expense category.
- Delete, in one DB transaction: past payment transactions become manual, cycles and bill are deleted.
- Extend category deletion ({{categories-api}}) to also move bills to the target category.

## Acceptance criteria

- [ ] Creating a bill without a category uses Bills; if Bills was deleted, it returns `400`.
- [ ] After deleting a bill, its past transactions remain and can be edited directly.
- [ ] Deleting a category used by a bill requires a target and moves the bill.
- [ ] Isolation tests for every endpoint.

@@@ issue
key: bill-actions
title: Add bill actions: pay, skip, undo, pause and resume
milestone: m4
labels: type: feature | area: api | size: L
deps: bills-api
flags: versioned, api
implements: FR-7.11, FR-7.12, FR-7.13, FR-7.14, FR-7.15, FR-7.16, FR-7.18, FR-7.19, FR-11.1
decisions: D-13

## Context

Spec Rule 7 (Marking as paid, Other actions, History and undo) and DESIGN 4.6.

## Scope

- `POST /bills/:id/pay { amount }`: in one DB transaction, create the expense (bill category, today, note = bill name, source = bill cycle), record the cycle as paid for the current due date, and move `nextDueDate` forward.
- `POST /bills/:id/skip`: record the cycle as skipped and move forward.
- `POST /bills/:id/undo`: only the most recent cycle; a paid cycle's transaction is permanently removed; `nextDueDate` returns to that cycle's due date.
- `POST /bills/:id/pause` and `POST /bills/:id/resume { nextDueDate }`; resuming sets `dueDay` from the new date. Pay and skip on a paused bill return `422`.

## Acceptance criteria

- [ ] Paying the same cycle twice (e.g. two devices) creates one transaction; the second request gets `409`.
- [ ] A failure in the middle of paying leaves no transaction, no cycle and an unchanged due date (rollback test).
- [ ] Undo after pay and after skip restores the exact previous state.
- [ ] Paying late doesn't shift the schedule (Spec Rule 7).
- [ ] Isolation tests for every action.

@@@ issue
key: bills-screens
title: Build the bills screens
milestone: m4
labels: type: feature | area: web | size: L
deps: bill-actions, tx-screens, celebrations, e2e-setup
flags: ui
implements: FR-7.12, FR-7.15, FR-7.16, FR-7.17, FR-7.18, FR-7.19, FR-12.6
decisions: D-13, D-24

## Context

Spec Rules 7 and 12 (Plan).

## Scope

- Plan → Bills: list sorted by next due date, with upcoming, overdue and paused badges.
- Add and edit form: name, amount, category (expense only, default Bills), frequency, due date, note.
- Detail: cycle history; **Pay** (dialog with the amount prefilled and editable), **Skip**, **Undo latest** (confirm), **Pause** / **Resume** (date picker), **Delete** (confirm, explains that past transactions are kept).
- Bill transactions in the transaction list link to their bill.
- Layouts from UI.md 3.5 and 3.6; feedback and confirmations from UI.md 7.1.
- Paying on or before the due date plays the small celebration (check mark in the toast, UI.md 6.4).

## Acceptance criteria

- [ ] Every action works and updates the list, detail, Home and transactions without a manual refresh.
- [ ] Pay and Skip show a toast with **Undo**; Delete and undo-from-history use `ConfirmDialog` (UI.md 7.1).
- [ ] The check-mark celebration plays only for on-time payments.
- [ ] Playwright end-to-end test on both viewports: pay a bill and see the expense appear (Spec Rule 16).

@@@ issue
key: home-bills
title: Show upcoming and overdue bills on Home
milestone: m4
labels: type: feature | area: api | area: web | size: S
deps: bill-actions, home-month
flags: ui, api
implements: FR-7.7, FR-7.8, FR-7.9, FR-12.3
decisions: D-13

## Context

Spec Rule 12 (Home).

## Scope

- `GET /home` adds upcoming and overdue bills.
- A Home card with a **Pay** shortcut for each.

## Acceptance criteria

- [ ] A bill due in 3 days appears; one due in 4 days doesn't.
- [ ] Paying from Home removes it from the card.

@@@ issue
key: m4-signoff
title: Milestone 4 sign-off
milestone: m4
labels: type: chore | size: S
deps: bills-screens, home-bills
implements: none
decisions: D-13

## Context

Spec Rule 15, milestone 4: "Done when: paying, skipping, pausing and undoing work, including a bill due on the 31st."

## Scope

- Verify every bill action in production, including a bill due on the 31st.
- Update SPEC/DESIGN; tag `v0.4.0` and publish a release.

## Acceptance criteria

- [ ] All actions verified in production.
- [ ] Every other milestone 4 issue is closed.
- [ ] `v0.4.0` release published.

@@@ issue
key: lending-domain
title: Add the lending domain functions
milestone: m5
labels: type: feature | area: api | size: S
deps: shared-helpers
flags: property
implements: FR-8.4, FR-8.5, FR-8.6, FR-8.7, FR-8.8, FR-8.11
decisions: D-14

## Context

Spec Rule 8 and Spec Rule 16.

## Scope

`lending.domain.ts`:
- `remainingAmount(record)`, `isSettled(record)`, `isOverdue(record, today)`.
- `checkRepayment(record, amount, excludingRepaymentId?)`: rejects amounts above the remaining amount.
- `checkAmountChange(record, newAmount)`: rejects amounts below the total repaid.
- `transactionTypeFor(direction, event)`: the table in Spec Rule 8.

## Acceptance criteria

- [ ] Unit tests for every rule, including editing a repayment (its own amount is excluded from the check) and reopening when the remaining amount goes back above zero.
- [ ] Domain coverage ≥ 90%.

@@@ issue
key: lending-api
title: Add the lending API: records
milestone: m5
labels: type: feature | area: api | area: db | size: L
deps: lending-domain, tx-api
flags: versioned, seed, idempotent, api, collection
implements: FR-8.1, FR-8.2, FR-8.8, FR-8.10, FR-8.11, FR-8.12, FR-8.14, FR-8.16, FR-9.4, FR-9.28
decisions: D-14

## Context

Spec Rule 8, DESIGN 5.3, 5.4 and 6.5.

## Scope

- `lendingRecords` collection with its indexes.
- `POST /lending`: creates the record and its Lending transaction (expense for lent, income for borrowed) in one DB transaction.
- `GET /lending` (filters `direction` and `status`, with overdue computed), `GET /lending/:id`.
- `PATCH /lending/:id`: updates the record and its transaction; the amount can't go below the total repaid; direction can change only while there are no repayments (SPEC Rule 8).
- `DELETE /lending/:id`: permanently deletes the record, its repayments and all their transactions in one DB transaction.
- `GET /lending/people?q=`.

## Acceptance criteria

- [ ] Every money movement produces the transaction type in Spec Rule 8's table.
- [ ] A due date before the record's date, or a record date in the future, returns `400` (Spec Rule 9).
- [ ] Deleting a record leaves no related transactions behind.
- [ ] A failure mid-create leaves neither the record nor the transaction (rollback test).
- [ ] Isolation tests for every endpoint.

@@@ issue
key: repayments-api
title: Add the lending API: repayments
milestone: m5
labels: type: feature | area: api | size: M
deps: lending-api
flags: versioned, idempotent, api
implements: FR-8.3, FR-8.4, FR-8.5, FR-8.6, FR-8.10, FR-8.13
decisions: D-14

## Context

Spec Rule 8 (Repayments, Editing and deleting).

## Scope

- `POST /lending/:id/repayments`, `PATCH /lending/:id/repayments/:repaymentId`, `DELETE /lending/:id/repayments/:repaymentId`.
- Each repayment has a linked transaction (income when someone repays me, expense when I repay), created, updated or removed with it in one DB transaction.
- `settledAt` is set and cleared automatically.

## Acceptance criteria

- [ ] A repayment above the remaining amount returns `422`.
- [ ] Repaying the full remaining amount settles the record; deleting that repayment reopens it.
- [ ] Every change keeps the record, its repayments and transactions consistent (tests check all three).
- [ ] Isolation tests for every endpoint.

@@@ issue
key: lending-screens
title: Build the lending screens
milestone: m5
labels: type: feature | area: web | size: L
deps: repayments-api, tx-screens, celebrations
flags: ui
implements: FR-8.2, FR-8.5, FR-8.16, FR-12.6
decisions: D-14

## Context

Spec Rules 8 and 12 (Plan).

## Scope

- Plan → Lending: list with direction and open/settled filters and overdue badges.
- Form: person (with autocomplete), direction, amount, date, due date, note.
- Detail: original, repaid and remaining amounts, progress, and repayments (add, edit, delete).
- Delete record with confirmation explaining its transactions are removed.
- Lending transactions in the transaction list link to their record.
- Layouts from UI.md 3.5 and 3.6; the repayment amount defaults to the remaining amount (UI.md 2.5).
- Settling a record plays the confetti celebration and shows "All settled with {person}" (UI.md 6.4, 9.3).

## Acceptance criteria

- [ ] Every action updates the list, detail, Home, reports and transactions without a manual refresh.
- [ ] Repayment limits show the server's message inline.

@@@ issue
key: home-lending
title: Show overdue lending on Home
milestone: m5
labels: type: feature | area: api | area: web | size: S
deps: repayments-api, home-month
flags: ui, api
implements: FR-8.7, FR-12.3
decisions: none

## Context

Spec Rule 12 (Home).

## Scope

- `GET /home` adds overdue lending records.
- A Home card linking to each record.

## Acceptance criteria

- [ ] A record past its due date and not settled appears; a settled one doesn't.

@@@ issue
key: m5-signoff
title: Milestone 5 sign-off
milestone: m5
labels: type: chore | size: S
deps: lending-screens, home-lending
implements: none
decisions: D-14

## Context

Spec Rule 15, milestone 5: "Done when: lending, partial repayments and settling produce the correct transactions and remaining amounts."

## Scope

- Verify in production, including the Reports Lending toggle now that Lending transactions exist.
- Update SPEC/DESIGN; tag `v0.5.0` and publish a release.

## Acceptance criteria

- [ ] Verified in production.
- [ ] Every other milestone 5 issue is closed.
- [ ] `v0.5.0` release published.

@@@ issue
key: goals-domain
title: Add the goals domain functions
milestone: m6
labels: type: feature | area: api | size: S
deps: shared-helpers
flags: property
implements: FR-6.6, FR-6.7, FR-6.8, FR-6.9, FR-6.10, FR-6.11
decisions: D-20

## Context

Spec Rule 6 (Statuses, Status rules) and Spec Rule 16.

## Scope

`goals.domain.ts`:
- `savedAmount(goal)`, `progress(goal)` (amount remaining and percentage, capped at 100%).
- `goalStatus(goal, today)`: active, overdue or completed.
- `applyChange(...)` helpers that return the new `completedAt` after a contribution is added, edited or deleted, or the target is lowered or raised (raising it above the saved amount reopens a completed goal, Spec Rule 6).

## Acceptance criteria

- [ ] Unit tests for every status rule in Spec Rule 6, including lowering the target and editing contributions below the target.
- [ ] Domain coverage ≥ 90%.

@@@ issue
key: goals-api
title: Add the goals API
milestone: m6
labels: type: feature | area: api | area: db | size: M
deps: goals-domain, onboarding
flags: versioned, seed, idempotent, api, collection
implements: FR-6.1, FR-6.2, FR-6.3, FR-6.4, FR-6.5, FR-6.8, FR-6.9, FR-6.10, FR-6.11, FR-6.12, FR-9.4, FR-9.28
decisions: D-12, D-20

## Context

Spec Rule 6, DESIGN 5.3 and 6.5.

## Scope

- `goals` collection with embedded contributions and its index.
- `GET /goals` (filter `status`), `POST /goals`, `GET /goals/:id`, `PATCH /goals/:id`, `DELETE /goals/:id`.
- `POST`, `PATCH` and `DELETE` for `/goals/:id/contributions/...`.
- `completedAt` set and cleared automatically; contributions to a completed goal return `422`; completed goals can still be edited, and raising the target above the saved amount reopens them (Spec Rule 6).

## Acceptance criteria

- [ ] Contributions never create transactions or change the balance.
- [ ] Every status rule is covered by an API test.
- [ ] Setting or changing a deadline to a past date returns `400`; a contribution dated in the future returns `400` (Spec Rule 9).
- [ ] Isolation tests for every endpoint.

@@@ issue
key: goals-screens
title: Build the goals screens
milestone: m6
labels: type: feature | area: web | size: M
deps: goals-api, app-shell, celebrations
flags: ui
implements: FR-6.1, FR-6.6, FR-6.7, FR-6.12, FR-12.6
decisions: D-12, D-20

## Context

Spec Rules 6 and 12 (Plan).

## Scope

- Plan → Goals: active goals (progress bar, remaining, time left, overdue badge) and a Completed list.
- Form (UI.md 3.11): emoji icon chosen with `EmojiPicker` (default 🎯, UI.md 5.4), name, target, optional deadline.
- Detail: contributions (add, edit, delete); delete goal with `ConfirmDialog`.
- Layouts from UI.md 3.5 and 3.6. The progress bar animates to its new value after each change (UI.md 6.3).
- Completing a goal plays the confetti celebration and shows "{goal} complete!" (UI.md 6.4, 9.3).

## Acceptance criteria

- [ ] Reaching the target moves the goal to Completed immediately.
- [ ] Lowering the target below the saved amount completes it; deleting a contribution can reopen it.

@@@ issue
key: m6-signoff
title: Milestone 6 sign-off
milestone: m6
labels: type: chore | size: S
deps: goals-screens
implements: none
decisions: D-12

## Context

Spec Rule 15, milestone 6: "Done when: contributions, editing and completion follow the status rules."

## Scope

- Verify in production; update SPEC/DESIGN; tag `v0.6.0` and publish a release.

## Acceptance criteria

- [ ] Verified in production.
- [ ] Every other milestone 6 issue is closed.
- [ ] `v0.6.0` release published.

@@@ issue
key: backup
title: Add the backup download
milestone: m7
labels: type: feature | area: api | area: web | size: M
deps: bill-actions, repayments-api, goals-api
flags: api
implements: FR-10.3, FR-10.4
decisions: D-18, D-50

## Context

Spec Rule 10 (Backups): the JSON download is the real backup, because the free Atlas tier may have none.

## Scope

- `GET /me/backup`: a JSON attachment named `money-manager-backup-YYYY-MM-DD.json` with `formatVersion: 1`, `exportedAt`, the profile, categories, transactions (including trashed, with `deletedAt`), goals, bills, bill cycles and lending records, shaped by the export schema (DESIGN 6.6). Limited to 10 downloads per hour per user (DESIGN 7.4).
- No auth data (sessions, tokens, Google account details).
- Sets `lastBackupAt`.
- **Download backup** in Settings.

## Acceptance criteria

- [ ] A test with data in every collection finds every document in the file and nothing from another user.
- [ ] The file contains no session or token data.
- [ ] Money and dates in the file use the stored formats (paise, `YYYY-MM-DD`).

@@@ issue
key: backup-reminder
title: Add the backup reminder on Home
milestone: m7
labels: type: feature | area: api | area: web | size: S
deps: backup, home-month
flags: ui, api
implements: FR-10.5, FR-12.3
decisions: D-18

## Context

Spec Rule 10: if I haven't downloaded a backup in 30 days, Home shows a reminder.

## Scope

- `GET /home` adds a `backupReminder` flag: true when 30 days have passed since the last backup (or since signup, if there has never been one).
- A Home card with a **Download backup** action.

## Acceptance criteria

- [ ] Unit tests at 29, 30 and 31 days, with and without a previous backup.
- [ ] Downloading hides the reminder.

@@@ issue
key: logout-all
title: Add log out of all devices
milestone: m7
labels: type: feature | area: auth | area: web | size: S
deps: auth-web
flags: ui
implements: FR-10.9
decisions: D-41

## Context

Spec Rule 10 and DESIGN 7.3.

## Scope

- **Log out of all devices** in Settings, with confirmation, using Better Auth's endpoint to revoke every session.

## Acceptance criteria

- [ ] An API test with two sessions: after revoking, both get `401` on their next request.
- [ ] The current device returns to `/sign-in`.

@@@ issue
key: delete-account
title: Add account deletion
milestone: m7
labels: type: feature | area: api | area: auth | area: web | size: M
deps: backup
flags: api
implements: FR-10.12
decisions: D-02, D-50

## Context

Spec Rule 10 (Account deletion) and DESIGN 5.5.

## Scope

- `DELETE /me { confirmation }`: the phrase must be exactly "delete my account". Limited to 3 attempts per hour per user (DESIGN 7.4).
- In one DB transaction, delete every document with the user's id from every app collection, then the Better Auth user, sessions and accounts.
- Settings "danger zone": a suggestion to download a backup first, then the typed confirmation.

## Acceptance criteria

- [ ] A wrong phrase returns `400` and deletes nothing.
- [ ] After deletion, no document with that user id exists in any collection, and the session is invalid.
- [ ] Another user's data is untouched (test).

@@@ issue
key: m7-signoff
title: Milestone 7 sign-off and v1.0.0
milestone: m7
labels: type: chore | size: S
deps: backup-reminder, logout-all, delete-account
implements: none
decisions: D-18

## Context

Spec Rule 15, milestone 7: "Done when: the backup file contains all my data and deleting my account leaves nothing behind." This completes the first version.

## Scope

- Walk through every SPEC rule (1–17) in production and confirm the behaviour.
- Delete a test account in production and confirm nothing is left.
- Update SPEC/DESIGN; tag `v1.0.0` and publish a release.

## Acceptance criteria

- [ ] Every SPEC rule confirmed or turned into a follow-up issue.
- [ ] Every other milestone 7 issue is closed.
- [ ] `v1.0.0` release published.

@@@ issue
key: ui-tokens
title: Implement the UI.md design tokens and theme
milestone: m1
labels: type: infra | area: web | size: M
deps: web-skeleton
flags: ui
implements: none
decisions: D-24, D-43

## Context

UI.md Section 4: every colour, type style, spacing value, radius and shadow comes from tokens. Components never hard-code them, so the look stays consistent and dark mode works everywhere.

## Scope

- Colour tokens from UI.md 4.1 as CSS variables in the shadcn/ui theme, for light and dark (soft dark grey).
- Type styles from UI.md 4.2 as Tailwind utilities; Inter self-hosted with `@fontsource-variable/inter`; `tabular-nums` for amounts.
- Spacing, shape and elevation from UI.md 4.3–4.5.
- Lucide icons installed, with the sizes from UI.md 4.6.
- A development-only `/dev/ui` page showing every token in both themes (excluded from production builds).
- `pnpm check:tokens`: a script that fails if a component file under `apps/web/src` contains a hex colour; added to CI.

## Acceptance criteria

- [ ] Every token in UI.md 4.1–4.5 exists, with the documented values, in both themes.
- [ ] Contrast of every text token on `background` and `surface` is at least 4.5:1 in both themes; results recorded in the pull request.
- [ ] No request goes to Google Fonts or any other third party (checked in the browser's network tab).
- [ ] `pnpm check:tokens` fails on a sample hex colour in a component and passes on the real code; CI runs it.
- [ ] `/dev/ui` is not reachable in the production build.

## Out of scope

- Components ({{ui-components}}) and motion ({{ui-motion}}).

@@@ issue
key: ui-motion
title: Set up Motion and the motion tokens
milestone: m1
labels: type: infra | area: web | size: S
deps: ui-tokens
flags: ui
implements: none
decisions: D-24, D-43

## Context

UI.md Section 6: subtle motion through one library and one set of tokens, never in the way, and fully respecting reduced motion.

## Scope

- Install `motion`; use `LazyMotion` with `m` components and load the feature bundle asynchronously (UI.md 6.1).
- `MotionConfig reducedMotion="user"` at the app root.
- `apps/web/src/lib/motion.ts`: the duration, easing and spring tokens from UI.md 6.2.
- Reusable helpers: press scale, tab cross-fade, detail slide-in, list insert/remove (UI.md 6.3).
- Reduced-motion behaviour from UI.md 6.5 applied to the helpers.

## Acceptance criteria

- [ ] Motion's feature bundle is not in the initial JavaScript chunk (checked in the build output).
- [ ] With "reduce motion" turned on in the OS, the helpers produce no movement, only instant changes or short fades.
- [ ] No component hard-codes a duration or easing; all come from `motion.ts`.

## Out of scope

- Celebrations ({{celebrations}}).

@@@ issue
key: ui-components
title: Build the shared core UI components
milestone: m1
labels: type: feature | area: web | size: L
deps: ui-tokens, ui-motion, shadcn-map
flags: ui
implements: FR-14.1, FR-14.2, FR-14.3, FR-14.6
decisions: D-24, D-43

## Context

UI.md Section 5: screens are built from one set of shared components, so every screen behaves the same way (UI.md 1.6) and handles loading, empty, error and offline states (UI.md 5.1).

## Scope

Components from UI.md 5.3, on top of shadcn/ui, each shown on the `/dev/ui` page:

- `Amount`: ₹ formatting and signs exactly as Spec Rule 14 (income `+` in the income colour; no sign for expenses and totals; `+`/`−` in normal colour for "left over"; `−` in normal colour for a negative balance), tabular figures.
- Buttons: `primary`, `secondary`, `ghost`, `destructive`, `danger-ghost`, `fab`, with the busy state (UI.md 5.2, 5.3).
- `Card`, `Badge` (upcoming, overdue, paused, source).
- `ResponsiveDrawer`: shadcn/ui Drawer (vaul) below `md`, centred Dialog from `md` up (UI.md 4.8).
- Every component uses exactly the shadcn/ui primitive mapped in UI.md 5.5; each primitive is added only when one of these components needs it.
- `ConfirmDialog` following UI.md 5.3 and 9.2.
- Toasts: sonner configured per UI.md 7.2 (placement, durations, one at a time, actions).
- `Skeleton` and a `useDelayedLoading` hook that shows skeletons only after 300ms (UI.md 5.1).
- `EmptyState` and `ErrorState`, with the unDraw illustrations from UI.md 4.6 recoloured to `primary` and loaded lazily.
- `OfflineBanner`.

## Acceptance criteria

- [ ] Every component above is on `/dev/ui` in all its states, in both themes.
- [ ] `Amount` unit tests: expense, income, zero, a negative balance, positive and negative "left over", paise and lakh/crore grouping.
- [ ] A load that finishes in under 300ms never shows a skeleton.
- [ ] `ResponsiveDrawer` and `ConfirmDialog` trap focus and return it on close; `ConfirmDialog` focuses Cancel by default.
- [ ] Every component meets the accessibility baseline (UI.md 8).

## Out of scope

- Form inputs ({{ui-inputs}}), `MoneyInput` ({{onboarding}}) and `CategoryPicker` ({{add-tx}}).

@@@ issue
key: ui-inputs
title: Build the shared input components
milestone: m1
labels: type: feature | area: web | size: M
deps: ui-components, shadcn-map
flags: ui
implements: FR-5.3
decisions: D-43

## Context

UI.md 5.3 (Inputs): the form components every create and edit form uses.

## Scope

- `TextField` and `TextArea`: label above, error below, character counter where there's a limit.
- `DateField`: **Today** and **Yesterday** chips plus **Pick a date** with a calendar; can disable future dates.
- `Autocomplete`: built on shadcn/ui Command, for payee and person.
- `SegmentedControl` (ToggleGroup, single selection).
- Every component uses exactly the shadcn/ui primitive mapped in UI.md 5.5.
- `ProgressBar`: animated fill (UI.md 6.3) with the value as text.
- `EmojiPicker` (UI.md 5.4): curated grid of about 80 emoji in groups, plus "Use another emoji"; validates exactly one emoji.
- All wired to React Hook Form, with errors shown when a field loses focus or on Save (UI.md 7.3).

## Acceptance criteria

- [ ] Every component is on `/dev/ui` in all its states, in both themes.
- [ ] `DateField` with future dates disabled can't select tomorrow, by mouse, touch or keyboard.
- [ ] Every input is usable with the keyboard and has a visible label (UI.md 8).

@@@ issue
key: celebrations
title: Add the celebration component
milestone: m4
labels: type: feature | area: web | size: S
deps: ui-motion
flags: ui
implements: none
decisions: D-24, D-25

## Context

UI.md 6.4: confetti for big moments (goal completed, lending record settled) and a check mark for paying a bill on time. Celebrations never block the screen and are never triggered by spending.

## Scope

- `celebrate("big" | "small", message)`:
  - `big`: a ~1.2s confetti burst in the chart palette using `canvas-confetti`, loaded only on first use, followed by the message.
  - `small`: a check mark drawing itself inside the toast (~400ms).
- Reduced motion: a static check mark and the message, no confetti (UI.md 6.5).

## Acceptance criteria

- [ ] `canvas-confetti` is not downloaded until the first big celebration.
- [ ] I can keep tapping and scrolling while a celebration plays.
- [ ] With "reduce motion" on, no confetti and no animated check mark.
- [ ] The message is also announced to screen readers.

@@@ issue
key: versioning
title: Add record versioning and stale-edit handling
milestone: m1
labels: type: infra | area: api | area: web | size: M
deps: db, ui-components
flags: ui
implements: FR-9.10
decisions: D-17, D-38

## Context

Spec Rule 9 (Editing on two devices) and DESIGN 4.7: an edit made on one device must never silently overwrite a newer change from another. Every feature with edits builds on this.

## Scope

API:
- A repository helper that updates or deletes with a `{ _id, userId, version }` filter and increments `version` in the same write.
- If nothing matched but the record exists, it throws `StaleRecordError` (`409 STALE_RECORD`); if the record doesn't exist for this user, `NotFoundError`.
- New documents start at `version: 1`; a shared Zod schema field for `version` in update and delete bodies.

Web:
- `api-client` recognises `STALE_RECORD`.
- A shared handler shows the error toast from UI.md 3.15 with **Reload**, which refetches the affected queries; the open form keeps its values until reload.

## Acceptance criteria

- [ ] API test: two updates sent with the same `version`; the first succeeds and the second gets `409 STALE_RECORD`.
- [ ] API test: the stale request changes nothing.
- [ ] A missing `version` on update or delete returns `400`.
- [ ] Web: a stale response shows the toast, and **Reload** loads the latest data.

## Out of scope

- Applying it to each feature: every feature issue with edits adds it to its own endpoints.

@@@ issue
key: e2e-setup
title: Set up Playwright end-to-end tests
milestone: m1
labels: type: test | area: ci | area: web | size: M
deps: onboarding
implements: FR-3.4
decisions: D-44

## Context

Spec Rule 16 and DESIGN 10.2: the critical flows get end-to-end browser tests. Setting up the harness in milestone 1 means the flow tests in later issues only add test files.

## Scope

- An `e2e/` workspace with Playwright and two projects: a mid-range Android phone viewport and a laptop viewport, both in Chrome.
- Runs against the production build, served by the API with an in-memory MongoDB.
- Test-only sign-in: a route that creates a session for a seeded test user, available only when `E2E_AUTH=true`. `config.ts` refuses to start if `E2E_AUTH=true` and `NODE_ENV=production`.
- A first smoke test: sign in through the test route and see the Home screen.
- `pnpm test:e2e` added to the CI job; failure traces and screenshots uploaded as CI artifacts.

## Acceptance criteria

- [ ] The smoke test passes on both viewports locally and in CI.
- [ ] Starting the server with `E2E_AUTH=true` and `NODE_ENV=production` exits with an error (test).
- [ ] The test sign-in route returns `404` when `E2E_AUTH` isn't set.
- [ ] A failing test leaves a trace and screenshot in the CI run's artifacts.

## Out of scope

- Flow tests: expense flows ({{tx-screens}}) and bill payment ({{bills-screens}}).

@@@ issue
key: seed-dev
title: Add the development seed script
milestone: m2
labels: type: infra | area: api | area: db | size: S
deps: tx-api, categories-api
implements: none
decisions: D-46

## Context

DESIGN 11.8: realistic sample data makes building and checking screens much easier, starting in milestone 2.

## Scope

- `pnpm seed:dev`: resets the development user's data and loads categories and about 3 months of realistic transactions (varied categories, payees, notes, income).
- Uses the same services as the API, so the data is always valid.
- Refuses to run when `NODE_ENV=production`, and refuses unless the database name in `MONGODB_URI` ends with `-dev`, so it can never touch the production database by accident.
- Later feature issues extend it with bills, lending records and goals.

## Acceptance criteria

- [ ] Running it twice gives the same data, with no duplicates.
- [ ] It refuses to run with `NODE_ENV=production` (test).
- [ ] After running it, the Transactions screen has several pages of realistic data.

@@@ issue
key: boundaries
title: Enforce import boundaries and code discipline checks
milestone: m1
labels: type: infra | area: ci | size: M
deps: container, web-skeleton
implements: none
decisions: D-35, D-44, D-50

## Context

DESIGN 4.2 and 10.4: the layer rules (routes, services, repositories, domain), the frontend rule that only `api.ts` files call the API client, and two discipline rules no linter covers (no clock in domain files, no raw money arithmetic) must be enforced by CI, not by memory.

## Scope

- `dependency-cruiser` with `.dependency-cruiser.cjs` implementing every row of the import boundary table in DESIGN 10.4, including "no circular imports" and "web features use each other only through `api.ts`" (DESIGN 15.4).
- `pnpm check:duplication`: jscpd failing on duplicated blocks of 10+ lines or 50+ tokens, excluding tests and generated files (DESIGN 15.2). A dev-only dependency, justified here per DESIGN 10.10.
- `pnpm check:boundaries` runs it.
- `pnpm check:discipline`: a small script that fails on `Date.now()` or argument-less `new Date()` in `*.domain.ts`, and on `* 100`, `/ 100`, `toFixed` or `parseFloat` applied to amounts outside `packages/shared/src/money.ts`.
- Both added to the CI job ({{ci}}).

## Acceptance criteria

- [ ] For every boundary rule, a sample violation fails `check:boundaries` (verified one by one, then removed).
- [ ] A circular import between two modules fails.
- [ ] A `Date.now()` in a domain file and a `* 100` in a component both fail `check:discipline`; the same code in `money.ts` passes.
- [ ] Both checks run in CI and pass on the real code.

@@@ issue
key: api-contract
title: Add response schemas, the respond helper and OpenAPI generation
milestone: m1
labels: type: infra | area: api | area: shared | size: M
deps: api-errors, container
implements: none
decisions: D-37, D-40

## Context

DESIGN 6.6 and 6.8: only fields the client needs leave the server, and the API description is generated from the same schemas, so it can't drift. This is the data-side twin of the error discipline (DESIGN 9.6).

## Scope

- Convention for request and response schemas per endpoint in `packages/shared/src/schemas/`.
- `respond(res, schema, data)`: validates outgoing data against the response schema and wraps it in `{ success: true, data }`. In development and tests an unlisted field throws; in production it's stripped and logged as a warning.
- A shared `id` schema (ObjectId as a string) and the mapping from documents (`_id`) to `id`.
- A route registry that records each route's method, path, request schema and response schema.
- `pnpm gen:openapi`: writes `docs/openapi.json` from the registry and schemas.
- CI step: regenerate and fail if `docs/openapi.json` changed (DESIGN 10.2).

## Acceptance criteria

- [ ] In a test, returning a document with `userId` through `respond` fails in test mode and is stripped in production mode.
- [ ] `/api/health` is the first endpoint described in `docs/openapi.json`.
- [ ] Changing a schema without regenerating makes CI fail.
- [ ] The generated file opens in an OpenAPI viewer without errors.

## Out of scope

- Feature endpoints; each feature issue adds its own schemas and routes.

@@@ issue
key: docs-checks
title: Run the documentation and traceability checks in CI
milestone: m1
labels: type: infra | area: ci | size: S
deps: ci
implements: none
decisions: D-45, D-49

## Context

SPEC.md ("How these documents fit together"), DESIGN 1.22 (D-49) and DESIGN 10.2: the docs, the issues and later the code must not silently disagree. The checks exist in `tools/docs/check.mjs` and `tools/backlog/create-issues.mjs --verify`; this issue makes CI run them on every pull request.

## Scope

- A `docs` job in `.github/workflows/ci.yml` (or a step in the existing `ci` job) that runs:
  - `node tools/docs/check.mjs --ci`: section references resolve; requirement and decision IDs are unique and known; every Must requirement has an issue and a module; `TRACEABILITY.md` is current; every Must requirement of a milestone listed in `tools/docs/finished-milestones.json` has at least one test carrying its ID.
  - `node tools/backlog/create-issues.mjs --verify`: every live issue matches `tools/backlog/issues.md`. Uses the workflow's `GITHUB_TOKEN` with read-only `issues` permission.
- `pnpm docs:check` and `pnpm backlog:verify` scripts at the root that run the same commands locally.
- README: how to change an issue (edit `tools/backlog/issues.md`, then `--update`), and how to regenerate `TRACEABILITY.md`.

## Acceptance criteria

- [ ] A pull request that breaks a section reference, or uses an unknown requirement ID, fails CI.
- [ ] A pull request that changes SPEC.md without regenerating `TRACEABILITY.md` fails CI.
- [ ] Editing a live issue on GitHub by hand makes the next CI run fail, until `issues.md` and the issue agree again.
- [ ] Adding a milestone to `finished-milestones.json` without tests for its Must requirements fails CI.
- [ ] The workflow's token has only the permissions it needs (`contents: read`, `issues: read`).

## Out of scope

- Writing to issues from CI; updates stay a deliberate local command.

@@@ issue
key: shadcn-map
title: Map app components to shadcn/ui primitives
milestone: m1
labels: type: docs | area: web | size: S
implements: none
decisions: D-43, D-50
flags: nocode

## Context

UI.md 1.6 and 5 say every component is built on shadcn/ui and that one component does one job, but they don't say **which** shadcn/ui primitive each app component uses. Without that, two people can build the same control from different primitives (for example the Expense / Income switch from Tabs in one place and ToggleGroup in another), which breaks visual and behavioural consistency. The name `ResponsiveSheet` also suggests shadcn/ui's side-panel Sheet, which the app doesn't use.

## Scope

- A table in UI.md 5 mapping every app component and UI need to exactly one shadcn/ui primitive.
- Rules: add a shadcn/ui component only when a screen needs it, and record it in the table; never build by hand anything the table lists; shadcn/ui's side-panel Sheet isn't used (the Drawer covers that job).
- Rename `ResponsiveSheet` to `ResponsiveDrawer` in UI.md, DESIGN.md and the backlog source, so the name matches the primitive it uses.
- Charts use shadcn/ui's Chart components, which wrap Recharts (D-43), so chart colours come from the tokens.

## Acceptance criteria

- [ ] UI.md 5 has the mapping table, and every component in UI.md 5.3 appears in it.
- [ ] No document or issue refers to `ResponsiveSheet` any more, except this issue's own description of the rename.
- [ ] `node tools/docs/check.mjs --ci` passes, and every live issue matches `tools/backlog/issues.md`.

## Out of scope

- Adding any shadcn/ui component to code; that happens in {{ui-components}} and {{ui-inputs}}.

@@@ issue
key: verify-closed
title: Treat closed issues as normal in the backlog verification
milestone: m1
labels: type: bug | area: ci | size: S
implements: none
decisions: D-49

## Context

`node tools/backlog/create-issues.mjs --verify` reports every closed issue as a problem. Closing is what finished work does: after {{shadcn-map}} was closed by its merged pull request, the verification started failing, and it would fail after every merge from now on, which would make the CI drift check in {{docs-checks}} useless.

## Scope

- `--verify` accepts open and closed issues; it still compares title, body, labels and milestone for every issue, whatever its state.
- The success message reports how many issues are open and how many closed.

## Acceptance criteria

- [ ] With #68 closed, `--verify` passes and reports the open and closed counts.
- [ ] A closed issue whose body differs from `tools/backlog/issues.md` is still reported.
- [ ] An issue on GitHub that isn't in the backlog is still reported.

@@@ issue
key: verification-record
title: Record verification in pull requests, and document engine-strict
milestone: m1
labels: type: docs | area: ci | size: S
implements: none
decisions: D-33, D-45
flags: nocode

## Context

Issues #1 and #2 were verified, but nothing showed it: the issue checkboxes stayed unticked, and the pull requests listed only acceptance criteria, not the definition of done. Ticking checkboxes in issues isn't an option, because issues are generated from `tools/backlog/issues.md` and the verification script would report the edited body. Separately, #2 added `.npmrc` with `engine-strict=true` without mentioning it in DESIGN 1.6.

## Scope

- DESIGN 10.7: the pull request description is the **verification record**: an Acceptance criteria section and a Definition of done section, each line ticked with its evidence or marked N/A with a reason. Issue checkboxes stay unticked.
- AGENTS.md: the same rule in "Before opening a pull request".
- DESIGN 1.6: `.npmrc` with `engine-strict=true` makes installing on another Node version fail.
- {{protection}}: its pull request template carries the two sections.

## Acceptance criteria

- [ ] DESIGN 10.7 and AGENTS.md describe the verification record and say issue checkboxes stay unticked.
- [ ] DESIGN 1.6 mentions `engine-strict`.
- [ ] This issue's own pull request uses the verification record.
- [ ] `node tools/docs/check.mjs --ci` and `node tools/backlog/create-issues.mjs --verify` pass.
