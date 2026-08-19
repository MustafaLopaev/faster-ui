# Research: Quality Automation Layer

All unknowns from the Technical Context resolved. Facts marked *(verified)* were checked against this machine, the built `dist/`, the live npm registry, or the action's published definition on 2026-08-19/20. Everything else is a design decision derived from those facts.

## R-0 — Baseline reality check: the SSR claim is currently TRUE

**Finding**: All nine variant cases — three Button shapes, four Input shapes, Dialog open and closed — render under `renderToString` against the built `dist/index.js` with no error *(verified: 589–1919 bytes each, zero failures)*. `dist/index.js` contains **no CSS import at all** *(verified)*; the stylesheet is a separate entry point the consumer imports.

**Why this matters**: FR-007 is a **regression guard, not a bug fix**. The plan must not be written as though it is repairing something broken — it is nailing down a property that currently holds by accident of good discipline and has nothing keeping it that way. This also sets the acceptance bar: the new suite must pass on the first commit that introduces it, and any failure at that point is a bug in the test, not in the library.

**Consequence for the consumer app**: because the JS bundle never imports CSS, a server-rendered consumer must import `styles.css` explicitly. The Next.js fixture therefore exercises a real, documented consumer step rather than relying on a side-effect import.

## R-1 — Visual capture harness: Cypress e2e, not Playwright and not lost-pixel

**Decision**: Add an **e2e** section to the existing `cypress.config.ts` that drives a browser over the built static workbench. Component testing keeps its own section unchanged.

**Rationale**: The constitution's Mandated Stack fixes Cypress for component tests; it says nothing about story-level capture, but adding a *second* browser automation stack for one job is exactly the speculative complexity Principle VII forbids. Cypress e2e against the static workbench works *(verified: 15 screenshots captured across 5 stories × 3 viewports, 15/15 passing)*. The binary is already cached in CI by the existing `cypress` job, so capture adds no install cost. Viewport control is native; writing direction is a `dir` attribute on the story root; reduced motion is a CDP `Emulation.setEmulatedMedia` call through `Cypress.automation('remote:debugger:protocol', …)` — the same channel `cypress-real-events` already uses for the pseudo-state matrix.

**Alternatives considered**:
- *Playwright*: better native device/media emulation and a first-class `toHaveScreenshot` with built-in tolerance. Rejected: a second browser stack, a second binary to cache, a second config language, and a second flake vocabulary for the triage agent (C2) to learn — all to replace a tool that is already installed, already cached, and already verified to do the job.
- *lost-pixel*: would supply capture *and* comparison in one dependency. Rejected: it bundles Playwright underneath (so it inherits the objection above), and its ergonomics assume its hosted platform for review — this feature requires baseline acceptance to be a reviewable repository change (FR-029), which is a different model.
- *Storybook's own test integration*: Vitest-based, and the constitution mandates Jest over Vitest. Rejected on the same grounds as R-6.

**Known risk**: Cypress screenshots capture the viewport, not the full page, and its retina handling differs across platforms. Capture must therefore be pinned to a single runner platform, and the baseline set is only valid for that platform — recorded as a constraint in the contract, not discovered later.

## R-2 — Serving the static workbench: `vite preview`, no new dependency

**Decision**: Serve `storybook-static` for capture with `vite preview --outDir storybook-static --strictPort`.

**Rationale**: The capture step needs an HTTP origin; `file://` will not do because the workbench fetches `index.json`. Vite is already a dependency and `vite preview` serves an arbitrary output directory — `iframe.html` and `index.json` both return 200 *(verified)*. This removes an entire class of dependency (`http-server`, `serve`, `sirv-cli`) for free.

**Note**: `vite preview` binds `localhost`, not `127.0.0.1` — a request to the literal loopback address fails *(verified: `000` vs `200`)*. The capture config must use `localhost`. This is exactly the kind of detail that costs an hour if it is discovered during implementation instead of now.

**Alternatives considered**: `http-server`/`serve` via npx (unpinned fetch at CI time breaks lockfile reproducibility — rejected); adding one as a devDependency (a dependency for something an existing dependency already does — rejected); `storybook dev` (a full dev server with HMR, far slower and non-deterministic for capture — rejected).

## R-3 — Pixel comparison: `pixelmatch` + `pngjs`, with an explicit anti-flake protocol

