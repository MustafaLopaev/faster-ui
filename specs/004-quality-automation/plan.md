# Implementation Plan: Quality Automation Layer

**Branch**: `004-quality-automation` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-quality-automation/spec.md`

## Summary

Add thirteen automated checks that close what the seven existing CI gates cannot see. Four are deterministic gates that become required immediately (server rendering and hydration, consumer install and build, accessibility, public type surface); five are model-driven pull-request reviews that ship advisory and are never merge-blocking; four run off the pull-request path entirely.

The build order is forced by dependency, not preference: the deterministic gates come first because the model-driven ones read the artifacts they produce — the accessibility report, the surface record, the screenshot set. `ci.yml` gains four jobs and is otherwise untouched; five new workflows carry the rest, so a failure in any new automation is attributable to its own file.

Three findings from Phase 0 shaped the design more than anything in the spec did. The SSR guarantee is **already true** *(verified — all nine variant cases render)*, making that gate a regression guard rather than a repair. The default palette **fails AA by design** — 27 pinned deviations *(verified)* — so axe's `color-contrast` rule must be scoped per palette or the accessibility gate can never go green. And a full visual cross-product would weigh **145 MB** *(projected from measured captures)*, so the matrix is a layered set of 233 cells at roughly 7.7 MB instead. Details: [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript (strict) on React 19 — component code is untouched by this feature

**Styling**: Tailwind CSS v4 token layer — observed by the accessibility and visual checks, never modified (FR-004, spec Out of Scope)

**Build**: Vite library mode — unchanged; the consumer smoke matrix consumes its `npm pack` output rather than its source

**Testing**: Jest + RTL (gains two projects: `ssr.test.tsx` in jsdom, `ssr-node.test.ts` in node) · Cypress (gains an `e2e` section for visual capture and `*.a11y.cy.tsx` specs in the existing component section)

**Documentation**: Storybook — its static build becomes an *input* to visual capture, served by `vite preview --outDir storybook-static` (research R-2)

**CI/CD**: GitHub Actions — `ci.yml` gains four jobs; new: `review.yml`, `visual.yml`, `triage.yml`, `changelog.yml`, `audit.yml`

**Runtime Pin**: Node 22 via `.nvmrc` — unchanged, read by every new job the same way

**Target Platform**: Checks run on `ubuntu-latest`. Visual baselines are **valid for that platform only** (research R-1) — a macOS-captured baseline will not match.

**Project Type**: React component library (single package) — this feature adds automation, fixtures and committed evidence only

**Design Source**: N/A for the automation itself. The drift watcher (C1) compares the TapTap file against `specs/00{1,2}-*/figma-extraction.md`.

**Feature-Specific Dependencies**: Seven new **devDependencies**, zero runtime dependencies. Each justified in Complexity Tracking below. Versions verified on the registry 2026-08-19: `cypress-axe@1.7.0`, `axe-core@4.13.0`, `publint@0.3.24`, `@arethetypeswrong/cli@0.18.5`, `pixelmatch@7.2.0`, `pngjs@7.0.0`, `@anthropic-ai/sdk`. `@microsoft/api-extractor@7.58.12` is **already installed and unused** — this feature wires it rather than adding it.

**Constraints**:

- Gate parity (FR-001) — every new check runs by the same npm script locally and in CI, extending 003's FR-003 contract to thirteen more checks.
- No new runtime dependency (FR-004, Principle VI). Consumer fixtures carry their own manifests and are never part of the root install (research R-8).
- Credential-absent is a **permanent** state, not a transitional one (FR-019): forks never get the secret, so every model-driven job must skip green. Implemented at job level, never with `pull_request_target` (research R-9).
- No model-driven check may be a required check (FR-017), and reference material is read from the base ref so a change cannot edit the rules it is judged against (research R-10).
- Visual baselines are committed images bounded at 12 MB (SC-011, set from measurement in research R-4).
- The existing seven gates and `release.yml` are additive-only (FR-003).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Token-First Styling** — N/A for new visual code; none is added. **Strengthened**: the existing `/token-audit` skill becomes automatic on every component change (FR-021), and the visual jury reads the token contract as its rubric. The token layer is explicitly read-only to this feature.
- [x] **II. Accessibility by Default** — **Directly served, and this is the feature's largest single win.** "Accessibility behavior is asserted in tests, not assumed" is currently unenforced by automation: `a11y: { test: 'error' }` is configured but no test provider is installed *(verified)*. FR-011 makes axe run per variant, per mode, per palette. A11Y-004 adds 200% text scaling (WCAG 1.4.4), which nothing covers today.
- [x] **III. One Consistent Component API** — N/A: no component API changes. **Strengthened**: the surface record (FR-013) makes any change to the exported contract impossible to make silently, and the coverage gate (FR-023) enforces the JSDoc that Principle III's IntelliSense promise depends on.
- [x] **IV. Tested Evidence** — **Directly served.** Adds the three evidence classes the suite lacks: server rendering, real-consumer consumption, and rendered-pixel evidence across cases. All assert observable behaviour, never class names.
- [x] **V. Storybook Contract** — N/A for new stories. **Strengthened**: FR-023 mechanically enforces "one story per variant and per meaningful state" and the Playground requirement, which is currently honoured by discipline alone.
- [x] **VI. Library-First Packaging** — **Directly served.** FR-009/FR-010 verify the packaged artifact the way a consumer receives it. Seven new devDependencies, zero runtime; `react`/`react-dom` stay peers; the `files` whitelist keeps every fixture and baseline out of the tarball.
- [x] **VII. Simplicity** — Passes **with justification** — see Complexity Tracking. Three simplifications were taken deliberately: `vite preview` instead of a static-server dependency (R-2), Cypress e2e instead of a second browser stack (R-1), and the action's `--json-schema` instead of an SDK on the pull-request path (R-11). Rejected as over-engineering: Playwright, lost-pixel, Verdaccio, Storybook's Vitest addon, per-node axe contrast exceptions.

**Post-Phase-1 re-check**: PASS. The design artifacts introduce no new violation. Complexity Tracking carries seven justified devDependencies and one accepted tension (visual baseline weight), all bounded by measured numbers rather than estimates.

**One finding the gate produced before installation**: api-extractor's trial run reported `ae-forgotten-export` for `ButtonBaseProps` *(verified)* — a real pre-existing hole in the public surface. Fixing it changes the public API, which this feature's Out of Scope forbids. Recorded in [data-model.md](./data-model.md) as the first output of the new gate, to be fixed in its own change.

## Project Structure

### Documentation (this feature)

```text
specs/004-quality-automation/
├── plan.md                      # This file
├── research.md                  # Phase 0 output — decisions R-0…R-12
├── data-model.md                # Phase 1 output — check, verdict, baseline, record entities
├── quickstart.md                # Phase 1 output — end-to-end validation guide
├── contracts/
│   ├── deterministic-gates.md   # The four required checks: triggers, commands, verdicts
│   ├── review-jobs.md           # Model-driven jobs: permissions, skip contract, prompts
│   ├── visual-matrix.md         # Capture axes, cell identity, baseline + acceptance rules
│   └── scheduled-agents.md      # C1–C5: drift, triage, changelog, audit, local hooks
├── checklists/requirements.md   # Written by /speckit-specify
└── tasks.md                     # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.github/workflows/
├── ci.yml                       EDIT — +4 jobs: ssr, consumers, a11y, api-surface
├── review.yml                   NEW  — B1 reviewer, B3 semver, B4 token audit, B5 suggestions
├── visual.yml                   NEW  — B2: capture → compare → judge changed cells only
├── triage.yml                   NEW  — C2: on workflow_run failure
├── changelog.yml                NEW  — C3: on push to main, opens a PR
└── audit.yml                    NEW  — C5: weekly schedule, Batch API

