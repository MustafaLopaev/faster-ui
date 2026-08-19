# Feature Specification: Quality Automation Layer

**Feature Branch**: `004-quality-automation`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Quality automation layer — 13 automated checks that close what the seven existing CI gates cannot see, spanning pull-request gates and scheduled agents. Group A (no model): SSR/hydration contract suite, real-consumer smoke matrix, axe running in the Cypress suite. Group B (model-driven, on pull requests): constitution reviewer, visual design jury, API surface diff and semver classifier, token audit as a CI job, story and prop coverage gate. Group C (off the pull-request path): Figma drift watcher, CI failure triage, changelog drafter, local authoring hooks, scheduled deep audit. Constraints: advisory before blocking; fork pull requests get no credentials and `pull_request_target` must not be used to work around it; diff content is untrusted input; local-parity with the FR-003 contract from feature 003; path filters so a docs-only change wakes none of it; stated per-run and per-month cost targets. The credential the model-driven checks need does not exist yet and is an operator task, exactly as NPM_TOKEN was in feature 003."

**Figma Reference**: N/A (infrastructure feature). The visual checks in User Story 4 consume the extraction records at `specs/001-foundation-tooling/figma-extraction.md` and `specs/002-core-components/figma-extraction.md` as their reference of record.

## Motivation

Four gaps found auditing `main` at `2e3cd46` against the code it ships. Each is a promise the repository already makes that nothing currently keeps.

1. **The accessibility gate is configured but never executed.** `.storybook/preview.tsx:19` sets `a11y: { test: 'error' }`. That parameter is consumed by a test provider; none is installed, and `axe-core` is absent from the dependency tree entirely. Constitution Principle II requires accessibility be "asserted in tests, not assumed" — today the automated portion runs only in an addon panel of a browser a human happens to open.
2. **The server-rendering guarantee is a changelog sentence with no test.** `CHANGELOG.md` ships "SSR-safe: no `window` or `document` access at module scope; all three components render under `renderToString`." No file in the repository imports `react-dom/server`.
3. **The public API surface is unwatched.** `@microsoft/api-extractor` sits in `devDependencies` with no configuration file and no script. A breaking change to an exported prop type can ship as a patch release with nothing detecting it.
4. **Nothing has evaluated a rendered pixel across cases.** `src/tokens/tokens.test.ts` computes its contrast matrix by parsing CSS text, never by rendering. The Cypress suite asserts computed colours for a handful of states at one viewport. No viewport but the default, no zoom level but 100%, no text length but each story's own, no writing direction but left-to-right, no reduced-motion pass. Twenty-four stories across two themes, two palettes and three viewports is 288 renderings for which no evidence exists either way.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - The Library's Own Claims Are Proven, Not Asserted (Priority: P1)

A contributor changes a component. Before review, automation proves the three guarantees the package already advertises still hold: it renders and rehydrates cleanly on the server, every variant is free of automatically-detectable accessibility violations in both colour modes and both palettes, and the exported type surface has not changed without someone saying so. Each is a distinct, individually visible gate alongside the seven that already exist, and each fails the run on its own.

**Why this priority**: These close documented gaps between what the package promises and what is verified. They need no credential, no model, and no new judgment — they are the cheapest possible protection and every later story reads the artifacts they produce.

**Independent Test**: Introduce a deliberate regression of each kind on a branch — a `document` reference at module scope, a contrast reduction on a rendered pair, an added required prop on an exported interface — and confirm exactly the corresponding gate turns red while the other two stay green.

**Acceptance Scenarios**:

