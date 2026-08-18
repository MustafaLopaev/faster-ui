# Feature Specification: Foundation & Tooling

**Feature Branch**: `001-foundation-tooling`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Foundation & tooling for Faster UI: convert the Vite scaffold into a publishable component library and wire up all quality tooling. Scope: (1) extract the design tokens (colors, typography, radius, spacing, states) from the TapTap Figma file in docs/udc-requirements.md using the Figma MCP tools, and define them as Tailwind v4 CSS-first @theme tokens in src/tokens/tokens.css with primitive → semantic layering; (2) install and configure Tailwind v4, Jest + React Testing Library (standalone transform), Cypress component testing, and Storybook with the Vite builder; (3) convert package.json to library packaging — Vite library mode, ESM output with type declarations, react/react-dom as peer dependencies, public API via src/index.ts only; (4) add npm scripts for dev, build, lint, typecheck, test, cypress, and storybook. No components yet — this feature ends when a trivial smoke component can be rendered in a Jest test, a Cypress component test, and a Storybook story, all passing locally."

**Figma Reference**: [TapTap Design System — Developers Community](https://www.figma.com/design/WYuHdUuUq31HzkdJhoKwXl/TapTap-Design-System%E4%B8%A8Developers--Community-?node-id=12-11244&p=f&t=IdkiBp7B4GxCdKAF-0) (source of all token values)

## Clarifications

### Session 2026-08-19

- Q: Should this foundation deliver a single theme only, or also wire up light/dark theme support if the TapTap Figma file defines both? → A: Light + dark now — extract both mode values and ship a mode-aware semantic token layer in this feature.
- Q: What should the library's published package name be? → A: `faster-ui` (unscoped, matches the "Faster" brand).
- Q: How should the library's token names avoid colliding with CSS variables a host application might already define? → A: Library prefix — every token (primitive and semantic) carries the `fui-` prefix.

## User Scenarios & Testing *(mandatory)*

<!-- For this infrastructure feature, the "users" are (a) the component author who
     will build Button/Input/Dialog on top of this foundation, and (b) the
     consuming developer who installs the published library. -->

### User Story 1 - Token-Driven Styling Foundation (Priority: P1)

A component author starts building a component and styles it entirely with purpose-named design tokens (e.g. "primary action color", "control radius") whose values were extracted from the TapTap Figma file. They never type a raw color, radius, spacing, or font value, and a later rebrand is possible by editing token definitions alone.

**Why this priority**: Every future component depends on the token system existing first — the constitution makes token-first styling non-negotiable, and no component work can start without it.

**Independent Test**: Style a throwaway element using only semantic tokens; verify each rendered value matches the Figma inspect value, then change one token's underlying value and verify the rendered output changes with zero edits to the element.

**Acceptance Scenarios**:

1. **Given** the token catalog is defined, **When** a component author needs a color, font, radius, or spacing value for any Button/Input/Dialog state (default, hover, focus, active, disabled, error), **Then** a purpose-named (semantic) token exists for it and resolves to the value shown in the Figma file.
2. **Given** a component styled only with semantic tokens, **When** the underlying primitive value of one token is changed, **Then** the component's appearance updates with no component-file edits.
3. **Given** the token catalog, **When** it is reviewed, **Then** every semantic token maps to a named primitive token, and no primitive value appears in more than one place.
4. **Given** a component styled only with semantic tokens, **When** the active color mode switches between light and dark, **Then** the component's colors update to that mode's Figma values with no component-file edits.

---

### User Story 2 - Behavior Verified in Two Test Harnesses (Priority: P2)

A component author writes a unit test (rendering and behavior assertions) and a browser-based component test (real mounting and interaction) for a component, and runs each locally with a single documented command.

**Why this priority**: The constitution forbids shipping a component without its full test contract; the harnesses must exist and demonstrably work before the first real component is built.

**Independent Test**: Write one unit test and one browser component test against the smoke component; both suites run locally with one command each and pass.

**Acceptance Scenarios**:

1. **Given** the configured unit test harness, **When** a test renders a component and asserts on its accessible role and name, **Then** the suite runs to completion locally with a single command and reports pass/fail per test.
2. **Given** the configured browser component test harness, **When** a test mounts a component, **Then** the component renders with token styling applied and interactions (e.g. click) can be asserted.
3. **Given** either harness, **When** a test imports a component that imports the token stylesheet, **Then** the harness handles it without errors.

---

### User Story 3 - Living Documentation Workbench (Priority: P2)

A component author (and later, a reviewer) opens the documentation workbench locally, finds a story for a component, sees it rendered with real token styling, and manipulates its props through interactive controls — with zero console errors.

**Why this priority**: Storybook is the contract's documentation per the constitution; it must render token-styled components before real component stories can be authored.

**Independent Test**: Launch the workbench with one command; the smoke component's story renders with token-driven styling and no console errors or warnings.

**Acceptance Scenarios**:

1. **Given** the configured workbench, **When** it is started with a single command, **Then** it serves locally and lists the smoke component's story.
2. **Given** the smoke component story, **When** it renders, **Then** token styling is visibly applied and the browser console shows zero errors and zero warnings.
3. **Given** the workbench, **When** its static build command runs, **Then** it completes successfully (proving it can later run in CI).

---

### User Story 4 - Consumable as a Library (Priority: P3)

A consuming developer installs the built package in their own React project, imports a component from the single public entry point with full type information, and gets no duplicate copy of React in their bundle.

**Why this priority**: Publishing is the end goal, but consumption can only be meaningfully exercised once real components exist; at this stage the packaging contract just needs to be in place and verified with the smoke component.

**Independent Test**: Run the library build; inspect the output for a modern module bundle plus type declarations, confirm React is not bundled in, and confirm the only importable surface is the public entry point.

**Acceptance Scenarios**:

1. **Given** the library build command, **When** it runs, **Then** it produces a distributable module bundle with type declarations, and the package manifest points at these outputs.
2. **Given** the built package, **When** its contents are inspected, **Then** React and its DOM renderer are not bundled inside — the host application is expected to provide them.
3. **Given** the package manifest, **When** a consumer imports from the package root, **Then** they receive exactly what the public entry file exports, and internal modules are not part of the advertised API.

---

### Edge Cases

- A Figma state value (e.g. a hover shade) has no corresponding primitive in the extracted palette → the extraction must add it as a primitive first; semantic tokens never hold raw values directly.
- A harness loads a component without the token stylesheet → browser-based harnesses (component tests, workbench) MUST load token styling so visual assertions are honest; the unit-test harness must at minimum not error on stylesheet imports.
- The consuming application already uses the same styling framework → collisions are prevented by the `fui-` prefix carried by every token name (see FR-002).
- The host application resolves a second copy of React → prevented by declaring React as a provided (peer) dependency rather than bundling it.
- A developer imports an internal module path directly → the package must not advertise internals; only the public entry point is a supported import.
- A needed color token has no dark-mode value in the Figma file → the light value is reused for both modes and the gap is recorded alongside the token definition.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a design token catalog extracted from the TapTap Figma file covering colors, typography (size, weight, line height), border radius, spacing, and interaction-state values (default, hover, focus, active, disabled, error) sufficient for the planned Button, Input, and Dialog components — with color values captured for both light and dark modes.
- **FR-002**: Tokens MUST be structured in two layers: primitive tokens (raw values, each defined exactly once) and semantic tokens (purpose-named, each mapping to a primitive). Components and consumers use semantic tokens only. Every token name in both layers carries the `fui-` library prefix so it cannot collide with host-defined variables.
- **FR-003**: All token definitions MUST live in a single central location, and changing a token's value MUST require no edits outside that location (rebrand-by-token guarantee).
- **FR-004**: Every primitive token value MUST match the value inspectable in the Figma file; any deliberate deviation MUST be recorded with a rationale.
- **FR-005**: Styling utilities generated from the semantic tokens MUST be available to component authors, so components are styled by token reference rather than raw values.
- **FR-006**: The unit test harness MUST render components and support assertions on user-observable behavior (roles, accessible names, interactions), runnable locally via a single command.
- **FR-007**: The browser component test harness MUST mount components with token styling applied and support real interaction assertions, runnable locally via a single command.
- **FR-008**: The documentation workbench MUST render stories with token styling and interactive prop controls, runnable locally via a single command, and MUST also support a non-interactive static build.
- **FR-009**: The package MUST be consumable as a library named `faster-ui`: a modern module bundle with type declarations, a single public entry point as the only supported import surface, and React provided by the host application rather than bundled.
- **FR-010**: A single documented command set MUST exist covering: local development, library build, lint, type check, unit tests, browser component tests, and the documentation workbench.
- **FR-011**: A trivial smoke component MUST exist that consumes at least one semantic token and is exercised by one passing unit test, one passing browser component test, and one rendering story — this is the feature's acceptance gate.
- **FR-012**: The tooling MUST coexist: the same component file must be importable by the unit test harness, the browser test harness, the workbench, and the library build without per-harness modifications.
- **FR-013**: The semantic color token layer MUST be mode-aware: each semantic color token resolves to its light-mode or dark-mode value based on the active mode, switching modes requires no component edits, and the workbench provides a way to view components in either mode. Where the Figma file defines no distinct dark value for a needed token, the light value serves both modes and the gap is recorded alongside the token.

### Exported Surface *(infrastructure feature)*

<!-- Per template guidance: for infrastructure features, describe the exported
     surface instead of a component API. -->

| Surface | What it exposes | Consumer |
| ------- | --------------- | -------- |
| Token stylesheet | Primitive + semantic token definitions; the single source of visual truth | Components, workbench, browser tests, host apps |
| Semantic token utilities | Purpose-named styling utilities generated from tokens | Component authors |
| Public entry point | The library's entire public API (currently: the smoke component, temporarily) | Consuming developers |
| Command set | dev, build, lint, typecheck, unit test, component test, docs workbench | Developers and CI |

### Token Dependencies

- Consumes: nothing — this feature *introduces* the token system.
- Introduces (groups; exact names finalized during extraction from Figma; all names carry the `fui-` prefix per FR-002):
  - Primitive palette: the raw color scales used by the TapTap design system
  - Semantic color tokens, each with light- and dark-mode values: action (primary/secondary + hover/active/disabled), feedback (error), surface/background, text (primary/secondary/inverse/disabled), border, focus indicator
  - Typography tokens: font family, size/weight/line-height sets used by controls and dialog text
  - Radius tokens: control-level and surface-level radii
  - Spacing tokens: the spacing scale used for control padding and layout gaps

### Out of Scope

- The Button, Input, and Dialog components themselves (subsequent feature).
- CI/CD pipeline and automated release (subsequent feature; this feature only ensures every quality command can run non-interactively).
- Publishing to a package registry.
- Themes beyond TapTap's light and dark modes (the token layering must *permit* additional brand themes, but none is delivered).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of visual values used by the smoke component resolve to named semantic tokens; an audit finds zero hardcoded color/radius/spacing/typography values in component files.
- **SC-002**: On a fresh clone, a developer can run install plus every documented quality command (lint, type check, unit tests, browser component tests, workbench static build, library build) and all complete successfully — locally, with no undocumented setup steps.
- **SC-003**: The smoke component passes in all three harnesses: at least one unit test, one browser component test, and one story rendering with zero console errors.
- **SC-004**: Rebranding the primary action color is achieved by edits confined to token definitions (at most one value per mode), with zero component-file changes, and is visible in the workbench.
- **SC-005**: The built package contains a module bundle and type declarations, does not contain React, and exposes exactly one public import surface.
- **SC-006**: Every primitive token value is traceable to the Figma file: a reviewer comparing tokens against Figma inspect values finds 100% agreement (or a documented rationale for each deviation).
- **SC-007**: Switching between light and dark modes in the workbench updates the smoke component's rendered colors to that mode's Figma values with zero component-file edits.

## Assumptions

- The mandated stack from the constitution (React 19 + TypeScript, Tailwind v4 CSS-first tokens, Vite library build, Jest + RTL, Cypress CT, Storybook) is a settled constraint, not a decision this spec makes; harnesses are referred to by role above.
- Token extraction uses the connected Figma design tooling against the TapTap file linked in the brief; the file is accessible at spec-execution time. If access fails, extraction falls back to the Figma web inspect panel with values recorded manually.
- Token scope is bounded by what Button, Input, and Dialog need plus the general foundations (palette, typography, radius, spacing, focus) — not an exhaustive mirror of the entire TapTap system.
- Both TapTap light and dark mode values are extracted and shipped (per clarification, 2026-08-19); where the Figma file defines only one value for a token, that value serves both modes. Additional brand themes remain out of scope.
- The smoke component is scaffolding: it is exported temporarily to validate packaging and will be removed or replaced when the first real component lands.
- The package is renamed from the scaffold name `uds` to `faster-ui` (per clarification, 2026-08-19); no npm organization is required.
- The token prefix is fixed as `fui-` ("Faster UI"); if planning uncovers a technical constraint on the exact spelling, the replacement must still be a library-unique prefix applied to every token.
- "All passing locally" is the gate for this feature; CI enforcement of the same commands arrives with the CI/CD feature.
