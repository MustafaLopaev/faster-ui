# Contract: CI Workflow (`.github/workflows/ci.yml`)

The quality pipeline's externally observable behavior. Job **names are API** — required-check configuration, the badge, and reviewers depend on them; renaming a job is a breaking change to repo configuration.

## Triggers

| Event | Filter | Effect |
| ----- | ------ | ------ |
| `push` | `branches: ['**']` (branches only — tag pushes are release's trigger) | Full suite on the pushed commit |
| `pull_request` | default (opened/synchronize/reopened) | Full suite on the merge candidate; each gate appears as a distinct PR check |
| `workflow_call` | — | Entire suite reusable by `release.yml`; gates stay single-sourced |

Concurrency: one group per ref; a newer push cancels a superseded in-progress run for the same ref. Completed verdicts are never affected.

## Jobs (the seven gates)

| Job id | Steps (contract level) | Command parity |
| ------ | ---------------------- | -------------- |
| `install` | checkout → setup Node from `.nvmrc` (npm cache) → `npm ci` | `npm ci` — exactly what a contributor runs |
| `lint` | needs `install`; same setup → `npm ci` → `npm run lint` | `npm run lint` |
| `typecheck` | needs `install`; same setup → `npm ci` → `npm run typecheck` | `npm run typecheck` |
| `test` | needs `install`; same setup → `npm ci` → `npm test` | `npm test` |
| `cypress` | needs `install`; same setup + restore Cypress binary cache **before** `npm ci` → `npm run cy:ct` | `npm run cy:ct` |
| `storybook` | needs `install`; same setup → `npm ci` → `npm run build-storybook` | `npm run build-storybook` |
| `build` | needs `install`; same setup → `npm ci` → `npm run build` | `npm run build` |

The six gate jobs after `install` run **in parallel**.

## Environment guarantees

- Node version: read from `.nvmrc` in every job — never hardcoded in the workflow.
- Installs: `npm ci` against the committed lockfile; npm cache via setup-node; Cypress binary cache keyed on the locked Cypress version. Cold caches change duration only.
- Non-`cypress` jobs set `CYPRESS_INSTALL_BINARY=0` for their install — the sole deliberate CI/local environment difference; those gates never execute the binary, so no verdict can change (research R-4).
- Workflow permissions: `contents: read`. No secrets are referenced anywhere in this workflow.

## Verdict contract

- A gate fails ⇔ its command exits nonzero. The run fails ⇔ any gate fails.
- On a PR, each gate is individually visible as `CI / <job id>` with its own pass/fail — a reviewer identifies the failing gate without opening logs (SC-003).
- Where the plan permits, the seven check names are configured as required on `main` (one-time repo setting — see [quickstart](../quickstart.md) scenario 7).
