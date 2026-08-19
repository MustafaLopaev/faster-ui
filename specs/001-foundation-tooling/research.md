# Research: Foundation & Tooling

**Feature**: `001-foundation-tooling` · **Date**: 2026-08-19
**Purpose**: Resolve every technical unknown in the plan's Technical Context before design. Exact dependency versions are pinned at install time (latest stable); decisions below fix the *approach*.

## R-1: Figma token extraction path

**Decision**: Extract via the Figma MCP tools (`get_variable_defs`, `get_design_context`, `get_screenshot`) against the user's duplicate **`taptap-design-copy`, file key `7OfpQVe2pYpE9MF5pQeXhH`** (https://www.figma.com/design/7OfpQVe2pYpE9MF5pQeXhH/taptap-design-copy). The original community file `WYuHdUuUq31HzkdJhoKwXl` stays reference-only (view in browser).

**Rationale**: The original community file is view-only to the MCP ("no edit access" on every read tool); Figma's access doc confirms the MCP reads only files within the user's own plans. The user duplicated it; access **verified 2026-08-19**: metadata and variable reads succeed against the copy.

**Verified findings** (planning probes, 2026-08-19):
- Token styles are present and readable: Neutral 50–700 (+White/Black), Primary teal 50–700 (500 `#47CFD6`, 600 `#15C5CE`, 700 `#00ABB6`), Auxiliary orange 50–700, status colors `Danger/600 #F64C4C`, `Info/600 #3B82F6`, `Success/600 #47B881`, `Warning/600 #FFAD0D`; full PingFang SC type scale (H1 30/38 … Caption 12/18, Regular 400 / Medium 500); Elevation 1–4 shadow effects.
- **Both modes exist as mode-scoped token names** (`Light/…` and `Dark/…`, e.g. `Light|Dark/Background/Fill Color/Smoke/Default`) — extraction maps `Light/*` → `:root`, `Dark/*` → `.dark`; FR-013's light-serves-both fallback covers tokens with no `Dark/*` counterpart.
- The brief's node `12-11244` resolves in the copy: it is the **Dialog page** (4 dialog variant frames). Component pages exist beyond the Cover.
- **Tooling quirk**: page-level listing (`get_metadata` without nodeId) reported only the Cover page — pages appear to lazy-load. The extraction task must enumerate pages via `use_figma` (`figma.root.children`) or navigate by known node ids, not trust the page listing.
- `search_design_system` returns nothing for a drafts copy (not a published library) — don't use it for this file.

**Alternatives considered**: (a) Manual web-inspect extraction — retained only as fallback, now unlikely to be needed. (b) Figma REST API with a personal access token — extra credential handling for no benefit over the working MCP path.

## R-2: Tailwind v4 wiring and the `fui-` prefix

**Decision**: `@tailwindcss/vite` plugin + CSS-first config. `src/tokens/tokens.css` is the single CSS entry and begins with `@import "tailwindcss" prefix(fui);`.

**Rationale**: Tailwind v4's native `prefix()` option prefixes **both** generated CSS variables (`--fui-color-…`) and utility classes (`fui:bg-…`) in one declaration — exactly the clarified token-collision decision, with zero hand-maintained naming discipline. It also collision-proofs utility classes against a host app's own Tailwind, which hand-prefixing token names alone would not. The Vite plugin serves dev, Cypress CT, and Storybook (all Vite-driven) from one config.

**Alternatives considered**: (a) Hand-prefixing every token name (`--color-fui-…`) — satisfies the letter of the clarification but leaves utility names unprefixed and relies on discipline; rejected. (b) PostCSS setup — more moving parts than the first-party Vite plugin.

**Consequence**: every utility in components is written `fui:…` (e.g. `fui:bg-action-primary`, `fui:flex`). Verbose, but explicitly accepted in the clarification (option noted longer utility names).

## R-3: Token layering & mode-awareness inside tokens.css

**Decision**: Three-block structure in `src/tokens/tokens.css`:

