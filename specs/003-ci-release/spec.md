# Feature Specification: CI/CD Pipeline & npm Release

**Feature Branch**: `003-ci-release`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "CI/CD and npm release for Faster UI, completing Steps 6–7 of the brief (docs/udc-requirements.md). Scope: (1) a CI workflow in .github/workflows that runs on every push and pull request: install dependencies (npm ci with npm cache), lint, typecheck, Jest tests, Cypress component tests headless (cache the Cypress binary), Storybook build, and the production library build — each as a distinct, visible quality gate so a red step blocks merge; (2) a release workflow that packages and publishes the faster-ui npm library, triggered by version tags, gated on the full CI suite passing first; (3) verify the pipeline end to end on GitHub — all steps green on a real run, and the badge added to README. Constraints: no new runtime dependencies; workflows must reproduce exactly what the local commands do (same scripts, no CI-only logic); Node version pinned to match local development."

**Figma Reference**: N/A (infrastructure feature)

## Clarifications

### Session 2026-08-19

- Q: The bare name `faster-ui` is taken on the public npm registry — where should the release publish? → A: Public npm registry under a user-owned scope (working name `@mlopaev/faster-ui`, verified available; exact scope confirmed when the publish credential is configured).
- Q: No git remote exists — where and how visible should the GitHub repository be? → A: Private repository under the personal account, with reviewers invited as collaborators. The published npm package itself remains public.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Every Change Is Guarded by Visible Quality Gates (Priority: P1)

A contributor pushes a commit or opens a pull request. Without any manual action, the full quality suite runs on shared infrastructure: dependency install, lint, type check, unit tests, component tests, documentation build, and production library build. Each check appears as its own named, individually visible gate with a pass/fail verdict, so anyone looking at the run can tell at a glance *which* gate failed. A red gate marks the run failed and stands as the pull request's merge verdict — enforced as a hard block wherever the hosting plan allows required checks on the private repository.

**Why this priority**: This is the core protection the brief asks for — "demonstrate that the component library is protected by automated quality checks." Every other part of this feature (release gating, badge) builds on this pipeline existing and being trustworthy.

**Independent Test**: Push a known-good commit and observe every gate pass. Then push a branch with a deliberately broken check (e.g. a failing test) and observe exactly that gate turn red, the run marked failed, and merging blocked for its pull request.

**Acceptance Scenarios**:

1. **Given** a commit where all local quality commands pass, **When** it is pushed to any branch, **Then** a pipeline run starts automatically and every gate finishes green.
2. **Given** a pull request whose latest commit fails one check (e.g. a type error), **When** the pipeline runs, **Then** exactly the corresponding gate reports failure, the overall run is red, and the pull request displays the failed verdict (hard-blocking the merge where required-check enforcement is available).
3. **Given** any pipeline run, **When** a reviewer opens it, **Then** each of the seven quality gates is listed as a distinct named check with its own pass/fail status — no gate is hidden inside another.
4. **Given** a commit that passes all local quality commands, **When** the pipeline runs the identical commands, **Then** the result matches the local result (a local green never turns CI-red due to differing commands, flags, or runtime versions).

---

### User Story 2 - Tagging a Version Publishes the Library (Priority: P2)

The maintainer decides the library is ready to release. They set the package version, tag the commit with a matching semantic version tag, and push the tag. The release automation first proves the tagged commit passes the complete quality suite, then packages the library and publishes it to the npm registry — with no manual publish steps. A consuming developer can then install the exact released version.

**Why this priority**: The brief's Step 6 ends with "NPM Library Release" and lists "NPM Library" as a deliverable. It depends on User Story 1's gates existing, so it is second.

**Independent Test**: Push a version tag on a commit known to be green and verify the package becomes installable at exactly that version. Separately, push a tag on a commit with a failing check and verify nothing is published.

**Acceptance Scenarios**:

1. **Given** a green commit whose package version matches the tag, **When** a semantic version tag is pushed, **Then** the release runs the full quality suite, packages the library, and publishes it — and the published version equals the tag version.
2. **Given** a tagged commit where any quality gate fails, **When** the release automation runs, **Then** no package is published and the run clearly reports which gate failed.
3. **Given** a tag whose version does not match the package manifest version, **When** the release automation runs, **Then** it aborts before publishing and reports the mismatch.
4. **Given** a published release, **When** a consuming developer installs it, **Then** the installed package contains only the distributable build output (compiled module, type declarations, stylesheet) and declares React as a peer dependency.

