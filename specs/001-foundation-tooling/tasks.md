# Tasks: Foundation & Tooling

**Input**: Design documents from `/specs/001-foundation-tooling/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md (all present)

**Tests**: This is an infrastructure feature — the Smoke component ships with its full Jest + Cypress + story contract because it *is* the acceptance gate (FR-011); every other story carries explicit verification tasks.

**Organization**: Tasks are grouped by the spec's user stories. Note: unlike component features, these stories form a deliberate dependency chain (tokens → harnesses → workbench → packaging) — US1 blocks the rest; see Dependencies.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions (Faster UI)

- Tokens: `src/tokens/tokens.css` (single source — [token-contract](contracts/token-contract.md))
- Components: `src/components/Smoke/` with co-located `.test.tsx`, `.cy.tsx`, `.stories.tsx`, `index.ts`
- Public API: `src/index.ts` only
- Figma source: duplicate `taptap-design-copy`, file key `7OfpQVe2pYpE9MF5pQeXhH` ([research R-1](research.md))

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependencies installed, scaffold reshaped, TypeScript projects split

- [X] T001 Install all new devDependencies (latest stable): `npm i -D tailwindcss @tailwindcss/vite jest jest-environment-jsdom @swc/core @swc/jest @types/jest @testing-library/react @testing-library/jest-dom @testing-library/user-event cypress storybook @storybook/react-vite @storybook/addon-a11y vite-plugin-dts` — record resolved majors in package.json (zero runtime deps, Principle VI)
- [X] T002 [P] Remove scaffold app remnants: delete `src/App.tsx`, `src/App.css`, `src/index.css`, `src/assets/`, `public/vite.svg`; keep `index.html` + `src/main.tsx` as the dev-playground shell (content rebuilt in T010)
- [X] T003 [P] Split TypeScript projects per [research R-8](research.md): replace `tsconfig.app.json` with `tsconfig.lib.json` (src, excluding `**/*.test.tsx`, `**/*.cy.tsx`, `**/*.stories.tsx`), add `tsconfig.test.json` (test files + jest types), `tsconfig.cypress.json` (`**/*.cy.tsx` + `cypress/**` + cypress types), keep `tsconfig.node.json` (config files, add jest/cypress/storybook configs); root `tsconfig.json` references all four

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Vite pipeline every harness shares

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Add `@tailwindcss/vite` plugin to `vite.config.ts` alongside the react plugin (library-mode build config comes later in T022)
- [X] T005 Verify baseline gates on the reshaped scaffold: `npm run lint` and `npx tsc -b` exit 0, `npm run dev` serves without errors

**Checkpoint**: Toolchain skeleton healthy — user story implementation can begin

---

## Phase 3: User Story 1 — Token-Driven Styling Foundation (Priority: P1) 🎯 MVP

**Goal**: All TapTap design tokens (light + dark) extracted from Figma and authored as the two-layer, `fui`-prefixed system in `src/tokens/tokens.css`; rebrand/mode changes touch only token definitions.

**Independent Test**: Style a playground element using only semantic utilities; values match Figma inspect values; changing one token value or toggling `.dark` restyles it with zero markup edits (spec US1 scenarios 1–4).

- [X] T006 [US1] Load the `/figma-use` skill, then enumerate the duplicate file's pages and component-set node ids via `use_figma` on file `7OfpQVe2pYpE9MF5pQeXhH` (`figma.root.children` — the page listing is unreliable per [research R-1](research.md)); record the page/node map in `specs/001-foundation-tooling/figma-extraction.md`
- [X] T007 [US1] Extract all color tokens — `Light/*` and `Dark/*` scoped names, palettes (Neutral/Primary/Auxiliary/status), and per-state values (default, hover, focus, active, disabled, error) — from the Button, Input, Dialog, and foundation pages via `get_variable_defs`/`get_design_context`; append raw name→value tables to `specs/001-foundation-tooling/figma-extraction.md` (traceability, SC-006)
- [X] T008 [US1] Extract typography (family, sizes, weights, line heights), radius, spacing, and elevation values from the same pages; complete `specs/001-foundation-tooling/figma-extraction.md`, flagging any token with no `Dark/*` counterpart (FR-013 fallback list)
- [X] T009 [US1] Author `src/tokens/tokens.css` exactly per [contracts/token-contract.md](contracts/token-contract.md): `@import "tailwindcss" prefix(fui)`, `--color-*: initial; --radius-*: initial` wipes, primitives as `:root` custom properties, mode-aware semantics on `:root`/`.dark`, `@theme inline` bridge; every primitive carries an inline Figma source comment; dark gaps noted (rules T1–T7)
- [X] T010 [US1] Build the dev playground: `src/main.tsx` (+ `index.html`) imports `src/tokens/tokens.css` and renders sample elements styled with semantic `fui:` utilities only, plus a button toggling `.dark` on `<html>`; verify `npm run dev` shows Figma-matching colors in both modes
- [X] T011 [US1] Validate US1 acceptance scenarios 2–3: repoint one semantic token to a different primitive → playground restyles, `git diff` shows only `src/tokens/tokens.css`; confirm no primitive value appears twice; revert

**Checkpoint**: Token system complete and demonstrably rebrand/mode-safe — everything downstream may consume it

---

## Phase 4: User Story 2 — Behavior Verified in Two Test Harnesses (Priority: P2)

**Goal**: Jest (standalone transform) and Cypress CT both run the token-styled Smoke component locally with one command each.

**Independent Test**: `npm test` and `npm run cy:ct` each exit 0 running the Smoke suites (spec US2 scenarios 1–3).

- [ ] T012 [P] [US2] Configure Jest per [research R-4](research.md): `jest.config.ts` (`@swc/jest` transform with automatic JSX runtime, `jest-environment-jsdom`, `moduleNameMapper` `\.css$` → `jest/style-stub.js`, setup `jest.setup.ts`), create `jest.setup.ts` (imports `@testing-library/jest-dom`) and `jest/style-stub.js`; add `test`/`test:watch` scripts to `package.json`
- [ ] T013 [P] [US2] Configure Cypress CT per [research R-5](research.md): `cypress.config.ts` (`framework: 'react'`, `bundler: 'vite'`, specPattern `src/**/*.cy.tsx`), `cypress/support/component.ts` (registers `cy.mount`, imports `src/tokens/tokens.css`), `cypress/support/component-index.html`; add `cy:ct`/`cy:open` scripts to `package.json`
- [ ] T014 [US2] Create the Smoke component: `src/components/Smoke/Smoke.tsx` (props extend `ComponentPropsWithoutRef<'div'>`, ref reaches the root element, merge-safe `className`, styled with semantic `fui:` utilities only — action background, on-action text, control radius, token spacing), `src/components/Smoke/index.ts` barrel, temporary export from `src/index.ts`
- [ ] T015 [P] [US2] Jest suite in `src/components/Smoke/Smoke.test.tsx`: renders children, forwards ref to the root element, merges `className` with base styling intact, passes through native div attributes
- [ ] T016 [P] [US2] Cypress suite in `src/components/Smoke/Smoke.cy.tsx`: mounts; asserts computed `background-color` equals the resolved semantic token value (proves the token chain live in a real browser); adds `.dark` to the document root and asserts the computed color flips to the dark value (FR-013 evidence)
- [ ] T017 [US2] Verify US2 checkpoint: `npm test` exits 0 and `npm run cy:ct` exits 0

**Checkpoint**: Both test harnesses proven against a real token-styled component

---

## Phase 5: User Story 3 — Living Documentation Workbench (Priority: P2)

**Goal**: Storybook renders the Smoke story with real token styling, interactive controls, a light/dark toolbar, and zero console errors.

**Independent Test**: `npm run storybook` lists the Smoke story rendering token-styled with a clean console; `npm run build-storybook` exits 0 (spec US3 scenarios 1–3).

- [ ] T018 [US3] Configure Storybook per [research R-6](research.md): `.storybook/main.ts` (`@storybook/react-vite`, stories glob `src/**/*.stories.tsx`, `@storybook/addon-a11y`), `.storybook/preview.ts` (imports `src/tokens/tokens.css`; global `theme` toolbar light/dark + decorator toggling `.dark` on the document root); add `storybook`/`build-storybook` scripts to `package.json`
- [ ] T019 [US3] Stories in `src/components/Smoke/Smoke.stories.tsx`: default story plus full-control exposure (children, className, native props) serving as the Playground pattern for future components
- [ ] T020 [US3] Verify US3 checkpoint: Smoke story renders with zero console errors/warnings, theme toolbar flips its colors live (SC-007), and `npm run build-storybook` exits 0

**Checkpoint**: Documentation workbench operational with mode switching

---

## Phase 6: User Story 4 — Consumable as a Library (Priority: P3)

**Goal**: `npm run build` emits an ESM bundle + rolled-up types + one stylesheet under the `faster-ui` name, React externalized, exports map locked to two surfaces.

**Independent Test**: Inspect `dist/` + `npm pack --dry-run` against [contracts/package-contract.md](contracts/package-contract.md) (spec US4 scenarios 1–3).

- [ ] T021 [P] [US4] Convert `package.json` to the library manifest per [contracts/package-contract.md](contracts/package-contract.md): name `faster-ui`, version `0.1.0`, `files: ["dist"]`, `sideEffects: ["**/*.css"]`, exports map (`.` + `./styles.css`), move `react`/`react-dom` to `peerDependencies` `^19.0.0` (keep devDependency copies), drop the `preview` script, finalize the full script set per [contracts/commands-contract.md](contracts/commands-contract.md)
- [ ] T022 [P] [US4] Add library build to `vite.config.ts` per [research R-7](research.md): `build.lib` (entry `src/index.ts`, `formats: ['es']`, `cssFileName: 'styles'`), `rollupOptions.external` (`react`, `react-dom`, `react/jsx-runtime`), `vite-plugin-dts` (`tsconfigPath: tsconfig.lib.json`, `rollupTypes: true`); ensure `src/index.ts` imports `./tokens/tokens.css` so the stylesheet is emitted
- [ ] T023 [US4] Verify US4 checkpoint per [quickstart §6](quickstart.md): `npm run build` exits 0; `dist/` contains exactly `index.js` (imports react, never bundles it), `index.d.ts` (exports Smoke + props type, no test/story leakage), `styles.css` (all names `fui`-prefixed); `npm pack --dry-run` lists only package.json, README, dist/*

**Checkpoint**: Package consumable per contract — all four stories complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Feature-level acceptance against every success criterion

- [ ] T024 Run the full fresh-clone gate per [quickstart §1](quickstart.md): `npm ci` (or rm -rf node_modules && npm install), then `npm run lint`, `npm run typecheck`, `npm test`, `npm run cy:ct`, `npm run build-storybook`, `npm run build` — all exit 0 with no undocumented steps (SC-002, SC-003)
- [ ] T025 [P] Run `/token-audit` over `src/` — zero hardcoded visual values, zero primitive-utility usage (SC-001)
- [ ] T026 [P] Walk [quickstart §3–§5](quickstart.md): Storybook mode switch (SC-007), rebrand test with tokens-only diff (SC-004), 3-token Figma traceability spot-check against `specs/001-foundation-tooling/figma-extraction.md` (SC-006); revert experiment edits
- [ ] T027 [P] Update `README.md` (setup, command set, consuming `faster-ui` + `faster-ui/styles.css`, dark-mode note) and `CLAUDE.md` (token architecture refinement per [research R-3](research.md); real script list replaces "once configured" placeholders)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately; T002 ∥ T003 after T001
- **Foundational (Phase 2)**: needs Phase 1 — blocks all stories
- **US1 (Phase 3)**: needs Phase 2. **Blocks US2–US4** (tokens are consumed by the Smoke component, Cypress support file, Storybook preview, and the shipped stylesheet) — this feature's stories chain rather than parallelize, per the spec's own priority rationale
- **US2 (Phase 4)**: needs US1. T012 ∥ T013 (different files); T014 after T009; T015 ∥ T016 after T014 (+T012/T013 respectively); T017 last
- **US3 (Phase 5)**: needs US1 + T014 (Smoke exists). Does **not** need T015–T017 — may start once T014 lands, in parallel with US2's test tasks
- **US4 (Phase 6)**: needs US1 + T014 (index.ts export). T021 ∥ T022; may also run in parallel with US3 and US2's test tasks. T023 after T021+T022
- **Polish (Phase 7)**: needs all stories. T024 first (full gate), then T025 ∥ T026 ∥ T027

### Parallel Opportunities

| Window | Tasks |
| ------ | ----- |
| Setup | T002 ∥ T003 |
| US2 config | T012 ∥ T013 |
| After T014 lands | US2 tests (T015 ∥ T016) ∥ US3 (T018–T019) ∥ US4 (T021 ∥ T022) |
| Polish | T025 ∥ T026 ∥ T027 |

---

## Implementation Strategy

**MVP first (US1)**: Phases 1–3 alone deliver the token foundation — independently valuable (validated in the dev playground: Figma-true colors, rebrand + mode-flip by token edit only) and the hard prerequisite for everything else. Stop at the Phase 3 checkpoint to review extraction quality before wiring harnesses.

**Then incremental**: US2 (test harnesses) → US3 (workbench) → US4 (packaging), each ending at a verifiable checkpoint; after T014, US3/US4 can proceed in parallel with US2's test tasks if desired. Phase 7 closes the FR-011 gate: Smoke green in all three harnesses plus the full command gate.

**Commits**: conventional commits per task or logical group (`feat:`, `chore:`, `test:`, `docs:`), keeping the spec-before-code story readable in history.

## Notes

- [P] tasks = different files, no dependencies
- Tests assert user-observable behavior (roles, names, computed token styles), never class-name proofs
- Figma reads are rate-limited (200/day, 15/min — [research R-1](research.md)): batch `get_variable_defs` per page, not per node
- Stop at any checkpoint to validate the story independently