api-extractor.json               NEW  — entry: dist/index.d.ts (research R-7)
tsconfig.api.json                NEW  — empty `types` array; scopes analysis (research R-7)
etc/faster-ui.api.md             NEW  — the committed public surface record

src/
├── ssr.test.tsx                 NEW  — renderToString → hydrateRoot, both error spies
├── ssr-node.test.ts             NEW  — imports dist/index.js under testEnvironment: node
└── components/<Name>/
    └── <Name>.a11y.cy.tsx       NEW ×3 — axe per variant × mode × palette

test/consumers/                  NEW  — NOT workspaces; installed against the packed tarball
├── vite-app/                    ESM bundler consumption
├── next-app/                    App Router: SSR + hydrate + explicit styles.css import
└── ts-resolution/               typechecks under bundler | node16 | nodenext

visual/                          NEW
├── matrix.ts                    the 233-cell layered definition (research R-4)
├── fixtures/adversarial.ts      frozen hostile content (FR-028)
├── capture.cy.ts                Cypress e2e capture spec
├── baselines/                   committed PNGs — budget 12 MB (SC-011)
└── rubric.md                    the jury's cached prefix

scripts/
├── api-report.mjs               wraps api-extractor; fails on drift
├── coverage-gate.mjs            props ↔ JSDoc ↔ Playground ↔ variant stories (FR-023)
├── visual-compare.mjs           pixelmatch; emits the changed-cell manifest
└── consumer-smoke.mjs           pack → install → build → assert console clean

