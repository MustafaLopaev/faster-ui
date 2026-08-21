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
| `report.yml` | `workflow_run` on `CI` completion, `workflow_dispatch` | never |

Job ids are API. Required-check configuration and the README badges reference them;
renaming one is a breaking change to repository settings.

---

## The model provider

Model-driven checks run on **Azure OpenAI** chat completions. The credential is
the `AZURE_OPENAI_API_KEY` repository secret; the endpoint, deployment and API
version come from the `AZURE_OPENAI_ENDPOINT` / `AZURE_OPENAI_DEPLOYMENT` /
`AZURE_OPENAI_API_VERSION` repository variables. The one client is
`scripts/azure-openai.mjs`; the per-job prompts and context-gathering live in
`.github/scripts/model-jobs.mjs` (PR review, triage, changelog) and
`scripts/visual-batch-judge.mjs` / `scripts/weekly-audit.mjs` (the scheduled
paths). **The model holds no tools anywhere** — scripts gather every input
deterministically and perform the one fixed action per job.

## The fork guard

Every job that consumes `AZURE_OPENAI_API_KEY` carries this condition verbatim:

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
      api-key: ${{ secrets.AZURE_OPENAI_API_KEY }}
  - if: steps.guard.outputs.ok == 'true'
    run: node .github/scripts/model-jobs.mjs <job>
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

## How verdicts reach the pull request

The script posts one **sticky comment** per job (`scripts/sticky-comment.mjs`,
marker `<!-- model-job:<id> -->`) — re-runs update it in place. The
`pull-requests: write` permission that allows it is granted deliberately; it is
the job's entire output. Because the SCRIPT posts rather than the model calling
a comment tool, the failure mode findings.md F-9 records against the retired
agentic action — a verdict reached with no way to say so — is structurally
gone.

## The overall results report

`report.yml` is the pipeline's closing act: when CI completes for a commit it
waits for the commit's other workflows to settle, then renders everything that
ran — every workflow, every job with conclusion and duration, the model-driven
verdict comments, and each run's artifacts — into one self-contained
`overall-report.html` (`scripts/run-report.mjs`; no model credential, reads
only). The file lands as the `overall-report` artifact, a compact table goes to
the job summary, and on pull requests a sticky comment links the download.
Locally: `npm run report` (defaults to the checked-out HEAD).

## Large diffs

The scripts bound what travels to the model by size (with an explicit
truncation marker the prompt tells the model not to guess past), and exclude
`visual/baselines` and `package-lock.json` from review diffs. There is no turn
budget any more — one completion per job, capped by `max_completion_tokens`.

## Review mode — demo by default

`review.yml` reads the `REVIEW_MODE` repository variable. **Unset means `demo`.**

| | `demo` (default) | `full` |
| --- | --- | --- |
| Jobs that run | `constitution-review` only | all four |
| Scope | exactly ONE changed source file, at most three findings | the whole change, size-capped |
| Cost profile | one small completion | one large completion per job |

Both modes use the same Azure OpenAI deployment (`AZURE_OPENAI_DEPLOYMENT`).
To opt into full reviews:

```bash
gh variable set REVIEW_MODE --body full
```

Demo is the default so the cost of a full review is always a deliberate opt-in
(findings.md F-9). There are no agentic turns any more — each job is a single
completion whose input the script bounds by size and whose output is capped by
`max_completion_tokens`.
