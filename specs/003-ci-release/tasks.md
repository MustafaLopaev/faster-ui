# Tasks: CI/CD Pipeline & npm Release

**Input**: Design documents from `/specs/003-ci-release/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Infrastructure feature — no component test tasks (constitution template rule). Every story instead carries **real-run verification tasks** on GitHub: the pipeline is not "done" when the YAML exists, but when the runs prove it (SC-008).

**Organization**: Grouped by user story. US1 (gates) is the MVP; US2 (release) and US3 (reviewer visibility) build on it in priority order — this feature's stories are sequential by nature (release needs gates; evidence needs both).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 (guarded changes), US2 (tag-triggered release), US3 (reviewer visibility)

## Path Conventions (this feature)

- Workflows: `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Node pin: `.nvmrc` · Packaging: `package.json` · Docs: `README.md`
- Nothing under `src/`, `.storybook/`, or `cypress/` is touched

---

## Phase 1: Setup (packaging & environment groundwork)

**Purpose**: The repo-local facts both workflows depend on — pinned Node, scoped package name, and a proven-green local baseline.

- [X] T001 [P] Create `.nvmrc` at the repo root containing exactly `22` — the single authoritative Node declaration (FR-005, research R-3)
- [X] T002 [P] In `package.json`: rename `name` to `@mlopaev/faster-ui` and add `"publishConfig": { "access": "public" }` (research R-5); grep the repo for other hardcoded `faster-ui` name references and list any docs hits for T015 (README is updated there)
- [X] T003 Local parity sweep (quickstart scenario 1): run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `env -u ELECTRON_RUN_AS_NODE npm run cy:ct`, `npm run build-storybook`, `npm run build` — all seven must exit 0 after T001–T002 before any workflow is authored (SC-005 baseline); also confirm `npm pack --dry-run` lists only `dist/` + manifest/README (contracts/package.md)

---

## Phase 2: Foundational (GitHub presence — blocks all story verification)

**Purpose**: The private repository every story's real-run evidence lives in.

**⚠️ CRITICAL**: No story can be *verified* until this phase is complete.

- [ ] T004 Install and authenticate the GitHub CLI: `brew install gh && gh auth login` (verified not installed — research R-8; operator completes the browser auth)
- [ ] T005 Create the private repo and push (quickstart scenario 2): `gh repo create faster-ui --private --source . --remote origin`, then `git push -u origin main 001-foundation-tooling 002-core-components 003-ci-release`; confirm the repo is private and `main` is the default branch (FR-014)

**Checkpoint**: Repository exists on GitHub — workflow runs now have somewhere to happen.

---

## Phase 3: User Story 1 — Every Change Is Guarded by Visible Quality Gates (Priority: P1) 🎯 MVP

**Goal**: Seven distinct, individually visible gate checks run automatically on every push and PR, reusing the exact local scripts; a red gate is unmissable on the PR.

**Independent Test**: A PR shows all seven named checks green; a deliberately broken PR shows exactly its gate red, identifiable without opening logs.

- [X] T006 [US1] Author `.github/workflows/ci.yml` per [contracts/ci-workflow.md](./contracts/ci-workflow.md): triggers `push` (branches `['**']` only), `pull_request`, `workflow_call`; per-ref concurrency with cancel-in-progress; `permissions: contents: read`; job `install` (checkout → setup-node with `node-version-file: .nvmrc` + `cache: npm` → `npm ci`) and six parallel jobs `lint`/`typecheck`/`test`/`cypress`/`storybook`/`build`, each `needs: install`, repeating the setup and running exactly its npm script; `cypress` job restores `~/.cache/Cypress` via `actions/cache` keyed on the locked Cypress version (15.21.0) **before** `npm ci`; the five other gate jobs set `CYPRESS_INSTALL_BINARY=0` on their `npm ci` (research R-1, R-4)
- [ ] T007 [US1] Open the feature PR and verify the first real run (quickstart scenario 3): `git push`, `gh pr create --base main --fill`, `gh pr checks --watch` — expect seven distinct checks (`CI / install` … `CI / build`) all green on a cold cache (FR-001/002/004, SC-001); re-run once to confirm cache hits shorten the run (SC-006); fix any workflow defect and re-verify before proceeding
- [ ] T008 [US1] Red-gate drill (quickstart scenario 4): branch `drill/red-gate`, break one Jest assertion in `src/components/Button/Button.test.tsx`, open a PR titled "DRILL: red gate — close without merging", verify exactly `CI / test` is red while the six others stay green and the failing gate is identifiable from the checks list alone (SC-002/003); close the PR, delete the branch, revert nothing on the feature branch

