# Contract: Off-Pipeline Automation

The four automations that never gate a pull request, plus the local authoring hooks. Every one of these **reports or proposes**; none commits to the default branch (FR-034), and none can turn a run red.

## C1 — Design drift watcher (local only)

**This one cannot run in GitHub Actions**, and that is a finding rather than an omission. The Figma connector is authenticated on the developer machine; a runner has no path to it. Adding a Figma REST token as a repository secret would compare against a *differently shaped* source than the one the extraction was performed through — a correctness risk, not merely a cost (research R-12).

| Property | Value |
| -------- | ----- |
| Home | `.claude/skills/design-drift/SKILL.md` |
| Invocation | `/design-drift` on demand, or a scheduled local routine |
| Reads | The TapTap variable set via the Figma connector |
| Compares against | `src/tokens/primitives/**`, `src/tokens/semantic/**` |
| Suppression source | `specs/001-foundation-tooling/figma-extraction.md`, `specs/002-core-components/figma-extraction.md` |
| Output | An issue, or a report — never a code change |

**Suppression is mandatory, not optional** (FR-031). The extraction records document deliberate deviations — `radius-surface` at 4 px (the 002 correction; the 8 px reading came from a demo artboard and the `--fui-radius-8` primitive was deleted with it) and the a11y overlay values. Reporting these as drift would train the reader to ignore the report, which is the only failure mode that matters for a scheduled check.

**`unreachable` is a required outcome** (FR-032). When the connector is unavailable, the report says so. An all-clear it did not establish is worse than no report — this is the one behaviour that separates a useful scheduled check from a dangerous one.

## C2 — CI failure triage (`.github/workflows/triage.yml`)

| Property | Value |
| -------- | ----- |
| Trigger | `workflow_run` on `CI`, `conclusion: failure` |
| Permissions | `contents: read`, `actions: read`, `pull-requests: write` |
| Reads | The failed run's logs |
| Output | A comment on the associated pull request |
| Blocking | never |

**Classification**: `regression` · `known-flake` · `infrastructure`. A `known-flake` verdict **must name the pattern it matched** (FR-033) — an unnamed flake claim is indistinguishable from a guess.

**The documented flake shapes**, which are what make this worth building here specifically:

| Pattern | Signature |
| ------- | --------- |
| CDP mouse persistence | A Cypress rest-state colour assertion failing after a hover test; the mouse must be parked on `[data-cy="park"]` before asserting rest state |
| `ELECTRON_RUN_AS_NODE` | Cypress failing to launch. Local-only — set to `1` in VS Code extension terminals *(verified set in this environment)*. GitHub runners never set it, so seeing this in CI means something else |
| Cold Cypress binary cache | A long install followed by success; duration anomaly, not a failure |
| Consumer framework major release | `consumers` failing while every other gate passes — infrastructure, not a packaging regression |

A triage agent that knows these four by name resolves most red builds without a human opening a log. That specificity is the entire argument for C2; a generic log summariser would not be worth the workflow file.

## C3 — Changelog drafter (`.github/workflows/changelog.yml`)

| Property | Value |
| -------- | ----- |
| Trigger | `push` to `main` |
| Permissions | `contents: write` **on a new branch only**, `pull-requests: write` |
| Output | A pull request adding a bullet under `## [Unreleased]` |
| Blocking | never |

**Never writes to `main`** (FR-034). The rule it applies is the repository's own, quoted from `CLAUDE.md`: *"Anything a consumer would notice gets a bullet."* A change no consumer would notice produces **no** pull request — silence is the correct output, and a drafter that always proposes something becomes noise within a week.

**Why this is load-bearing**: `release.yml` already refuses to publish a version with no changelog section, so the changelog is not documentation — it is a release gate. Drafting it early means the gate is satisfied before it is hit.

## C5 — Scheduled deep audit (`.github/workflows/audit.yml`)

| Property | Value |
| -------- | ----- |
| Trigger | `schedule`, weekly, plus `workflow_dispatch` |
| Runs | `.claude/skills/production-audit/SKILL.md` against `main` |
| Delivery | Anthropic SDK **Batch API** (FR-038) |
| Output | An issue, with findings diffed against the previous week's |
| Blocking | never |

**The diff is the product, not the findings** (FR-035). A standing audit that reports the same twelve findings every week is ignored by week three. What is actionable is *what changed*: a metric that moved toward its limit.

**Tracked drift metrics**, each of which already has an enforced limit somewhere:

| Metric | Limit | Enforced by |
| ------ | ----- | ----------- |
| `dist/index.js` size | 24 KB | `scripts/postbuild.mjs` |
| `dist/styles.css` size | 26 KB | `scripts/postbuild.mjs` |
| Jest coverage | 95/88/100/97 | `jest.config.ts` thresholds |
| Baseline set weight | 12 MB | SC-011 |
| Dependency staleness | — | Dependabot |

Reporting *approach* to a limit is the value; the limits themselves already fail on breach.

## C4 — Local authoring hooks (`.claude/settings.json`)

| Hook | Matcher | Action |
| ---- | ------- | ------ |
| `PostToolUse` | `Edit\|Write` on `src/components/**` | Token-audit regex fast path; **refuses** the edit on a raw colour, arbitrary-value utility, or non-semantic palette class |
| `Stop` | — | `lint` and `typecheck` on changed files |

**The hooks enforce nothing new.** Every rule they apply is also enforced by a gate that cannot be bypassed (FR-036). A contributor without them is slower, never less safe.

**SC-013 verifies this by construction**: disable the hooks entirely, push an offending change, and confirm the corresponding gate still fails. If it does not, the hook has quietly become load-bearing and the gate has a hole — which is the actual thing that assertion is testing.

**Scope guard**: an edit outside `src/components/**` runs no component-specific check (US6 scenario 4). A hook that fires on every file is a hook that gets disabled.

## Shared properties

| Property | Applies to |
| -------- | ---------- |
| Skips green without the credential | C2, C3, C5 — same guard idiom as [review-jobs.md](./review-jobs.md) |
| Never a required check | all five |
| Never writes to `main` | all five |
| Read-only tools except where a pull request is opened | C3 is the only one with any write capability, and only onto a new branch |

## Cost

| Job | Frequency | Path | Monthly |
| --- | --------- | ---- | ------- |
| C2 triage | on failure only | action | < $2 |
| C3 changelog | per merge | action | < $1 |
| C5 audit | weekly | Batch API | < $1 |
| C1 drift | on demand | local | not metered |

Combined with `review.yml` (~$6) and the visual jury (~$10), this holds SC-009's **≈ $20/month** target at current change volume.
