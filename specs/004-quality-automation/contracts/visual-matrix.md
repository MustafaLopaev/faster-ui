# Contract: Visual Matrix (`.github/workflows/visual.yml`)

Three passes, and **the order is the contract**: capture, compare, then judge only what moved. Reversing the last two costs roughly 12× for information the comparison already settled, and it is why FR-026 exists.

## Pass 1 — Capture

| Property | Value |
| -------- | ----- |
| Subject | `storybook-static`, built by the existing `build-storybook` gate |
| Server | `vite preview --outDir storybook-static --strictPort` — no new dependency (research R-2) |
| Origin | **`localhost`, not `127.0.0.1`** — `vite preview` binds the hostname; the literal loopback address fails *(verified: `000` vs `200`)* |
| Driver | Cypress `e2e` section, added to the existing `cypress.config.ts` |
| Story source | `storybook-static/index.json` |
| Platform | `ubuntu-latest` **only** — baselines are platform-specific (research R-1) |

**Anti-flake protocol.** Each of these is a requirement, not tuning; a visual check that cries wolf is disabled within a month.

1. Inject a stylesheet zeroing `animation-duration` and `transition-duration`. The Button spinner (`fui:animate-spin`) is otherwise a guaranteed per-run difference.
2. Await `document.fonts.ready`. Nunito Sans ships with the workbench build; racing it produces a fallback-font diff on every cell.
3. Suppress the caret — a focused Input otherwise blinks into half the captures.
4. One pinned runner platform.

**Emulation channel**: reduced motion and colour-scheme are set via CDP `Emulation.setEmulatedMedia` through `Cypress.automation('remote:debugger:protocol', …)` — the same channel `cypress-real-events` already uses for the pseudo-state matrix.

## The matrix — a layered set, not a cross-product

The cross-product is **4,416 cells ≈ 145 MB** — disqualifying for a repository that budgets 24 KB for its own JavaScript. The layered set is **233 cells ≈ 7.7 MB**:

| Layer | Composition | Cells |
| ----- | ----------- | ----- |
| Base grid | 23 stories × {light, dark} × {360, 768, 1280} | 138 |
| Palette sweep | 23 stories × {light, dark} @ 1280, `aa` overlay | 46 |
| Scaling sweep | 23 stories @ 360, light, 200% text | 23 |
| Direction sweep | 23 stories @ 768, light, rtl | 23 |
| Motion sweep | animating stories only, reduced-motion | 3 |
| **Total** | | **233** |

Each sweep varies **one** axis off the base grid. The rationale per sweep: the overlay only re-points colour, so width adds nothing; clipping surfaces at the tightest width, which is the whole point of the scaling pass; directional defects are width-independent; only three stories animate at all.

**Measured basis** *(verified by capturing real stories at 360/768/1280)*: component stories mean **33 KB** (12 samples, 13.6–61.6 KB).

**Excluded**: `foundations-design-tokens--all-tokens` — a documentation page rendering the whole palette, measured at **1.4 MB per capture**, a **42× outlier** that would be ~40% of the entire set on its own. Recorded so nobody "restores" it later.

**Budget**: 12 MB (SC-011), ~55% headroom over the projection. If the matrix cannot fit, the matrix narrows — the budget does not silently rise. This mirrors how `scripts/postbuild.mjs` treats the distribution budget.

## Adversarial content

`visual/fixtures/adversarial.ts`, generated once then **frozen** (FR-028) — regenerating per run makes the matrix irreproducible. Six cases: a 200-character label, an Arabic string, emoji with combining marks, a zero-width-joiner sequence, a 500-row modal body, and the empty/single-character boundary.

## Pass 2 — Compare

| Property | Value |
| -------- | ----- |
| Engine | `pixelmatch` over `pngjs` — pure JS, no platform binary (research R-3) |
| Per-pixel threshold | `0.1` |
| Cell fails when | more than `0.1%` of pixels differ |
| Output | a changed-cell manifest consumed by Pass 3 |

**States**: `unchanged` · `changed` · `new` (no baseline — must be judged, never silently accepted) · `orphaned` (baseline whose story no longer exists — reported, never silently kept).

