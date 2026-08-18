# Tasks: Core Components — Button, Input, Dialog

**Input**: Design documents from `/specs/002-core-components/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/), [figma-extraction.md](figma-extraction.md)

**Tests**: MANDATORY (Constitution Principle IV). Every component ships Jest +
RTL and Cypress CT suites covering its full Variants & States Matrix and every
A11Y requirement. Contract guarantee IDs (B1–B10, I1–I10, D1–D10) come from
[contracts/](contracts/).

**Organization**: Grouped by user story (US1 Button P1, US2 Input P2, US3
Dialog P3, US4 keyboard journey P1-composite, US5 dark mode P2).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

## Path Conventions (Faster UI)

- Tokens: `src/tokens/tokens.css`
- Components: `src/components/[Name]/[Name].tsx` + co-located `.test.tsx`,
  `.cy.tsx`, `.stories.tsx`, `index.ts`
- Shared internals: `src/lib/`
- Public API: `src/index.ts` only

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature-level initialization

- [X] T001 Install `cypress-real-events` as a devDependency (research R-11) and register it via `import 'cypress-real-events/support'` in cypress/support/component.ts
- [X] T002 Apply the full token delta per [contracts/tokens-delta.md](contracts/tokens-delta.md) in src/tokens/tokens.css: 18 new §2 semantics with Figma-style comments, their `.dark` re-declarations (action-clear-active, border-strong, text-control, text-heading, text-placeholder-disabled), matching §3 `@theme inline` bridge entries, `--radius-surface` → `var(--fui-radius-4)`, delete `--fui-radius-8`
- [X] T003 Verify the token delta end-to-end: `npm run build` succeeds and dist/styles.css contains the new `--fui-*` semantics with `--radius-surface` resolving to 0.25rem; `npm run typecheck` stays green

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared internals and platform de-risking every story depends on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 [P] Create `cn(...parts: Array<string | false | null | undefined>): string` falsy-filtering class join helper (research R-1) in src/lib/cn.ts
- [X] T005 [P] De-risk platform assumptions in a scratch story/playground and record findings as a short addendum in specs/002-core-components/research.md: (a) `fui:animate-spin` utility generates with the prefix (R-3), (b) `fui:backdrop:bg-overlay` styles `::backdrop` (R-8), (c) arbitrary-property utilities for `appearance` resets work prefixed (R-6), (d) jsdom `HTMLDialogElement.showModal/close` exist under Jest 30 (R-10) — if (d) fails, add the minimal method shim to jest.setup.ts

**Checkpoint**: Foundation ready — user story implementation can now begin

---

## Phase 3: User Story 1 — Button in every Figma variant (Priority: P1) 🎯 MVP

**Goal**: `Button` renders all 4 variants × 2 tones × 3 sizes with icon slots,
`iconOnly` circular mode, and loading/disabled behavior, per the Button
matrices and [contracts/button-api.md](contracts/button-api.md).

**Independent Test**: Mount `Button` alone in Jest/Cypress/Storybook; every
matrix cell renders from tokens; click/Enter/Space activate; disabled/loading
suppress; `iconOnly` misuse fails typecheck.

- [X] T006 [US1] Implement Button per contract in src/components/Button/Button.tsx: `forwardRef` + `ComponentPropsWithoutRef<'button'>`, discriminated `ButtonProps` union (R-4, guarantee B8), variant×tone×size class maps over `fui:*` utilities (colors per Button matrix; geometry 40/36/24, pad 8/8-7/8-3/4, min-w 106/98/62, icon gap 4; link = no box; iconOnly = square + `radius-full` + pad 11/10/5), inline `aria-hidden` spinner SVG with `currentColor` + `fui:animate-spin` in the leading slot when `loading` (R-3), `aria-busy`, internal activation guard (no native `disabled` for loading, A-6), `type` default `"button"`, dev-only warn for iconOnly misuse
- [X] T007 [US1] Barrel export `Button` + `ButtonProps` in src/components/Button/index.ts
- [X] T008 [US1] Swap the public API in src/index.ts (export `Button`/`ButtonProps`, drop Smoke) and delete src/components/Smoke/ entirely — Smoke.tsx, Smoke.test.tsx, Smoke.cy.tsx, Smoke.stories.tsx, index.ts (research R-13)
- [X] T009 [P] [US1] Jest + RTL suite covering guarantees B1–B6, B8 (runtime warn), B9, B10 (prop-reachable parts) in src/components/Button/Button.test.tsx — accessible names, activation counts, Enter/Space, disabled/loading suppression + `aria-busy` + focus retention, type default, ref forwarding, className merge; include `@ts-expect-error` cases for the iconOnly union
- [X] T010 [P] [US1] Cypress CT suite covering B7 in src/components/Button/Button.cy.tsx — for every variant×tone×size: default/disabled/loading computed colors resolve to the mapped token values; hover/active cells via `cy.realHover`/`realMouseDown` (all 8 variant×tone rows); loading spinner visible and click-suppressed on a real browser; min-width and height computed-style checks
- [X] T011 [P] [US1] Stories in src/components/Button/Button.stories.tsx: one grid story per variant×tone (8 — sizes × default/disabled/loading rows), IconOnly story (3 variants × sizes, `aria-label` demonstrated), WithIcons story (left/right slots), Playground exposing every public prop (R-14)
- [X] T012 [US1] Story-1 gate: `npm run lint && npm run typecheck && npm test && env -u ELECTRON_RUN_AS_NODE npm run cy:ct && npm run build-storybook && npm run build` all green with Smoke gone

**Checkpoint**: Button meets the Definition of Done independently — MVP deliverable

---

## Phase 4: User Story 2 — Input as a labelled, validated form field (Priority: P2)

**Goal**: `Input` covers five states × three sizes with label/error ARIA
wiring plus all seven Figma adornment sets (icons, affixes, number steppers,
clearable), per [contracts/input-api.md](contracts/input-api.md).

**Independent Test**: Mount `Input` alone; label click focuses; typing works
controlled and uncontrolled; error announces via `aria-invalid` +
`aria-describedby`; adornments render without disturbing field state styling.

- [X] T013 [US2] Implement Input core per contract in src/components/Input/Input.tsx: `forwardRef` to the real `<input>`, `Omit<…,'size'|'prefix'>` props (R-2), label + `useId` wiring (I2, I10), field-wrapper anatomy carrying all visuals with mutually exclusive state class branches — default(hover/focus-within)/error/disabled (R-5, A-3), error message `<p>` + `aria-invalid`/`aria-describedby` merge (I3), size geometry per matrix (heights 40/36/24, pad-x 12/12/8, ramps, `radius-control`), wrapper click → focus
- [X] T014 [US2] Add adornments to src/components/Input/Input.tsx: `leftIcon`/`rightIcon` and `prefix`/`suffix` slots (rest `icon-muted`, disabled `text-disabled`, I6), number steppers when `type="number"` — native spin UI hidden via appearance resets, 14px chevrons `tabIndex={-1}` `aria-hidden`, `stepUp()/stepDown()` + value-setter `input` dispatch (R-6, I7) — and `clearable`/`onClear` — 16px labelled clear `<button>`, visibility rule `value ∧ enabled ∧ !readOnly`, native-setter clear + refocus (R-7, I8)
- [X] T015 [US2] Barrel export in src/components/Input/index.ts and add `Input`/`InputProps` to src/index.ts
- [X] T016 [P] [US2] Jest + RTL suite covering I1–I6, I8 (behavioral), I10 in src/components/Input/Input.test.tsx — label association, controlled/uncontrolled parity, ARIA error wiring incl. consumer `aria-describedby` merge, disabled focusability, adornments excluded from name/value, clear fires `onChange`→`onClear`→refocus, id override
- [X] T017 [P] [US2] Cypress CT suite covering I5, I7, I8, I9 in src/components/Input/Input.cy.tsx — hover/focus border computed colors via real events, error-persists-through-hover/focus, real number stepping incl. `min`/`max` clamp and controlled `onChange`, clear affordance with real typing, size geometry computed styles
- [X] T018 [P] [US2] Stories in src/components/Input/Input.stories.tsx: Default/Error/Disabled state stories, Adornments story (icons, affixes, number, clearable), Sizes story, Playground with every public prop
- [X] T019 [US2] Story-2 gate: full local gate (as T012) green with Input exported

**Checkpoint**: Stories 1 AND 2 meet the Definition of Done independently

---

## Phase 5: User Story 3 — Dialog as a controlled modal (Priority: P3)

**Goal**: `Dialog` wraps native `<dialog>` with controlled `open`/`onClose`,
focus trap/restore, Escape-to-close, inert background, sizes, dividers, and
scrollable body, per [contracts/dialog-api.md](contracts/dialog-api.md).

**Independent Test**: Mount `Dialog` with a trigger; open/close via every
path; assert focus movement/restore, inert background, `onClose` call counts,
geometry per matrix.

- [X] T020 [US3] Implement Dialog per contract in src/components/Dialog/Dialog.tsx: `forwardRef` merged with internal ref, `Omit<…,'open'|'onClose'>` props (R-2), `showModal()/close()` visibility effect + `onCancel` preventDefault→`onClose` + forced-close re-sync (R-8, D3), opener capture/restore on close AND unmount (D4), header (title `text-heading` 18/26 + internal 14px `icon-muted` close button with focus ring), body section (scrollable overflow, D8), right-aligned footer slot gap 8, `dividers` hairlines `border-strong` with 16/24 rhythm (D9), size widths 400/600/900 viewport-capped, panel `surface-raised` + `radius-surface` + `shadow-elevation-4` + pad 24 + gaps 16/32, `::backdrop` via `fui:backdrop:bg-overlay`, `aria-labelledby` ← `useId` when `title` (D6)
- [X] T021 [US3] Barrel export in src/components/Dialog/index.ts and add `Dialog`/`DialogProps` to src/index.ts
- [X] T022 [P] [US3] Jest + RTL suite covering D1, D3, D4, D6, D10 in src/components/Dialog/Dialog.test.tsx — closed = out of a11y tree, Escape/close-button call `onClose` exactly once without self-close, controlled-misuse stays open, focus restore on close and unmount, accessible name, ref + passthrough, scrim click does not close (apply the T005 shim only if jsdom gaps were found)
- [X] T023 [P] [US3] Cypress CT suite covering D2, D5, D7, D8, D9 in src/components/Dialog/Dialog.cy.tsx — real top-layer render over `overlay` backdrop, background inert to pointer + Tab, focus trapped across full Tab cycles, panel geometry computed styles per size (incl. radius 4px), overflow body scrolls with fixed header/footer, dividers preset
- [X] T024 [P] [US3] Stories in src/components/Dialog/Dialog.stories.tsx: Basic (Ghost+Primary md footer per Figma), Warning composition (Warning/600 icon + `danger` outline confirm, R-15), Scrollable, WithDividers, Sizes, Playground — each openable/closable in-canvas
- [X] T025 [US3] Story-3 gate: full local gate (as T012) green with Dialog exported

**Checkpoint**: All three components meet the Definition of Done independently

---

## Phase 6: User Story 4 — Keyboard-only & screen-reader journey (Priority: P1, composite — requires US1+US2+US3)

**Goal**: Prove the three components compose accessibly in one keyboard-only
flow (spec US4 scenarios 1–4).

**Independent Test**: The journey spec passes with zero pointer events.

- [ ] T026 [US4] Cypress keyboard-only journey spec in src/components/Dialog/Dialog.journey.cy.tsx: Tab to trigger Button → Enter opens Dialog (focus inside) → Tab cycle stays trapped → type into Input → submit invalid → `aria-invalid` + message asserted → fix value → Escape → `onClose` → focus restored to trigger; assert visible `focus-ring` on each stop; zero pointer events used

**Checkpoint**: US4 journey green — accessibility composition proven

---

## Phase 7: User Story 5 — Light and dark mode (Priority: P2)

**Goal**: Every component renders correctly in both modes via the token layer
alone (`dark` class contract).

**Independent Test**: Computed colors flip for representative cells with zero
prop changes; all stories legible in the dark toolbar.

- [ ] T027 [P] [US5] Add dark-mode context tests to src/components/Button/Button.cy.tsx: with `dark` on the root, outline/ghost surfaces flip (`surface-raised` → ink-800) while action colors stay brand (US5 scenario 2)
- [ ] T028 [P] [US5] Add dark-mode context tests to src/components/Input/Input.cy.tsx: field fill, borders (`white-a7`), text (`text-control` → `white-a79`), placeholder-disabled flip per [data-model.md](data-model.md) §4
- [ ] T029 [P] [US5] Add dark-mode context tests to src/components/Dialog/Dialog.cy.tsx: panel `surface-raised`, `text-heading` → `white-a90`, dividers `white-a7`, overlay unchanged
- [ ] T030 [US5] Storybook dark sweep: review every story in the dark toolbar; fix any illegible derivation in src/tokens/tokens.css ONLY (zero component edits — Principle I rebrand path); confirm zero console errors/warnings in both modes

**Checkpoint**: SC-003 satisfied — both modes verified

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T031 [P] Run `/token-audit` over src/components/ — zero hardcoded colors/spacing/radius/typography or arbitrary visual values (SC-004); the only permitted arbitrary properties are the behavioral `appearance` resets (R-6)
- [ ] T032 [P] Verify packaging surface (SC-006): `npm run build`; dist/index.d.ts exports exactly `Button`/`ButtonProps`/`Input`/`InputProps`/`Dialog`/`DialogProps`; dist/styles.css carries the token delta; no Smoke remnants anywhere (grep)
- [ ] T033 Full local gate, everything at once: `npm run lint && npm run typecheck && npm test && env -u ELECTRON_RUN_AS_NODE npm run cy:ct && npm run build-storybook && npm run build` — all green (SC-007)
- [ ] T034 [P] Update README.md and CLAUDE.md: component usage docs (Button/Input/Dialog with props tables), `src/lib/` no longer reserved, Smoke removed, radius-surface correction noted; cross-check [quickstart.md](quickstart.md) sign-off list

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately. T001 ∥ T002; T003 after T002
- **Foundational (Phase 2)**: after Setup. T004 ∥ T005 — BLOCKS all stories
- **US1 Button (Phase 3)**: after Phase 2. T006 → T007 → T008; T009/T010/T011 [P] after T006 (T010 also needs T001); T012 last
- **US2 Input (Phase 4)**: after Phase 2 (independent of US1). T013 → T014 → T015; T016/T017/T018 [P] after T014; T019 last
- **US3 Dialog (Phase 5)**: after Phase 2; stories T024 compose Button (needs T008 for the Figma-faithful footer). T020 → T021; T022/T023/T024 [P] after T020; T025 last
- **US4 (Phase 6)**: after US1+US2+US3 (composite journey)
- **US5 (Phase 7)**: T027–T029 [P] after their component's cy suite exists; T030 after all stories
- **Polish (Phase 8)**: after everything desired; T031/T032/T034 [P], T033 final

### Story completion order

`Setup → Foundational → US1 (MVP) → US2 ∥ US3 → US4 → US5 → Polish`
(US2 and US3 implementations are file-independent and can be built in
parallel; only Dialog's *stories* want Button exported first.)

### Parallel Opportunities

- Phase 1: T001 ∥ T002
- Phase 2: T004 ∥ T005
- Per story once its implementation lands: Jest ∥ Cypress ∥ Stories (e.g. T009 ∥ T010 ∥ T011)
- Across stories: US2 tasks ∥ US3 tasks (different component dirs)
- Phase 7: T027 ∥ T028 ∥ T029; Phase 8: T031 ∥ T032 ∥ T034

---

## Implementation Strategy

**MVP first**: Phases 1–3 alone deliver a shippable increment — the full
Button matrix on the corrected token layer with the Smoke gate retired
(T012 proves the whole pipeline). Stop-and-validate at every checkpoint.

**Incremental delivery**: each subsequent story is independently gated
(T019, T025) so the library is releasable after any checkpoint. US4/US5 are
thin proof layers over existing files; Polish finishes the constitution's
Definition of Done (SC-001…SC-007).

**Notes**: tests assert user-observable behavior (roles, names, computed
token colors, keyboard flows) — never class names; commit after each task or
logical group with conventional-commit messages; matrix values come from
[figma-extraction.md](figma-extraction.md) — no other color/size source is
authoritative.
