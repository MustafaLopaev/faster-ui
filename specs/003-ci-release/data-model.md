# Data Model: CI/CD Pipeline & npm Release

Infrastructure feature — the "data" are pipeline and packaging entities, their attributes, and their state transitions. Contracts referencing these entities: [contracts/](./contracts/).

## Entities

### Quality Gate

The unit of protection. Exactly seven exist (FR-002); their **names are a public contract** — PR checks, required-check configuration, and reviewer expectations all reference them.

| Gate (job id) | Local command (identical in CI, FR-003) | Depends on |
| ------------- | --------------------------------------- | ---------- |
| `install`     | `npm ci`                                 | —          |
| `lint`        | `npm run lint`                           | `install`  |
| `typecheck`   | `npm run typecheck`                      | `install`  |
| `test`        | `npm test`                               | `install`  |
| `cypress`     | `npm run cy:ct`                          | `install`  |
| `storybook`   | `npm run build-storybook`                | `install`  |
| `build`       | `npm run build`                          | `install`  |

Validation rules: a gate runs its script verbatim — no extra flags, no subsets; a nonzero exit fails the gate; any failed gate fails the run (FR-006).

### Pipeline Run

One execution of the quality suite for one commit.

- **Fields**: trigger (`push` to a branch | `pull_request` | `workflow_call` from release), commit SHA, gate verdicts (7), overall verdict.
- **States**: `queued → in_progress → success | failure | cancelled` (cancelled only by a newer run on the same ref superseding it — never affects a completed verdict).
- **Rules**: every branch push and PR produces a run (FR-001); overall success ⇔ all seven gates succeed.

### Release

One tag-triggered attempt to publish.

- **Fields**: tag (`vX.Y.Z`), tagged commit SHA, embedded Pipeline Run (via `workflow_call`), version-match verdict, publish verdict.
- **States**: `gates_running → version_check → publishing → published | aborted`.
- **Transitions/rules**: `gates_running → aborted` on any red gate (FR-008); `version_check → aborted` when `tag minus 'v' ≠ manifest version` (FR-010); `publishing → aborted` when the registry rejects (e.g. version already published — surfaced, never silent); only `published` yields a Published Package.

### Published Package

- **Fields**: name `@mlopaev/faster-ui`, version (= tag, FR-010), contents (`dist/` only: ESM module, type declarations, stylesheet — from the existing `files` whitelist), access `public`, peers (`react`, `react-dom` ^19).
- **Rules**: installable without authentication (FR-009); immutable once published (registry semantics — a re-release requires a new version).

### Runtime Pin

- **Fields**: file `.nvmrc`, value `22`.
- **Rules**: the only Node-version declaration in the repo (FR-005); read by local version managers and by every CI job; changing it changes both worlds at once.

### Cache Entry

- **Kinds**: npm cache (keyed on lockfile hash), Cypress binary (keyed on locked Cypress version `15.21.0`).
- **Invariant**: outcome-neutral — hit or miss changes duration only, never a verdict (FR-004).

### Credential

- **Fields**: `NPM_TOKEN` repository secret (granular npm automation token, publish-only scope for the `@mlopaev` scope).
- **Rules**: referenced exclusively by the release workflow's publish job; structurally absent from PR-triggered runs (FR-012).

### Status Badge

- **Fields**: source = CI workflow status on `main`, placement = README top, link = workflow run history.
- **Rules**: reflects the latest completed default-branch run automatically (SC-007); renders for authenticated collaborators on the private repo (FR-013).

## Relationships

```text
Runtime Pin ──read by──▶ every Quality Gate job
commit ──push/PR──▶ Pipeline Run ──contains 7──▶ Quality Gate verdicts
tag vX.Y.Z ──▶ Release ──embeds──▶ Pipeline Run (workflow_call)
Release ──on all-green + version match──▶ Published Package
Credential ──available only to──▶ Release.publish
Pipeline Run (main, latest) ──rendered as──▶ Status Badge
Cache Entry ──accelerates, never decides──▶ Pipeline Run
```