**Cold start is its own outcome**, not a run in which every cell happens to be `new`. When `visual/baselines/` is empty nothing has been established, so the pass neither succeeds nor fails: it reports loudly, exits 0, and sets `coldStart: true` in the manifest. Pass 3 is skipped on that flag in both the pull-request path (`visual.yml`'s `cold-start` job condition) and the nightly path.

The reasoning is the one FR-032 applies to the drift watcher's `unreachable`: an all-clear a check did not establish is worse than no report, and a failure it cannot substantiate is noise that blocks every pull request until someone mutes it. The cost matters too — judging all 239 cells against nothing to compare them to is roughly the price of a nightly full sweep, spent to characterise a change that has not happened. Baselines land first, via `gh workflow run visual.yml -f accept-baselines=true`; from then on Pass 3 sees only the cells a change actually moved.

This pass is **deterministic and blocking** once baselines stabilise. It needs no credential and runs for forks.

## Pass 3 — Judge

Runs **only** on `changed` and `new` cells (FR-026).

| Property | Value |
| -------- | ----- |
| Delivery | `scripts/visual-batch-judge.mjs` — one Azure OpenAI vision completion per cell, images read from disk (amended from `anthropics/claude-code-action@v1` with the Azure migration) |
| Model | the `AZURE_OPENAI_DEPLOYMENT` repository variable |
| Output | JSON-schema structured output, validated per cell |
| Cached prefix | `visual/rubric.md` + the token contract + the extraction records (~25K tokens) |
| Blocking | **advisory** until measured (FR-020, SC-007) |
| Credential absent | skips; **Pass 2 still runs and still reports differences** (FR-030, US4 scenario 7) |

**Verdict shape**: `{ cell, verdict: PASS|WARN|FAIL, defect, confidence }`. `defect` is required and non-empty when the verdict is not `PASS`, and must name the defect — *"label clipped at the right edge at 200% scaling"*, never *"differs from baseline"* (FR-027). A `low` confidence marks the cell for human attention rather than being silently trusted.

**What the jury is for** — defects a pixel comparison detects but cannot characterise:

- Label clipped or truncated at 200% text scaling (WCAG 1.4.4)
- The `lg` modal's 900 px panel overflowing the 360 px viewport
- A focus ring cropped by an `overflow-hidden` ancestor
- Icon baseline drift at `sm`
- Dark-mode borders vanishing into their surface
- An error message reflowing the input row
- Directional adornment order wrong under rtl

## Baseline acceptance

| Property | Value |
| -------- | ----- |
| Location | `visual/baselines/` |
| Naming | `{storyId}__{theme}-{palette}-{viewport}-{scale}-{direction}-{motion}-{content}.png` — identity **is** the filename; no sidecar index to desynchronise |
| Accepting | `npm run visual:accept` writes new baselines; the change is committed and reviewed like any other (FR-029) |
| Visibility | The accepted-cell **count** appears in the pull request, so a 200-cell acceptance cannot be mistaken for a 2-cell one |

**Bulk acceptance is bounded, not forbidden.** A legitimate token change genuinely moves hundreds of cells. What the contract prevents is an *unreviewable* one: the count is surfaced, and the diff is a normal reviewable change.

## Cost

| Path | Frequency | Approximate cost |
| ---- | --------- | ---------------- |
| Pass 2 only (no changes) | most PRs | $0 |
| Pass 3, typical change (4–20 cells) | styling PRs | $0.15–0.60 |
| Full sweep, all 233 cells | nightly, `visual-batch-judge.mjs` | low single digits |

The nightly sweep and the pull-request judge are the SAME script since the Azure migration — the sweep just runs with no PR to comment on, keeping the whole-matrix cost off the pull-request path (FR-038). The Anthropic Batch API and the `@anthropic-ai/sdk` devDependency it justified (Complexity Tracking row 4) are gone; the shared prompt prefix now leans on Azure's automatic prompt caching, reported per run (FR-037).

## Job graph

| Job id | Needs | Credential | Blocking |
| ------ | ----- | ---------- | -------- |
| `visual-capture` | `storybook` | no | yes |
| `visual-compare` | `visual-capture` | no | yes, once baselines stabilise |
| `visual-judge` | `visual-compare` | yes | never, until measured |

Path filter: `src/components/**`, `src/tokens/**`, `**/*.stories.tsx`. A change to none of these captures nothing.