---

### User Story 3 - Reviewers See a Living, Verifiable Pipeline (Priority: P3)

A reviewer preparing for the presentation session — invited as a collaborator on the private repository — opens it on GitHub. The README shows a live status badge reflecting the latest pipeline result on the default branch; clicking it leads to the run history where every gate of every run is inspectable. At least one fully green pipeline run and one successful release exist as real, on-record evidence — not just workflow files in the repository.

**Why this priority**: Step 7 of the brief requires the solution to be reviewable on GitHub before the session. Evidence of a working pipeline is what turns the workflow files from claims into proof. It depends on Stories 1 and 2 having run at least once.

**Independent Test**: Open the repository README as an outside reviewer: the badge renders and reflects the latest default-branch run; the run history shows a fully green pipeline run and a successful release run.

**Acceptance Scenarios**:

1. **Given** the repository on GitHub, **When** an invited reviewer views the README, **Then** a status badge shows the current pipeline state of the default branch and links to the run history.
2. **Given** the run history, **When** a reviewer inspects it, **Then** at least one completely green quality-suite run and one successful release run are present on real infrastructure.
3. **Given** the pipeline turns red on the default branch, **When** the README is viewed afterwards, **Then** the badge reflects the failure without any manual update.

### Edge Cases

- A cache is cold or evicted (dependencies or test-browser binary): the run must still succeed identically — caching is a speed optimization, never a correctness dependency.
- A version tag is pushed to a commit that never had a green run: the release must run the full suite itself and refuse to publish on any failure.
- A tag is pushed whose version was already published: the publish fails; the run must surface that clearly rather than silently succeed.
- The tag and the package manifest disagree on the version: abort before publishing anything.
- A pull request from a fork triggers the pipeline: publish credentials must not be exposed to it; only the quality gates run.
- The component-test browser fails to start on the shared runner: this is a red gate like any other — it must fail the run visibly, not be retried into silence.
- Two pushes land in quick succession: each gets its own run; the badge reflects the latest completed default-branch run.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Every push to any branch and every pull request MUST automatically trigger the quality pipeline; no manual step may be required to obtain a verdict.
- **FR-002**: The pipeline MUST expose exactly these checks as distinct, individually visible gates, each with its own pass/fail status: dependency install, lint, type check, unit tests, component tests (headless), documentation (Storybook) build, and production library build.
- **FR-003**: Every gate MUST execute the identical command a developer runs locally (the package scripts already defined) — no CI-only logic, alternate flags, or skipped subsets that could make CI and local results diverge.
- **FR-004**: Dependency installation MUST be reproducible from the committed lockfile. Dependency and test-browser caching MUST be used to keep runs fast, and MUST NOT change any outcome — a cold cache produces the same verdict, only slower.
- **FR-005**: The runtime (Node) version used by the pipeline MUST be pinned to match local development (Node 22) and declared in a single authoritative place that both contributors and the pipeline read.
- **FR-006**: A failure in any gate MUST mark the whole run failed and be prominently reported on the pull request itself; where the hosting plan permits enforcement on a private repository, the gates MUST additionally be configured as required checks that hard-block merging into the default branch.
- **FR-007**: A release MUST be triggered only by pushing a semantic version tag; ordinary pushes and pull requests MUST never publish anything.
- **FR-008**: The release MUST NOT publish unless the complete quality suite (all gates of FR-002) passes for the tagged commit.
- **FR-009**: The release MUST package the library and publish it to the public npm registry under the maintainer's scope (working name `@mlopaev/faster-ui`; the bare name `faster-ui` is already taken). The package manifest MUST be renamed to the scoped name, and the published package MUST be publicly installable without authentication.
- **FR-010**: The published version MUST equal the tag version; on mismatch with the package manifest, the release MUST abort before publishing.
- **FR-011**: The published package MUST contain only the distributable build output (compiled module, type declarations, stylesheet) and MUST declare React as a peer dependency — verifiable by inspecting the packed archive.
- **FR-012**: Publish credentials MUST be available only to the release automation, never to pull-request-triggered runs.
- **FR-013**: The README MUST display a live pipeline status badge for the default branch that links to the run history; on the private repository it renders for authenticated viewers with access (invited reviewers), which satisfies the brief's review requirement.
- **FR-014**: The repository MUST be published on GitHub as a private repository under the maintainer's personal account with reviewers invited as collaborators, and the pipeline MUST be verified end to end there: at least one fully green quality-suite run and one successful release on record.
- **FR-015**: The feature MUST add no new runtime dependencies to the library (constitution Principle VI); changes are limited to automation definitions, repository configuration, the package-manifest rename required by FR-009, and the README badge.