1. **Given** a component that reads a browser-only global during render, **When** the pipeline runs, **Then** the server-rendering gate fails and names the component and the offending access.
2. **Given** a component whose markup differs between the server-rendered pass and the client rehydration pass, **When** the pipeline runs, **Then** the server-rendering gate fails and reports the mismatch, including cases the framework recovers from silently at runtime.
3. **Given** a change that introduces an automatically-detectable accessibility violation in any variant, **When** the pipeline runs, **Then** the accessibility gate fails, naming the component, the variant, the colour mode, the palette, and the rule violated.
4. **Given** the palette's known, recorded contrast deviations, **When** the accessibility gate runs, **Then** those specific pairs are accepted as documented exceptions and any *new* or *widened* deviation fails the gate.
5. **Given** a change to any exported type, **When** the pipeline runs, **Then** the surface gate fails unless the committed record of the public surface was updated in the same change.
6. **Given** an unchanged commit, **When** the pipeline runs twice, **Then** all three gates return identical verdicts.

---

### User Story 2 - The Published Package Works Where People Install It (Priority: P1)

A consuming developer installs the package into their application and it simply works — in a client-rendered build, in a server-rendered framework, and under every module-resolution mode a TypeScript project might use. The pipeline proves this by consuming the package the same way they would: packing it, installing the archive into throwaway applications, and building each one.

**Why this priority**: The existing build gate verifies that files *exist* in the archive. It does not verify they *work*. A server-rendered consumer application is also the highest-signal rehydration check available, because it exercises the framework's client-boundary rules, real streaming server rendering, and stylesheet import order at once — none of which a unit test can reach.

**Independent Test**: Publish a deliberately malformed package locally (a wrong entry-point condition, a missing stylesheet export) and confirm the consumer gate fails while every existing gate stays green.

**Acceptance Scenarios**:

1. **Given** a packed archive of the library, **When** it is installed into a client-rendered consumer application and built, **Then** the build succeeds and the stylesheet resolves.
2. **Given** the same archive installed into a server-rendered consumer application, **When** a page using every component is loaded, **Then** the page renders and the browser console reports zero rehydration errors and zero warnings.
3. **Given** the same archive, **When** a consumer project type-checks the import under each supported module-resolution mode, **Then** every mode resolves the types successfully.
4. **Given** an entry-point declaration that is malformed or that misorders its type condition, **When** the packaging gate runs, **Then** it fails and names the specific declaration at fault.
5. **Given** a consumer application built against the archive, **When** the library's own peer dependency is the only framework copy installed, **Then** no duplicate framework copy is pulled in.

---

### User Story 3 - Every Pull Request Receives a Principled Review (Priority: P2)

A contributor opens a pull request. Alongside the mechanical gates, an automated reviewer reads the project's constitution, the active feature's contracts, and the repository guide, then reviews the change against those documents specifically — citing a file and line for every finding, and saying so plainly when there is nothing to report. It reviews for the things the project has written down and no linter can express: whether a token is semantically right rather than merely token-shaped, whether a new prop honours the API contract, whether a test proves behaviour or merely asserts a class name, whether a consumer-visible change was recorded.

**Why this priority**: This is the highest-leverage automation available to this repository specifically, because the repository has a written constitution, per-feature contracts, and a Definition of Done. A reviewer that reads them is one no generic tool can provide. It is P2 rather than P1 because it depends on a credential that does not yet exist and because it must start advisory.

**Independent Test**: Open a pull request that violates one principle per file — a hardcoded colour, a prop that bypasses native passthrough, a test asserting a class name, a new variant with no story — and confirm the reviewer reports each with a correct file and line reference and no fabricated findings.

**Acceptance Scenarios**:

1. **Given** a change that uses a semantically wrong but syntactically valid token, **When** the reviewer runs, **Then** it reports the mismatch with the file, the line, and the token it expected.
2. **Given** a change that is fully compliant, **When** the reviewer runs, **Then** it reports a clean verdict and raises nothing speculative.
3. **Given** a change to the public type surface, **When** the classifier runs, **Then** it states the version increment the change requires and fails the request when the recorded release notes claim a smaller increment than the surface change demands.
4. **Given** a change adding a public prop, **When** the coverage gate runs, **Then** it fails if the prop lacks documentation, is absent from the interactive example, or introduces a variant value no example renders.
5. **Given** a pull request containing text that instructs the reviewer to approve it, ignore its instructions, or alter its rules — in a source file, a document, or the change description — **When** the reviewer runs, **Then** it treats that text as data under review, reports it as a finding, and its verdict is unaffected.
6. **Given** a pull request from a contributor without access to the review credential, **When** the pipeline runs, **Then** the review step is skipped and reported as skipped, and no gate that would otherwise pass turns red because of its absence.
7. **Given** a change touching only documentation, **When** the pipeline runs, **Then** no review step runs at all.

