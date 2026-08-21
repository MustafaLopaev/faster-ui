# Pipeline showcase — 21 August 2026

A record of deliberately waking every workflow in `.github/workflows/` and writing
down what each one actually did. Nine workflow files, 42 runs, four pull requests,
one throwaway tag, and 34 model calls. Run counts throughout this document cover
the tour only — 14 further runs fired in the same window from an unrelated history
rewrite, and are listed separately in §9.2.

Nothing here is a simulation. Every verdict quoted below is verbatim from the
comment or log the job produced, and every run ID links to its own logs.

- **Repository:** [MustafaLopaev/faster-ui](https://github.com/MustafaLopaev/faster-ui)
- **Window:** 08:46 – 09:19 UTC
- **Baseline commit:** `ce79cf1` → merged to `f9cbce6` mid-tour
- **Model provider:** Azure OpenAI, deployment `gpt-5.1-chat`

---

## 1. The nine workflows at a glance

| # | Workflow | Triggers | Jobs | Blocks a merge? | What it is for | What it did in this tour |
| - | -------- | -------- | ---- | --------------- | -------------- | ------------------------ |
| 1 | `ci.yml` | `push`, `pull_request`, `workflow_call` | 13 (11 gates + `changes` + `install`) | **Yes — the only one** | Runs every deterministic gate, each invoking the identical `npm` script a developer runs locally. Five of the gates wake only on a path filter. | 9 runs. Proved **all 11 gates green** on #17 and #19, **four gates red** on #18, and **five gates correctly skipped** on #16. |
| 2 | `review.yml` | `pull_request` | 4 advisory + `changes` | Never (FR-017, structural) | Four model-driven reviews: constitution compliance, semver classification, semantic token audit, missing-story suggestions. Reads its rules from the **base** ref so a PR cannot rewrite the standard it is judged by. | 4 runs. All four jobs exercised. Caught the omitted changelog bullet on #17, five findings on #18, and on #19 caught a contract violation **plus the test edited to hide it**. |
| 3 | `visual.yml` | `pull_request`, `schedule`, `workflow_dispatch` | 6 | Capture + compare **yes**; judgment never | Three ordered passes over a layered 239-cell matrix: capture, pixel-compare, then send **only the moved cells** to a model jury against `visual/rubric.md`. | 5 runs. Generated the 239 baselines that did not exist, then found **10 new cells** on #17 and **12 changed cells** on #19. The jury found two real defects. |
| 4 | `triage.yml` | `workflow_run` on `CI` completion | 1 | Never | Reads a failed CI run's own logs and classifies them against the four flake shapes this repo has documented. A `known-flake` verdict must name its pattern. | 9 runs. Skipped on every green CI. Fired on #18 and named **all four** failing gates, classifying it `regression`, not a flake. |
| 5 | `report.yml` | `workflow_run` on `CI` completion, `workflow_dispatch` | 1 | Never | Deterministic aggregation — no model anywhere in the file. Waits for the commit's other workflows to settle, then renders every run, job, verdict comment and artifact into one self-contained HTML file. | 10 runs. Four reports on the showcase commits, one dispatched by hand, and three cancelled by its own concurrency group (designed). |
| 6 | `changelog.yml` | `push` to `main` | 1 | Never | Decides whether a merge is consumer-visible and, if so, opens a PR adding one bullet under `## [Unreleased]`. `release.yml` refuses to publish without that section, so this is a release gate satisfied in advance. | 1 run. Correctly decided the #16 merge was **not** consumer-visible and opened nothing. |
| 7 | `docs.yml` | `push` to `main`, `workflow_dispatch` | 2 | Never | Builds the Storybook workbench and deploys it to GitHub Pages — the workbench is the component contract's living documentation. | 2 runs, both green, deployed to [mustafalopaev.github.io/faster-ui](https://mustafalopaev.github.io/faster-ui/). Its three previous push runs had all failed. |
| 8 | `release.yml` | `push` tags `v*` | 1 + reused `ci.yml` | n/a | Publishes to npm with provenance, but only behind the whole gate suite re-run on the tagged commit itself, and only after the tag, the manifest and the changelog all agree. | 1 run. **13 quality jobs green, then publish aborted at the version guard.** `npm publish` was never reached; nothing was published. |
| 9 | `audit.yml` | `schedule` Mon 06:41, `workflow_dispatch` | 1 | Never | Measures the tracked drift metrics deterministically, then asks a model to report only what **moved toward a limit**. The diff is the product, not the findings. | 1 run, 56s. Opened [issue #15](https://github.com/MustafaLopaev/faster-ui/issues/15) with the metrics table and "New findings: None." |

### How they chain

```
push / PR ─→ ci.yml ─────┬─→ (on completion) ─→ triage.yml   (only if CI failed)
                         └─→ (on completion) ─→ report.yml   (always)
PR ──────────→ review.yml
PR ──────────→ visual.yml    capture → compare → judge what moved
merge to main → changelog.yml + docs.yml + ci.yml
tag v* ──────→ release.yml   (reuses ci.yml wholesale via workflow_call)
Mon 06:41 ───→ audit.yml
03:17 daily ─→ visual.yml    nightly-sweep  ← the one path not shown here
```

---

## 2. What had to be fixed before anything could be shown

The pipeline could not be demonstrated end to end as it stood. Two settings were
off, and two things were broken — the broken ones since the day the visual layer
landed.

| What | State found | Action taken |
| ---- | ----------- | ------------ |
| Actions → create pull requests | `can_approve_pull_request_reviews: false` | **Enabled.** Both `accept-baselines` and `draft-changelog` open PRs; neither could. |
| `REVIEW_MODE` variable | Unset — which means `demo`: one file, ≤3 findings, one of four jobs | **Set to `full`**, so all four review jobs are in scope. Still set. |
| `visual/baselines/` | No images at all. `visual:compare` reported **cold start** — neither pass nor failure — and the jury was skipped by design | 239 cells captured on `ubuntu-latest`, landed in **#16**. |
| `accept-baselines` checkout | Shallow. The branch it pushes shares no commit with `main`, so `gh pr create` is refused outright | `fetch-depth: 0`, fixed in **#16**. |

---

## 3. The four pull requests

Each is a real change, written so a specific set of jobs has something true to
say about it.

| PR | Branch | Change | CI | Visual | Purpose | State |
| -- | ------ | ------ | -- | ------ | ------- | ----- |
| [#16](https://github.com/MustafaLopaev/faster-ui/pull/16) | `visual/baselines-and-unshallow` | 239 baseline PNGs + the `fetch-depth: 0` fix | 7 pass, 5 skip | 239 cells, 0 moved | Prerequisite, and a clean demo of path filtering | **Merged** |
| [#17](https://github.com/MustafaLopaev/faster-ui/pull/17) | `showcase/button-full-width` | `Button fullWidth` — one class, a type-level exclusion on the icon-only union, two real-browser width proofs, a story, regenerated API record | **11/11 gates pass** | **10 new cells** | The green path end to end, all four review jobs, and a jury with new cells to characterise | Open |
| [#18](https://github.com/MustafaLopaev/faster-ui/pull/18) | `showcase/gate-violations` | A `subtle` variant and an `elevated` flag, written badly on purpose | **4 gates fail** | 239 cells, 0 moved | Every blocking gate's red path, plus Triage and the advisory jobs | **Draft — never merge** |
| [#19](https://github.com/MustafaLopaev/faster-ui/pull/19) | `showcase/icon-only-radius` | Icon-only buttons take the control radius; the Cypress assertion updated to match | **11/11 gates pass** | **12 cells changed** | Why the pixel layer exists when eleven gates already run | Open |

---

## 4. Run-by-run detail

### 4.1 `visual.yml` — baseline generation

**[Run 32464700548](https://github.com/MustafaLopaev/faster-ui/actions/runs/32464700548)** · `workflow_dispatch` · 11m 28s · **failure**

```
gh workflow run visual.yml -f accept-baselines=true -f stability-runs=2
```

| Step | Result |
| ---- | ------ |
| `npm run visual:capture` | 239 cells |
| `npm run visual:accept` | adopted as baselines |
| stability cycle 1/2 | clean |
| stability cycle 2/2 | clean |
| `git push` the branch | succeeded — `visual/baselines-32464700548` |
| `gh pr create` | **failed** |

```
pull request create failed: GraphQL: The visual/baselines-32464700548 branch
has no history in common with main (createPullRequest)
```

The capture and the reproducibility proof both worked; the job died opening its
own pull request. See finding F-1. The stability protocol asks for ten cycles
(SC-006); two were run for tour speed, and that is a stated deviation rather than
an oversight.

Because the branch was unopenable, the 239 PNGs were re-assembled by hand onto a
branch with real history, together with the `fetch-depth: 0` fix, and shipped as #16.

### 4.2 `audit.yml` — the scheduled deep audit

**[Run 32465463749](https://github.com/MustafaLopaev/faster-ui/actions/runs/32465463749)** · `workflow_dispatch` · 56s · **success** → [issue #15](https://github.com/MustafaLopaev/faster-ui/issues/15)

Metrics measured deterministically before the model was called:

| Metric | Value | Limit | Usage |
| ------ | ----- | ----- | ----- |
| `dist/index.js` | 17,475 B | `scripts/postbuild.mjs` | — |
| `dist/styles.css` | 18,574 B | `scripts/postbuild.mjs` | — |
| `dist/index.d.ts` | 5,967 B | `scripts/postbuild.mjs` | — |
| `dist/a11y.css` | 5,821 B | `scripts/postbuild.mjs` | — |
| Visual baselines | 2,055 B | 12,582,912 B | 0.02% |
| Baseline cells | 1 | — | informational |
| Outdated dependencies | 10 | — | informational |

> **New findings:** None. **Standing findings:** None recorded.

One call, 8,834 prompt / 284 completion tokens. It ran *before* #16 merged, which
is why it reports one baseline cell and 2 KB. The next run sees 239 cells and
3.6 MB — 30% of the budget — and naming that jump is exactly this job's purpose.

### 4.3 `docs.yml` — Storybook to Pages

**[Run 32465466252](https://github.com/MustafaLopaev/faster-ui/actions/runs/32465466252)** · `workflow_dispatch` · 49s · **success**

`build` 29s → `deploy` 11s → live at <https://mustafalopaev.github.io/faster-ui/>.

Its three previous push-triggered runs had all failed with
`Get Pages site failed. Please verify that the repository has Pages enabled`.
Pages was switched on between 08:28 and 08:32; every run since is green,
including both push runs during this tour.

### 4.4 PR #16 — path filtering, and the baselines landing

| Workflow | Run | Duration | Result |
| -------- | --- | -------- | ------ |
| CI (push) | [32465752565](https://github.com/MustafaLopaev/faster-ui/actions/runs/32465752565) | 2m 08s | success |
| CI (pull_request) | [32465778787](https://github.com/MustafaLopaev/faster-ui/actions/runs/32465778787) | 1m 23s | success |
| Review | [32465779212](https://github.com/MustafaLopaev/faster-ui/actions/runs/32465779212) | 0m 09s | success — all four jobs skipped |
| Visual | [32465779207](https://github.com/MustafaLopaev/faster-ui/actions/runs/32465779207) | 4m 19s | success |

The diff touched only `visual/**` and one workflow file, so the shared path sets
computed `code=false`, `components=false`, `visual=true`:

- **Ran:** `lint`, `typecheck`, `test`, `cypress`, `storybook`, `build`
- **Skipped:** `ssr`, `consumers`, `api-surface`, `a11y`, `coverage-gate` — and a
  skip counts as success, so the run still produced a complete verdict rather
  than one with holes in it
- **Review:** all four jobs skipped — nothing in `code` or `components` moved
- **Visual:** 239 cells captured, **0 changed**, `visual-judge` skipped on
  `to-judge == 0`. The baselines had been captured from that exact tree, which is
  the strongest available check that the capture is deterministic

### 4.5 PR #17 — the green path

| Workflow | Run | Duration | Result |
| -------- | --- | -------- | ------ |
| CI (push) | [32466180211](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466180211) | 3m 08s | success |
| CI (pull_request) | [32466183681](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466183681) | 2m 47s | **success — 11/11 gates** |
| Review | [32466183637](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466183637) | 0m 28s | success — all four jobs ran |
| Visual | [32466183697](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466183697) | 5m 10s | **failure — 10 new cells** |
| Report | [32466436958](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466436958) | 2m 40s | success |

Verified locally against the identical commands before pushing: `lint`,
`lint:tokens`, `typecheck`, `coverage:gate`, `build`, `build-storybook`,
`test:coverage` (165 tests, branches 92.75% against a 88% threshold),
`test:ssr` (33 tests), `api:report` + `api:check`, and the Button Cypress spec
(25 passing, two of them new).

**`semver-classify`** — 1,098 prompt / 77 completion tokens:

> **Required increment: `minor`** — claimed: `minor` — the changelog agrees ✅
>
> Two optional props were added to the public API: `fullWidth?: never` on
> `IconOnlyButtonProps` and `fullWidth?: boolean` on `TextButtonProps`. Adding
> optional props is a minor-version surface expansion.

**`token-audit`** — PASS. "Added utility `fui:w-full` is token-compliant, no raw
visual literals or arbitrary-value Tailwind utilities were introduced."

**`coverage-suggest`** — no model call at all. It runs `coverage:gate` itself,
the gate passed, so there was nothing to suggest and nothing was spent.

**`constitution-review`** — one finding, and it is the one this PR was written to
provoke:

> `CHANGELOG.md` — Convention violated ("Anything a consumer would notice gets a
> bullet under `## [Unreleased]`"). This change adds a new public `Button` prop
> (`fullWidth`) and updates the public API surface, but there is no accompanying
> changelog entry in the diff.

The bullet was omitted on purpose so `changelog.yml` would have a qualifying
change to draft at merge time. The reviewer flagging it is correct behaviour, not
a false positive.

**`visual-judge`** — 10 cells judged, **PASS 8, WARN 0, FAIL 2**. Both failures
are real defects, and both are about the story this PR adds:

> **`full-width__light-figma-360-200-ltr`** — multiple full-width Button variants
> overflow the 360px viewport at 200% text scaling, causing the right side of the
> buttons and their labels to be clipped; labels such as "Full…", "Outline…",
> "+ Both…", and "Load…" are cut off and not fully readable.

> **`full-width__light-figma-768-100-rtl`** — In the RTL variant, the button with
> both adornment slots does not mirror correctly: the directional arrow remains on
> the left and points right, and the trailing plus icon stays on the right instead
> of swapping sides for RTL layout.

The first is the story's fixed-width wrapper failing to grow with text scale.
The second is **pre-existing Button behaviour** — the icon slots are physical
`leftIcon`/`rightIcon`, not logical start/end — that no story had ever handed to
the direction sweep. Both are left open.

### 4.6 PR #18 — the red path

| Workflow | Run | Duration | Result |
| -------- | --- | -------- | ------ |
| CI (push) | [32466191872](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466191872) | 3m 44s | **failure** |
| CI (pull_request) | [32466196741](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466196741) | 3m 01s | **failure** |
| Review | [32466196766](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466196766) | 0m 49s | success |
| Visual | [32466196652](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466196652) | 5m 09s | success |
| Triage | [32466443201](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466443201) · [32466495284](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466495284) | 0m 22s · 0m 20s | success |

#### The four red gates, verbatim

```
✖ lint — npm run lint:tokens
  Button.styles.ts:27  [arbitrary-value]  rounded-[10px]
  Button.styles.ts:56  [raw-colour]       #F5F5F5
  Button.styles.ts:56  [arbitrary-value]  bg-[#F5F5F5]
  Button.styles.ts:58  [raw-colour]       #FEF2F2
  Button.styles.ts:58  [arbitrary-value]  bg-[#FEF2F2]
  ✖ 5 token violation(s).

✖ coverage-gate
  Button.types.ts:48       [undocumented-prop]      Button.elevated has no JSDoc
  Button.stories.tsx:105   [prop-not-in-playground] no entry in args or argTypes
  ✖ coverage gate: 2 problems.

✖ api-surface
  ✖ The public surface has changed and etc/faster-ui.api.md does not record it.

✖ ssr                                            ← NOT predicted
  ● ships the prop unions as plain frozen-shape lookup objects
    at Object.toEqual (src/ssr-node.test.ts:55:31)
```

Green on purpose, and all green in fact: `typecheck`, `oxlint`, `build` (both
arbitrary values *are* generated by Tailwind, so the stylesheet-coverage check
was satisfied), `test`, `consumers`, `a11y`, and the entire visual matrix.

#### `triage.yml` classified it correctly

> **regression** — multiple gates failed due to repository changes. The `ssr` job
> failed with `expect(received).toEqual(expected)` in `src/ssr-node.test.ts:55`
> because `ButtonVariant` now includes an unexpected `"subtle": "subtle"` entry.
> The `lint` job also failed on token policy violations such as `rounded-[10px]`
> and raw colours like `#F5F5F5` / `bg-[#F5F5F5]` in
> `src/components/Button/Button.styles.ts`, the `coverage-gate` job failed because
> `Button.elevated` is undocumented and missing from the Playground story
> args/argTypes, and `api-surface` failed because the public API report changed
> without updating `etc/faster-ui.api.md`.

Four gates, four correct diagnoses, and it declined to call any of them a flake.

#### `token-audit` added the judgement a regex cannot

> `fui:bg-[#F5F5F5]` — raw hex color inside arbitrary Tailwind utility. Replace with
> a semantic surface/background token utility such as a semantic subtle surface token.
>
> **Semantic token usage review** — the resting-state backgrounds for the new
> `subtle` variant are implemented with raw colors rather than semantic
> surface/action tokens, which bypasses the semantic layering model and should be
> tokenized.

#### `constitution-review` found five, two of them contract violations

> `Button.types.ts:17` — Principle III / contract violation. Evidence:
> `subtle: "subtle",` — This changes the public `ButtonVariant` union, but
> `specs/002-core-components/contracts/button-api.md` defines the allowed variants
> as `'primary' | 'outline' | 'ghost' | 'link'`. Update the contract (and its
> associated stories/tests/docs/changelog entry) before shipping a new public variant.

> `Button.types.ts:48` — Principle III / contract violation. Evidence:
> `elevated?: boolean;` — This adds a new public prop that is not part of the
> Button API contract.

#### `coverage-suggest` emitted an applicable patch

Not a description of the fix — the diff itself: the JSDoc line on
`ButtonBaseProps.elevated`, the `argTypes` entry with a control and a description,
and the `elevated: false` Playground arg. Detection blocks in `coverage-gate`;
writing the fix structurally cannot. That split is the design.

#### `semver-classify` skipped

Correctly: its filter requires `etc/faster-ui.api.md` to have changed, and leaving
it stale is precisely what makes `api-surface` red.

### 4.7 PR #19 — the visual path, and three layers disagreeing

| Workflow | Run | Duration | Result |
| -------- | --- | -------- | ------ |
| CI (push) | [32466206475](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466206475) | 3m 23s | success |
| CI (pull_request) | [32466209395](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466209395) | 2m 40s | **success — 11/11 gates** |
| Review | [32466209400](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466209400) | 1m 19s | success |
| Visual | [32466209377](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466209377) | 6m 42s | **failure — 12 cells changed** |

Every deterministic gate is green on this commit — including `lint:tokens`,
because `fui:rounded-control` is a perfectly legitimate token. The Cypress
assertion that pinned `999px` was **updated to `4px` in the same commit**, which
is what a contributor does when a unit test disagrees with the change they meant
to make.

```
visual-compare
  unchanged 227   changed 12   new 0   orphaned 0

✖ icon-only__dark-aa-1280-100-ltr-default                     0.147% of pixels
✖ icon-only__dark-figma-1280-100-ltr-default                  0.149%
✖ icon-only__dark-figma-360-100-ltr-default                   0.529%
✖ icon-only__dark-figma-768-100-ltr-default                   0.248%
✖ icon-only__light-aa-1280-100-ltr-default                    0.139%
✖ icon-only__light-figma-1280-100-ltr-default                 0.128%
✖ icon-only__light-figma-1280-100-ltr-reduced                 0.128%
✖ icon-only__light-figma-360-100-ltr-default                  0.457%
✖ icon-only__light-figma-360-200-ltr-default                  1.140%
✖ icon-only__light-figma-768-100-ltr-default                  0.214%
✖ icon-only__light-figma-768-100-rtl-default                  0.214%
✖ adversarial-content--boundary__light-figma-360-…-adversarial 0.141%
```

Eleven of those are the `components-button--icon-only` cells — six base grid
(2 themes × 3 widths), two palette, one text-scaling, one direction, one
reduced-motion. **The twelfth was not predicted:** the frozen `boundary`
adversarial fixture renders icon-only buttons too, so the adversarial layer
earned its place by catching a cell nobody would have thought to look for.

Note the deltas: **0.128% to 1.140%** against a 0.1% per-cell tolerance. A corner
radius on three small circles is exactly the size of change a looser tolerance
would have called "unchanged" and shipped.

**Three verdicts, and they disagree — which is the design, not a flaw:**

| Layer | Can it block? | What it knew | What it said |
| ----- | ------------- | ------------ | ------------ |
| `visual-compare` | **Yes** | Only that pixels moved | 12 cells changed — red |
| `visual-judge` | No | Only what `visual/rubric.md` says | 12 judged, **PASS 12, FAIL 0** |
| `token-audit` | No | Only whether the token is legal | **PASS** — "`fui:rounded-control` … remains compliant with token-first styling" |
| `constitution-review` | No | **It read the contract** | **2 findings — and it is right** |

> `Button.styles.ts:22` — the contract requires icon-only buttons to use
> `radius-full`, but the change replaces it with the control radius. B10 explicitly
> states: "radius `radius-control` (`radius-full` when iconOnly)". Restore the
> icon-only sizing map to `fui:rounded-full`; if the design intent has changed, the
> contract itself must be amended first rather than changing the implementation and
> tests unilaterally.

> `Button.cy.tsx:253` — Principle IV violation: the test is rewritten to assert the
> new implementation rather than the contracted behaviour. **This test change masks
> the contract regression** instead of validating the specified behaviour.

Merging this would mean overruling exactly one advisory job that happens to be
right — a failure mode a green-means-ship pipeline cannot even express.

### 4.8 `changelog.yml` — on the #16 merge

**[Run 32466159247](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466159247)** · `push` to `main` · 14s · **success**, no PR opened

> Nothing consumer-visible in `f9cbce6` — no pull request. (The changes are limited
> to visual test baselines and a GitHub Actions workflow checkout configuration.
> These are internal CI/testing updates and do not change the published API,
> rendered component behavior, packaging, or any consumer-visible functionality.)

One call, 5,275 prompt / 67 completion tokens. That is the common path and it is
correct. The **qualifying** path — where it edits `CHANGELOG.md`, cuts a
`changelog/<sha>` branch and opens a PR — was not reached; see §6.

### 4.9 `report.yml` — the closing act

Four reports on showcase commits, one dispatched by hand, three cancelled by
concurrency.

| Run | Trigger | Commit | Duration | Headline |
| --- | ------- | ------ | -------- | -------- |
| [32466436958](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466436958) | `workflow_run` | `f4c6a15` (#17) | 2m 40s | ✕ failing — 34 passed, 1 failed, 2 skipped across 4 workflows; 5 AI agent runs |
| [32466495308](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466495308) | `workflow_run` | `1175183` (#18) | 2m 08s | ✕ failing — 25 passed, 8 failed, 4 skipped across 4 workflows; 3 AI agent runs |
| [32466480391](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466480391) | `workflow_run` | `b245a23` (#19) | 3m 37s | ✕ failing — 33 passed, 1 failed, 3 skipped across 4 workflows; 4 AI agent runs |
| [32467297218](https://github.com/MustafaLopaev/faster-ui/actions/runs/32467297218) | `workflow_dispatch` | `f9cbce6` (main) | 0m 30s | dispatched with an explicit `head-sha` |

Each uploads a self-contained `overall-report.html` (25.8 KB for #19) plus
`report-meta.json`, and posts a sticky comment linking the artifact. Three
in-flight reports were cancelled as newer CI runs completed for the same commit —
its concurrency group is keyed on the head SHA with `cancel-in-progress: true`.

### 4.10 `release.yml` — the guard-rail demo

**[Run 32466988968](https://github.com/MustafaLopaev/faster-ui/actions/runs/32466988968)** · `push` tag `v9.9.9` · 2m 40s · **failure at the guard**

A tag that deliberately disagrees with `package.json`. The whole gate suite
re-runs on the tagged commit — single-sourced from `ci.yml` via `workflow_call`,
so a gate added to CI later is automatically part of release gating.

```
✓ quality / changes     5s      ✓ quality / lint            18s
✓ quality / install    17s      ✓ quality / a11y          1m38s
✓ quality / cypress    47s      ✓ quality / coverage-gate   14s
✓ quality / storybook  26s      ✓ quality / ssr             24s
✓ quality / test       27s      ✓ quality / api-surface     31s
✓ quality / typecheck  23s      ✓ quality / consumers     1m17s
✓ quality / build      25s                        13 jobs green

✖ publish  27s
    ✓ checkout · setup-node · npm ci · npm run build
    ✖ Verify tag matches package.json version
        ::error::Tag v9.9.9 does not match package.json version 0.1.0
                 — aborting before publish (FR-010).
    -  Verify the changelog documents this version    never reached
    -  npm publish --provenance                       never reached
    -  Create the GitHub Release from the changelog    never reached
```

The tag was deleted immediately afterwards
(`git push origin :refs/tags/v9.9.9`), and `npm view @mlopaev/faster-ui` still
returns 404 — the package has never been published. The second guard (a version
with no changelog section) and the provenance publish itself remain unexercised
by design.

---

## 5. Model spend for the whole tour

34 calls, 167,390 prompt tokens, 3,787 completion tokens, 4,224 cached.

| Where | Job | Calls | Prompt | Completion | Cached | Outcome |
| ----- | --- | ----: | -----: | ---------: | -----: | ------- |
| #17 | `constitution-review` | 1 | 23,166 | 117 | 0 | full review of the whole diff — comment posted |
| #17 | `semver-classify` | 1 | 1,098 | 77 | 0 | required minor, claimed minor — agrees |
| #17 | `token-audit` | 1 | 1,905 | 63 | 0 | comment posted |
| #17 | `coverage-suggest` | **0** | 0 | 0 | 0 | coverage gate passes — no model call needed |
| #17 | `visual-judge` | 10 | 23,075 | 391 | 2,816 | 10 moved cells — PASS 8, FAIL 2 |
| #18 | `constitution-review` | 1 | 20,858 | 545 | 0 | full review of the whole diff — comment posted |
| #18 | `coverage-suggest` | 1 | 4,400 | 350 | 0 | coverage gate failed — suggestion posted |
| #18 | `token-audit` | 1 | 1,708 | 380 | 0 | comment posted |
| #18 | `triage` | 1 | 5,092 | 245 | 0 | CI run 32466196741 classified |
| #18 | `triage` | 1 | 5,092 | 198 | 0 | CI run 32466191872 classified |
| #19 | `constitution-review` | 1 | 20,509 | 277 | 0 | full review of the whole diff — comment posted |
| #19 | `token-audit` | 1 | 1,054 | 85 | 0 | comment posted |
| #19 | `coverage-suggest` | **0** | 0 | 0 | 0 | coverage gate passes — no model call needed |
| #19 | `visual-judge` | 12 | 45,324 | 708 | 1,408 | 12 moved cells — PASS 12, FAIL 0 |
| main | `draft-changelog` | 1 | 5,275 | 67 | 0 | nothing consumer-visible — no PR |
| main | `weekly-audit` | 1 | 8,834 | 284 | 0 | issue #15 created |

Three things worth reading off this table:

1. **The ordering in `visual.yml` is the cost control.** `visual-judge` is 22 of
   the 34 calls and 41% of the prompt tokens for **22 cells**. Judging all 239
   would have been roughly eleven times that, per pull request, for information
   the pixel comparison had already settled.
2. **`coverage-suggest` spent nothing twice.** It runs the deterministic gate
   itself and only calls a model when the gate fails.
3. **Completion tokens are tiny** — 3,787 against 167,390 prompt. Every job is one
   completion returning either a short verdict or schema-validated JSON. There are
   no agentic turns anywhere.

---

## 6. Findings

### F-1 · `accept-baselines` had never once completed — **fixed in #16**

It pushes its branch and then dies at `gh pr create`, and it has done so for two
separate reasons:

| Run | Date | Duration | Failure |
| --- | ---- | -------- | ------- |
| [32311334241](https://github.com/MustafaLopaev/faster-ui/actions/runs/32311334241) | 19 Aug | 39m 32s | `GitHub Actions is not permitted to create or approve pull requests` |
| [32464700548](https://github.com/MustafaLopaev/faster-ui/actions/runs/32464700548) | 21 Aug | 11m 23s | `The visual/baselines-<id> branch has no history in common with main` |

The first is a repository setting (now enabled — and it would have blocked
`draft-changelog` the first time it had a bullet to write). The second is
`actions/checkout@v5` defaulting to a shallow clone, so the pushed branch shares
no commit with `main`. Both failures land **after** the push, which is why 239
valid baselines from 19 August have been sitting on the unopenable branch
`visual/baselines-32311334241` ever since.

### F-2 · Pages was not enabled, so `docs.yml` failed on every push — **fixed**

Three consecutive merges to `main` deployed nothing, each failing with
`Get Pages site failed`. Green since Pages was switched on.

### F-3 · `union-member-without-story` is dead code for this repo's own pattern

`coverage-gate` has a rule for "a variant with no story". It resolves a union by
following one type-alias hop, and the const-object pattern the constitution
**mandates** makes `ButtonVariant` an `IndexedAccessType` —
`(typeof ButtonVariant)[keyof typeof ButtonVariant]` — which the resolver returns
empty for. **The check passes vacuously for every `variant` and `size` union in
the library.** #18 added a fifth variant that no story renders and the gate said
nothing.

The addition itself was not undetected — `test:ssr` pins the union's runtime shape
and caught it — but that is a different question. One asks "is this union shape
still what we publish"; the other asks "does a reviewer ever see this variant
rendered", and only the first currently has an answer.

### F-4 · The a11y matrix is a hardcoded literal

`Button.a11y.cy.tsx` enumerates
`TEXT_VARIANTS = ["primary", "outline", "ghost", "link"]` as a literal array, so
#18's fourth variant was never handed to axe. The `a11y` gate passed.

### F-5 · Two real Button defects, surfaced by #17's new story

At 360px and 200% text scale the full-width buttons clip their labels; in RTL the
two-slot button does not mirror, because the icon slots are physical
`leftIcon`/`rightIcon` rather than logical start/end. The second is pre-existing
behaviour that no story had exposed to the direction sweep. Both are left open on
#17 and need a decision, not a patch chosen by whoever notices first.

---

## 7. What was not shown, and why

| Path | Why not | What it would take |
| ---- | ------- | ------------------ |
| `visual.yml` → `nightly-sweep` | Guarded by `if: github.event_name == 'schedule'`; a dispatch cannot reach it | Wait for 03:17 UTC, or add a dispatch input |
| `changelog.yml` → the qualifying path | Fires only on a push to `main`, and the one merge available was not consumer-visible | Merge **#17** — it deliberately ships without its bullet. Its ten new visual cells would need accepting too |
| The fork guard | Every credential-holding job carries `head.repo.full_name == github.repository`; all four PRs are same-repo | A pull request from a fork. The jobs skip, and a skip counts as success |
| The credential guard | `.github/actions/claude-guard` only speaks up when the secret is unset, and it is set | A clone without `AZURE_OPENAI_API_KEY`; the step skips with a `::notice::` and the job still concludes green |
| `release.yml` → changelog guard + publish | The version guard fired first, so the changelog check and `npm publish --provenance` were never reached | A tag matching `package.json` with a real `## [x.y.z]` section — i.e. an actual release |

---

## 8. Reproducing it

```bash
# ── the two repository settings ────────────────────────────────────────────
gh api -X PUT repos/:owner/:repo/actions/permissions/workflow \
  -f default_workflow_permissions=read -F can_approve_pull_request_reviews=true
gh variable set REVIEW_MODE --body full          # unset means demo

# ── baselines: ubuntu-latest only; ~11 min at 2 cycles, ~40 min at 10 ─────
gh workflow run visual.yml -f accept-baselines=true -f stability-runs=2

# ── the dispatchable workflows ─────────────────────────────────────────────
gh workflow run audit.yml                        # opens an issue
gh workflow run docs.yml                         # deploys Pages
gh workflow run report.yml -f head-sha=$(git rev-parse main)

# ── the release guard, without publishing anything ────────────────────────
git tag v9.9.9 && git push origin v9.9.9
git push origin :refs/tags/v9.9.9                # after it aborts

# ci.yml, review.yml, visual.yml, triage.yml and report.yml all follow
# from opening the three showcase pull requests.
```

`REVIEW_MODE` is still set to `full`, which means every pull request now pays for
four large completions instead of one small one.
`gh variable delete REVIEW_MODE` restores the cheap default.

---

## 9. Complete run inventory

56 runs fired in the window. **42 belong to this tour**; the 14 listed under
§9.2 were triggered by an unrelated `git filter-branch` history rewrite that was
force-pushed from this machine at 08:47, and are recorded only so the run list
adds up.

### 9.1 The tour

| Time (UTC) | Workflow | Trigger | Ref | Result | Duration | Run |
| ---------- | -------- | ------- | --- | ------ | -------- | --- |
| 08:46:08 | Visual | dispatch | `main` | failure | 11m 28s | 32464700548 |
| 08:55:58 | Audit | dispatch | `main` | success | 0m 56s | 32465463749 |
| 08:56:00 | Docs | dispatch | `main` | success | 0m 49s | 32465466252 |
| 08:59:44 | CI | push | `visual/baselines-and-unshallow` | success | 2m 08s | 32465752565 |
| 09:00:04 | CI | pull_request | #16 | success | 1m 23s | 32465778787 |
| 09:00:04 | Review | pull_request | #16 | success | 0m 09s | 32465779212 |
| 09:00:04 | Visual | pull_request | #16 | success | 4m 19s | 32465779207 |
| 09:01:29 | Report | workflow_run | `main` | cancelled | 0m 39s | 32465900148 |
| 09:01:29 | Triage | workflow_run | `main` | skipped | 0m 07s | 32465900149 |
| 09:01:53 | Report | workflow_run | `main` | success | 2m 40s | 32465932566 |
| 09:01:53 | Triage | workflow_run | `main` | skipped | 0m 01s | 32465932570 |
| 09:04:44 | CI | push | `main` (#16 merge) | success | 1m 11s | 32466159234 |
| 09:04:44 | Changelog | push | `main` | success | 0m 14s | 32466159247 |
| 09:04:44 | Docs | push | `main` | success | 0m 41s | 32466159187 |
| 09:05:00 | CI | push | `showcase/button-full-width` | success | 3m 08s | 32466180211 |
| 09:05:03 | CI | pull_request | #17 | success | 2m 47s | 32466183681 |
| 09:05:03 | Review | pull_request | #17 | success | 0m 28s | 32466183637 |
| 09:05:03 | Visual | pull_request | #17 | **failure** | 5m 10s | 32466183697 |
| 09:05:09 | CI | push | `showcase/gate-violations` | **failure** | 3m 44s | 32466191872 |
| 09:05:12 | CI | pull_request | #18 | **failure** | 3m 01s | 32466196741 |
| 09:05:12 | Review | pull_request | #18 | success | 0m 49s | 32466196766 |
| 09:05:12 | Visual | pull_request | #18 | success | 5m 09s | 32466196652 |
| 09:05:19 | CI | push | `showcase/icon-only-radius` | success | 3m 23s | 32466206475 |
| 09:05:21 | CI | pull_request | #19 | success | 2m 40s | 32466209395 |
| 09:05:21 | Review | pull_request | #19 | success | 1m 19s | 32466209400 |
| 09:05:21 | Visual | pull_request | #19 | **failure** | 6m 42s | 32466209377 |
| 09:05:57 | Report | workflow_run | `main` | success | 0m 53s | 32466259190 |
| 09:05:57 | Triage | workflow_run | `main` | skipped | 0m 10s | 32466259238 |
| 09:07:54 | Report | workflow_run | `main` | cancelled | 0m 33s | 32466415225 |
| 09:07:54 | Triage | workflow_run | `main` | skipped | 0m 01s | 32466415291 |
| 09:08:03 | Report | workflow_run | `main` | cancelled | 0m 56s | 32466426882 |
| 09:08:03 | Triage | workflow_run | `main` | skipped | 0m 01s | 32466426940 |
| 09:08:10 | Report | workflow_run | #17 | success | 2m 40s | 32466436958 |
| 09:08:10 | Triage | workflow_run | `main` | skipped | 0m 02s | 32466437013 |
| 09:08:15 | Report | workflow_run | `main` | cancelled | 0m 56s | 32466443189 |
| 09:08:15 | Triage | workflow_run | #18 | **success** | 0m 22s | 32466443201 |
| 09:08:44 | Report | workflow_run | #19 | success | 3m 37s | 32466480391 |
| 09:08:44 | Triage | workflow_run | `main` | skipped | 0m 01s | 32466480503 |
| 09:08:54 | Report | workflow_run | #18 | success | 2m 08s | 32466495308 |
| 09:08:54 | Triage | workflow_run | #18 | **success** | 0m 20s | 32466495284 |
| 09:15:10 | Release | push tag | `v9.9.9` | **failure** | 2m 40s | 32466988968 |
| 09:19:00 | Report | dispatch | `main` | success | 0m 30s | 32467297218 |

### 9.2 Not part of the tour — the 08:47 history rewrite

A `git filter-branch` rewrite was force-pushed across every branch at 08:47:01
(visible in the local reflog as `main@{1}: filter-branch: rewrite`, which turned
`40e1b28` into `ce79cf1`). GitHub treated it as a push to four branches and fired
CI on each, which in turn fired Report and Triage. One of them —
`003-ci-release`, a long-abandoned branch — failed, and Triage duly classified it.

| Time (UTC) | Workflow | Ref | Result | Duration | Run |
| ---------- | -------- | --- | ------ | -------- | --- |
| 08:47:00 | CI | `004-quality-automation` | success | 1m 20s | 32464766079 |
| 08:47:01 | CI | `003-ci-release` | **failure** | 1m 12s | 32464766856 |
| 08:47:01 | CI | `main` | success | 1m 17s | 32464767629 |
| 08:47:01 | CI | `visual/baselines-32311334241` | success | 1m 52s | 32464766557 |
| 08:47:01 | Changelog | `main` | success | 0m 14s | 32464767612 |
| 08:47:01 | Docs | `main` | success | 0m 48s | 32464767584 |
| 08:48:15 | Report | `main` | success | 0m 13s | 32464860411 |
| 08:48:15 | Triage | `main` | success | 0m 18s | 32464860430 |
| 08:48:20 | Report | `main` | success | 1m 20s | 32464867140 |
| 08:48:20 | Triage | `main` | skipped | 0m 01s | 32464867230 |
| 08:48:22 | Report | `main` | success | 0m 13s | 32464870086 |
| 08:48:22 | Triage | `main` | skipped | 0m 02s | 32464870102 |
| 08:48:54 | Report | `main` | success | 0m 12s | 32464912300 |
| 08:48:54 | Triage | `main` | skipped | 0m 01s | 32464912262 |

---

## 10. Current state

| Item | State |
| ---- | ----- |
| `main` | `f9cbce6` — 239 baselines and the `fetch-depth: 0` fix merged |
| [#17](https://github.com/MustafaLopaev/faster-ui/pull/17) | Open. 11/11 gates green; two jury failures and one changelog finding to decide on |
| [#18](https://github.com/MustafaLopaev/faster-ui/pull/18) | **Draft. Must never merge** — it exists only to be red |
| [#19](https://github.com/MustafaLopaev/faster-ui/pull/19) | Open. Should be **closed or reworked** — `constitution-review` is right that it contradicts contract B10 |
| [Issue #15](https://github.com/MustafaLopaev/faster-ui/issues/15) | Weekly audit report, open |
| `REVIEW_MODE` | `full` — four large completions per PR until unset |
| Actions → create PRs | Enabled |
| Tag `v9.9.9` | Deleted, locally and on the remote |
| npm | `@mlopaev/faster-ui` still unpublished (404) |
| `visual/baselines-32311334241` | Stale branch, safe to delete — superseded by #16 |