### Exported Surface *(infrastructure feature)*

| Artifact | Consumer | Contract |
| -------- | -------- | -------- |
| Quality pipeline | Contributors, reviewers | Runs on every push and pull request; seven named gates (install, lint, type check, unit tests, component tests, docs build, library build), each individually pass/fail |
| Release pipeline | Maintainer, consuming developers | Triggered by semantic version tags; full quality suite first, then package and publish; version equals tag |
| Status badge | Reviewers (invited collaborators) | In README; live default-branch status; links to run history |
| Pinned runtime version declaration | Contributors, pipeline | Single authoritative Node version (22) both read |
| Published package | Consuming developers | `@mlopaev/faster-ui` on the public npm registry; installable without authentication at each released version; build output only; React as peer |

### Out of Scope

- Hosting or deploying Storybook (the brief requires local Storybook access only).
- Automated version bumping, changelog generation, or release-notes automation — versions are set manually before tagging.
- Coverage reporting, matrix testing across multiple runtime versions, scheduled runs, or automated dependency-update tooling.
- Any change to component code, tokens, tests, or stories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of pushes and pull requests receive an automated verdict with all seven quality gates individually visible — zero changes reach the default branch without one.
- **SC-002**: A deliberately broken change turns exactly its corresponding gate red, and its pull request carries the failed verdict (hard-blocked from merging wherever required-check enforcement is available on the plan).
- **SC-003**: A reviewer can identify which quality gate failed from the run overview alone, without opening any logs.
- **SC-004**: Tagging a green commit yields a package installable at exactly that version with zero manual publish steps; tagging a red commit publishes nothing.
- **SC-005**: A commit that passes all local quality commands also passes the pipeline — zero CI-only failures attributable to command, flag, or runtime-version drift.
- **SC-006**: A warm-cache pipeline run completes in under 15 minutes, and a cold-cache run reaches the same verdict.
- **SC-007**: The README badge reflects the latest default-branch pipeline state without manual updates.
- **SC-008**: The run history on GitHub contains at least one fully green quality-suite run and one successful release run as verifiable evidence.

## Assumptions

- Local development uses Node 22 (v22.22.2 observed); 22 is the version the pipeline pins.
- The maintainer owns (or will claim) the `@mlopaev` scope on the public npm registry — `@mlopaev/faster-ui` was verified unclaimed — and will provide a publish credential as a repository secret during implementation; if their npm username differs, only the scope string changes.
- Branch-protection/required-check *enforcement* on a private repository depends on the GitHub plan (unavailable on Free); the pipeline verdict on pull requests is plan-independent, so FR-006's hard block is enforced when the plan allows and otherwise the red verdict on the PR is the gate.
- Reviewers are invited as collaborators before the presentation session; the npm package, unlike the repository, is publicly visible.
- Semantic versioning per the constitution; release tags follow `vX.Y.Z`, and the first verified release is the current manifest version (0.1.0).
- The maintainer bumps the package manifest version manually before tagging; the release only verifies tag/manifest agreement (FR-010), it never rewrites versions.
- The release runs the full quality suite on the tagged commit itself rather than trusting an earlier run on the same commit — simplest gating that cannot be bypassed.
- "Blocks merge" (FR-006) includes the one-time repository setting that marks the quality gates as required for the default branch; configuring it is part of this feature's verification.
- The GitHub repository does not exist yet; creating it and pushing the history is part of Step 7 and therefore of this feature's end-to-end verification.
- No component, token, test, or story changes are needed — the existing local commands already pass and are the exact commands the pipeline reuses.