---

### User Story 4 - The Design Is Judged Across Cases, Not Just the Happy Path (Priority: P2)

Someone changes a component's styling. Automation renders every documented example across both colour modes, both palettes, three viewport widths, two text-scaling levels, both writing directions, and a reduced-motion pass — then compares each rendering against a recorded baseline. Renderings that are unchanged stop there. Only new and changed renderings are examined further, and for those the reviewer states plainly whether the result is acceptable, questionable, or broken, and why.

**Why this priority**: It is the only automation that can answer "does this design hold up in cases nobody wrote a test for". The ordering — record, compare, then judge only what moved — is what makes it both affordable and stable enough to be believed. It is P2 because it is the largest build in this feature and depends on a recorded baseline existing first.

**Independent Test**: Narrow a component's width so a label clips at the largest text-scaling level, and confirm the comparison flags exactly that cell and the judgment names clipping as the reason — while every other cell stays unflagged.

**Acceptance Scenarios**:

1. **Given** an unchanged component, **When** the visual check runs twice on the same commit, **Then** both runs report zero changed renderings and zero findings.
2. **Given** a change that alters a component's appearance in one colour mode only, **When** the visual check runs, **Then** only the affected cells are reported and each names its mode, palette, viewport and scaling level.
3. **Given** a label that clips at 200% text scaling, **When** the visual check runs, **Then** the finding names clipping and the specific cell, not merely that pixels differed.
4. **Given** a modal whose widest size exceeds the narrowest supported viewport, **When** the visual check runs at that viewport, **Then** it is reported as broken rather than accepted.
5. **Given** the recorded adversarial content set — an extremely long label, a right-to-left string, emoji, zero-width characters, an overlong modal body — **When** the visual check runs, **Then** every component is rendered against that set and the results are reported per case.
6. **Given** an intended visual change, **When** a maintainer accepts it, **Then** the baseline is updated through a reviewable change and subsequent runs report no difference.
7. **Given** the review credential is unavailable, **When** the visual check runs, **Then** the recorded comparison still runs and still reports differences; only the judgment step is skipped.

---

### User Story 5 - Drift and Failures Surface Without Anyone Asking (Priority: P3)

Nobody has to remember to check. On a schedule, automation compares the design source of record against the token layer and opens a report of what moved. When the pipeline fails, automation reads the failure and says whether it is a real regression, a known intermittent failure, or infrastructure. When a change lands, automation drafts the consumer-facing release note it warrants. Weekly, the standing production audit runs against the default branch and its findings are compared with the previous week's, so slow drift — a size budget creeping toward its ceiling, coverage sliding toward its floor — becomes visible before it becomes a problem.

**Why this priority**: All four remove recurring manual work and none blocks anybody. They are last because they add no protection a pull request depends on, and one of them cannot run on shared infrastructure at all.

**Independent Test**: Change a value in the design source and confirm the next scheduled comparison reports exactly that value as drift, while every value recorded as a deliberate deviation is not reported.

**Acceptance Scenarios**:

