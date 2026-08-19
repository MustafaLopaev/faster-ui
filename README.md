# Faster UI

Production-grade React component library for the Faster Design System —
**Button**, **Input**, **Dialog** — built on design tokens extracted from the
TapTap Design System Figma file.

React 19 · TypeScript (strict) · Tailwind CSS v4 · Jest · Cypress CT ·
Storybook · GitHub Actions

## Setup

Requires Node 20.19+ (or 22.12+) and npm. No other setup:

```bash
npm install
```

## Commands

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Vite dev playground with live token styling |
| `npm run storybook` | Component workbench at :6006 (light/dark toolbar) |
| `npm test` / `npm run test:watch` | Jest + React Testing Library suites |
| `npm run cy:ct` / `npm run cy:open` | Cypress component tests (real browser, real token CSS) |
| `npm run lint` | oxlint over source, tests, stories, configs |
| `npm run typecheck` | `tsc -b` across all four TS projects (lib / jest / cypress / node) |
| `npm run build` | Library build → `dist/` (ESM + rolled-up types + stylesheet) |
| `npm run build-storybook` | Static workbench build (CI artifact) |

## Consuming the library

```tsx
import { Button, Input, Dialog } from 'faster-ui'
import 'faster-ui/styles.css' // once, at your app root

function InviteFlow() {
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

- `faster-ui` and `faster-ui/styles.css` are the only two import surfaces;
  deep imports don't resolve. Exports: `Button`/`ButtonProps`,
  `Input`/`InputProps`, `Dialog`/`DialogProps`.
- `react`/`react-dom` ≥19 are peer dependencies — your app provides React.
- The stylesheet is pre-compiled: **no Tailwind required in your app**, and it
  contains no global resets — only `fui`-prefixed tokens and utilities, so it
  cannot restyle your elements.

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

`type` defaults to `"button"`; `disabled` is the native attribute.

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

### Dark mode

Toggle the `dark` class on the document root — that's the entire contract:

```js
document.documentElement.classList.toggle('dark')
```

Components never reference modes; every mode-aware value re-resolves at the
token layer.

## Design tokens

`src/tokens/tokens.css` is the single source of every visual value, layered as
**primitives** (raw palette, private) → **semantics** (purpose-named,
mode-aware) → Tailwind `@theme inline` bridge (generates the only styling
utilities that exist, all `fui:`-prefixed). Every primitive carries a comment
tracing it to a Figma style; the extraction records live in
`specs/001-foundation-tooling/figma-extraction.md` and
`specs/002-core-components/figma-extraction.md` (the latter corrected
`radius-surface` to 4 px — the Dialog panel's node-verified corner radius).

Rebranding or adding a theme = editing token values only, zero component edits.

## Workflow

This repo is developed spec-first with [spec-kit](https://github.com/github/spec-kit):
constitution → specify → plan → tasks → implement. See `.specify/memory/constitution.md`
for the seven governing principles and `specs/` for each feature's artifacts.