**Checkpoint**: US1 delivers the MVP — every push/PR is now protected by visible gates.

---

## Phase 4: User Story 2 — Tagging a Version Publishes the Library (Priority: P2)

**Goal**: Pushing `vX.Y.Z` re-proves the full suite on the tagged commit, verifies tag ↔ manifest agreement, and publishes `@mlopaev/faster-ui` publicly — zero manual publish steps.

**Independent Test**: Tag green `main` with `v0.1.0` → package installable at 0.1.0 unauthenticated; a tag on a red commit publishes nothing.

- [ ] T009 [US2] Configure publish credentials: operator creates a granular npm automation token scoped to publish `@mlopaev/faster-ui` (npmjs.com → Access Tokens; claim the `@mlopaev` scope if not yet claimed), then `gh secret set NPM_TOKEN` (FR-012; quickstart prerequisites)
- [X] T010 [US2] Author `.github/workflows/release.yml` per [contracts/release-workflow.md](./contracts/release-workflow.md): trigger `push` tags `v*`; `permissions: contents: read`; job `quality` → `uses: ./.github/workflows/ci.yml`; job `publish` `needs: quality` — checkout → setup-node (`node-version-file: .nvmrc`, `registry-url: https://registry.npmjs.org`) → `npm ci` → `npm run build` → version-match step failing with an explicit message when `${GITHUB_REF_NAME#v}` ≠ `package.json` version → `npm publish` with `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` (FR-007/008/009/010)
- [ ] T011 [US2] Land the feature: merge the PR from T007 into `main` (include T010's commit in it), confirm the post-merge `main` push run is fully green — the tagging baseline (FR-014 evidence begins)
- [ ] T012 [US2] Release for real (quickstart scenario 6): from green `main`, `git tag v0.1.0 && git push origin v0.1.0`, then `gh run watch` — quality suite green on the tagged commit → version check passes → publish succeeds (SC-004)
- [ ] T013 [P] [US2] Verify publication from a clean environment (contracts/package.md hooks): `npm view @mlopaev/faster-ui version` → `0.1.0`; unauthenticated scratch-dir `npm install @mlopaev/faster-ui react react-dom` succeeds; the module exposes `Button`/`Input`/`Dialog`; `npm pack @mlopaev/faster-ui --dry-run` shows `dist/`-only contents with `react`/`react-dom` as peers (FR-009/011)
- [ ] T014 [US2] (Optional drill) Prove release refuses a red commit (quickstart scenario 9): scratch branch with a failing test, tag `v0.1.1-drill`, push tag → `quality` red, `publish` never starts, `npm view @mlopaev/faster-ui versions` unchanged; delete the tag (`git push origin :refs/tags/v0.1.1-drill`) and branch (US2 AS-2)

**Checkpoint**: The library is live on npm behind an ungameable gate chain.

---

## Phase 5: User Story 3 — Reviewers See a Living, Verifiable Pipeline (Priority: P3)

**Goal**: An invited reviewer opens the README, sees the live badge, clicks through to green runs and the release — evidence, not claims.

**Independent Test**: As a collaborator (or fresh owner session): badge renders with current `main` status; run history shows ≥1 fully green suite run and the successful `v0.1.0` release.

- [ ] T015 [US3] Update `README.md`: CI badge at the top (`https://github.com/<owner>/faster-ui/actions/workflows/ci.yml/badge.svg?branch=main`, linked to the workflow run list); install/import docs switched to `@mlopaev/faster-ui` (+ `@mlopaev/faster-ui/styles.css`); setup section notes Node 22 via `.nvmrc`; land it via a small PR to `main` — itself one more piece of green-run evidence (FR-013, research R-7)
- [ ] T016 [US3] Attempt merge-blocking enforcement (quickstart scenario 7): mark the seven `CI / *` checks required on `main` (Settings → Branches or `gh api` ruleset); if the Free plan declines enforcement on the private repo, record that outcome in the PR/commit message — the red verdict remains the gate (FR-006, research R-6)
- [ ] T017 [US3] Evidence audit (quickstart scenario 8): badge renders and tracks `main`; Actions history contains ≥1 fully green CI run and the successful `v0.1.0` release run; capture run URLs in the feature's PR description for the presentation (SC-007/008)
- [ ] T018 [US3] Invite the reviewers as collaborators (`gh api` or Settings → Collaborators; account names provided by the maintainer) — the private-repo access path from the spec clarification

**Checkpoint**: All three stories verified on real infrastructure.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Documentation debt and final parity proof.

- [ ] T019 [P] Update `CLAUDE.md` settled decisions: scoped package name, `.nvmrc` pin, workflow shape (reusable `ci.yml` + tag-triggered `release.yml`), release gating, and the npm-name-taken fact so future sessions don't re-litigate (repo convention from 001/002)
- [ ] T020 [P] Drill-artifact sweep: confirm `drill/red-gate` branch, drill PR, and any `v*-drill` tags are deleted; no stray scratch dirs committed
- [ ] T021 Final full local gate re-run (same seven commands as T003) on post-merge `main` — parity holds after every edit this feature made (SC-005)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately; T001/T002 parallel, T003 after both
- **Foundational (Phase 2)**: needs T003 green (never bootstrap a repo on a red baseline); T005 needs T004
- **US1 (Phase 3)**: needs Phase 2; strictly sequential T006 → T007 → T008
- **US2 (Phase 4)**: needs US1's T007 (gates proven) — T009 anytime after T005, T010 after T006; then T011 → T012 → T013 (T014 optional, after T012)
- **US3 (Phase 5)**: T015 needs T011 (main exists with workflows); T016 after T007; T017 needs T012 + T015; T018 anytime after T005
- **Polish (Phase 6)**: after all desired stories; T019/T020 parallel, T021 last

### Parallel Opportunities

- T001 ∥ T002 (different files)
- T009 (npm token/secret) ∥ T006–T008 (workflow authoring/verification) — different surfaces, no shared files
- T013 ∥ T015 (registry verification vs README edit)
- T019 ∥ T020 (docs vs cleanup)

### Story-level note

The stories are inherently sequential (release gates on CI; evidence needs both), so the parallelism lives *inside* phases, not across them — matching how the pipeline itself works.

---

## Implementation Strategy

**MVP first (Phases 1–3, T001–T008)**: after US1, every push and PR is protected by seven visible gates — the brief's core "protected by automated quality checks" is already true and demonstrable. Stop here and you have a defensible checkpoint.

**Incremental delivery**: US2 turns a green `main` into a published `0.1.0` (one secret + one workflow + one tag). US3 is pure evidence surfacing (badge, enforcement attempt, invitations). Each checkpoint leaves the repo in a presentable state for the review session.

**Operator-assisted tasks**: T004 (gh auth), T009 (npm token), T018 (reviewer names) need the maintainer's accounts/decisions; everything else is executable from the task text alone.

---

## Notes

- Workflow YAML must stay a thin wrapper: every gate runs its npm script verbatim (FR-003) — if a gate needs different behavior, change the *script* so local and CI move together.
- Commit after each task or logical group (conventional commits; e.g. `feat: CI quality-gate workflow`, `feat: tag-triggered npm release workflow`, `docs: CI badge + scoped install instructions`).
- Drill tasks (T008, T014) intentionally create failures — never merge them; their PRs/tags are evidence, then cleanup (T020).
