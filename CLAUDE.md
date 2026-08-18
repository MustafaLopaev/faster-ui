# Faster UI — Claude Code Guide

Production-grade React component library (**Button**, **Input**, **Dialog**)
for a design-system engineering task. Full brief: `docs/udc-requirements.md`.
Design source: TapTap Design System Figma file (link in the brief).

## Governing documents (read in this order)

1. `.specify/memory/constitution.md` — the project constitution. Seven
   principles (token-first styling, a11y by default, consistent API, mandatory
   tests, Storybook contract, library-first packaging, simplicity) plus the
   Definition of Done for components. **All work must comply.**
2. `specs/[###-feature]/` — the active feature's spec, plan, and tasks.

## Workflow

This repo uses **spec-driven development** via GitHub spec-kit:

`/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`

- Specs live in `specs/`, one per feature (foundation, components) — not one
  per prop. Templates in `.specify/templates/` are pre-tailored to this repo.
- Never start implementation work that has no spec/tasks backing, except
  trivial fixes.
- Custom skills: `/new-component` scaffolds a complete component contract;
  `/token-audit` checks for hardcoded visual values.

## Architecture decisions (settled — don't re-litigate)

- **Vite stays** (library mode for the build; also powers Storybook and
  Cypress CT). Jest runs standalone with its own transform because the brief
  mandates Jest over Vitest.
- **Tailwind CSS v4**, CSS-first, in `src/tokens/tokens.css` (the single
  source of every visual value). Layering (refined during foundation, see
  research R-3): **primitives** are private `--fui-*` custom properties on
  `:root` (deliberately *not* in `@theme`, so no primitive utilities exist);
  **semantics** are purpose-named refs re-declared under `.dark`; a
  `@theme inline` bridge generates the only utilities components may use —
  all `fui:`-prefixed (native `prefix(fui)`). Tailwind's default palette and
  radii are wiped; preflight is deliberately not imported (the shipped
  stylesheet must not restyle host elements).
- **Dialog** wraps the native `<dialog>` element (top-layer, focus handling)
  with a controlled React API.
- **react / react-dom are peer dependencies.** Public API exports only
  through `src/index.ts`.

## Layout

```text
src/tokens/            tokens.css (primitives → semantics → @theme inline bridge)
src/components/<Name>/ <Name>.tsx + .test.tsx (Jest) + .cy.tsx (Cypress)
                       + .stories.tsx + index.ts   (co-located contract)
src/lib/               shared internals (reserved — empty so far)
src/index.ts           the only public export surface
src/main.tsx           dev playground (not part of the library build)
```

TypeScript is split into four referenced projects (Jest and Cypress globals
collide): `tsconfig.lib.json` (shipping code), `tsconfig.test.json`
(*.test.tsx, stories, playground, .storybook/preview.tsx), `tsconfig.cypress.json`
(*.cy.tsx + cypress/), `tsconfig.node.json` (config files).

## Commands

```bash
npm run dev              # Vite dev playground (live token styling)
npm run build            # tsc -b && vite build → dist/ (ESM + d.ts + styles.css)
npm run lint             # oxlint
npm run typecheck        # tsc -b (all four TS projects)
npm test                 # Jest (test:watch for TDD)
npm run cy:ct            # Cypress component tests headless (cy:open interactive)
npm run storybook        # Storybook dev at :6006 (light/dark toolbar)
npm run build-storybook  # static workbench build
```

Quirk: in shells where `ELECTRON_RUN_AS_NODE=1` is exported (e.g. VS Code
extension terminals), Cypress must run with it unset:
`env -u ELECTRON_RUN_AS_NODE npm run cy:ct`.

## Conventions

- TypeScript strict; props extend the native element via
  `ComponentPropsWithoutRef<'...'>`; forward refs; `variant`/`size` as typed
  unions with defaults; `className` merge-safe escape hatch.
- Tests assert user-observable behavior (roles, accessible names, keyboard
  flows) — never class names as behavior proofs.
- No hardcoded colors/spacing/radii in components — semantic tokens only.
  `bg-[#hex]`-style arbitrary values are constitution violations.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
