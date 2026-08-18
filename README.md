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
import { Smoke } from 'faster-ui'
import 'faster-ui/styles.css' // once, at your app root

<Smoke className="your-extra-class">hello</Smoke>
```

- `faster-ui` and `faster-ui/styles.css` are the only two import surfaces;
  deep imports don't resolve.
- `react`/`react-dom` ≥19 are peer dependencies — your app provides React.
- The stylesheet is pre-compiled: **no Tailwind required in your app**, and it
  contains no global resets — only `fui`-prefixed tokens and utilities, so it
  cannot restyle your elements.

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
tracing it to a Figma style; the full extraction record lives in
`specs/001-foundation-tooling/figma-extraction.md`.

Rebranding or adding a theme = editing token values only, zero component edits.

## Workflow

This repo is developed spec-first with [spec-kit](https://github.com/github/spec-kit):
constitution → specify → plan → tasks → implement. See `.specify/memory/constitution.md`
for the seven governing principles and `specs/` for each feature's artifacts.
