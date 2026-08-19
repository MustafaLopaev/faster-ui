# Contributing to Faster UI

Thanks for taking the time. This repo is spec-driven and has a written
constitution — reading the two documents below first will save you a round of
review.

1. **`.specify/memory/constitution.md`** — seven principles (token-first
   styling, accessibility by default, one consistent component API, tested
   evidence, Storybook as documentation, library-first packaging, simplicity)
   plus the Definition of Done. All work must comply.
2. **`specs/<feature>/`** — the active feature's spec, plan and tasks.

## Setup

```bash
git clone https://github.com/MustafaLopaev/faster-ui.git
cd faster-ui
nvm use          # Node 22 (see .nvmrc); ≥ 20.19 also works
npm install
npm run dev      # token playground
npm run storybook
```

## The workflow

Features go through spec-kit: `/speckit-specify` → `/speckit-plan` →
`/speckit-tasks` → `/speckit-implement`. Specs live at feature granularity
(foundation, components, CI) — not one per prop. Don't start implementation
that has no spec or tasks backing it, except trivial fixes.

Two custom skills help: `/new-component` scaffolds a complete component
contract, and `/token-audit` checks for hardcoded visual values.

## Before you open a PR

Every gate below runs in CI on every push and pull request, and the release
workflow re-runs the whole suite on the tagged commit. Run them locally first:

```bash
npm run lint           # oxlint — zero warnings allowed
npm run lint:tokens    # Principle I: no raw colours or arbitrary visual values
npm run lint:workflows # the workflow files' own safety invariants
npm run typecheck      # tsc -b across all four TS projects
npm run test:coverage  # Jest + RTL, coverage thresholds enforced
npm run cy:ct          # Cypress component tests
npm run build-storybook
npm run build          # library build + dist size budget
```

`npm run build` first, then the gates that consume the built artifact:

```bash
npm run test:ssr       # server render → hydrate, plus the browserless import
npm run test:a11y      # axe per variant × mode × palette
npm run api:check      # the public surface still matches etc/faster-ui.api.md
npm run test:consumers # pack, install into three fixtures, publint + attw
npm run coverage:gate  # props ↔ JSDoc ↔ Playground ↔ one story per variant
```

Every one of these is the identical command CI runs. If a check exists only in
CI, it cannot be developed against — that is the whole point of the parity rule.

If your shell exports `ELECTRON_RUN_AS_NODE=1` (VS Code extension terminals
do), Cypress needs it unset: `env -u ELECTRON_RUN_AS_NODE npm run cy:ct`.

## What a change is expected to include

A component does not exist until it ships with its full contract, co-located:

```text
src/components/<Name>/
  <Name>.types.ts     types, prop unions, prop defaults
  <Name>.styles.ts    the class maps — configuration, not behaviour
  <Name>.tsx          behaviour only; imports both of the above
  <Name>.test.tsx     Jest + React Testing Library
  <Name>.cy.tsx       Cypress component tests
  <Name>.a11y.cy.tsx  the axe sweep for this component
  <Name>.stories.tsx  every variant and state, plus a Playground
  index.ts            barrel
```

Shared pieces live outside the component folders: SVGs in `src/assets/icons`
(prop-less, `aria-hidden`, `fui:size-full`), internal sub-components in
`src/components/internal`. A component file should contain neither.

House rules that reviewers will check:

- **No hardcoded visual values.** Colours, radii, spacing and type come from
  semantic tokens via `fui:` utilities. `bg-[#3b82f6]`-style arbitrary values
  are constitution violations. `npm test` fails if a semantic token is added
  without a bridge line, or if a contrast pair regresses.
- **Tests assert user-observable behaviour** — roles, accessible names,
  keyboard flows — never class names as behaviour proofs.
- **Props extend the native element** via `ComponentPropsWithoutRef<'…'>`,
  refs are forwarded, and `className` is a merge-safe escape hatch appended last.
- **Prop unions are const objects, not `enum`.** Every tsconfig sets
  `erasableSyntaxOnly: true`, so a TS `enum` will not compile (TS1294) — and an
  enum-typed prop would force consumers to import a symbol to write
  `variant="primary"`. Declare `export const X = {…} as const` plus
  `export type X = (typeof X)[keyof typeof X]`; the merged identifier works in
  both value and type position. Defaults come from a `<NAME>_DEFAULTS` const.
- **JSDoc every public prop.** It is what consumers see in IntelliSense and
  what Storybook's autodocs renders.
