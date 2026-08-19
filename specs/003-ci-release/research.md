# Research: CI/CD Pipeline & npm Release

All unknowns from the Technical Context resolved. Facts marked *(verified)* were checked against this machine, the lockfile, or the live npm registry on 2026-08-19.

## R-1 — Gate visibility: one job per gate, not steps in one job

**Decision**: `ci.yml` defines **seven jobs** — `install`, `lint`, `typecheck`, `test`, `cypress`, `storybook`, `build` — where the six check jobs `needs: install` (which primes the caches) and then run in parallel.

**Rationale**: FR-002 requires each gate to be a *distinct, individually visible* check. GitHub surfaces **jobs** — not steps — as separate named checks on a pull request and as separately required checks for merge blocking. Steps inside one job would collapse the seven gates into a single check named after the job. Parallel jobs are also faster wall-clock: after `install`, the six gates run concurrently instead of serially.

**Alternatives considered**:
- *Single job, seven named steps*: simplest file, but the PR shows one check ("CI"), a red lint is indistinguishable from a red build without opening logs — fails FR-002 and SC-003. Rejected.
- *Sharing `node_modules` across jobs via artifact upload/download*: saves the per-job `npm ci`, but artifact round-trips for a ~400MB tree are slower than a warm-cache `npm ci` and notoriously fragile (permissions, symlinks). Rejected. Each job runs its own `npm ci` against the shared npm cache.

## R-2 — Release gating: reusable workflow, not workflow_run or duplicated jobs

**Decision**: `ci.yml` additionally declares the `workflow_call` trigger. `release.yml` (triggered by `push` on tags `v*`) has a `quality` job that `uses: ./.github/workflows/ci.yml`, and a `publish` job with `needs: quality`. The complete gate suite therefore re-runs on the tagged commit itself before any publish.

