---
name: new-component
description: Scaffold a new Faster UI component with its complete co-located contract — implementation, Jest suite, Cypress component suite, Storybook stories, and barrel exports — all conforming to the constitution's API and testing principles. Use when adding any new component to the library.
---

# New Component Scaffolder

Scaffold a component named `$ARGUMENTS` (PascalCase). If no name was given, ask for one.

## Prerequisites — verify before scaffolding

1. A spec for this component exists under `specs/` with a filled **Component
   API Surface** and **Variants & States Matrix**. If none exists, stop and
   tell the user to run `/speckit-specify` first — scaffolding without a spec
   violates the workflow.
2. Read `.specify/memory/constitution.md` (Principles III, IV, V) and the
   component's spec before writing any file.

## Files to create

Create `src/components/<Name>/` with exactly these five files:

### 1. `<Name>.tsx` — implementation

- Props interface `<Name>Props` extending
  `ComponentPropsWithoutRef<'<native-element>'>` (choose the semantically
  correct native element from the spec).
- Explicit ref support forwarded to the native element (React 19: accept
  `ref` as a prop typed via `Ref<HTMLxElement>`).
- `variant` / `size` as typed string-literal unions with defaults matching
  the spec's API table.
- Variant classes composed from **semantic token utilities only** — no raw
  hex/rgb/arbitrary values.
- `className` merged last via the shared `cn` helper from `src/lib`.
- Export the component and its props type.

### 2. `<Name>.test.tsx` — Jest + RTL suite

Cover, minimum:

- Renders with an accessible role and name.
- Every `variant` and `size` renders (iterate the union).
- Disabled/error states behave per spec (not just look — behavior:
  no onClick when disabled, aria-invalid when error, etc.).
- User interactions via `@testing-library/user-event`, including keyboard.
- Ref is forwarded to the native element.
- Native props pass through (e.g. `type`, `aria-*`).

### 3. `<Name>.cy.tsx` — Cypress component suite

Cover, minimum:

- Mounts successfully and renders expected content.
- Primary interaction flow with real events (click, type, open/close).
- One realistic user journey per P1 acceptance scenario in the spec.

### 4. `<Name>.stories.tsx` — Storybook stories

- Meta with `title: 'Components/<Name>'`, autodocs tag.
- One story per variant, plus stories for disabled/error/interaction states
  in the spec's matrix.
- A **Playground** story exposing every public prop via controls
  (argTypes with proper control types for unions).

### 5. `index.ts` — barrel

Re-export the component and props type. Then add the export to `src/index.ts`.

## After scaffolding

1. Run the Jest suite and Cypress suite for the new component; both must pass.
2. Run `/token-audit` on the new component file.
3. Report the created files and test results; remind the user the component
   isn't Done until it meets the constitution's Definition of Done.
