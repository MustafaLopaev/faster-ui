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

Create `src/components/<Name>/` with exactly these seven files. The split is
the house structure — behaviour, contract and configuration each get their own
file, and the co-located specs sit beside them:

### 1. `<Name>.types.ts` — the contract

- Every type, interface and prop union for the component lives here. Nothing
  type-shaped stays in `<Name>.tsx`.
- Prop unions are declared as a **const object plus a derived union**, never a
  TS `enum` — `enum` emits runtime code and every tsconfig here sets
  `erasableSyntaxOnly: true`, so it is a compile error (TS1294). It would also
  force consumers to import a symbol just to write `variant="primary"`:

  ```ts
  export const <Name>Variant = { primary: 'primary', outline: 'outline' } as const
  export type <Name>Variant = (typeof <Name>Variant)[keyof typeof <Name>Variant]
  ```

  Declaration merging makes the one identifier serve as both value and type.
  Member keys mirror their literal values exactly.
- Props interface `<Name>Props` extending `ComponentPropsWithoutRef<'<native-element>'>`
  (choose the semantically correct native element from the spec).
- JSDoc on **every** public prop — it is what IntelliSense and Storybook
  autodocs render.
- A `<NAME>_DEFAULTS` const holding each prop's default, referenced from the
  component's destructuring so no default is written as a bare literal.

### 2. `<Name>.styles.ts` — the configuration

- Every class string the component can apply: base, per-size, per-variant,
  per-state. Plain lookup maps of static `fui:*` strings joined by `cn()` —
  no variant library (002 research R-1).
- Key the maps by the const-object members (`[<Name>Size.lg]: '…'`) so a
  renamed variant is a compile error here rather than a missing style.
- **Semantic token utilities only** — no raw hex/rgb/arbitrary values.
- Adding this file means Tailwind must see it: `src/tokens/tokens.css` already
  globs `../components/**/*.{ts,tsx}`, and `scripts/postbuild.mjs` fails the
  build if any class in shipping source is missing from `dist/styles.css`.

### 3. `<Name>.tsx` — the behaviour

- Imports its types from `./​<Name>.types` and its classes from `./​<Name>.styles`;
  contains neither.
- Explicit ref forwarded to the native element.
- Shared icon assets come from `src/assets/icons`; shared internal
  sub-components from `src/components/internal`. Do **not** define an inline
  SVG or a helper component in this file — an SVG belongs in `src/assets/icons`
  (prop-less, `aria-hidden`, `fui:size-full`), a sub-component in
  `src/components/internal`.
- `className` merged last via the shared `cn` helper from `src/lib`.
- Set an explicit `displayName`.

### 4. `<Name>.test.tsx` — Jest + RTL suite

Cover, minimum:

- Renders with an accessible role and name.
- Every `variant` and `size` renders (iterate `Object.values(<Name>Variant)`).
- Disabled/error states behave per spec (not just look — behavior:
  no onClick when disabled, aria-invalid when error, etc.).
- User interactions via `@testing-library/user-event`, including keyboard.
- Ref is forwarded to the native element.
- Native props pass through (e.g. `type`, `aria-*`).

### 5. `<Name>.cy.tsx` — Cypress component suite

Cover, minimum:

- Mounts successfully and renders expected content.
- Primary interaction flow with real events (click, type, open/close).
- One realistic user journey per P1 acceptance scenario in the spec.

### 6. `<Name>.stories.tsx` — Storybook stories

- Meta with `title: 'Components/<Name>'`.
- One story per variant, plus stories for disabled/error/interaction states
  in the spec's matrix.
- A **Playground** story exposing every public prop via controls.
- Declare `argTypes` at **meta** level, not on the Playground story, so the
  autodocs page carries the table too. If `<Name>Props` is a discriminated
  union, automatic docgen resolves nothing — author the table by hand and say
  so in a comment (see `Button.stories.tsx`).

### 7. `index.ts` — barrel

Re-export the component, its const objects (one plain `export`, which carries
both the value and the merged type), and its remaining types. Then add the
same exports to `src/index.ts`.

## After scaffolding

1. Run the Jest suite and Cypress suite for the new component; both must pass.
2. Run `npm run lint:tokens` (deterministic) and `/token-audit` (advisory) over
   the new files.
3. Run `npm run build` — the postbuild guard proves every class the component
   uses actually reached the stylesheet.
4. Run `npm run api:report` and commit the updated `etc/faster-ui.api.md`; a
   new export is a public-surface change.
5. Add the component's rendered colour pairs to `PAIRS` in
   `src/tokens/tokens.test.ts` so their contrast is measured in both modes.
3. Report the created files and test results; remind the user the component
   isn't Done until it meets the constitution's Definition of Done.
