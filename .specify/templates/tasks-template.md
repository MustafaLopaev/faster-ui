---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md

**Tests**: MANDATORY for every component (Constitution Principle IV). Every component task group MUST include Jest + RTL tasks and Cypress component-test tasks covering the full variants & states matrix from the spec. Infrastructure-only features (tooling, config) may omit component tests but must include verification tasks (build passes, pipeline green).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions (Faster UI)

- Tokens: `src/tokens/`
- Components: `src/components/[Name]/[Name].tsx` with co-located
  `.test.tsx` (Jest), `.cy.tsx` (Cypress), `.stories.tsx` (Storybook), `index.ts`
- Shared internals: `src/lib/`
- Public API: `src/index.ts` only
- CI: `.github/workflows/`

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit-tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - The Component API Surface and Variants & States Matrix from spec.md
  - Feature requirements from plan.md

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature-level initialization

- [ ] T001 Create component directory structure per implementation plan
- [ ] T002 [P] Add/verify semantic tokens required by this feature in src/tokens/tokens.css

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Anything that MUST exist before any user story can be implemented (shared internals, token additions, config changes)

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] [Example] Add shared utility in src/lib/[util].ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Component task pattern (repeat per component this story touches)

> Write test tasks alongside implementation; tests must cover every cell of
> the spec's variants & states matrix and every A11Y requirement.

- [ ] T010 [US1] Implement [Component] per API surface in src/components/[Component]/[Component].tsx
- [ ] T011 [P] [US1] Jest suite (render, variants, states, interactions, a11y) in src/components/[Component]/[Component].test.tsx
- [ ] T012 [P] [US1] Cypress component suite (mount, render, interactions) in src/components/[Component]/[Component].cy.tsx
- [ ] T013 [P] [US1] Stories for all variants/states + Playground in src/components/[Component]/[Component].stories.tsx
- [ ] T014 [US1] Export via src/components/[Component]/index.ts and src/index.ts

**Checkpoint**: Story 1 component(s) meet the Definition of Done independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

- [ ] T020 [US2] [Follow the component task pattern above]

**Checkpoint**: Stories 1 AND 2 work independently

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Verify zero console errors across all stories in Storybook
- [ ] TXXX [P] Run token audit — no hardcoded visual values in components
- [ ] TXXX Run full local gate: lint, typecheck, Jest, Cypress, Storybook build, library build
- [ ] TXXX [P] Update README / docs if the public API changed

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel where files don't overlap
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### Within Each User Story

- Implementation before exports; tests and stories can proceed in parallel with each other once the component exists
- A story is complete only when its component(s) meet the constitution's Definition of Done (implementation + Jest + Cypress + stories + green gates)

### Parallel Opportunities

- All tasks marked [P] operate on different files and can run in parallel
- Different components' task groups are independent once Foundational completes

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Tests assert user-observable behavior (roles, names, interactions), not implementation details
- Commit after each task or logical group
- Stop at any checkpoint to validate the story independently