1. **Given** a value that changed in the design source since extraction, **When** the comparison runs, **Then** it is reported with its old and new values and where the token layer defines it.
2. **Given** a value that the extraction records as a deliberate, documented deviation from the design source, **When** the comparison runs, **Then** it is not reported as drift.
3. **Given** a pipeline failure matching a documented intermittent-failure pattern, **When** triage runs, **Then** it classifies the failure as intermittent, names the pattern, and does not report it as a regression.
4. **Given** a change that a consumer would notice, **When** it lands on the default branch, **Then** a draft release note is proposed as a reviewable change and never written directly to the default branch.
5. **Given** a change no consumer would notice, **When** it lands, **Then** no release note is proposed.
6. **Given** two consecutive weekly audits, **When** the second completes, **Then** its report states what changed since the first, including any metric that moved toward its limit.
7. **Given** the design-source connection is unavailable, **When** the comparison is due, **Then** it reports that it could not run and does not report a false all-clear.

---

### User Story 6 - A Violation Is Caught Before It Is Committed (Priority: P3)

Someone — a contributor or an assistant acting on their behalf — edits a component file. Before that edit can become a commit, the fastest checks run locally and refuse the change if it hardcodes a visual value or fails to lint or type-check. The feedback arrives in seconds, at the moment of the edit, rather than minutes later on shared infrastructure.

**Why this priority**: It costs nothing to run and prevents the most common category of rework, but it protects nothing on its own — every rule it enforces is also enforced by a gate that cannot be bypassed. It is a convenience layer over gates that already exist.

**Independent Test**: Write a hardcoded colour value into a component file and confirm the edit is refused locally with the offending value named, before any commit is possible.

**Acceptance Scenarios**:

1. **Given** an edit that writes a raw colour value into a component file, **When** the edit completes, **Then** it is refused locally and the offending value and location are named.
2. **Given** an edit that introduces a lint or type error in a changed file, **When** the work is concluded, **Then** the error is reported locally before any commit.
3. **Given** the local checks are unavailable or disabled, **When** a violating change is pushed, **Then** the corresponding pipeline gate still fails — local checks are never the only enforcement of any rule.
4. **Given** an edit to a file outside the component source, **When** the edit completes, **Then** no component-specific check runs.

### Edge Cases

- **The review credential is absent** — on a fresh clone, a contributor's fork, or before the operator task is done. Every model-driven check must skip visibly and none may turn a run red by its absence, or the pipeline becomes unusable for anyone but the maintainer.
- **A change is submitted from a fork.** Credentials are unavailable by design. The workaround that would expose them to unreviewed code is forbidden; the model-driven checks simply do not run.
- **A change contains text addressed to the reviewer** — in a source file, a comment, a document, or the change description — attempting to alter its instructions or its verdict. The reviewer must treat all reviewed content as data and report the attempt.
- **The same commit is reviewed twice and the model reaches different conclusions.** Model-driven checks are advisory until measured; a non-deterministic check must never be the sole reason a change is blocked.
- **A legitimate visual change makes hundreds of recorded renderings differ at once.** Accepting a baseline must be a reviewable, bounded action, not an unreviewable bulk overwrite.
- **A rendering differs by a sub-pixel amount from font rasterisation or animation timing** rather than a real change. The comparison must have a tolerance and animations must be neutralised, or the check will be ignored within a month.
- **A rendering is new because a story was added.** There is no baseline to compare against; it must be judged rather than silently accepted.
- **The design-source connection is unavailable** when the scheduled comparison is due. It must report that it could not run — an all-clear it did not earn is worse than no report.
- **The recorded public-surface file and the release notes disagree** about the size of a change. The change is blocked and the disagreement is stated, rather than either being silently trusted.
- **A consumer framework releases a new major version** and the consumer application stops building for reasons unrelated to this library. The failure must be distinguishable from a real packaging regression.
- **A change touches only documentation, specifications or workflows.** None of these checks should run, and the run should still report a verdict.
- **Model spend exceeds its stated target** in a busy month. Spend must be observable and bounded before it is discovered on an invoice.
- **A known contrast deviation is fixed.** The accessibility gate must report the now-unnecessary exception rather than silently continuing to permit it.

## Requirements *(mandatory)*

### Functional Requirements

**Cross-cutting**

