# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`

**Created**: [DATE]

**Status**: Draft

**Input**: User description: "$ARGUMENTS"

**Figma Reference**: [Link to the Figma frame/node this feature implements, or N/A for infrastructure features]

## User Scenarios & Testing *(mandatory)*

<!--
  For Faster UI, the "user" is almost always the CONSUMING DEVELOPER using the
  library, and secondarily the END USER interacting with the rendered component
  (including keyboard and screen-reader users — write at least one story from
  their perspective for any interactive component).

  Each story must be INDEPENDENTLY TESTABLE and prioritized (P1 = most critical,
  the MVP slice).
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this journey in plain language, e.g. "A developer imports Button and renders a primary action that responds to clicks."]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [How this can be verified on its own, e.g. "Mount the component in isolation and assert the behavior in Jest/Cypress"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [How this can be verified on its own]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority. Always
include a keyboard/assistive-technology journey for interactive components.]

### Edge Cases

<!-- Component-library edge cases worth considering:
     long/overflowing content, missing labels, disabled + click attempts,
     controlled vs uncontrolled misuse, rapid open/close, focus loss,
     SSR/portal timing, ref forwarding, className collisions. -->

- What happens when [boundary condition]?
- How does the component handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Component MUST [specific capability, e.g., "render all variants defined in the variants matrix"]
- **FR-002**: Component MUST [interaction requirement, e.g., "invoke onClick when activated by mouse, Enter, or Space"]
- **FR-003**: Component MUST [accessibility requirement, e.g., "expose an accessible name in all configurations"]
- **FR-004**: Component MUST [API requirement, e.g., "forward its ref to the underlying native element"]
- **FR-005**: Component MUST [token requirement, e.g., "derive all visual values from semantic design tokens"]

*Mark anything the Figma file or brief leaves ambiguous:*

- **FR-006**: Component MUST [NEEDS CLARIFICATION: e.g., hover spec not present in Figma for this variant]

### Component API Surface *(for component features)*

<!-- The public contract. Props, types, defaults — per Constitution Principle III.
     For infrastructure features (tokens, tooling), describe the exported
     surface instead (token names, config entry points). -->

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `variant` | `'primary' \| ...` | `'primary'` | [purpose] |
| `size` | `'sm' \| 'md' \| ...` | `'md'` | [purpose] |
| ... | | | |

Native passthrough: extends `ComponentPropsWithoutRef<'[element]'>`; ref forwarded to `[element]`.

### Variants & States Matrix *(for component features)*

<!-- Enumerate every variant × state combination the Figma file defines.
     This matrix drives implementation, tests, AND stories — they must all
     cover exactly this set. -->

| Variant | Default | Hover | Focus | Active | Disabled | Error |
| ------- | ------- | ----- | ----- | ------ | -------- | ----- |
| [name]  | [spec]  | [spec]| [spec]| [spec] | [spec]   | [spec / N/A] |

### Accessibility Requirements *(for component features)*

- **A11Y-001**: [e.g., "Role and accessible name: ..."]
- **A11Y-002**: [e.g., "Keyboard behavior: Tab/Shift+Tab/Enter/Space/Escape do ..."]
- **A11Y-003**: [e.g., "Focus management: ..."]
- **A11Y-004**: [e.g., "State announcement: error/disabled communicated via ..."]

### Token Dependencies

<!-- Which semantic tokens this feature consumes or introduces.
     New tokens must state their primitive mapping. -->

- Consumes: [e.g., `--color-action-primary`, `--radius-control`]
- Introduces: [e.g., `--color-feedback-error` → maps to `red-500`]

## Success Criteria *(mandatory)*

<!-- Measurable, technology-visible-from-outside outcomes. -->

### Measurable Outcomes

- **SC-001**: [e.g., "Every cell of the variants matrix is rendered by a story and asserted by a test"]
- **SC-002**: [e.g., "A keyboard-only user can complete [interaction] without a pointer"]
- **SC-003**: [e.g., "Component renders correctly with zero console errors in Storybook"]
- **SC-004**: [e.g., "Rebranding the primary color requires editing only token definitions"]

## Assumptions

- [Assumption about Figma interpretation, e.g., "Focus ring not shown in Figma; using the design system's standard focus token"]
- [Assumption about scope, e.g., "RTL support out of scope for v1"]
- [Dependency, e.g., "Requires semantic tokens from the foundation feature"]