.claude/
├── settings.json                NEW — PostToolUse(Edit|Write) + Stop hooks (C4)
└── skills/design-drift/         NEW — C1, local only (research R-12)

package.json                     EDIT — 7 devDeps + scripts for every check above
jest.config.ts                   EDIT — projects[] split for the two SSR environments
cypress.config.ts                EDIT — add the `e2e` section; component section unchanged
```

**Structure Decision**: Confirms the canonical layout with three additions. `test/consumers/` and `visual/` are new top-level directories because neither belongs under `src/` — they are evidence and fixtures, not shipped code, and the `files` whitelist (`dist`, `LICENSE`) already excludes them from the package. `etc/` follows api-extractor's own convention for report location. The `a11y.cy.tsx` specs sit **beside** their components, preserving the co-located contract Principle IV establishes.

## Phased Delivery

The spec's story priorities map onto four phases. Each is independently shippable and leaves the pipeline green.

| Phase | Stories | Delivers | Gate status on completion |
| ----- | ------- | -------- | ------------------------- |
| 1 | US1, US2 | SSR suite, consumer matrix, axe, surface record | Four new **required** checks |
| 2 | US3 | Reviewer, semver classifier, token audit, coverage gate | Advisory comments; measurement begins |
| 3 | US4 | Capture harness, baselines, comparison, jury | Comparison required; judgment advisory |
| 4 | US5, US6 | Drift, triage, changelog, weekly audit, local hooks | Reports only; nothing blocks |

Phase 1 needs no credential and can land before the operator task. Phase 2 needs `ANTHROPIC_API_KEY`. Phase 3 needs Phase 1's Storybook build to be reliable and produces the baseline commit. Phase 4 is order-independent.

## Complexity Tracking

> Constitution Principle VII requires every added dependency to be justified. Seven devDependencies are added; the eighth row is an accepted tension rather than a dependency.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `cypress-axe` + `axe-core` (2 devDeps) | FR-011 requires automated accessibility violations per variant; nothing in the repo runs axe today *(verified)* | Storybook's a11y addon is already installed but its test provider is Vitest-based, which the constitution's Jest mandate forbids. Hand-rolling axe integration means reimplementing injection and result shaping (research R-6) |
| `publint` + `@arethetypeswrong/cli` (2 devDeps) | FR-010 requires the packaged artifact resolve correctly under every module-resolution mode; the existing tarball audit checks only that files exist | Hand-written resolution tests would encode a snapshot of TypeScript's resolution rules that goes stale with each release. Both tools are single-purpose and read the tarball rather than the source (research R-8) |
| `pixelmatch` + `pngjs` (2 devDeps) | FR-025 requires baseline comparison with a stated tolerance | `odiff-bin` is faster but ships a per-platform native binary — an install failure mode for a speed gain that is unmeasurable at 233 cells. Pure-JS keeps macOS and Linux identical (research R-3) |
| `@anthropic-ai/sdk` (1 devDep, `scripts/` only) | FR-038 requires non-blocking checks run on the lower-cost asynchronous path; `claude-code-action` does not expose the Batch API | Using the action for scheduled jobs too would satisfy "off the PR path" but not "lower-cost asynchronous", leaving FR-038 unmet at roughly 2× the spend on the two highest-volume jobs (research R-11) |
| Two new top-level directories (`test/consumers/`, `visual/`) | Consumer fixtures must be installed as real packages, and baselines must be committed and reviewable (FR-029) | Placing them under `src/` would put them in the library's TypeScript projects, Tailwind's `@source` scan and the coverage denominator — all of which they must stay out of |
| Five new workflow files | FR-002 requires each check be individually visible, and a failure must be attributable | One large workflow collapses attribution and makes a failing schedule indistinguishable from a failing review. 003 established one-job-per-gate for the same reason (its research R-1) |
| Two Jest projects instead of one | jsdom *provides* `document`, so a module-scope DOM access passes silently in the only environment the suite runs in | A single jsdom project cannot detect the exact defect FR-008 exists to catch (research R-5) |
| **Accepted tension**: ~7.7 MB of committed baseline images in a repo that budgets 24 KB for its own JS | FR-029 requires baseline acceptance be a reviewable repository change, which rules out external storage | A hosted visual service would keep the repo light but moves review off-platform and adds a service dependency this project has otherwise avoided. Bounded at 12 MB (SC-011) with the token-catalogue outlier excluded — 42× the mean, ~40% of the set on its own (research R-4) |
