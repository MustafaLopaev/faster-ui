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
npm run lint          # oxlint — zero warnings allowed
npm run typecheck     # tsc -b across all four TS projects
npm run test:coverage # Jest + RTL, coverage thresholds enforced
npm run cy:ct         # Cypress component tests
npm run build-storybook
npm run build         # library build + dist size budget
```

If your shell exports `ELECTRON_RUN_AS_NODE=1` (VS Code extension terminals
do), Cypress needs it unset: `env -u ELECTRON_RUN_AS_NODE npm run cy:ct`.

## What a change is expected to include

A component does not exist until it ships with its full contract, co-located:

```text
src/components/<Name>/
  <Name>.tsx          implementation
  <Name>.test.tsx     Jest + React Testing Library
  <Name>.cy.tsx       Cypress component tests
  <Name>.stories.tsx  every variant and state, plus a Playground
  index.ts            barrel
```

House rules that reviewers will check:

- **No hardcoded visual values.** Colours, radii, spacing and type come from
  semantic tokens via `fui:` utilities. `bg-[#3b82f6]`-style arbitrary values
  are constitution violations. `npm test` fails if a semantic token is added
  without a bridge line, or if a contrast pair regresses.
- **Tests assert user-observable behaviour** — roles, accessible names,
  keyboard flows — never class names as behaviour proofs.
- **Props extend the native element** via `ComponentPropsWithoutRef<'…'>`,
  refs are forwarded, `variant`/`size` are typed unions with defaults, and
  `className` is a merge-safe escape hatch appended last.
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