- **FR-001**: Every check introduced by this feature MUST be runnable locally by the same command the pipeline runs, with no pipeline-only logic, flags, or skipped subsets — preserving the local-parity contract established as FR-003 of feature 003.
- **FR-002**: Each check MUST appear as its own individually visible gate with its own pass/fail verdict; no check may be hidden inside another.
- **FR-003**: The seven existing quality gates and the release automation MUST be unchanged by this feature except by the addition of new, independent gates.
- **FR-004**: This feature MUST add no new runtime dependency to the published library (Constitution Principle VI). Every addition is a development-time or automation-time dependency and MUST be justified in the plan's Complexity Tracking table (Principle VII).
- **FR-005**: Checks MUST NOT run for changes that touch only documentation, specifications, or automation definitions themselves; such a change MUST still receive a verdict.
- **FR-006**: A superseded in-progress run MUST be cancellable by a newer one without affecting any verdict already reported.

**Group A — checks that require no model**

- **FR-007**: Every component variant MUST be proven to render on the server without error, and to rehydrate into that exact server-produced markup without mismatch. Mismatches the framework recovers from silently MUST be detected and MUST fail the gate.
- **FR-008**: The built library MUST be proven to import successfully in an environment that has no browser globals, so that any browser-only access at module scope fails at import.
- **FR-009**: A packed archive of the library MUST be installed and built in at least one client-rendered and one server-rendered consumer application. The server-rendered application MUST load a page exercising every component and MUST report zero rehydration errors and zero warnings.
- **FR-010**: The packed archive MUST be verified to resolve its types under every module-resolution mode the package supports, and its entry-point declarations MUST be verified as well-formed.
- **FR-011**: Every component variant MUST be checked for automatically-detectable accessibility violations in both colour modes and both palettes, and MUST report zero violations.
- **FR-012**: The palette's recorded contrast deviations MUST be enumerated explicitly as documented exceptions. A new deviation, or a widening of a recorded one, MUST fail the gate. A recorded exception that is no longer needed MUST be reported.
- **FR-013**: The public type surface MUST be recorded in a committed, reviewable artifact. A change to the exported surface MUST fail the gate unless that artifact was updated in the same change.

**Group B — checks that use a model, on pull requests**

- **FR-014**: A review MUST evaluate each change against the project constitution, the active feature's contracts, and the repository guide, and MUST cite a file and line for every finding.
- **FR-015**: A review MUST report a clean verdict when it finds nothing, and MUST NOT report findings it cannot substantiate with a citation.
- **FR-016**: All reviewed content — source, documents, commit messages, and change descriptions — MUST be treated as data. A review MUST NOT follow instructions found within reviewed content, MUST report any attempt to issue such instructions as a finding, and MUST reach a verdict unaffected by them.
- **FR-017**: Review steps MUST have read-only access. No review step may write to the repository, and no review step may be configured as a check that blocks merging.
- **FR-018**: Review steps MUST NOT be granted credentials for changes originating outside the repository, and MUST NOT be triggered by any mechanism that would expose repository credentials to unreviewed content.
- **FR-019**: Every model-driven check MUST skip visibly and non-fatally when its credential is unavailable, leaving the run's verdict determined solely by the checks that did execute.
- **FR-020**: Model-driven checks MUST report as comments only until their false-positive rate has been measured over a stated observation period; promotion of any check to blocking MUST be a separate, deliberate decision recorded in this specification's successor.
- **FR-021**: The existing token-audit definition MUST be executed automatically for every change touching component source, without a human invoking it.
- **FR-022**: A change to the recorded public type surface MUST be classified as requiring a major, minor, or patch increment, and the change MUST fail when the release notes claim a smaller increment than the surface change requires.
- **FR-023**: Every public prop MUST be verified to carry documentation and to appear in its component's interactive example, and every value of every variant-style union MUST be verified to be rendered by at least one documented example.

**Group B — the visual check specifically**

