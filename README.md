# Money Manager

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
| `pnpm dev` | start every workspace's development server (from issues #8 and #12) |
| `pnpm test` | run all tests (Vitest; each workspace is a project) |
| `pnpm test:coverage` | run tests with coverage; fails below 90% lines or branches on `*.domain.ts` files |
| `pnpm test:api` | run the API tests against an in-memory MongoDB (from issue #10; passes with none until then) |
| `pnpm docs:check` | check docs, IDs, references and that `TRACEABILITY.md` is current, without changing anything (CI runs this) |
| `node tools/docs/check.mjs` | the same checks, and regenerate `TRACEABILITY.md` |
| `pnpm backlog:verify` | check every GitHub issue matches `tools/backlog/issues.md` (CI runs this; needs `gh` signed in) |

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

## Repository layout

```text
apps/api/          Express server (TypeScript, compiled with tsc)
apps/web/          React + Vite web app
packages/shared/   code used by both: schemas, money and date helpers, error catalogue
tools/backlog/     source of the GitHub issues and the script that syncs them
tools/docs/        documentation and traceability checks
```

The full layout is in [DESIGN 3](DESIGN.md#3-repo-structure).