**Rationale**: FR-008 says publish only if the *complete* suite passes *for the tagged commit*. Calling the CI workflow keeps the gates single-sourced — a gate added to CI later is automatically part of release gating, so the two can never drift (spec's parity constraint applied to the pipeline itself).

**Alternatives considered**:
- *`workflow_run` chaining* (release fires after CI completes): asynchronous, awkward to correlate with the tag's commit, and the release run's UI doesn't show the gates it depended on. Rejected.
- *Trust an earlier green run on the same SHA* (query the Checks API): bypassable (tag an unchecked commit) and adds API-querying logic — exactly the kind of CI-only logic the constraints forbid. Rejected; re-running the suite is the simplest gating that cannot be bypassed (spec assumption).
- *semantic-release / changesets*: automates versioning and changelogs the spec explicitly scopes out; heavy configuration; violates Principle VII for this feature's size. Rejected.

## R-3 — Node pinning: `.nvmrc` as the single authoritative declaration

**Decision**: Add `.nvmrc` containing `22`. Every workflow job uses `actions/setup-node` with `node-version-file: .nvmrc`. No `engines` field is added.

**Rationale**: FR-005 demands one declaration read by both contributors and the pipeline. `.nvmrc` is the convention every local version manager understands (nvm, fnm, asdf via plugin, Volta reads it too), and `setup-node` consumes it natively — CI can never drift from the file. Local dev runs v22.22.2 *(verified)*; pinning the major line (`22`) matches how developers actually track Node (patch upgrades are automatic locally, and pinning an exact patch would make CI *diverge* from local machines over time rather than match them).

**Alternatives considered**: exact pin `22.22.2` (drifts from local reality as machines patch-update; rejected), `engines` + `engine-strict` (errors consumers' installs, wrong tool for a dev-environment pin; rejected), hardcoding `node-version: 22` in each workflow (two declarations that can drift from each other and from local; rejected — violates "single authoritative place").

## R-4 — Cypress in CI: binary cache keyed on the locked version; headless needs nothing extra

**Decision**: The `cypress` job restores `~/.cache/Cypress` via `actions/cache` keyed on the Cypress version from the lockfile (`15.21.0` *(verified)*), **before** `npm ci`, then runs `npm run cy:ct` exactly. Non-Cypress jobs set `CYPRESS_INSTALL_BINARY=0` on their `npm ci` so they skip downloading a ~250MB binary they never execute.

**Rationale**: Cypress's postinstall downloads the binary only when the cached version is absent — restoring the cache first makes `npm ci` a no-op for it (cache-hit runs save 30–60s; a cold cache just downloads again, so the verdict is unaffected — FR-004). `ubuntu-latest` runners ship Chrome and the bundled Electron, and `cypress run` manages Xvfb itself, so headless CT works with zero CI-only setup. `CYPRESS_INSTALL_BINARY=0` in the six non-Cypress jobs is an *install-environment* optimization, not gate logic: those gates (lint, tsc, Jest, Storybook, Vite) never invoke the binary, so its absence cannot change their verdicts — this stays within FR-003's parity constraint, and is documented here precisely because it's the only place CI's environment deliberately differs from local.

**Note**: the local `ELECTRON_RUN_AS_NODE` quirk (CLAUDE.md) is specific to VS Code extension terminals; GitHub runners don't set that variable, so no unset logic belongs in the workflow.

## R-5 — npm publish: scoped name, declarative public access, token-authenticated

**Decision**: Rename the package to `@mlopaev/faster-ui` and add `"publishConfig": { "access": "public" }` to `package.json`. The `publish` job runs `npm ci` → `npm run build` (the identical local command) → a tag ↔ manifest version-match check → `npm publish`, authenticated by a granular automation token stored as the `NPM_TOKEN` repository secret and exposed as `NODE_AUTH_TOKEN` via `setup-node`'s `registry-url`.

**Rationale**: `faster-ui` is taken (0.0.1 live); `@mlopaev/faster-ui` returns 404 — unclaimed *(both verified against registry.npmjs.org)*. Scoped packages default to `restricted`; `publishConfig` makes public access a declarative package fact rather than a publish-command flag (one less place for CI to diverge). The version check is a two-line comparison of the tag ref against `package.json` — release *orchestration*, not a quality gate, so it doesn't violate the no-CI-only-logic constraint (which governs the gates); FR-010 explicitly requires it.

**Alternatives considered**:
- *`--provenance` attestation*: valuable for public repos, but from a **private** repo it embeds the repository URL and workflow path into a public transparency log — leaks exactly what the user chose to keep private. Rejected for this repo; noted as a follow-up if the repo ever goes public.
- *GitHub Packages*: rejected in the spec clarification (consumers would need auth to install).
- *`npm publish --access public` flag*: works, but access belongs in the manifest, not in workflow arguments. Rejected.

## R-6 — Merge blocking on a private Free-plan repo: verdict always, enforcement best-effort

**Decision**: Treat the red PR verdict as the plan-independent gate. As a one-time verification step (quickstart), attempt to mark the seven gate jobs as required status checks on `main`; if the account plan doesn't allow enforcement on private repos, document that and rely on the verdict.

**Rationale**: GitHub enforces branch protection / rulesets on **private** repositories only on paid plans (public repos get them free). The spec (FR-006, post-clarification) was worded for exactly this: failure must be prominently reported on the PR always, and hard-block merging *where the hosting plan permits*. Every PR still shows each gate's red/green check regardless of plan.

**Alternatives considered**: making the repo public (rejected by the user in the spec clarification), a merge-queue bot (absurd overhead for a single-maintainer task repo — Principle VII).

## R-7 — Badge on a private repo: standard workflow badge, renders for collaborators

**Decision**: Add the standard `…/actions/workflows/ci.yml/badge.svg?branch=main` badge to the top of README, linking to the workflow's run list.

**Rationale**: On private repos GitHub serves the badge (and the linked run history) to authenticated users with repository access — which is precisely the audience (invited reviewers, FR-013). No third-party badge service sees the repo. Anonymous viewers get nothing, which matches the private-repo decision.

## R-8 — Repo bootstrap & verification tooling: GitHub CLI, with web-UI fallback

**Decision**: Create the private repo and drive verification with the GitHub CLI (`gh repo create mlopaev-owned-account/faster-ui --private`, `gh secret set NPM_TOKEN`, `gh run watch`, `gh pr checks`). `gh` is **not currently installed** locally *(verified)* — installing it (`brew install gh`) is a quickstart prerequisite; every step has a web-UI fallback documented in quickstart.

**Rationale**: End-to-end verification (FR-014, SC-008) needs repo creation, one secret, tag pushes, and run observation; `gh` makes each a scriptable one-liner and is the standard GitHub tooling. Nothing in the *repository* depends on `gh` — it's operator tooling only, so no new project dependencies (FR-015).

**Additional facts locked here**:
- `main` currently lacks the 001/002/003 work — feature branches must land on `main` (PRs are themselves the first real pipeline exercise) before tagging `v0.1.0` from it.
- First release: `v0.1.0`, matching the current manifest version — no bump needed (spec assumption).
- CI's `push` trigger is filtered to branches (`branches: ['**']`) so a tag push triggers only `release.yml` — the gates still run there via the `workflow_call` (avoids double-running the suite on every release; R-2).
- A `concurrency` group with cancel-in-progress on `ci.yml` prevents superseded pushes from queueing stale runs; cancellation affects scheduling, never verdicts (FR-004's spirit), and each surviving run is complete.
- Workflow-level `permissions: contents: read` on both workflows; no elevated GitHub permissions are needed anywhere (npm auth is the separate `NPM_TOKEN` secret, referenced only in `release.yml` — FR-012 satisfied structurally).
