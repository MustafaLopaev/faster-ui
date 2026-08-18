# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]

**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!-- The stack below is FIXED by the task brief and the constitution's
     Mandated Stack section — do not re-litigate it per feature. Fill in
     only the feature-specific rows and remove any N/A rows. -->

**Language/Version**: TypeScript (strict) on React 19

**Styling**: Tailwind CSS v4, CSS-first `@theme` tokens (primitive → semantic CSS variables)

**Build**: Vite library mode (ESM output, type declarations, `react`/`react-dom` externalized as peers)

**Testing**: Jest + React Testing Library (unit, standalone transform) · Cypress Component Testing (Vite-mounted)

**Documentation**: Storybook (Vite builder) with full controls

**CI/CD**: GitHub Actions (install → lint → typecheck → Jest → Cypress → Storybook build → library build → release)

**Target Platform**: Modern evergreen browsers; consumed as an npm package

**Project Type**: React component library (single package)

**Design Source**: [Figma node(s) this feature implements, or N/A]

**Feature-Specific Dependencies**: [any new dependency this feature adds — each must be justified per Principle VI, or "None"]

**Constraints**: [feature-specific, e.g., "no layout shift on state change", or "N/A"]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [ ] **I. Token-First Styling** — no hardcoded visual values; semantic tokens identified in spec's Token Dependencies
- [ ] **II. Accessibility by Default** — A11Y requirements specified and covered by planned tests
- [ ] **III. One Consistent Component API** — props extend native element, ref forwarded, variant/size unions, className escape hatch
- [ ] **IV. Tested Evidence** — Jest + Cypress coverage planned for every variants-matrix cell and interaction
- [ ] **V. Storybook Contract** — stories planned for all variants/states + Playground
- [ ] **VI. Library-First Packaging** — public API only via `src/index.ts`; no new runtime deps (or justified below)
- [ ] **VII. Simplicity** — no speculative abstractions beyond the spec

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

<!-- Canonical Faster UI layout. Extend with the feature's concrete files;
     delete sections that this feature does not touch. -->

```text
src/
├── tokens/                      # Design tokens (CSS variables + @theme mapping)
│   └── tokens.css
├── components/
│   └── [ComponentName]/
│       ├── [ComponentName].tsx          # Implementation
│       ├── [ComponentName].test.tsx     # Jest + RTL suite
│       ├── [ComponentName].cy.tsx       # Cypress component suite
│       ├── [ComponentName].stories.tsx  # Storybook stories
│       └── index.ts                     # Barrel export
├── lib/                         # Shared internals (cn/class merge, hooks)
└── index.ts                     # Public API — the only export surface

.storybook/                      # Storybook config
cypress/                         # Cypress support files
.github/workflows/               # CI pipeline
```

**Structure Decision**: [Confirm the layout above or document deviations]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., new runtime dependency] | [current need] | [why building it is worse] |
