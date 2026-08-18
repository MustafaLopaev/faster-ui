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
- **Tailwind CSS v4**, CSS-first: tokens are CSS variables declared via
  `@theme` in `src/tokens/tokens.css`. Layering: primitive → semantic;
  components consume semantic tokens only.
- **Dialog** wraps the native `<dialog>` element (top-layer, focus handling)
  with a controlled React API.
- **react / react-dom are peer dependencies.** Public API exports only
  through `src/index.ts`.

## Layout

```text
src/tokens/            tokens.css (@theme, primitive + semantic CSS vars)
src/components/<Name>/ <Name>.tsx + .test.tsx (Jest) + .cy.tsx (Cypress)
                       + .stories.tsx + index.ts   (co-located contract)
src/lib/               shared internals (cn, hooks)
src/index.ts           the only public export surface
```

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # tsc -b && vite build (library)
npm run lint         # oxlint
npm test             # Jest (once configured)
npm run cy:ct        # Cypress component tests (once configured)
npm run storybook    # Storybook dev (once configured)
```

(Testing/Storybook scripts land with the foundation feature — check
package.json for the current truth.)

## Conventions

- TypeScript strict; props extend the native element via
  `ComponentPropsWithoutRef<'...'>`; forward refs; `variant`/`size` as typed
  unions with defaults; `className` merge-safe escape hatch.
- Tests assert user-observable behavior (roles, accessible names, keyboard
  flows) — never class names as behavior proofs.
- No hardcoded colors/spacing/radii in components — semantic tokens only.
  `bg-[#hex]`-style arbitrary values are constitution violations.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`).
