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