**Decision**: Compare with `pixelmatch@7.2.0` over `pngjs@7.0.0` *(both verified on the registry)*. A cell fails when more than 0.1% of its pixels differ at a per-pixel threshold of 0.1.

**Rationale**: At this matrix size the comparison is I/O-bound, not CPU-bound, so a native engine buys nothing measurable. Both packages are pure JavaScript with no platform binaries, no postinstall, and no lockfile fragility across the macOS development machine and the Linux runner.

**Anti-flake protocol** — a visual check that cries wolf is disabled within a month (spec edge case), so these are requirements of the design rather than tuning:
1. Animation is neutralised at capture by injecting a stylesheet that zeroes `animation-duration` and `transition-duration`. The Button spinner (`fui:animate-spin`) is otherwise a guaranteed per-run difference.
2. Web fonts must be awaited (`document.fonts.ready`) before capture; Nunito Sans is served from the workbench build and a capture that races it produces a fallback-font diff on every cell.
3. Capture runs on one pinned runner platform only (R-1).
4. The caret is suppressed; a focused Input otherwise blinks into half the captures.

**Alternatives considered**: `odiff-bin@4.5.0` *(verified available)* — faster, but ships a per-platform native binary, adding an install-surface failure mode for a speed gain that does not matter at 233 cells. Rejected. Cypress's own `cy.compareSnapshot` plugins: unmaintained relative to the Cypress 15 line. Rejected.

## R-4 — Matrix shape: layered sweeps, NOT a cross-product

**Decision**: The matrix is a **base grid plus four targeted sweeps**, not the product of every axis.

**Measured basis** *(verified by capturing real story screenshots at 360/768/1280)*:

| Story class | Samples | Mean PNG | Range |
| ----------- | ------- | -------- | ----- |
| Component stories | 12 | **33 KB** | 13.6–61.6 KB |
| Token catalogue (`foundations-design-tokens--all-tokens`) | 3 | **1.4 MB** | 1.38–1.47 MB |

The token catalogue is a **42× outlier** — it is a documentation page rendering the entire palette, not a component. Including it would make it roughly 40% of the entire baseline set on its own.

**The cross-product is infeasible.** 23 component stories × 2 themes × 2 palettes × 3 viewports × 2 scaling levels × 2 writing directions × 2 motion settings = **4,416 cells ≈ 145 MB**. That is disqualifying for a repository that enforces a 24 KB budget on its own JavaScript output.

**The layered set**:

| Layer | Cells | Why this slice |
| ----- | ----- | -------------- |
| Base grid: 23 stories × 2 themes × 3 viewports | 138 | Every story, every mode, every width — the regression net |
| Palette sweep: 23 stories × 2 themes @ 1280 | 46 | The overlay only re-points colour; width adds nothing |
| Scaling sweep: 23 stories @ 360, light | 23 | Clipping surfaces at the tightest width; that is the whole point |
| Writing-direction sweep: 23 stories @ 768, light | 23 | Directional layout defects are width-independent |
| Motion sweep: stories that animate (Button loading) | 3 | Only three stories animate at all |
| **Total** | **233** | **≈ 7.7 MB** |

**Consequence**: the token catalogue story is excluded from capture and this exclusion is recorded in the contract, so a future reader does not "fix" it. SC-011's open bound is set at **12 MB**, leaving roughly 55% headroom over the measured projection.

**Alternatives considered**: full cross-product (145 MB — rejected on measurement, not intuition); one viewport only (would not have caught the 900 px modal at 360 px, which is a named acceptance scenario — rejected); JPEG or WebP baselines (lossy compression injects its own diff noise into a pixel comparison — rejected).

## R-5 — Hydration detection: two environments, two signals, because neither alone is sufficient

**Decision**: Two separate Jest projects.

1. `src/ssr.test.tsx` under the existing jsdom environment: `renderToString`, then `hydrateRoot` into that exact markup, with **both** an `onRecoverableError` spy and a `console.error` spy asserted empty.
2. `src/ssr-node.test.ts` under `testEnvironment: 'node'`: imports the **built** `dist/index.js` and asserts the import itself resolves.

