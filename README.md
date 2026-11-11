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

## Commands

Run from the repository root. Each runs across every workspace that defines it.

| Command | Does |
| --- | --- |
| `pnpm install` | install dependencies and link the workspaces |
| `pnpm typecheck` | type-check all workspaces |
| `pnpm build` | build all workspaces |
| `pnpm dev` | start every workspace's development server (from issues #8 and #12) |
| `pnpm test` | run all tests (from issue #4) |
| `node tools/docs/check.mjs` | check docs, IDs and references; regenerate `TRACEABILITY.md` (`--ci` only checks) |
| `node tools/backlog/create-issues.mjs --verify` | check every GitHub issue matches `tools/backlog/issues.md` |

## Repository layout

```text
apps/api/          Express server (TypeScript, compiled with tsc)
apps/web/          React + Vite web app
packages/shared/   code used by both: schemas, money and date helpers, error catalogue
tools/backlog/     source of the GitHub issues and the script that syncs them
tools/docs/        documentation and traceability checks
```

The full layout is in [DESIGN 3](DESIGN.md#3-repo-structure).
