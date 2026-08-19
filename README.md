# Faster UI

[![CI](https://github.com/MustafaLopaev/faster-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/MustafaLopaev/faster-ui/actions/workflows/ci.yml)
[![Visual](https://github.com/MustafaLopaev/faster-ui/actions/workflows/visual.yml/badge.svg)](https://github.com/MustafaLopaev/faster-ui/actions/workflows/visual.yml)
[![npm](https://img.shields.io/npm/v/@mlopaev/faster-ui.svg)](https://www.npmjs.com/package/@mlopaev/faster-ui)
[![license](https://img.shields.io/npm/l/@mlopaev/faster-ui.svg)](./LICENSE)

Production-grade React component library for the Faster Design System —
**Button**, **Input**, **Dialog** — built on design tokens extracted from the
TapTap Design System Figma file.

React 19 · TypeScript (strict) · Tailwind CSS v4 · Jest · Cypress CT ·
Storybook · GitHub Actions

## Install

```bash
npm install @mlopaev/faster-ui
```

`react` and `react-dom` (≥ 19) are **peer** dependencies — your app provides
them. The package is ESM-only and ships its own pre-compiled stylesheet, so
**Tailwind is not required in your app**.

```tsx
import { useState } from 'react'
import { Button, Input, Dialog } from '@mlopaev/faster-ui'
import '@mlopaev/faster-ui/styles.css' // once, at your app root

export function InviteFlow() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  return (
    <>
      <Button onClick={() => setOpen(true)}>Invite teammate</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Invite teammate"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>Send invite</Button>
          </>
        }
      >
        <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Dialog>
    </>
  )
}
```

### Entry points

| Import | What it is |
| ------ | ---------- |
| `@mlopaev/faster-ui` | The components and their prop types |
| `@mlopaev/faster-ui/styles.css` | The compiled token layer + component utilities (**required**) |
| `@mlopaev/faster-ui/a11y.css` | Optional — raises the palette to WCAG 2.1 AA ([why](#accessibility)) |

Deep imports don't resolve; the four entries above are the whole surface.
Exports: `Button` / `ButtonProps` / `TextButtonProps` / `IconOnlyButtonProps`,
`Input` / `InputProps`, `Dialog` / `DialogProps`, plus the prop-value tables
below.

### Prop values: strings or symbols, your choice

Every `variant` / `size` prop is a union of string literals, so the ordinary
form works and is fully type-checked — `variant="nope"` is a compile error:

```tsx
<Button variant="outline" size="lg" />
```

The same names are also exported as objects, for code that would rather not
repeat string literals:

```tsx
import { Button, ButtonVariant, ButtonSize } from '@mlopaev/faster-ui'

<Button variant={ButtonVariant.outline} size={ButtonSize.lg} />
```

`ButtonVariant`, `ButtonSize`, `ButtonTone`, `IconOnlyButtonVariant`,
`InputSize`, `InputState` and `DialogSize` are each **both** a value and a
type, so one import serves both positions:

```tsx
import { ButtonSize } from '@mlopaev/faster-ui'

const big: ButtonSize = ButtonSize.lg // type position and value position
```

They are plain frozen-shape objects whose keys mirror their values
(`ButtonVariant.outline === 'outline'`), deliberately not TypeScript `enum`s:
an enum emits runtime code that cannot be erased, and typing the props as one
would make `variant="outline"` a type error for every consumer.

The stylesheet contains **no global resets** — only `fui`-prefixed tokens and
utilities — so it cannot restyle your elements. Tailwind's preflight is
deliberately not bundled.

### Requirements

The package declares `engines: { node: "^20.19.0 || >=22.12.0" }`, matching the
toolchain it is built with; npm warns (it does not fail) on older Node. The
shipped output is plain ESM plus CSS, so what actually matters at runtime is
your bundler, not your Node version.

TypeScript consumers should use `moduleResolution: "bundler"`, `"node16"` or
`"nodenext"`. Legacy `main` / `module` / `types` fields are provided as a
fallback so the classic `"node"` resolver also finds the package.

### Server rendering

All three components are SSR-safe: no `window` or `document` access at module
scope, and every DOM call sits inside an effect or an event handler. They
render under `renderToString` with no DOM present. `Dialog` renders its markup
on the server and promotes itself to the top layer on hydration.

This is enforced, not asserted: every variant is server-rendered and hydrated in
CI with both React error channels checked, and the built bundle is imported in a
Node environment with no browser globals at all. A real Next.js App Router
application is built and loaded headlessly on every change, and fails on any
console error or warning.

Two things a server-rendering consumer must do, both exercised by that fixture:

```tsx
'use client' // ① the package ships no directive; these components use hooks

import { Button } from '@mlopaev/faster-ui'
import '@mlopaev/faster-ui/styles.css' // ② the JS bundle imports no CSS
```

① Mark the module that imports them as a Client Component. ② Import the
stylesheet yourself — `dist/index.js` contains no CSS import, which is what
keeps the stylesheet separately overridable.

## Components

All three share the Principle III API contract: props extend the native
element (`ComponentPropsWithoutRef`), `ref` is forwarded to the real DOM node,
`variant`/`size` are typed unions with defaults, and `className` is a
merge-safe escape hatch appended after component classes.

### Button

Four TapTap variants × danger tone × three sizes, with icon slots, a circular
`iconOnly` mode and busy-state loading.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `variant` | `'primary' \| 'outline' \| 'ghost' \| 'link'` | `'primary'` | Visual style, 1:1 with the Figma sets |
| `danger` | `boolean` | `false` | Danger counterpart of the variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 24 / 36 / 40 px |
| `loading` | `boolean` | `false` | Spinner in the leading slot, `aria-busy`, activation suppressed **without** dropping focus |
| `leftIcon` / `rightIcon` | `ReactNode` | — | Presentational icon slots (4 px gap) |
| `iconOnly` | `true` | `false` | Circular icon button; children are the icon; **requires `aria-label`**; only `primary`/`outline`/`ghost`, no `danger` (enforced at the type level) |

`type` defaults to `"button"`; `disabled` is the native attribute. The loading
spinner honours `prefers-reduced-motion`.

### Input

Labelled, validated form field on a native `<input>` with all seven Figma
adornment sets.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 24 / 36 / 40 px (replaces the native numeric `size` attr) |
| `label` | `ReactNode` | — | Visible label, associated via `htmlFor`; label click focuses |
| `error` | `string` | — | Error state: message 4 px below + `aria-invalid` + `aria-describedby` (merges with yours) |
| `leftIcon` / `rightIcon` | `ReactNode` | — | In-field icons, presentational |
| `prefix` / `suffix` | `ReactNode` | — | Static affixes inside the field (not part of the value) |
| `clearable` | `boolean` | `false` | Clear affordance while the field has a value and is enabled |
| `onClear` | `() => void` | — | Fires after the clear affordance empties the field |

Controlled and uncontrolled usage both work exactly like the native element.
`type="number"` swaps the browser spinners for the Figma stepper chevrons
(native `step`/`min`/`max` semantics preserved).

### Dialog

Controlled modal on the native `<dialog>` element: top layer, inert
background, focus trap while open, focus restore on close.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `open` | `boolean` | required | Controlled visibility — the component never closes itself |
| `onClose` | `() => void` | required | Called on every close intent (Escape, header ✕); you flip `open` |
| `title` | `ReactNode` | — | Title row; becomes the accessible name via `aria-labelledby` |
| `footer` | `ReactNode` | — | Right-aligned actions (Figma composes md Buttons, 8 px gap) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Panel width 400 / 600 / 900 px, viewport-capped |
| `dividers` | `boolean` | `false` | Hairlines under header / above footer ("With divider" preset) |
| `showClose` | `boolean` | `true` | Header close button |

Body content is `children`; it scrolls when it overflows while title and
footer stay fixed. Scrim clicks deliberately do **not** close (Escape and
buttons are the close paths).

## Theming

Every utility in the shipped stylesheet resolves through a **live** custom
property — `.fui\:bg-action-primary { background-color: var(--fui-action-primary) }`
— because the Tailwind bridge is declared `@theme inline`. Overriding a
variable anywhere in your own CSS re-themes the library at runtime, with no
rebuild and no Tailwind in your project:

```css
/* your app, loaded after @mlopaev/faster-ui/styles.css */
:root {
  --fui-action-primary: #7c3aed;
  --fui-action-primary-hover: #8b5cf6;
  --fui-action-primary-active: #6d28d9;
  --fui-focus-ring: #7c3aed;
}
```

Scope it to a subtree, a class, or a media query — it is ordinary CSS cascade:

```css
.marketing-site { --fui-radius-4: 0.75rem; }
```

### What is covered by semver

The **semantic** tokens are the public theming contract. They are
purpose-named, stable, and every one of them is listed in the
`Foundations → Design Tokens` story (which reads them out of the live
stylesheet, so it can never go stale):

| Group | Tokens |
| ----- | ------ |
| Actions | `--fui-action-{primary,danger}[-hover\|-active\|-disabled]`, `--fui-on-action`, `--fui-action-secondary-{text,border}[-hover\|-active\|-disabled]`, `--fui-action-ghost-*`, `--fui-action-danger-outline-*`, `--fui-action-link-disabled`, `--fui-action-clear[-hover\|-active]` |
| Surfaces | `--fui-surface-{page,raised,sunken}`, `--fui-overlay` |
| Text & icons | `--fui-text-color-{primary,secondary,placeholder,disabled}`, `--fui-text-{control,heading,placeholder-disabled}`, `--fui-icon-muted` |
| Borders & focus | `--fui-border-{default,subtle,disabled,hover,strong}`, `--fui-focus-ring` |
| Feedback | `--fui-feedback-{error,warning,success,info}` |
| Geometry & type | `--fui-radius-{4,pill}`, `--fui-spacing-unit`, `--fui-family-sans`, `--fui-weight-{regular,medium}`, `--fui-size-*`, `--fui-lh-*`, `--fui-elevation-{1,2,3,4}` |

The **primitive** palette (`--fui-primary-600`, `--fui-neutral-300`, …) is also
overridable and is the shortest path to a full rebrand — change the scale once
and every semantic that points at it follows. Its *names* are stable; its
*values* track the design source and may change in a minor release.

The generated utility class names (`fui:bg-action-primary`) are **not** part of
the contract — style through the tokens, not the classes.

### Dark mode

Toggle the `dark` class on the document root — that's the entire contract:

```js
document.documentElement.classList.toggle('dark')
```

Components never reference modes; every mode-aware value re-resolves at the
token layer.

## Accessibility

Semantic HTML first, ARIA only to fill gaps: `Button` is a real `<button>`,
`Input` is a real labelled `<input>` with `aria-invalid` + `aria-describedby`
error wiring, `Dialog` is a native `<dialog>` with a real top-layer focus trap
and deterministic focus restore. Keyboard operability and accessible names are
asserted in Jest, and the whole keyboard-only journey — open, tab the trap,
submit invalid, perceive the error, fix, Escape, land back on the trigger — is
asserted in Cypress with zero pointer events.

### Colour contrast, and why `a11y.css` exists

The TapTap palette is the design source of record, and some of its pairs do
not reach WCAG 2.1 AA. The most significant: a white label on `Primary/600`
measures **2.12:1** where SC 1.4.3 requires 4.5:1. Matching Figma and meeting
AA are genuinely in conflict here, so the library ships both and lets you
choose:

```ts
import '@mlopaev/faster-ui/styles.css' // Figma-faithful (default)
import '@mlopaev/faster-ui/a11y.css'   // ← add this to reach WCAG 2.1 AA
```

`a11y.css` re-points semantic tokens only. It needs no component changes, it
composes with `dark` exactly like the base layer, and it darkens the brand
ramps on light surfaces while inverting filled controls to a light fill with a
dark label on ink surfaces (a white label and a near-black page cannot both be
satisfied by one fill).

Known deviations in the **default** layer, measured and pinned in
`src/tokens/tokens.test.ts` so they cannot silently get worse:

| Pair | Default | Required | With `a11y.css` |
| ---- | ------- | -------- | --------------- |
| Primary button label | 2.11:1 | 4.5 | ✅ 4.60:1 |
| Danger button label | 3.46:1 | 4.5 | ✅ 4.61:1 |
| Link / focus ring on page | 2.11:1 | 4.5 / 3 | ✅ 4.60:1 |
| Input & outline border | 1.30:1 | 3 | ✅ 3.11:1 |
| Placeholder ink | 1.63:1 | 4.5 | ✅ 4.61:1 |
| Error message | 3.46:1 | 4.5 | ✅ 4.61:1 |

Disabled states are excluded throughout: SC 1.4.3 and 1.4.11 both exempt
inactive user-interface components.

## Design tokens

`src/tokens/` is the single source of every visual value, split by tier:

```text
src/tokens/
  tokens.css              entry — layer order, imports, Tailwind source scope
  reset.css               wipes Tailwind's default theme namespaces
  primitives/color.css    raw palette + alpha composites   ─┐ private `--fui-*`
  primitives/typography.css  family, weights, size ramps    │ on :root; no
  primitives/geometry.css    radius + the 4px spacing unit  │ utilities are
  primitives/elevation.css   shadow effect styles          ─┘ generated from them
  semantic/light.css      purpose-named refs (default mode)
  semantic/dark.css       the `.dark` re-declarations  ← must follow light.css
  bridge.css              `@theme inline` — the only utility-generating surface
  a11y.css                the opt-in WCAG AA overlay (shipped separately)
```

Import order is load-bearing and documented in `tokens.css`. Every primitive
carries a comment tracing it to a Figma style; the extraction records live in
`specs/001-foundation-tooling/figma-extraction.md` and
`specs/002-core-components/figma-extraction.md`.

`src/tokens/tokens.test.ts` enforces the layer's contracts: every semantic is
bridged (a missing bridge line would silently generate no utility at all), no
`var()` dangles, no dark or a11y block overrides a token that doesn't exist,
no bridge key collides with a token name, no semantic declares a raw colour
literal, and every contrast pair meets its WCAG floor with `a11y.css` applied.

## Development

```bash
npm install
```

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Vite dev playground with live token styling |
| `npm run storybook` | Component workbench at :6006 (light/dark + palette toolbars) |
| `npm test` / `npm run test:watch` | Jest + React Testing Library suites |
| `npm run test:coverage` | Jest with the coverage thresholds enforced |
| `npm run cy:ct` / `npm run cy:open` | Cypress component tests (real browser, real token CSS) |
| `npm run lint` | oxlint (a11y + correctness rules, zero warnings allowed) |
| `npm run lint:tokens` | Principle I: no raw colours or arbitrary visual values in components |
| `npm run lint:workflows` | The workflow files' own safety invariants |
| `npm run typecheck` | `tsc -b` across all four TS projects (lib / jest / cypress / node) |
| `npm run build` | Library build → `dist/` (ESM + rolled-up types + stylesheets + size budget) |
| `npm run build-storybook` | Static workbench build (CI artifact, deployed to Pages) |
| `npm run test:ssr` | Server render → hydrate, plus a browserless import of the built bundle |
| `npm run test:a11y` | axe across every variant × colour mode × palette |
| `npm run test:consumers` | Packs the tarball and installs it into a Vite app, a Next.js app and a type-resolution fixture |
| `npm run api:report` / `api:check` | Regenerate, or verify, the public surface record in `etc/` |
| `npm run coverage:gate` | Props ↔ JSDoc ↔ Playground controls ↔ one story per variant |
| `npm run visual:capture` / `visual:compare` / `visual:accept` | The 239-cell visual matrix (baselines are `ubuntu-latest`-only — see CONTRIBUTING.md) |

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the workflow, and
[CHANGELOG.md](./CHANGELOG.md) for release notes.

This repo is developed spec-first with [spec-kit](https://github.com/github/spec-kit):
constitution → specify → plan → tasks → implement. See `.specify/memory/constitution.md`
for the seven governing principles and `specs/` for each feature's artifacts.

## License

[MIT](./LICENSE) © Mustafa Lopaev
