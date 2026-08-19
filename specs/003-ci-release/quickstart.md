# Quickstart: Validating the CI/CD Pipeline & Release End to End

Runnable scenarios proving the feature works on real infrastructure. Contracts: [ci-workflow](./contracts/ci-workflow.md) · [release-workflow](./contracts/release-workflow.md) · [package](./contracts/package.md).

## Prerequisites

- **GitHub CLI** — not currently installed on this machine: `brew install gh`, then `gh auth login`. (Web-UI fallback exists for every step below.)
- **npm account** owning the `@mlopaev` scope, with a **granular automation token** scoped to publish `@mlopaev/faster-ui` (npmjs.com → Access Tokens → Granular; bypass 2FA for automation).
- **Node 22** locally (`node --version` → v22.x; after this feature, `.nvmrc` pins it).

## Scenario 1 — Local parity sweep (SC-005 baseline)

Every command CI will run must be green locally first, unchanged:

```bash
npm ci && npm run lint && npm run typecheck && npm test && \
  env -u ELECTRON_RUN_AS_NODE npm run cy:ct && npm run build-storybook && npm run build
```

**Expected**: all seven exit 0. (The `env -u` wrapper is the local VS Code terminal quirk only — CI needs and has no equivalent.)

## Scenario 2 — Bootstrap the private repo (FR-014)

```bash
gh repo create faster-ui --private --source . --remote origin
git push -u origin main 001-foundation-tooling 002-core-components 003-ci-release
gh secret set NPM_TOKEN            # paste the npm automation token
```

*Fallback*: create the private repo at github.com/new, `git remote add origin …`, add the secret under Settings → Secrets and variables → Actions.

**Expected**: private repo exists; `NPM_TOKEN` listed as a repository secret; pushing `main` (no workflows on it yet) triggers nothing.

## Scenario 3 — First green pipeline run (US1, SC-001)

Open a PR from `003-ci-release` (which carries the workflows) into `main`:

```bash
gh pr create --base main --title "feat: CI pipeline + npm release automation" --fill
gh pr checks --watch
```

**Expected**: seven distinct checks appear — `CI / install`, `CI / lint`, `CI / typecheck`, `CI / test`, `CI / cypress`, `CI / storybook`, `CI / build` — all green. The `cypress` job's cache step reports a miss (first run) and the run is still green (FR-004 cold-cache proof). A re-run after merge should show cache hits and a faster wall-clock (SC-006).

## Scenario 4 — Deliberate-failure drill (US1 AS-2, SC-002/SC-003)

```bash
git checkout -b drill/red-gate && \
  sed -i '' 's/toBeInTheDocument/toBeChecked/' src/components/Button/Button.test.tsx && \
  git commit -am "test: deliberate red gate (drill — do not merge)" && git push -u origin HEAD
gh pr create --base main --title "DRILL: red gate" --body "Verification drill for SC-002. Close without merging."
gh pr checks --watch
```

**Expected**: exactly `CI / test` red; the other gates green; PR shows the failed verdict (and is hard-blocked if required checks are enforced — scenario 7). Identify the failing gate from the checks list alone, without opening logs. Then close the PR and delete the branch.

## Scenario 5 — Land everything on `main`

Merge the open feature PR(s) so `main` holds the full library + workflows.

**Expected**: post-merge push run on `main` fully green → the badge (scenario 8) turns green.

## Scenario 6 — Real release (US2, SC-004)

`package.json` is already `0.1.0`; tag from green `main`:

```bash
git checkout main && git pull && git tag v0.1.0 && git push origin v0.1.0
gh run watch
```

**Expected**: `release.yml` runs — the embedded `quality` suite re-runs all seven gates on the tagged commit, then `publish` verifies `0.1.0` ↔ `v0.1.0` and publishes. Confirm from any machine, unauthenticated:

```bash
npm view @mlopaev/faster-ui version        # → 0.1.0
cd "$(mktemp -d)" && npm init -y >/dev/null && npm install @mlopaev/faster-ui react react-dom
node -e "console.log(Object.keys(require('@mlopaev/faster-ui')))"   # → Button, Input, Dialog…
```

Also check the tarball contains only `dist/` + manifest/README (`npm pack @mlopaev/faster-ui --dry-run`).

## Scenario 7 — Merge-blocking configuration (FR-006, plan-dependent)

Attempt to require the seven gate checks on `main` (Settings → Branches → protection rule, or `gh api` ruleset). **Expected**: on a paid plan, the drill PR of scenario 4 becomes hard-blocked; on the Free plan GitHub declines enforcement for private repos — record that the red verdict remains the gate (spec FR-006 wording covers both).

## Scenario 8 — Badge & evidence audit (US3, SC-007/SC-008)

As an invited collaborator (or the owner in a fresh browser session): open the repo README.

**Expected**: badge renders and shows the latest `main` status; clicking it opens the CI run history containing ≥1 fully green suite run; the Actions tab shows the successful `v0.1.0` release run. Invite the reviewers as collaborators.

## Scenario 9 (optional) — Release refuses a red commit (US2 AS-2)

On a scratch branch with a failing test (reuse the scenario 4 diff), tag `v0.1.1-drill` and push the tag. **Expected**: `quality` turns red, `publish` never starts, `npm view @mlopaev/faster-ui versions` is unchanged. Delete the tag afterwards (`git push origin :refs/tags/v0.1.1-drill`).