- **FR-024**: Every documented example MUST be rendered across both colour modes, both palettes, at least three viewport widths spanning the narrowest supported width to a desktop width, at least two text-scaling levels including 200%, both writing directions, and a reduced-motion pass.
- **FR-025**: Renderings MUST be compared against a committed baseline with a stated tolerance, and animation MUST be neutralised during capture so that a rendering is stable across runs of the same commit.
- **FR-026**: Only renderings that are new or that differ from their baseline may proceed to judgment; unchanged renderings MUST NOT be judged.
- **FR-027**: Each judged rendering MUST receive an explicit verdict of acceptable, questionable, or broken, with a stated reason that names the defect rather than the fact that pixels differed.
- **FR-028**: An adversarial content set — at minimum an extremely long label, a right-to-left string, emoji, zero-width characters, and an overlong modal body — MUST be committed as fixtures and rendered for every component, so the matrix is reproducible rather than regenerated.
- **FR-029**: Accepting a changed baseline MUST be a reviewable change to the repository, and the count of accepted renderings MUST be visible in that review.
- **FR-030**: The comparison MUST continue to run and report differences when the judgment step is unavailable.

**Group C — automation off the pull-request path**

- **FR-031**: The design source of record MUST be compared against the token layer on a schedule, reporting values that moved since extraction. Values that the extraction records document as deliberate deviations MUST NOT be reported as drift.
- **FR-032**: The design comparison MUST report explicitly when it could not run, and MUST NOT report an all-clear it did not establish.
- **FR-033**: A pipeline failure MUST be classified as a real regression, a known intermittent failure, or an infrastructure failure, and the classification MUST name the documented pattern it matched when it claims an intermittent failure.
- **FR-034**: A consumer-visible change landing on the default branch MUST produce a draft release note as a proposed change for review. Nothing may write to the default branch directly, and a change no consumer would notice MUST produce no note.
- **FR-035**: The standing production audit MUST run on a schedule against the default branch, and each report MUST state what changed since the previous report.
- **FR-036**: Local authoring checks MUST refuse an edit that hardcodes a visual value in component source, and MUST report lint and type errors in changed files before a commit. Every rule they enforce MUST also be enforced by a pipeline gate, so that disabling them weakens feedback speed and never weakens protection.

**Cost and observability**

- **FR-037**: Repeated model-driven checks MUST reuse their stable reference material rather than resending it, and the effectiveness of that reuse MUST be observable.
- **FR-038**: Checks whose results are not needed to decide a pull request MUST run on the lower-cost asynchronous path.
- **FR-039**: Model spend MUST be observable per run and per month against the targets stated in Success Criteria, and MUST be discoverable from the automation's own output rather than from a billing statement.

### Exported Surface *(infrastructure feature)*

| Artifact | Consumer | Contract |
| -------- | -------- | -------- |
| Server-rendering gate | Contributors, consuming developers | Every variant renders and rehydrates cleanly; the built library imports without browser globals |
| Consumer smoke gate | Consuming developers | The packed archive installs and builds in client- and server-rendered applications, and resolves types under every supported module-resolution mode |
| Accessibility gate | End users, contributors | Zero automatically-detectable violations per variant, per mode, per palette; recorded deviations enumerated as explicit exceptions |
| Public surface record | Maintainer, consuming developers | A committed, reviewable file describing the exported type surface; changes to it are deliberate |
| Automated review | Contributors, reviewers | Advisory comments citing file and line, evaluated against the constitution and the active feature's contracts |
| Version-increment classification | Maintainer | The increment a surface change requires; disagreement with the release notes blocks the change |
| Visual baseline set | Contributors, designers | A committed record of every documented example across the case matrix; changes to it are reviewed |
| Visual findings | Contributors, designers | Per-rendering verdict and reason for new and changed cells only |
| Adversarial content fixtures | Contributors | A committed, frozen set of hostile content every component is rendered against |
| Design drift report | Maintainer, designers | Scheduled comparison of the design source against the token layer, excluding recorded deviations |
| Failure classification | Contributors, maintainer | Real regression, known intermittent failure, or infrastructure — with the matched pattern named |
| Draft release notes | Maintainer | A proposed change containing the consumer-facing note a landed change warrants |
| Drift-over-time report | Maintainer | Scheduled audit findings diffed against the previous report |
| Local authoring checks | Contributors, assistants | Immediate refusal of hardcoded visual values and of lint or type errors in changed files |

