# Outgo

A personal finance app (installable web app) for knowing exactly where my money goes: expenses and income, with recurring bills, lending and savings goals as secondary features.

The project is spec-driven. Read these before changing anything:

| Document | What it covers |
| --- | --- |
| [SPEC.md](SPEC.md) | What the app does and why: requirements (`FR-…`), product decisions, scope, assumptions, open questions, glossary. **Wins when documents disagree.** |
| [DESIGN.md](DESIGN.md) | How it's built: technical decisions, architecture, data, API, security, quality gates |
| [UI.md](UI.md) | How it looks, feels and reads |
| [AGENTS.md](AGENTS.md) | How to work in this repo, for AI agents and humans |
| [TRACEABILITY.md](TRACEABILITY.md) | Generated map from each requirement to its issues, module and tests |

Work is tracked as GitHub issues and milestones; the conventions are in [AGENTS.md](AGENTS.md).

## Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| Node.js | 24 (see `.nvmrc`) | runtime; installs fail on other versions (`engine-strict`) |
| pnpm | 10 (pinned in `package.json`) | package manager for the workspaces |
| git | any recent | version control |
| gitleaks | 8 or later | secret scanning in the pre-commit hook ([DESIGN 10.1](DESIGN.md#101-gate-1-before-each-commit-my-machine)) |
| GitHub CLI (`gh`) | optional | working with issues and pull requests; required for `tools/backlog` |

A Node version manager that reads `.nvmrc` (for example fnm or nvm) switches to Node 24 automatically inside the repo.

## Getting started

```bash
git clone https://github.com/fasluolassery/money-manager.git
cd money-manager
pnpm install
pnpm typecheck
```

`pnpm typecheck` builds `packages/shared` and `apps/api` with TypeScript project references and checks `apps/web`. It passes on a fresh clone.

`pnpm install` also installs the pre-commit hook: it scans staged changes with gitleaks, then formats and lints them with Biome ([DESIGN 10.1](DESIGN.md#101-gate-1-before-each-commit-my-machine)). Without gitleaks the hook stops and says how to install it.

## Commands

Run from the repository root. Each runs across every workspace that defines it.

| Command | Does |
| --- | --- |
| `pnpm install` | install dependencies and link the workspaces |
| `pnpm typecheck` | type-check all workspaces |
| `pnpm lint` | check formatting and lint rules across the repo (Biome) |
| `pnpm format` | fix formatting and safe lint fixes across the repo |
| `pnpm build` | build all workspaces |
| `pnpm start` | run the built app: the API serving the built web app (after `pnpm build`) |
| `pnpm dev` | start every workspace's development server (from issues #8 and #12) |
| `pnpm test` | run all tests (Vitest; each workspace is a project) |
| `pnpm test:coverage` | run tests with coverage; fails below 90% lines or branches on `*.domain.ts` files |
| `pnpm test:api` | run API integration tests (`*.api.test.ts`) against an in-memory MongoDB replica set |
| `pnpm docs:check` | check docs, IDs, references and that `TRACEABILITY.md` is current, without changing anything (CI runs this) |
| `node tools/docs/check.mjs` | the same checks, and regenerate `TRACEABILITY.md` |
| `pnpm backlog:verify` | check every GitHub issue matches `tools/backlog/issues.md` (CI runs this; needs `gh` signed in) |
| `pnpm pr:check <number>` | check a pull request's verification record against its issue (CI runs this on every pull request; needs `gh` signed in) |

## Running the production build locally

```bash
cp apps/api/.env.example apps/api/.env   # then fill in MONGODB_URI (the development cluster)
pnpm build
pnpm start                               # one Node process: the API plus the built web app
```

`pnpm start` serves the app at `http://localhost:3000` (or `PORT`). `/api/health` returns `200` when the database is reachable.

## Deployment

Production **target** is Railway (Hobby plan, Singapore) with MongoDB Atlas ([DESIGN 11](DESIGN.md#11-deployment-and-environments)). Paid Hobby go-live can wait on budget ([DESIGN 11.9](DESIGN.md#119-deferred-hobby-go-live), SPEC Q-08); until then use a local production build (and a tunnel for the phone). Merging to `main` will deploy automatically once Railway is connected, but only after the `ci` check passes.

### Interim: phone access without Railway

1. `pnpm build && pnpm start` (serves the app on `PORT`, default 3000).
2. Point a tunnel (e.g. Cloudflare Tunnel) or LAN HTTPS at that port.
3. Set `APP_URL` in `apps/api/.env` to that public origin (needed for Origin checks and, later, Google OAuth).

### One-time setup: MongoDB Atlas

Atlas allows one free cluster per project, so create **two projects**: one for development, one for production ([DESIGN 11.1](DESIGN.md#111-environments)). In each:

1. Create a **free** cluster in Singapore (AWS `ap-southeast-1`), or the nearest region Atlas offers for free clusters.
2. Add a database user with a long random password, for example from `openssl rand -hex 24` (hex needs no escaping in a connection string).
3. Under Network Access, allow `0.0.0.0/0`. Railway's outgoing addresses aren't fixed on the Hobby plan ([DESIGN 11.2](DESIGN.md#112-production-setup)).
4. Copy the connection string. The development one goes in `apps/api/.env`; the production one goes only into Railway's variables.

The database name comes from `NODE_ENV` (`money-manager` in production, `money-manager-dev` locally), so the connection string doesn't name one.

### One-time setup: Railway

Create a project on the Hobby plan with one service from this GitHub repository. Railway's settings live in its dashboard, not in a file ([DESIGN 11.2](DESIGN.md#112-production-setup)); these are all of them:

| Setting | Value |
| --- | --- |
| Source | this repository, branch `main` |
| Wait for CI | on, so a commit whose `ci` check fails is never deployed |
| Region | Southeast Asia (Singapore) |
| Builder | Railpack (the default); it reads Node 24 and pnpm 10 from `package.json` |
| Build command | `pnpm build` |
| Start command | `node apps/api/dist/main.js` (Node directly, so it receives Railway's shutdown signal) |
| Healthcheck path | `/api/health` |
| Restart policy | on failure |
| Public networking | generate a Railway domain, `outgo.up.railway.app` if it's free |

**Variables** (the full list is in [DESIGN 11.4](DESIGN.md#114-configuration-and-secrets) and [`apps/api/.env.example`](apps/api/.env.example)):

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `APP_URL` | the Railway domain with `https://`, e.g. `https://outgo.up.railway.app` |
| `MONGODB_URI` | the production cluster's connection string |
| `LOG_LEVEL` | `info` |
| `MONGOMS_DISABLE_POSTINSTALL` | `1`; skips downloading the test-only MongoDB binary during the build |

Railway sets `PORT` itself.

**Notifications and spending** ([DESIGN 11.6–11.7](DESIGN.md#116-cost)): turn on email notifications for failed deploys and crashed services, and on the workspace's Usage page set an email alert at $5 and a hard limit at $10.

### Deploying

Merge a pull request to `main`. CI runs on `main`; when the `ci` check passes, Railway builds, starts the new version, and switches traffic to it once `/api/health` returns `200`. If the health check fails, the previous version keeps running.

### Rolling back

1. In Railway, open the service's **Deployments**, find the last good deployment, and choose **Redeploy**.
2. Check that `https://<domain>/api/health` returns `200` and the app opens.
3. Revert the bad change on `main` through a pull request, so the next deploy doesn't bring it back.

## Changing the docs or an issue

- **After changing SPEC, DESIGN, UI.md, the backlog or test names,** run `node tools/docs/check.mjs` to regenerate `TRACEABILITY.md`, and commit it. CI fails if it's out of date. Never edit `TRACEABILITY.md` by hand.
- **To change an issue,** edit `tools/backlog/issues.md`, never the issue on GitHub. Then, from your branch, run `node tools/backlog/create-issues.mjs --update --only <key>` (and the milestone's sign-off key if you added an issue), and re-run CI. CI fails while an issue on GitHub and the backlog disagree ([DESIGN 10.7](DESIGN.md#107-git-conventions-and-releases)).
- **To add an issue,** add an entry to `tools/backlog/issues.md` and run `node tools/backlog/create-issues.mjs` (no flag creates only missing issues), then commit the updated `tools/backlog/created.json`.

## Major versions

The latest stable major of each tool and library, chosen when the project started ([DESIGN 1.6](DESIGN.md#16-versions-and-build)). Exact versions are in `pnpm-lock.yaml`; this list grows as each issue adds its libraries.

| Tool or library | Major |
| --- | --- |
| Node.js | 24 |
| pnpm | 10 |
| TypeScript | 7 |
| Biome | 2 |
| Vitest | 5 |
| fast-check | 4 |
| Zod | 4 |

## Repository layout

```text
apps/api/          Express server (TypeScript, compiled with tsc)
apps/web/          React + Vite web app
packages/shared/   code used by both: schemas, money and date helpers, error catalogue
tools/backlog/     source of the GitHub issues and the script that syncs them
tools/docs/        documentation and traceability checks
```

The full layout is in [DESIGN 3](DESIGN.md#3-repo-structure).
