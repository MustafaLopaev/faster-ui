# Implementation Plan: CI/CD Pipeline & npm Release

**Branch**: `003-ci-release` | **Date**: 2026-08-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-ci-release/spec.md`

## Summary

Protect every change with a seven-gate GitHub Actions pipeline and automate the npm release, completing Steps 6–7 of the brief. Two workflows: `ci.yml` runs on every branch push and pull request with one job per quality gate (install, lint, typecheck, Jest, Cypress CT, Storybook build, library build), each job invoking the *identical* local npm script; `release.yml` triggers on `v*` tags, re-runs the entire gate suite on the tagged commit by calling `ci.yml` as a reusable workflow, verifies tag ↔ manifest version agreement, then publishes `@mlopaev/faster-ui` to the public npm registry. Node 22 is pinned once in `.nvmrc` (read by both contributors and CI); npm and Cypress-binary caches accelerate runs without being able to change a verdict. The repository is published private on GitHub, reviewers invited, the CI badge added to README, and the whole pipeline verified with a real green run plus a real release (research: [research.md](./research.md)).

## Technical Context

**Language/Version**: TypeScript (strict) on React 19 — untouched by this feature; pipeline runs the existing suites

**Build**: Vite library mode (ESM output, type declarations, `react`/`react-dom` externalized as peers) — invoked via the existing `npm run build`

**Testing**: Jest + React Testing Library (`npm test`) · Cypress Component Testing headless (`npm run cy:ct`) — invoked unchanged in CI

**Documentation**: Storybook (Vite builder) — `npm run build-storybook` as the docs-build gate

**CI/CD**: GitHub Actions — `ci.yml` (7 gate jobs, also `workflow_call`-reusable) + `release.yml` (tag-triggered, gates-then-publish)

**Runtime Pin**: Node 22 via `.nvmrc` (single authoritative declaration; local dev is v22.22.x; CI reads it via `node-version-file`)

**Target Platform**: GitHub-hosted `ubuntu-latest` runners (Chrome/Electron preinstalled — covers Cypress headless); published to registry.npmjs.org

**Project Type**: React component library (single package) — this feature adds automation + packaging metadata only

**Design Source**: N/A (infrastructure feature)

**Feature-Specific Dependencies**: None. No new runtime or dev dependencies. Workflows consume GitHub-hosted actions only (`actions/checkout`, `actions/setup-node`, `actions/cache`), pinned to their current major tags — these live in workflow definitions, not in `package.json`.

**Constraints**:

- Gate parity — every gate executes the exact package script a developer runs locally; no CI-only check logic, flags, or subsets (FR-003). Environment-level install optimizations (cache restore, skipping the unused Cypress binary download in non-Cypress jobs) are permitted only because they cannot alter any gate's verdict (research R-4).
- Caching is outcome-neutral: a cold cache must produce the same verdict (FR-004).
- Publish credentials (`NPM_TOKEN`) are referenced exclusively in the release workflow — structurally unreachable from PR-triggered runs (FR-012).
- Private repository on the personal account; required-check *enforcement* depends on the GitHub plan (research R-6); the red PR verdict is the plan-independent gate.
- Package renames to `@mlopaev/faster-ui` with `publishConfig.access: "public"` (bare name taken on npm; spec clarification).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Token-First Styling** — N/A: no visual code is added or modified; the pipeline's lint/test gates continue to enforce token rules on component code.
- [x] **II. Accessibility by Default** — N/A: no UI surface; the a11y assertions in the existing Jest/Cypress suites become CI-enforced on every push, strengthening this principle's guarantee.
- [x] **III. One Consistent Component API** — N/A: no component API changes; the public export surface is untouched (only the package *name* changes, per spec clarification).
- [x] **IV. Tested Evidence** — Directly served: "All tests pass locally **and in CI** before a task is marked complete" becomes mechanically enforced. The feature itself is verified by real runs (SC-008), including a deliberate-failure drill (quickstart scenario 4).
- [x] **V. Storybook Contract** — N/A for new stories; the Storybook build gate ensures the documentation workbench never silently breaks.
- [x] **VI. Library-First Packaging** — Directly served: "releases are automated through CI, never manual." No new runtime dependencies; `react`/`react-dom` stay peers; published artifact is `dist/` only via the existing `files` whitelist.
- [x] **VII. Simplicity** — One reusable workflow (single source of gate truth) + one thin release workflow. Rejected as over-engineering: semantic-release/changesets, monorepo release tooling, coverage services, matrix builds, Storybook hosting (research R-2, R-8).

**Post-Phase-1 re-check**: PASS — design artifacts introduce no violations; Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/003-ci-release/
├── plan.md              # This file
├── research.md          # Phase 0 output — decisions R-1…R-8
├── data-model.md        # Phase 1 output — pipeline/release/package entities
├── quickstart.md        # Phase 1 output — end-to-end validation guide
├── contracts/
│   ├── ci-workflow.md   # Trigger matrix, the seven gate names, parity table
│   ├── release-workflow.md  # Tag trigger, gating, version rule, abort conditions
│   └── package.md       # Published-package contract (@mlopaev/faster-ui)
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml           # NEW — seven gate jobs; on: push (branches), pull_request, workflow_call
    └── release.yml      # NEW — on: push tags v*; calls ci.yml, verifies version, publishes
.nvmrc                   # NEW — "22"; single authoritative Node pin (local + CI)
package.json             # EDIT — name → @mlopaev/faster-ui, publishConfig.access public
README.md                # EDIT — CI status badge at top, install instructions for scoped name
```

No files under `src/`, `.storybook/`, or `cypress/` are touched.

**Structure Decision**: Two workflow files, not one — CI and release have different triggers, permissions, and secrets exposure (FR-007/FR-012); the gate definitions stay single-sourced by making `ci.yml` reusable via `workflow_call` (research R-5).

## Complexity Tracking

No constitution violations — table intentionally empty.