1. **Primitives** — plain CSS custom properties on `:root`, hand-named `--fui-*` (e.g. `--fui-blue-500`). *Deliberately not `@theme`*, so Tailwind generates **no primitive utilities** — components physically cannot use `fui:bg-blue-500`.
2. **Semantic (mode-aware colors)** — custom properties declared on `:root` (light values) and re-declared under `.dark` (dark values), each referencing a primitive var.
3. **Bridge** — `@theme inline { --color-action-primary: var(--fui-action-primary); … }` plus non-color semantics (`--radius-control: var(--fui-radius-8)` etc.). `inline` keeps the var reference live at use-site so `.dark` re-declaration flips rendered colors at runtime.

Additionally `@theme { --color-*: initial; --radius-*: initial; }` wipes Tailwind's default palette and radii so no off-system color/radius utilities exist.

**Rationale**: This makes Constitution Principle I structurally enforceable, not just auditable: the only color/radius utilities that exist are semantic ones. Mode switching is a pure token-layer concern (`.dark` class on the document root) — components contain zero `dark:` variants, satisfying FR-013 with no component involvement. `@theme inline` is the canonical v4 pattern for variables that reference other variables.

**Alternatives considered**: (a) Primitives inside `@theme` — generates primitive utilities that must be policed by `/token-audit` only; rejected as weaker. (b) `dark:` utility variants in components — leaks mode logic into every component, violates token-first layering. (c) `light-dark()` CSS function — couples to `color-scheme` and complicates an explicit Storybook toggle; class strategy is simpler and testable.

**Note on CLAUDE.md wording** ("tokens are CSS variables declared via `@theme`"): the public, utility-generating token surface still lives in `@theme` blocks; primitives become private implementation detail. Recorded here as a deliberate refinement, to be reflected in CLAUDE.md during implementation.

## R-4: Jest standalone transform

**Decision**: Jest 30 + `@swc/jest` transform + `jest-environment-jsdom`, `@testing-library/react` v16+, `@testing-library/jest-dom`, `@testing-library/user-event`. CSS imports mapped to an empty stub via `moduleNameMapper`; setup file registers jest-dom matchers.

**Rationale**: The brief mandates Jest; the constitution mandates it be standalone from Vite. `@swc/jest` gives fast TS/TSX transform with the automatic JSX runtime and zero Babel chain. jsdom cannot resolve CSS custom properties anyway, so Jest asserts *behavior* (roles, names, interactions) while visual/token assertions live in Cypress and Storybook — the stub mapping makes token imports inert rather than fatal (spec US2 scenario 3).

**Alternatives considered**: (a) `ts-jest` — slower, needs isolatedModules tuning. (b) `babel-jest` + presets — more config surface for the same output.

## R-5: Cypress component testing

**Decision**: Cypress (latest stable) component testing with `devServer: { framework: 'react', bundler: 'vite' }`, spec pattern `src/**/*.cy.tsx`, and `cypress/support/component.ts` importing `src/tokens/tokens.css` so every mounted component renders with real token styling.

**Rationale**: First-party React+Vite dev-server support reuses the same Vite/Tailwind pipeline as the app — mounted components get real compiled utilities, so a Cypress test can assert an actual token-driven computed style (proving the CSS chain end-to-end, which Jest cannot).

**Alternatives considered**: webpack bundler for CT — second bundler to maintain for nothing.

## R-6: Storybook

**Decision**: Storybook (latest stable, `@storybook/react-vite` framework) with `@storybook/addon-a11y`; `preview` imports `src/tokens/tokens.css`; a global toolbar switch ("theme": light/dark) with a decorator toggling the `.dark` class on the document root.

**Rationale**: Vite builder shares the Tailwind pipeline. The theme toolbar delivers SC-007 (mode switch visible in the workbench with zero component edits) as a global mechanism rather than per-story wiring. addon-a11y turns Principle II into visible checks from day one at near-zero cost. Controls are core in current Storybook — the Playground requirement needs no extra addon.

**Alternatives considered**: `storybook-dark-mode` community addon — third-party dependency for what a 10-line decorator does; rejected per Principle VII.

## R-7: Library packaging