### Check Inventory

The complete set this feature delivers. "Blocking" states the intended end state; every model-driven check ships advisory first per FR-020.

| # | Check | Trigger | Needs credential | Blocking |
| - | ----- | ------- | ---------------- | -------- |
| A1 | Server rendering and rehydration | every change | no | yes, from day one |
| A2 | Consumer install and build matrix | every change | no | yes, from day one |
| A3 | Accessibility violations per variant | every change | no | yes, from day one |
| A4 | Public type surface record | every change | no | yes, from day one |
| B1 | Constitution and contract review | pull request, component source | yes | never — advisory by FR-017 |
| B2a | Visual comparison against baseline | pull request, component or token source | no | yes, once baselines are stable |
| B2b | Visual judgment of changed cells | pull request, changed cells only | yes | advisory until measured |
| B3 | Version-increment classification | pull request changing the surface record | yes | advisory until measured |
| B4 | Token audit | pull request, component source | yes | advisory until measured |
| B5 | Documentation and example coverage | pull request, component source | partly | detection blocking; suggestion advisory |
| C1 | Design-source drift | schedule | yes | no — reports only |
| C2 | Failure classification | pipeline failure | yes | no — reports only |
| C3 | Draft release notes | merge to default branch | yes | no — proposes only |
| C4 | Local authoring checks | local edit | no | locally, yes; never the sole enforcement |
| C5 | Scheduled deep audit | schedule | yes | no — reports only |

### Accessibility Requirements

- **A11Y-001**: Automatically-detectable violations MUST be checked for every component variant in both colour modes and both palettes — the state matrix already recorded in feature 002, not a sample of it.
- **A11Y-002**: The recorded contrast deviations of the Figma-faithful palette MUST be enumerated individually as named exceptions with their measured ratios. A deviation not on that list, or one that has widened, MUST fail.
- **A11Y-003**: The opt-in accessible palette MUST be verified to reach the AA baseline for every rendered pair in both colour modes, preserving the guarantee the current token contract test already makes.
- **A11Y-004**: Text scaling to 200% MUST NOT clip, truncate, or overlap any label, message, or control in any component (WCAG 2.1 success criterion 1.4.4).
- **A11Y-005**: A reduced-motion rendering pass MUST confirm that no component animates when motion is not wanted.
- **A11Y-006**: Right-to-left rendering MUST be captured for every component so that directional layout defects are visible, even where right-to-left support is not yet a stated guarantee.

### Token Dependencies