- **Anything exported must come through `src/index.ts`.** `src/lib/` is private.

## Touching the token layer

`src/tokens/` is split by tier and its import order is load-bearing — read the
header comment in `tokens.css` before rearranging anything. In particular:

- `semantic/dark.css` must be imported **after** `semantic/light.css`
  (`.dark` and `:root` tie on specificity, so source order decides).
- `reset.css` must sit **after** Tailwind's theme import and **before**
  `bridge.css`.
- Every semantic token needs a matching line in `bridge.css`, or no utility is
  generated for it. `src/tokens/tokens.test.ts` fails if you forget.
- Primitives must avoid the `--fui-{color,radius,font,font-weight,text,shadow,container,spacing}-*`
  shapes — those are Tailwind's prefixed theme namespaces, and reusing them
  makes the bridge emit self-referential declarations.
- A new colour pair that a component renders should be added to `PAIRS` in
  `tokens.test.ts` so its contrast is measured in both modes and both layers.

## Visual baselines

The visual matrix renders 239 cells — every story across both colour modes,
three viewport widths, both palettes, 200% text scaling, right-to-left, reduced
motion, and a frozen set of adversarial content. They are compared against
committed PNGs in `visual/baselines/`.

```bash
npm run build-storybook
npm run visual:capture   # writes visual/current/
npm run visual:compare   # diffs against visual/baselines/, writes visual/report.json
```

**Baselines are captured on `ubuntu-latest` and are valid only there.** Font
rasterisation alone makes a macOS capture differ from a Linux one on every
single cell, so `npm run visual:accept` refuses to run off Linux without
`--force`. When a change legitimately moves cells, regenerate them on the
runner:

```
gh workflow run visual.yml -f accept-baselines=true
```

That job captures once, then captures ten more times and refuses to open the
pull request if any cell drifted on the unchanged commit. An unstable baseline
set makes every later visual result meaningless, so it is refused rather than
committed. The pull request states the accepted-cell **count**, so a 200-cell
acceptance cannot be mistaken for a 2-cell one.

The set is bounded at 12 MB. If the matrix will not fit, the matrix narrows —
the budget does not silently rise, exactly as `scripts/postbuild.mjs` treats the
distribution budget.

## Local hooks

`.claude/settings.json` wires two hooks for contributors using Claude Code:

| Hook | What it does |
| ---- | ------------ |
| `PostToolUse` on `Edit`/`Write` | Refuses an edit to `src/components/**` or `src/lib/**` that introduces a raw colour, an arbitrary-value utility carrying a visual value, a non-semantic palette class, or a literal inline style. |
| `Stop` | Runs lint on the files this session changed, and `tsc -b` if any TypeScript changed. |

**They enforce nothing new, and this is deliberate.** Every rule the token hook
applies comes from `scripts/token-rules.mjs` — the same module the blocking
`npm run lint:tokens` gate imports. Both hooks duplicate a gate that cannot be
bypassed. A contributor who deletes `.claude/settings.json` is slower, never
less safe, and no pull request can pass because a hook was enabled.

That property is verified rather than asserted: disable the hooks, commit a
`bg-[#ff0000]`, and `npm run lint:tokens` fails anyway. If it ever did not, the
hook would have quietly become the only enforcement — which is a hole in the
pipeline, not a feature of the hook.

The `PostToolUse` matcher is scoped to component and shared-internal source. An
edit anywhere else runs no component-specific check, because a hook that fires
on every file is a hook that gets switched off.

## Commits and PRs

Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`.

Add a bullet under `## [Unreleased]` in `CHANGELOG.md` for anything a consumer
would notice. The release workflow refuses to publish a version with no
changelog section.

## Releasing (maintainers)

1. Move the `Unreleased` entries into a new `## [x.y.z] - YYYY-MM-DD` section.
2. Bump `version` in `package.json` to match.
3. Merge to `main`, then `git tag vx.y.z && git push --tags`.

The release workflow re-runs every CI gate on the tagged commit, verifies the
tag matches `package.json` and that the changelog documents the version, then
publishes to npm with provenance and opens a GitHub Release from the changelog
section. A red pipeline blocks the publish — releases are never manual.

## Reporting problems

Bugs and feature requests: <https://github.com/MustafaLopaev/faster-ui/issues>.
Security issues: see [SECURITY.md](./SECURITY.md) — please don't open a public
issue for those.
