# Implementation Plan: Foundation & Tooling

**Branch**: `001-foundation-tooling` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-foundation-tooling/spec.md`

## Summary

Convert the Vite scaffold into the publishable `faster-ui` component library and wire every quality harness. Two-layer, `fui`-prefixed, light+dark mode-aware design tokens are extracted from the TapTap Figma file into `src/tokens/tokens.css` (Tailwind v4 CSS-first: primitives as private custom properties, semantics bridged through `@theme inline` so only semantic utilities exist). Jest+RTL (via `@swc/jest`, standalone from Vite), Cypress CT (Vite dev server), and Storybook (react-vite, theme toolbar) are configured against a temporary `Smoke` component that must pass in all three harnesses — the feature's acceptance gate. Packaging becomes library-grade: ESM + rolled-up types, `react`/`react-dom` as peers, exports map limited to `faster-ui` and `faster-ui/styles.css`. Full decision log in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript (strict) on React 19

**Styling**: Tailwind CSS v4 via `@tailwindcss/vite`, CSS-first with `@import "tailwindcss" prefix(fui)`; tokens in `src/tokens/tokens.css` (primitive `:root` vars → semantic `:root`/`.dark` vars → `@theme inline` bridge; defaults wiped with `--color-*: initial; --radius-*: initial`) — see [research R-2/R-3](research.md)

**Build**: Vite library mode — entry `src/index.ts`, `formats: ['es']`, externals `react`/`react-dom`/`react/jsx-runtime`, `cssFileName: 'styles'`, declarations via `vite-plugin-dts` (`rollupTypes: true`) — see [research R-7](research.md)

**Testing**: Jest 30 + `@swc/jest` + jsdom + Testing Library (CSS stubbed via `moduleNameMapper`) · Cypress CT (`framework: 'react'`, `bundler: 'vite'`, token CSS imported in component support) — see [research R-4/R-5](research.md)

**Documentation**: Storybook `@storybook/react-vite` + `@storybook/addon-a11y`; global light/dark toolbar toggling `.dark` on the document root — see [research R-6](research.md)

**CI/CD**: Out of scope this feature; script names are the future CI contract ([contracts/commands-contract.md](contracts/commands-contract.md))

**Target Platform**: Modern evergreen browsers; consumed as npm package `faster-ui` (ESM-only)

**Project Type**: React component library (single package)

**Design Source**: TapTap Design System via the user's duplicate `taptap-design-copy`, file key **`7OfpQVe2pYpE9MF5pQeXhH`** — MCP access verified 2026-08-19; palettes, type scale, elevations, and `Light/*`+`Dark/*` mode-scoped tokens confirmed readable; node `12:11244` = Dialog page ([research R-1](research.md)). Original community file `WYuHdUuUq31HzkdJhoKwXl` is view-only (reference in browser only)

**Feature-Specific Dependencies** (all `devDependencies` — zero runtime deps, Principle VI): `tailwindcss` + `@tailwindcss/vite` (mandated styling); `jest`, `jest-environment-jsdom`, `@swc/core` + `@swc/jest`, `@types/jest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (mandated unit testing); `cypress` (mandated CT); `storybook`, `@storybook/react-vite`, `@storybook/addon-a11y` (mandated docs; a11y addon serves Principle II); `vite-plugin-dts` (library type declarations). Versions pinned at install time (latest stable)

**Constraints**: Jest mandated over Vitest (brief) → transform independent of Vite; consumers must not need Tailwind (compiled `styles.css` shipped); every token name `fui`-prefixed; both color modes ship now (clarifications 2026-08-19)

## Constitution Check

*GATE: evaluated before Phase 0 research; re-evaluated after Phase 1 design — both passes below.*

- [x] **I. Token-First Styling** — two-layer system is the core deliverable; design makes primitive utilities structurally nonexistent and wipes Tailwind's default palette/radii, so components *cannot* use off-system values ([token-contract](contracts/token-contract.md) T4)
- [x] **II. Accessibility by Default** — foundation-level: addon-a11y installed from day one; Smoke keeps semantic HTML; full A11Y contracts land with the components feature
- [x] **III. One Consistent Component API** — Smoke implements the contract in miniature (native props extension, forwarded ref, merge-safe className) so the pattern is proven before real components
- [x] **IV. Tested Evidence** — the harnesses ARE the deliverable; gate = Smoke passing in Jest + Cypress + Storybook (FR-011)
- [x] **V. Storybook Contract** — workbench configured with controls + theme toolbar; Smoke ships a controls-exposing story; zero-console-error rule validated in quickstart §2
- [x] **VI. Library-First Packaging** — exports map restricts to `src/index.ts` output + stylesheet; react/react-dom peers; **zero new runtime dependencies**
- [x] **VII. Simplicity** — native Tailwind `prefix()` over hand-rolled naming; no community addons where a 10-line decorator suffices; multi-tsconfig split is forced by Jest/Cypress global type collision, not speculative ([research R-8](research.md))

**Post-design re-check (2026-08-19)**: no violations introduced by Phase 1 artifacts; Complexity Tracking stays empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-foundation-tooling/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions R-1…R-10 + risks
├── data-model.md        # Phase 1 — token/package/command entities & rules
├── quickstart.md        # Phase 1 — validation guide mapped to SC-001…SC-007
├── contracts/
│   ├── package-contract.md    # npm surface: exports, peers, guarantees
│   ├── token-contract.md      # tokens.css structure, rules T1–T7, mode contract
│   └── commands-contract.md   # script names & behavior (future CI contract)
└── tasks.md             # Phase 2 (/speckit-tasks — NOT created here)
```

### Source Code (repository root)

```text
src/
├── tokens/
│   └── tokens.css               # THE token file (tailwind import + 3 layers)
├── components/
│   └── Smoke/                   # temporary FR-011 gate component
│       ├── Smoke.tsx
│       ├── Smoke.test.tsx       # Jest + RTL
│       ├── Smoke.cy.tsx         # Cypress CT (asserts computed token style)
│       ├── Smoke.stories.tsx    # story + Playground-style controls
│       └── index.ts
├── lib/                         # (reserved — nothing added this feature)
└── index.ts                     # public API: exports Smoke (temporarily)

jest.config.ts                   # standalone transform (@swc/jest), jsdom, css stub
jest.setup.ts                    # @testing-library/jest-dom
jest/style-stub.js               # css moduleNameMapper target
cypress.config.ts                # react + vite CT dev server
cypress/support/component.ts     # cy.mount + imports tokens.css
.storybook/
├── main.ts                      # react-vite framework, addon-a11y
└── preview.ts                   # imports tokens.css; theme toolbar + .dark decorator
tsconfig.json                    # references the four projects below (R-8)
tsconfig.lib.json                # src minus *.test/*.cy/*.stories
tsconfig.test.json               # Jest files (jest globals)
tsconfig.cypress.json            # *.cy.tsx + cypress support (cypress globals)
tsconfig.node.json               # vite/jest/cypress/storybook config files
vite.config.ts                   # @tailwindcss/vite + react + dts + lib build
package.json                     # renamed faster-ui; scripts per commands-contract
```

**Structure Decision**: canonical Faster UI layout confirmed. Scaffold app remnants (`App.tsx`, `main.tsx`, `index.html` demo content, `preview` script) are removed or reduced to a minimal dev playground for `npm run dev`. The scaffold's single `tsconfig.app.json` is replaced by the four-project split (justified in [research R-8](research.md)). CLAUDE.md's token wording gets a one-line refinement note per [research R-3](research.md).

## Complexity Tracking

No constitution violations — table intentionally empty.