**Decision**: Vite `build.lib` with entry `src/index.ts`, `formats: ['es']`, externals `react`, `react-dom`, `react/jsx-runtime`; types via `vite-plugin-dts` (`rollupTypes: true`); `src/index.ts` imports `tokens.css` so Vite extracts one stylesheet (`build.lib.cssFileName: 'styles'` → `dist/styles.css`). package.json: name `faster-ui`, version `0.1.0`, `type: module`, `files: ["dist"]`, `sideEffects: ["**/*.css"]`, `peerDependencies: react ^19, react-dom ^19` (kept in devDependencies for local dev), exports map:

```json
{
  ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
  "./styles.css": "./dist/styles.css"
}
```

**Rationale**: Consumers `import { … } from 'faster-ui'` + `import 'faster-ui/styles.css'` — no Tailwind required in the host (the shipped CSS already contains tokens + the utilities the components use, compiled). The exports map is the technical enforcement of FR-009/"internals not importable": nothing outside the map resolves. ESM-only matches the modern-evergreen target and mandated stack.

**Alternatives considered**: (a) Dual CJS+ESM — no stated consumer needs CJS; doubles the test matrix. (b) Requiring consumers to run Tailwind with our preset — heavier integration burden, contradicts "install and use". (c) `tsc` for declarations without rollup — leaks internal file structure into `dist/types`.

## R-8: Co-located test-file type isolation

**Decision**: Split TypeScript projects: `tsconfig.lib.json` (src, excluding `*.test.tsx` / `*.cy.tsx` / `*.stories.tsx`), `tsconfig.test.json` (Jest files + `@types/jest`), `tsconfig.cypress.json` (`*.cy.tsx` + cypress support + cypress types), `tsconfig.node.json` (config files), all referenced from root `tsconfig.json`; `typecheck` script = `tsc -b`.

**Rationale**: Jest and Cypress both declare global `describe/it/expect` with incompatible types; co-location (mandated layout) puts both in `src/`, so one TS project cannot hold both. Project references give each file family its own global type universe while `tsc -b` still checks everything in one command. `vite-plugin-dts`/lib build use the lib project so test/story files never leak into published types.

**Alternatives considered**: (a) One tsconfig with both type packages — `expect` collisions produce unfixable errors. (b) Moving tests out of `src/` — violates the constitution's co-located component contract.

## R-9: Smoke component

**Decision**: `src/components/Smoke/` with the full co-located contract (`Smoke.tsx`, `.test.tsx`, `.cy.tsx`, `.stories.tsx`, `index.ts`), exported temporarily from `src/index.ts`. It renders a single element styled exclusively with semantic utilities (`fui:bg-action-primary`, `fui:text-on-action`, `fui:rounded-control`, spacing), forwards its ref, and merges `className` — a miniature of the Principle III contract. Jest asserts render/role/children; Cypress asserts mount + a computed background-color that only resolves if the token chain is live; the story exposes controls and renders in both modes.

**Rationale**: FR-011 acceptance gate; naming it `Smoke` makes its temporary nature self-documenting (spec assumption: removed when the first real component lands).

## R-10: Lint & scripts

**Decision**: Keep `oxlint` (already scaffolded). Final script set: `dev`, `build` (`tsc -b && vite build`), `lint`, `typecheck` (`tsc -b`), `test`, `test:watch`, `cy:ct` (`cypress run --component`), `cy:open`, `storybook`, `build-storybook`. Scaffold's `preview` script is dropped (meaningless for a library).

**Rationale**: Covers FR-010 and maps 1:1 onto the CI stages the constitution defines, so the later CI feature is a transcription job.

## Risks

| Risk | Mitigation |
| ---- | ---------- |
| ~~User doesn't duplicate the Figma file~~ | **Resolved 2026-08-19**: duplicate `7OfpQVe2pYpE9MF5pQeXhH` verified readable |
| TapTap file lacks dark-mode values for some tokens | `Dark/*` names confirmed present; for any token without a `Dark/*` counterpart, FR-013 fallback: light value serves both modes, gap recorded next to the token |
| Figma page listing shows only the Cover page | Known quirk (see R-1): enumerate pages via `use_figma` or known node ids during extraction |
| Major-version drift (Storybook/Cypress/Jest) since planning | Versions pinned at install; each harness validated by the smoke gate before the feature closes |
| MCP rate limit (200 calls/day) during extraction | Batch reads (`get_variable_defs` per component set, not per node); well under budget |