- Consumes: the entire semantic token layer and the opt-in accessible overlay, as the reference the accessibility and visual checks measure against; the recorded extraction files, as the reference the design-drift comparison measures against.
- Introduces: no new tokens. This feature observes the token layer and must never modify it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every one of the four documented gaps is closed by a check that fails when the gap is deliberately reopened — verified once per gap by a red run on a throwaway branch.
- **SC-002**: 100% of component variants are covered by the server-rendering, accessibility and visual checks — coverage is the recorded state matrix in full, not a sample.
- **SC-003**: A contributor can run every check introduced by this feature locally with the same commands the pipeline uses, and a local pass never becomes a pipeline failure attributable to differing commands, flags, or runtime versions.
- **SC-004**: A run on a change that touches only documentation completes without executing any check introduced by this feature.
- **SC-005**: A contributor without the review credential — including anyone working from a fork — receives a complete, non-red verdict from every check that does not require one.
- **SC-006**: Repeating the visual comparison on an unchanged commit reports zero differing renderings, ten times out of ten.
- **SC-007**: Over a stated observation period of at least twenty reviewed changes, each model-driven check's false-positive rate is recorded, and no check is promoted to blocking until its recorded rate is at or below one in twenty.
- **SC-008**: A pull request containing text that attempts to instruct the reviewer is reported as such and its verdict is unchanged from the same change without that text.
- **SC-009**: Model spend stays at or below a stated target of roughly twenty dollars per month at present change volume, and per-run spend is visible in the automation's own output.
- **SC-010**: A warm-cache run of the complete pipeline, existing gates plus new ones, still completes within the fifteen-minute budget feature 003 established.
- **SC-011**: The committed visual baseline set stays within a stated repository-weight bound, and accepting a baseline change is a reviewable action whose scope is visible in the review.
- **SC-012**: A value changed in the design source is reported by the next scheduled comparison, and no value recorded as a deliberate deviation is ever reported as drift.
- **SC-013**: Every rule enforced locally is also enforced by a pipeline gate — verified by disabling the local checks entirely and confirming an offending change still fails.

## Assumptions

- **Credential**: The credential the model-driven checks require does not exist yet. Providing it is an operator task performed during implementation, exactly as the publish credential was in feature 003. Until it exists, every model-driven check skips and the pipeline remains fully green — this is a permanent property, not a temporary state, because forks will never have it.
- **Advisory period**: "Measured" in FR-020 and SC-007 means at least twenty reviewed changes. If change volume makes that period impractically long, the checks stay advisory rather than being promoted on a smaller sample.
- **Visual baselines** live in the repository as committed image files, because the alternative — an external service — would introduce a hosted dependency this project has otherwise avoided, and because a reviewable baseline change is itself a requirement (FR-029). The repository-weight bound in SC-011 is the constraint this choice must respect; if the matrix cannot fit within it, the matrix is narrowed rather than the bound raised silently. This mirrors how the distribution size budget is treated.
- **Viewport set**: 360, 768 and 1280 pixels wide, as the narrowest commonly supported phone width, a tablet width, and a desktop width. The largest modal size is 900 pixels wide, so the narrowest viewport is deliberately chosen to exercise the case where it cannot fit.
- **Consumer applications** used by the smoke matrix track the current stable release of each framework. When a framework's own major release breaks the consumer application for reasons unrelated to this library, that is triaged as an infrastructure failure under FR-033 rather than a packaging regression.
- **The design-source comparison cannot run on shared infrastructure**, because its connection to the design source is authenticated locally. It runs as a scheduled or on-demand local routine, and its output is a report rather than a gate. This is the one automation in this feature that is not part of the pipeline.
- **The repository is private** with reviewers invited as collaborators (feature 003's clarification). Fork-originated changes are therefore rare today, but the credential-exposure rules in FR-018 are written to hold if that ever changes.
- **The existing token contract test remains the authority** on token-layer correctness. The checks in this feature observe rendered output; they do not duplicate or replace the computed contrast matrix already in place.
- **Storybook's own test integrations are not used.** The accessibility check joins the component-test suite that already exists, because the constitution mandates Jest over Vitest and Storybook's current test integration is Vitest-based. The documented-example build remains a gate in its own right.

## Out of Scope

- Any change to component behaviour, token values, or the public API. This feature only observes; a finding it produces is fixed in its own change.
- Promoting any model-driven check to a merge-blocking status. That decision requires the measurement this feature produces and belongs to a successor feature.
- Automated version bumping or automated publishing decisions. The version-increment classification advises; the maintainer still sets the version and pushes the tag, per feature 003.
- Automated dependency updates beyond what is already configured.
- Cross-browser and cross-platform rendering. The visual matrix runs on one browser engine on the pipeline's platform; rendering differences between engines are not in scope.
- Performance budgets beyond the distribution size budget that already exists.
- Any model-driven check that writes to the repository. Every automation in Group C proposes; none commits.