**Rationale**: The two signals catch different things and neither is a superset of the other. `onRecoverableError` is React 19's structured hydration-mismatch callback, but React recovers from some mismatches by re-rendering and reports others only as a console error; asserting one and not the other leaves a hole. The node-environment probe is the only check that can catch a module-scope `document` reference, because jsdom *provides* `document` — a module-scope access would pass silently in the very environment the other suite runs in. Testing the **built** artifact rather than source is deliberate: it is what consumers execute, and it is where a bundler could have hoisted something.

**Note on Dialog**: with `open: true` the server emits a `<dialog>` without the `open` attribute — the attribute is applied by an effect, and effects do not run during server rendering. This is correct and must not be "fixed"; the hydration assertion has to tolerate it, because the client's first render also omits it and only the subsequent effect opens the element. Recorded so the implementer does not chase it.

**Alternatives considered**: `renderToStaticMarkup` (discards hydration metadata, so it cannot test hydration at all — rejected); string-comparing server HTML against client HTML (reimplements React's own reconciliation rules badly — rejected); relying solely on the Next.js fixture (correct but slow and coarse; it says *a* page broke, not *which* variant — kept as the complementary end-to-end check in R-8, not as a replacement).

## R-6 — axe: the colour-contrast rule must be split by palette, or the gate is unshippable

**Decision**: `cypress-axe@1.7.0` + `axe-core@4.13.0` *(both verified)*, in per-component `*.a11y.cy.tsx` specs joining the existing component suite. The `color-contrast` rule is **disabled on the Figma-faithful palette and enabled on the accessible overlay**.

**Rationale — this is the single most important finding in this document.** The default palette **fails AA by design**: `src/tokens/tokens.test.ts` pins **27 known deviations** (17 light, 10 dark) *(verified)*, including the primary Button label at 2.11:1 against a 4.5:1 requirement. Running axe with `color-contrast` enabled against the default palette would report a violation on essentially every component, permanently. FR-011's "zero violations" is therefore only satisfiable if the rule is scoped:

- **Default palette** — every axe rule *except* `color-contrast`. Contrast on this palette is already covered, and covered *better*, by the existing token test: its pinned matrix is two-sided, so a value cannot silently worsen *or* silently improve without the record being updated. Duplicating it in axe would add a second, weaker authority over the same property.
- **Accessible overlay** — the full rule set including `color-contrast`, expected to be clean, which is the entire promise of that stylesheet.

This resolves the apparent tension in FR-011/FR-012 without weakening either: the requirement to report zero violations stands, and the requirement that recorded deviations stay enumerated stands — they are just enforced by the tool that owns each property.

**Alternatives considered**: enabling `color-contrast` everywhere and listing 27 per-node exceptions (a second copy of a list that already exists in a stricter form, guaranteed to drift — rejected); disabling `color-contrast` on both palettes (throws away the overlay's central guarantee — rejected); `@storybook/test-runner` (Playwright-based, adds the R-1 objection); the Storybook Vitest addon (blocked by the constitution's Jest mandate).

## R-7 — api-extractor: works today, with two adjustments and one pre-existing finding

**Decision**: Add `api-extractor.json` pointing at `dist/index.d.ts`, commit the report to `etc/faster-ui.api.md`, and run `api-extractor run` (no `--local`) in CI so a drifted report fails the gate.

**Verified by running it**: `@microsoft/api-extractor@7.58.12` — already a devDependency, already binary-linked *(verified)* — analysed the built `dist/index.d.ts` successfully and produced a 2,478-byte report covering all 12 exports.

Three things the trial run surfaced:

1. **Pre-existing surface leak.** `ae-forgotten-export`: `ButtonBaseProps` is referenced by both `TextButtonProps` and `IconOnlyButtonProps` but is not exported from the entry point *(verified)*. A consumer cannot name the base type these two extend. This is a **real defect the gate found before it was even installed** — but fixing it changes the public API, which this feature's Out of Scope forbids. It is recorded here and in `data-model.md` as the first finding the new gate produces, to be fixed in its own change.
2. **TypeScript version skew.** The project is on TypeScript 6.0.3; api-extractor bundles 5.9.3 and warns *(verified)*. The analysis succeeded regardless. Accepted with the warning visible rather than suppressed — a suppressed skew warning becomes an invisible correctness risk when the language moves again.
3. **Ambient type leakage.** The default configuration pulled `@types/jsdom` and `@types/mdx` into analysis, producing four unrelated warnings *(verified)*. A dedicated `tsconfig.api.json` with an empty `types` array scopes the analysis to the declaration file under test.

**Alternatives considered**: `attw`-only (checks resolution, not surface shape — complementary, not a substitute; adopted separately in R-8); hand-maintaining a surface document (drifts on the first hurried change — rejected); diffing raw `dist/index.d.ts` in git (the bundler reorders and renames, so the diff is noise — the extractor's canonical ordering is the point).

## R-8 — Consumer smoke matrix: pack once, install three ways

**Decision**: One `npm pack` produces a tarball; three fixtures under `test/consumers/` consume it — a Vite app, a Next.js App Router app, and a bare type-resolution fixture. Plus `publint@0.3.24` and `@arethetypeswrong/cli@0.18.5` *(both verified)* run against the same tarball.

**Rationale**: These check four genuinely distinct failure modes. `publint` reads the manifest's declared shape; `attw --pack` simulates how each TypeScript resolution mode *actually* resolves the package; the Vite app proves a bundler can consume the ESM output; the Next.js app is the only one that exercises the server-render → hydrate path through a real framework, including the client-boundary rules and the explicit `styles.css` import that R-0 showed is required. The existing tarball audit in `ci.yml` verifies files *exist*; none of this overlaps with it.

**Fixtures are not workspaces.** They carry their own manifests and are installed at check time against the packed tarball. Adding them to the root install would put a framework in the library's own dependency graph — precisely what FR-004 forbids.

**Hydration assertion**: the Next.js fixture is built, started, and loaded headlessly with the browser console captured; the check fails on any console error or warning. This is the coarse end-to-end complement to R-5's per-variant suite.

**Alternatives considered**: `npm link`/workspace linking (resolves through symlinks and does not reproduce a real install — the classic way to miss a broken `exports` map; rejected); publishing to a local registry such as Verdaccio (a service to run and pin for something a tarball path already does; rejected); testing source instead of the tarball (would not have caught anything this check exists for).

## R-9 — `claude-code-action@v1`: exact inputs, and the credential-absent contract

**Decision**: Model-driven jobs use `anthropics/claude-code-action@v1` with `prompt` (automation mode), `claude_args` for model and tool restriction, `anthropic_api_key` from the repository secret, and `use_sticky_comment: true` so a re-run updates one comment instead of accreting new ones.

**Verified input names** (from the published action definition, so the workflows are written against reality rather than recall): `prompt`, `claude_args`, `settings`, `anthropic_api_key`, `claude_code_oauth_token`, `github_token`, `track_progress`, `use_sticky_comment`, `classify_inline_comments`, `include_fix_links`, `display_report`, `allowed_non_write_users`, `trigger_phrase`. Outputs: `conclusion`, `execution_file`, `branch_name`, `github_token`, **`structured_output`** (populated when `--json-schema` is passed in `claude_args`), `session_id`.

**The credential-absent contract (FR-019)** is implemented at the job level, not inside the action:

```yaml
jobs:
  review:
    if: github.event.pull_request.head.repo.full_name == github.repository
    steps:
      - id: guard
        run: echo "ok=${{ secrets.ANTHROPIC_API_KEY != '' }}" >> "$GITHUB_OUTPUT"
      - if: steps.guard.outputs.ok == 'true'
        uses: anthropics/claude-code-action@v1
```

A fork-originated pull request never reaches the job; a missing secret skips the step. In both cases the job concludes **successful**, so no verdict turns red for a reason the contributor cannot fix. `pull_request_target` is never used — it is the mechanism that would expose the secret to unreviewed code, which FR-018 forbids outright.

**Model**: `claude-opus-5` via `claude_args`. Effort is set per job — the constitution reviewer and the semver classifier are judgment tasks and get high effort; the token audit is largely pattern-matching and gets less.

**Alternatives considered**: `track_progress: true` (useful for long implementation runs; noise for a review that posts once — rejected); a bare `@claude` mention trigger (requires a human to ask, defeating the automation — rejected); running the reviewer through the API SDK directly (reimplements diff fetching, comment posting, and permission handling that the action already owns — rejected).

## R-10 — Prompt-injection hardening: structural, not just instructional

**Decision**: Four independent measures, because a prompt instruction alone is not a control.

1. **Capability**: review jobs declare `permissions: { contents: read, pull-requests: write }` and restrict `claude_args` to read-only tools (`Read`, `Grep`, `Glob`) plus specific read-only Bash commands. A job that *cannot* write cannot be talked into writing.
2. **Authority**: reference material (constitution, contracts, repository guide) is read from the **base** ref, never from the pull request's head. A change that edits `CLAUDE.md` therefore cannot alter the rules it is being judged against — it is judged *as a change to* those rules.
3. **Framing**: the prompt states that all diff content is untrusted data, and instructs that any attempt to issue instructions be reported as a finding (FR-016).
4. **Blast radius**: no review job is a required check (FR-017), so even a fully successful injection changes a comment, not a merge decision.

**Rationale**: Measures 1, 2 and 4 hold even if 3 fails completely. That ordering is the point — the instruction is the weakest of the four and is listed last deliberately.

**Alternatives considered**: instruction-only defence (a single control with a known bypass class — rejected); refusing to review any change touching governance files (a change that edits the constitution is exactly the one most worth reviewing — rejected).

## R-11 — The vision jury: `--json-schema` through the action, Batch API only where it pays

**Decision**: The judgment pass runs through the same action, with the changed images passed as file paths for the agent to read and `--json-schema` in `claude_args` so the verdict arrives as validated JSON on the `structured_output` output. The **scheduled** sweeps (C5 weekly audit, nightly full matrix) use the Anthropic SDK's Batch API instead.

**Rationale**: Using the action for the pull-request path avoids a runtime dependency entirely and gets schema-validated output for free — a `PASS`/`WARN`/`FAIL` enum with a required reason string cannot come back malformed, which matters because FR-027 requires a verdict *and* a stated defect. The action does not expose the Batch API, so FR-038's "lower-cost asynchronous path" requires the SDK for the two scheduled jobs; that is the sole justification for adding `@anthropic-ai/sdk`, and it is confined to `scripts/` (Complexity Tracking entry 7).

**Cost shaping**: the stable prefix — constitution, token contract, extraction records, the rubric — is roughly 25K tokens and is marked with `cache_control: { type: 'ephemeral' }`, making repeat reads about a tenth of the price. `usage.cache_read_input_tokens` is logged per run; a zero there means something volatile leaked into the prefix and the caching is silently doing nothing (FR-037's observability requirement exists precisely to catch that).

**Alternatives considered**: SDK for everything (a runtime dependency and hand-rolled comment posting on the hot path — rejected); free-text verdicts (unparseable, and drifts toward hedging rather than deciding — rejected); judging every cell rather than only changed ones (roughly 12× the cost for information the pixel comparison already settled — rejected, and it is why the ordering in FR-026 is load-bearing).

## R-12 — Off-pipeline automation: two homes, and one that cannot be automated in CI at all

**Decision**:

- **C1 Figma drift** runs **locally** as a `/design-drift` skill, not in Actions. The Figma connector is authenticated on the developer machine; a runner has no path to it. Its output is a report; FR-032 requires it to say so loudly when it cannot run, because a silent all-clear from a check that never executed is worse than no check.
- **C2 triage**, **C3 changelog**, **C5 weekly audit** run in Actions on `workflow_run`, `push` to the default branch, and `schedule` respectively.
- **C4 local hooks** live in `.claude/settings.json` as a `PostToolUse` matcher on `Edit|Write` and a `Stop` hook.

**Rationale for C4's scope**: the hook enforces nothing new. Every rule it applies is already enforced by a gate that cannot be bypassed, so a contributor without the hook is slower, never less safe (FR-036, and SC-013 verifies it by disabling the hooks and confirming the gate still fails). This keeps the hook a convenience and prevents it from quietly becoming load-bearing.

**Note on C2's value**: this repository has three documented flake shapes — the CDP mouse persisting between Cypress tests (parked on `[data-cy="park"]`), the `ELECTRON_RUN_AS_NODE` quirk *(verified set to `1` in this very environment)*, and a cold Cypress binary cache. A triage agent that knows those three by name resolves the majority of red builds without a human opening a log. That specificity is what makes C2 worth building here and not worth building in general.

**Alternatives considered for C1**: a Figma REST token in Actions secrets (a different integration surface than the connector the extraction was performed through, so it would compare against a differently-shaped source — rejected as a correctness risk, not merely a cost); skipping drift detection (the token layer's entire premise is fidelity to a source that can change — rejected).
