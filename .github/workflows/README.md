# Workflows

Six workflows. `ci.yml` and `release.yml` come from 003; `review.yml`, `visual.yml`,
`triage.yml`, `changelog.yml` and `audit.yml` come from 004 (the quality automation
layer — see `specs/004-quality-automation/`).

| File | Trigger | Blocks a merge? |
| ---- | ------- | --------------- |
| `ci.yml` | `push`, `pull_request`, `workflow_call` | **yes** — eleven deterministic gates |
| `release.yml` | `push` tags `v*` | n/a — re-runs `ci.yml` before publishing |
| `docs.yml` | `push` to `main` | no |
| `visual.yml` | `pull_request`, `schedule` | capture + compare **yes**; judgment never |
| `review.yml` | `pull_request` | **never** (FR-017) |
| `triage.yml` | `workflow_run` on `CI` failure | never |
| `changelog.yml` | `push` to `main` | never |
| `audit.yml` | weekly `schedule`, `workflow_dispatch` | never |

Job ids are API. Required-check configuration and the README badges reference them;
renaming one is a breaking change to repository settings.

---

## The fork guard

Every job that consumes `ANTHROPIC_API_KEY` carries this condition verbatim:

```yaml
if: github.event.pull_request.head.repo.full_name == github.repository
```

A fork-originated pull request never reaches the job, so the secret is never in
scope for code nobody has reviewed. The job's absence is a *skip*, which GitHub
reports as success — the contributor still gets a complete verdict (SC-005).

**`pull_request_target` is forbidden** (FR-018). It is precisely the mechanism
that would run with repository secrets in the context of an unreviewed head ref,
and there is no configuration of it that makes a model-driven review of untrusted
diff content safe. If a future workflow appears to need it, the answer is that the
check does not run for forks — not that the trigger changes.

## The credential guard

The fork guard covers forks. `.github/actions/claude-guard` covers the other
half: a repository where the secret is simply unset (a clone, a contributor's
own fork of the whole project, the period before operator task 1 is done).

```yaml
steps:
  - uses: ./.github/actions/claude-guard
    id: guard
    with:
      api-key: ${{ secrets.ANTHROPIC_API_KEY }}
  - if: steps.guard.outputs.ok == 'true'
    uses: anthropics/claude-code-action@v1
```

The step is skipped, the job concludes **successful**, and a `::notice::` explains
why. No model-driven job may ever be configured as a required check (FR-017), so
this can never become a merge blocker.

## Base-ref authority

Model-driven jobs read their reference material — `.specify/memory/constitution.md`,
`specs/*/contracts/*.md`, `CLAUDE.md`, `visual/rubric.md` — from the **base ref**,
never from the pull request head:

```yaml
- uses: actions/checkout@v5
  with:
    ref: ${{ github.event.pull_request.base.sha }}
    path: base
```

A change that edits the constitution is therefore judged *as a change to* the
rules, not *by* its own version of them (research R-10, measure 2). This is the
control that makes the injection test in quickstart Scenario 5 pass; if a verdict
ever shifts under an injection attempt, check this first.

---

## Shared path-filter sets

Three named sets, used by `dorny/paths-filter` in `ci.yml`, `review.yml` and
`visual.yml`. A docs-only change must match **none** of them (FR-005, SC-004).

### `code`

Gates that exercise the library or its packaging.

```yaml
code:
  - 'src/**'
  - 'package.json'
  - 'package-lock.json'
  - 'scripts/**'
  - 'test/consumers/**'
  - 'vite.config.ts'
  - 'tsconfig*.json'
  - 'jest.config.ts'
  - 'api-extractor.json'
```

Used by: `ssr`, `consumers`, `api-surface`, `a11y`, `coverage-gate`,
`constitution-review`.

### `components`

Changes to component or shared-internal source.

```yaml
components:
  - 'src/components/**'
  - 'src/lib/**'
```

Used by: `token-audit`, `coverage-suggest`.

### `visual`

Anything that can move a rendered pixel.

```yaml
visual:
  - 'src/components/**'
  - 'src/tokens/**'
  - '**/*.stories.tsx'
  - 'visual/**'
```

Used by: `visual-capture`, `visual-compare`, `visual-judge`.

### What matches nothing

`**.md`, `specs/**`, `docs/**`, `LICENSE`, `.github/**` on its own. A change
touching only these executes no 004 check and still receives a verdict — every
filtered job reports success rather than being absent from the run summary.

---

## The comment tool must stay in `allowedTools`

Every model-driven job lists `mcp__github_comment__update_claude_comment` in its
`--allowedTools`. It looks like a write tool sitting in a read-only allowlist,
and it is the obvious thing to "tidy away" during a security pass. Do not.

Restricting `--allowedTools` replaces the action's default set entirely,
including its own comment tool. Without it the agent runs, reads the diff,
reaches a verdict — and has no way to say so. Verified the hard way on PR #9:
`token-audit` completed cleanly in 31 turns and $1.50, `constitution-review`
burned 61 turns, $2.92 and eight permission denials retrying a tool it was not
allowed to call, and **zero comments appeared on the pull request**. Three jobs
reported success while producing nothing.

This does not weaken injection hardening measure 1. That measure is about a job
being unable to modify the repository — no `contents: write`, no file-write
tools, no push. Posting a comment is the job's entire output, and the
`pull-requests: write` permission that allows it is granted deliberately.
Findings F-9 in `specs/004-quality-automation/findings.md`.

## Large diffs

`constitution-review` reads `git diff --stat` first and then individual files.
Piping is not in the allowed command set (`Bash(git diff:*)` matches a command
that *starts with* `git diff`, so `git diff … | head` is denied), and dumping a
10,000-line diff in one turn exhausts the budget before anything is judged.

## Review mode — demo by default

`review.yml` reads the `REVIEW_MODE` repository variable. **Unset means `demo`.**

| | `demo` (default) | `full` |
| --- | --- | --- |
| Jobs that run | `constitution-review` only | all four |
| Model | Haiku 4.5 | Opus 5 |
| Turn cap | 6 | 40 (25 for the others) |
| Scope | exactly ONE changed source file, named in the prompt | the whole change |
| Typical cost | cents | $1–6 on a large change |

To opt into full reviews:

```bash
gh variable set REVIEW_MODE --body full
```

Demo is the default so the cost of a full review is always a deliberate opt-in
(findings.md F-9). Every model-driven job also carries a `--max-turns` cap in
both modes — not a substitute for a well-scoped prompt, but a bound on the
damage when the prompt is wrong.
