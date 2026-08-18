# Feature Specification: Core Components — Button, Input, Dialog

**Feature Branch**: `002-core-components`

**Created**: 2026-08-19

**Status**: Draft

**Input**: User description: "Core components for Faster UI: Button, Input, and Dialog, implemented strictly from the TapTap Figma copy (file key 7OfpQVe2pYpE9MF5pQeXhH). For each component: extract the complete variants, sizes, and states from Figma into the spec's Variants & States Matrix with exact token mappings — flag anything Figma leaves ambiguous as NEEDS CLARIFICATION rather than inventing values. APIs follow constitution Principle III. Dialog wraps the native `<dialog>` element with a controlled open/onClose React API, focus trap and restore, Escape-to-close, and inert background. Input covers label association, error state with aria-invalid + aria-describedby, and disabled. Button covers all Figma variants and sizes plus loading/disabled behavior. All styling consumes fui- semantic tokens only; light and dark modes must both render correctly. Each component ships its full co-located contract: Jest + RTL suite, Cypress component suite, stories for every matrix cell plus a Playground, exported through src/index.ts."

**Figma Reference**:

- Button page (`15:12480`): <https://www.figma.com/design/7OfpQVe2pYpE9MF5pQeXhH/taptap-design-copy?node-id=15-12480&m=dev>
- Input page (`11:7661`): <https://www.figma.com/design/7OfpQVe2pYpE9MF5pQeXhH/taptap-design-copy?node-id=11-7661&m=dev>
- Dialog page (`12:11244`): <https://www.figma.com/design/7OfpQVe2pYpE9MF5pQeXhH/taptap-design-copy?node-id=12-11244&m=dev>

All variant, state, and geometry values in this spec were extracted node-by-node from
these pages on 2026-08-19 (extraction evidence: [figma-extraction.md](figma-extraction.md)).
Values are cited as Figma paint/text/effect style names (e.g. `Primary/600`) with their
semantic-token mapping. Tokens marked **†** do not exist yet in `src/tokens/tokens.css`
and are introduced by this feature (see Token Dependencies).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Button in every Figma variant (Priority: P1)

A developer imports `Button` and renders any of the four TapTap visual styles
(primary, outline, ghost, link), each optionally in its danger tone, in three
sizes, with optional leading/trailing icon slots. Clicks fire; disabled and
loading buttons don't.

**Why this priority**: Button is the most-used primitive and the Dialog footer
depends on it (Figma composes Ghost + Primary / Outline-danger buttons inside
every Dialog variant). Nothing else can ship faithfully without it.

**Independent Test**: Mount `Button` in isolation in Jest/Cypress; assert each
variant × tone × size renders, click/Enter/Space activation works, and
disabled/loading suppress activation.

**Acceptance Scenarios**:

1. **Given** `<Button>Save</Button>`, **When** rendered, **Then** a real `<button>` with accessible name "Save" appears with primary styling (teal fill, white label) and `type="button"`.
2. **Given** any variant/tone/size combination from the matrix, **When** rendered, **Then** the computed colors, radius, height, padding, and typography come from the tokens mapped in the matrix — no hardcoded values.
3. **Given** a Button with `onClick`, **When** activated by mouse click, Enter, or Space, **Then** the handler fires exactly once per activation.
4. **Given** a disabled Button, **When** the user clicks or presses Enter/Space, **Then** `onClick` never fires and the disabled visual state (per matrix) is shown.
5. **Given** a loading Button, **When** the user attempts to activate it, **Then** `onClick` never fires, the button communicates busy state to assistive technology, and a loading indicator is visible.
6. **Given** `leftIcon`/`rightIcon` content, **When** rendered, **Then** the icon sits before/after the label with the Figma-specified 4px gap and the accessible name is still the label text.

---

### User Story 2 - Input as a labelled, validated form field (Priority: P2)

A developer builds a form field: a labelled text input that shows placeholder
and entered text, an error state with a message announced to assistive
technology, and a disabled state.

**Why this priority**: Input is the second most common primitive and exercises
the error/a11y machinery (label association, `aria-invalid`,
`aria-describedby`) that the constitution makes non-negotiable.

**Independent Test**: Mount `Input` in isolation; type into it; toggle
`error`/`disabled`; assert visual state and ARIA wiring.

**Acceptance Scenarios**:

1. **Given** `<Input label="Email" />`, **When** rendered, **Then** a native `<input>` is associated with the visible label (clicking the label focuses the input; the input's accessible name is "Email").
2. **Given** a placeholder and no value, **When** rendered, **Then** placeholder text shows in the placeholder color from the matrix; typing shows entered text in the entered-text color.
3. **Given** `error="Required field"`, **When** rendered, **Then** the field border uses the error token, the message renders below the field in the error color, the input has `aria-invalid="true"`, and `aria-describedby` points at the message element.
4. **Given** a disabled Input, **When** rendered, **Then** the sunken fill/disabled border/disabled text tokens apply, and the input is not focusable or editable.
5. **Given** any of the three sizes, **When** rendered, **Then** height, padding, and typography match the size table exactly.
6. **Given** focus moves into the enabled input (by click or Tab), **Then** the focus border token applies and typing updates the value (controlled and uncontrolled usage both work as native `<input>` does).
7. **Given** `leftIcon`/`rightIcon`/`prefix`/`suffix` adornments, **When** rendered, **Then** they appear inside the field in the adornment colors from the matrix, are excluded from the accessible name and value, and the field's state styling is unchanged.
8. **Given** `clearable` and a non-empty value, **When** the clear affordance is activated, **Then** the value empties, change handling fires, `onClear` is called, and focus returns to the input; the affordance is absent when the field is empty or disabled.

---

### User Story 3 - Dialog as a controlled modal (Priority: P3)

A developer opens a modal dialog from a button, renders a title, body content,
and footer actions, and closes it via the Escape key, the header close button,
or their own footer button — all through a controlled `open`/`onClose` API on
top of the native `<dialog>` element.

**Why this priority**: Dialog composes the other two components and carries
the hardest interaction contract (focus trap/restore, inert background); it
lands last but proves the system works together.

**Independent Test**: Mount `Dialog` with a trigger in Cypress; open, interact,
close via each path; assert focus and inertness in Jest/RTL and Cypress.

**Acceptance Scenarios**:

1. **Given** `open={false}`, **When** rendered, **Then** nothing is visible and nothing is in the accessibility tree.
2. **Given** `open` flips to `true`, **When** the dialog appears, **Then** it renders in the top layer over a scrim (overlay token), the page behind is inert (not clickable, not reachable by Tab or assistive technology), and focus moves into the dialog.
3. **Given** an open dialog, **When** the user presses Escape or activates the header close button, **Then** `onClose` is called exactly once — the dialog does not close itself (closing happens when the owner sets `open={false}`).
4. **Given** the dialog closes, **Then** focus returns to the element focused before it opened.
5. **Given** `title`, body children, and `footer` actions, **When** rendered, **Then** the dialog's accessible name is the title, and the layout (padding, gaps, right-aligned footer) matches the matrix.
6. **Given** body content taller than the panel, **When** rendered, **Then** the body region scrolls while title and footer stay fixed (Figma "Scrollable" variant).
7. **Given** `dividers`, **When** rendered, **Then** hairline dividers separate header and footer from the body (Figma "With divider" variant).

---

### User Story 4 - Keyboard-only and screen-reader journey (Priority: P1)

A keyboard-only user (and a screen-reader user) completes a full flow: tabs to
a button, opens a dialog, tabs through the dialog's input and action buttons
without escaping it, submits with an invalid value, hears the error, fixes it,
and closes the dialog — landing back on the trigger.

**Why this priority**: Accessibility is constitution Principle II
(NON-NEGOTIABLE); this journey is the proof that the three components compose
accessibly, not just individually.

**Independent Test**: A Cypress component test drives the whole flow with
keyboard events only; Jest asserts each ARIA attribute and focus transition.

**Acceptance Scenarios**:

1. **Given** the flow above, **When** driven only with Tab/Shift+Tab/Enter/Space/Escape, **Then** every step completes without a pointer.
2. **Given** focus is on the last focusable element in an open dialog, **When** Tab is pressed, **Then** focus stays trapped within the dialog.
3. **Given** every interactive element in the flow, **When** focused via keyboard, **Then** a visible focus indicator driven by the focus-ring token appears.
4. **Given** the Input receives an error, **Then** a screen reader announces the field as invalid together with the error message text.

---

### User Story 5 - Light and dark mode (Priority: P2)

A consuming developer toggles the documented `dark` class on the document root
and every component renders correctly in both modes with zero component-level
changes.

**Why this priority**: The token system's mode contract was built in the
foundation feature; the components must prove it end-to-end.

**Independent Test**: Storybook's existing light/dark toolbar renders every
story in both modes; Cypress asserts mode-dependent computed colors flip for a
representative cell of each component.

**Acceptance Scenarios**:

1. **Given** any story, **When** the `dark` class is applied to the root, **Then** surfaces, text, and borders flip to their dark token values with no component prop changes.
2. **Given** dark mode, **Then** brand action colors (teal/danger scales) remain legible per the foundation's documented fallback (no `Dark/*` action styles exist in Figma).

---

### Edge Cases

- **Long button label**: the button grows to fit (Figma buttons hug content with a min-width guide); the label never wraps to a second line by default.
- **Long dialog content**: the body region scrolls (US3 scenario 6); the panel never exceeds the viewport.
- **Disabled + click attempts**: no `onClick`, no form submission, no focus styling changes.
- **Loading + repeated clicks**: activation is suppressed for the entire loading window; no double-submits.
- **Input error toggled with no `id` supplied**: the component generates stable ids so `aria-describedby`/label association never break.
- **Rapid open/close of Dialog** (open → close → open in quick succession): no orphaned scrim, no lost focus restore, no console errors.
- **Dialog unmounted while open**: no leaked inert state on the background page.
- **`className` collisions**: consumer classes merge after component classes; component rendering never *requires* a consumer class.
- **Ref forwarding**: refs reach the real `<button>`/`<input>`/`<dialog>` DOM nodes on all three components.
- **Controlled Dialog misuse**: if the owner never flips `open` to false after `onClose`, the dialog stays open (controlled contract holds; the component never closes itself, including on Escape — the native cancel is intercepted).
- **Clearable + disabled/empty**: the clear affordance never renders on a disabled or empty field; it is also keyboard-reachable and labelled when it does render.
- **Number stepping at bounds**: steppers respect native `min`/`max`/`step` semantics — stepping past a bound clamps exactly as the native control does.
- **Icon-only misuse**: `iconOnly` without an `aria-label` fails the accessible-name assertion (dev-time warning; tests enforce).

## Requirements *(mandatory)*

### Functional Requirements

**Button**

- **FR-001**: Button MUST render every cell of the Button matrix: 4 variants (`primary`, `outline`, `ghost`, `link`) × 2 tones (default, danger) × 3 sizes (`sm`, `md`, `lg`) × states (default, hover, focus, active, disabled, loading), with exact token mappings per the matrix.
- **FR-002**: Button MUST invoke `onClick` when activated by mouse, Enter, or Space, and MUST NOT invoke it when `disabled` or `loading`.
- **FR-003**: Button MUST expose the label as its accessible name in every configuration (including with icon slots) and default to `type="button"` so it never submits forms accidentally.
- **FR-004**: Button MUST render optional `leftIcon`/`rightIcon` content with the Figma 4px icon–label gap, hidden from the accessible name.
- **FR-005**: Button `loading` MUST communicate busy state to assistive technology and suppress interaction. Visual (clarified 2026-08-19): a spinner renders in the leading-icon slot — replacing `leftIcon` if present, or the icon itself when `iconOnly` — inheriting the label color token of the current variant/state; the label stays visible. The spinner is the single sanctioned non-Figma visual in this feature.
- **FR-006**: Button MUST support `iconOnly` (clarified 2026-08-19: in scope): the Figma circular icon-button sets — square 40/36/24 panels, `radius-full`, padding 11/10/5, icon slot 18/16/14 — per the icon-only matrix. Figma defines icon-only sets only for `primary`, `outline`, and `ghost` in the default tone; `link` and `danger` combinations are excluded from the contract (no Figma source, A-11). An icon-only button MUST carry a consumer-supplied accessible name (`aria-label`), asserted in every icon-only test and story.

**Input**

- **FR-007**: Input MUST render the five Figma states (default, hover, focus, disabled, error) across the three sizes with exact token mappings per the matrix, on a native `<input>`.
- **FR-008**: Input MUST associate a visible label with the control when `label` is provided (label click focuses the input; accessible name = label text), and MUST still work with external labelling (`aria-label`, `aria-labelledby`, external `<label htmlFor>`) when it is not.
- **FR-009**: Input error state MUST set `aria-invalid="true"`, render the message below the field (Figma: `Danger/600` text, 4px below the field), and reference it via `aria-describedby`. Error styling is never conveyed by color alone (message text is the non-color signal).
- **FR-010**: Disabled Input MUST use the disabled tokens (sunken fill, disabled border/text), be unfocusable and uneditable, and preserve any entered value's distinct disabled text color per the matrix.
- **FR-011**: Input MUST support both controlled and uncontrolled usage exactly as the native element does (full native prop passthrough).
- **FR-012**: Input MUST implement all Figma adornment sets (clarified 2026-08-19: all seven sets in scope), per the adornment matrix; the field's fill/border/text follow the Basic matrix unchanged in every combination:
  - **FR-012a** (`Left icon` / `Right icon`): optional `leftIcon`/`rightIcon` slots inside the field, adornment color per state, presentational — never part of the accessible name or value.
  - **FR-012b** (`Prefix` / `Suffix` / `Prefix & Suffix`): optional static `prefix`/`suffix` text inside the field, adornment color per state, size-matched type ramp; affixes are not part of the input's value.
  - **FR-012c** (`Number`): when the native `type="number"` is passed, browser spinners are replaced by the Figma stepper chevrons (14px up/down instances, adornment colors per the matrix) that step by the native `step` and respect `min`/`max`; keyboard arrow-stepping and typing remain native. Figma draws no stepper hover/pressed visuals (A-12).
  - **FR-012d** (clear, Figma `State 2`): `clearable` renders a 16px clear affordance whenever the field has a value and is enabled (visibility rule per A-9); activating it empties the value, fires the native change path plus `onClear`, and returns focus to the input. Clear colors (verified): rest Neutral/400 → `action-clear`†, hover Neutral/500 → `action-clear-hover`†, pressed Neutral/600 → `action-clear-active`†.

**Dialog**

- **FR-013**: Dialog MUST wrap the native `<dialog>` element, opened in the top layer via its modal mode, with a fully controlled API: visible iff `open`; every close intent (Escape, header close button) calls `onClose` and never self-closes.
- **FR-014**: Dialog MUST trap focus while open (Tab cycles inside), make the background page inert (unclickable, unreachable by keyboard and assistive technology), and restore focus to the previously focused element on close.
- **FR-015**: Dialog MUST render the Figma anatomy: scrim (overlay token) behind a raised panel (radius 4, Elevation/4 shadow, 24px padding) containing title row (title + close button), body, and right-aligned footer actions, per the matrix geometry.
- **FR-016**: Dialog MUST expose the title as its accessible name (`aria-labelledby` when `title` is given; consumers can pass `aria-label` otherwise) and use `role="dialog"` + `aria-modal` semantics native to `<dialog>`.
- **FR-017**: Dialog MUST support the three Figma sizes as panel widths (sm 400 / md 600 / lg 900, capped to the viewport), a scrollable body when content overflows, and an optional `dividers` presentation matching the "With divider" set.

**Cross-cutting**

- **FR-018**: All three components MUST consume only `fui`-prefixed semantic-token utilities — no hardcoded colors, spacing, radii, typography, or arbitrary values (constitution Principle I).
- **FR-019**: All three components MUST render correctly in light and dark mode via the token layer alone (the `dark` class contract from the foundation feature) with zero component-level mode logic beyond token consumption.
- **FR-020**: All three components MUST implement the Principle III API contract: props extend the native element, `ref` forwarded to it, typed `variant`/`size` unions with defaults, merge-safe optional `className`, no global state or required context.
- **FR-021**: All three components MUST ship their full co-located contract (implementation, Jest+RTL suite, Cypress component suite, stories for every matrix cell plus a Playground) and be exported — components and their prop types — only through `src/index.ts`.
- **FR-022**: Every interactive element MUST show a visible keyboard focus indicator driven by the focus-ring token (Figma defines no focus state; see Assumption A-1).

### Component API Surface *(for component features)*

**Button** — extends `ComponentPropsWithoutRef<'button'>`; ref forwarded to `<button>`.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `variant` | `'primary' \| 'outline' \| 'ghost' \| 'link'` | `'primary'` | Visual style; maps 1:1 to the Figma text-button sets |
| `danger` | `boolean` | `false` | Switches the variant to its Figma danger counterpart set |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Figma Small/Medium/Large (24/36/40px) |
| `loading` | `boolean` | `false` | Busy state: suppresses activation, announces busy |
| `leftIcon` | `ReactNode` | — | Leading icon slot (Figma Left Icon=True) |
| `rightIcon` | `ReactNode` | — | Trailing icon slot (Figma Right Icon=True) |
| `iconOnly` | `boolean` | `false` | Circular icon button (Figma icon-only sets): children are the icon; requires `aria-label`. Valid only with `primary`/`outline`/`ghost` in the default tone (A-11) |

Notes: `type` defaults to `"button"`. `disabled` is the native attribute.
`loading` renders the spinner in the leading-icon slot (FR-005).

**Input** — extends `ComponentPropsWithoutRef<'input'>` (native `size` attribute
excluded — the `size` union replaces it); ref forwarded to `<input>`.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Figma Small/Medium/Large (24/36/40px) |
| `label` | `ReactNode` | — | Visible label rendered above the field and associated via `htmlFor` |
| `error` | `string` | — | When set: error styling, message below the field, `aria-invalid` + `aria-describedby` wiring |
| `leftIcon` | `ReactNode` | — | Leading in-field icon (Figma `Left icon` set); presentational |
| `rightIcon` | `ReactNode` | — | Trailing in-field icon (Figma `Right icon` set); presentational |
| `prefix` | `ReactNode` | — | Static leading affix text inside the field (Figma `Prefix`) |
| `suffix` | `ReactNode` | — | Static trailing affix text inside the field (Figma `Suffix`) |
| `clearable` | `boolean` | `false` | Clear affordance while the field has a value (Figma `State 2`) |
| `onClear` | `() => void` | — | Called after the clear affordance empties the field |

Notes: `disabled`, `placeholder`, `value`/`defaultValue`, `onChange` are native
passthrough. Ids are auto-generated (and overridable via native `id`).
`type` is native passthrough; `type="number"` swaps browser spinners for the
Figma steppers (FR-012c).

**Dialog** — extends `ComponentPropsWithoutRef<'dialog'>` (native `onClose`
event prop is superseded by the controlled `onClose` below); ref forwarded to `<dialog>`.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `open` | `boolean` | — (required) | Controlled visibility |
| `onClose` | `() => void` | — (required) | Called on every close intent (Escape, close button); owner flips `open` |
| `title` | `ReactNode` | — | Title row content; becomes the accessible name |
| `footer` | `ReactNode` | — | Right-aligned action slot (Figma composes md Buttons, 8px gap) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Panel width 400/600/900 |
| `dividers` | `boolean` | `false` | Hairline dividers under header / above footer (Figma "With divider") |
| `showClose` | `boolean` | `true` | Header close button (present in every Figma Dialog set) |

Body content is `children`.

### Variants & States Matrix *(for component features)*

Cell notation: Figma paint-style name → semantic token. **†** = token introduced
by this feature (primitive mapping in Token Dependencies). Focus column: Figma
defines no focus visuals for any component set — every interactive element uses
the foundation focus-ring token via `:focus-visible` (Assumption A-1); Input is
the exception, where Figma's "Pressed & Focus" state defines the focused border.

#### Button — colors (from Figma sets `15:12968`, `15:13574`, `15:14180`, `15:14786`, `15:15392`, `15:16001`, `15:16610`, `15:17093`; 36 variants each)

| Variant | Property | Default | Hover | Active (Figma "Pressed") | Disabled |
| ------- | -------- | ------- | ----- | ------------------------ | -------- |
| primary | fill | Primary/600 → `action-primary` | Primary/500 → `action-primary-hover` | Primary/700 → `action-primary-active` | Primary/300 → `action-primary-disabled` |
| primary | label | White → `on-action`, weight Medium | same | same | same |
| primary danger | fill | Danger/600 → `action-danger` | Danger/500 → `action-danger-hover` | Danger/700 → `action-danger-active` | Danger/300 → `action-danger-disabled` |
| primary danger | label | White → `on-action`, weight Medium | same | same | same |
| outline | fill | White → `surface-raised` (A-2) | same | same | same |
| outline | border | Neutral/300 → `action-secondary-border` | Primary/500 → `action-secondary-border-hover` | Primary/700 → `action-secondary-border-active` | Neutral/200 → `action-secondary-border-disabled` |
| outline | label | Neutral/600 → `action-secondary-text`, weight Regular | Primary/500 → `action-secondary-text-hover` | Primary/700 → `action-secondary-text-active` | Neutral/400 → `action-secondary-text-disabled` |
| outline danger | fill | White → `surface-raised` (A-2) | same | same | same |
| outline danger | border | Danger/600 → `action-danger-outline`† | Danger/500 → `action-danger-outline-hover`† | Danger/700 → `action-danger-outline-active`† | Danger/400 → `action-danger-outline-disabled`† |
| outline danger | label | Danger/600 (same tokens as border, per state) | Danger/500 | Danger/700 | Danger/400 |
| ghost | fill | none (transparent) | Neutral/100 → `action-ghost-hover`† | Neutral/300 → `action-ghost-active`† | none |
| ghost | label | Neutral/600 → `action-secondary-text`, weight Regular | Neutral/600 (unchanged) | Neutral/600 (unchanged) | Neutral/400 → `action-secondary-text-disabled` |
| ghost danger | fill | none | Danger/100 → `action-ghost-danger-hover`† | Danger/300 → `action-ghost-danger-active`† | none |
| ghost danger | label | Danger/600 → `action-danger-outline`† | Danger/600 (unchanged) | Danger/700 → `action-danger-outline-active`† | Danger/400 → `action-danger-outline-disabled`† |
| link | label | Primary/600 → `action-primary`, weight Regular, no underline in any state | Primary/500 → `action-primary-hover` | Primary/700 → `action-primary-active` | Primary/400 → `action-link-disabled`† |
| link danger | label | Danger/600 → `action-danger` | Danger/500 → `action-danger-hover` | Danger/700 → `action-danger-active` | Danger/400 → `action-danger-outline-disabled`† |

Loading column (clarified, FR-005): default-state colors + spinner in the
leading-icon slot inheriting the label color token; activation suppressed.
Focus column: default-state colors + focus ring (A-1). Label weight: Medium for
filled primary/primary-danger; Regular for outline/ghost/link (verified per set).

#### Button — geometry & typography (identical across all 8 text-button sets)

| Size | Height | Padding (t/r/b/l) | Font (size/line-height) | Radius | Icon gap | Min width |
| ---- | ------ | ----------------- | ----------------------- | ------ | -------- | --------- |
| lg | 40 | 8/8/8/8 | 16/24 (Subtitle ramp) | 4 → `radius-control` | 4 | 106 |
| md | 36 | 7/8/7/8 | 14/22 (Body ramp) | 4 → `radius-control` | 4 | 98 |
| sm | 24 | 3/4/3/4 | 12/18 (Caption ramp) | 4 → `radius-control` | 4 | 62 |

Exception — `link` variant has no box: no padding, no radius, no min-width;
height equals the line-height (lg 24 / md 22 / sm 18).

#### Button — icon-only (`iconOnly`; Figma circular sets `15:20350`, `15:20577`, `15:20824`, 12 variants each; no danger or link counterparts exist in Figma)

| Variant | Property | Default | Hover | Active (Figma "Pressed") | Disabled |
| ------- | -------- | ------- | ----- | ------------------------ | -------- |
| primary | fill | Primary/600 → `action-primary` | Primary/500 → `action-primary-hover` | Primary/700 → `action-primary-active` | Primary/300 → `action-primary-disabled` |
| primary | icon | White → `on-action` | same | same | same |
| outline | fill | White → `surface-raised` (A-2) | Neutral/100 → `action-ghost-hover`† | Neutral/300 → `action-ghost-active`† | White → `surface-raised` |
| outline | border | Neutral/300 → `action-secondary-border` — stays neutral in hover/active, unlike the text outline set | same | same | Neutral/200 → `action-secondary-border-disabled` |
| outline | icon | Neutral/600 → `action-secondary-text` | same | same | Neutral/400 → `action-secondary-text-disabled` |
| ghost | fill | none (transparent) | Neutral/100 → `action-ghost-hover`† | Neutral/300 → `action-ghost-active`† | none |
| ghost | icon | Neutral/600 → `action-secondary-text` | same | same | Neutral/400 → `action-secondary-text-disabled` |

Icon-only geometry: square (width = height) 40/36/24 (lg/md/sm); radius →
`radius-full` (circular); padding 11/10/5; icon slot 18/16/14 (glyph
15/13.3/11.7). All icon-only colors and geometry above verified node-by-node
on 2026-08-19 (extraction record §1a).

#### Input — colors (from Figma set `Basic` `11:7949`, 39 variants; border/fill live on the inner "Base" rect, stroke 1px)

| State | Field fill | Border (1px) | Placeholder | Entered text | Message |
| ----- | ---------- | ------------ | ----------- | ------------ | ------- |
| Default | White → `surface-raised` | Neutral/300 → `border-default` | Neutral/400 → `text-placeholder` | Neutral/600 → `text-control`† | — |
| Hover | White → `surface-raised` | Primary/500 → `border-hover`† | Neutral/400 | Neutral/600 | — |
| Focus (Figma "Pressed & Focus") | White → `surface-raised` | Primary/600 → `focus-ring` | Neutral/400 | Neutral/600 | — |
| Disabled | Neutral/50 → `surface-sunken` | Neutral/200 → `border-disabled` | Neutral/300 → `text-placeholder-disabled`† | Neutral/400 → `text-disabled` | — |
| Error | White → `surface-raised` | Danger/600 → `feedback-error` | Neutral/400 | Neutral/600 | Danger/600 → `feedback-error` |

Error state combinations (error+hover, error+focus) are not drawn in Figma —
the error border persists and takes precedence (Assumption A-3).

#### Input — adornments (from Figma sets `Left icon` `11:8536`, `Right icon` `11:9189` ×39; `Number` `11:9747`, `Prefix` `11:10945`, `Suffix` `11:11523`, `Prefix & Suffix` `11:10328` ×30; field fill/border/text follow the Basic matrix unchanged)

| Adornment | Rest (default/hover/focus/error) | Disabled | Geometry |
| --------- | -------------------------------- | -------- | -------- |
| Left/right icon | Neutral/500 → `icon-muted`† (unchanged in error state) | Neutral/400 → `text-disabled` | 18px slot / 15px glyph (lg); inside field padding |
| Prefix/suffix text | Neutral/500 → `icon-muted`† | Neutral/400 → `text-disabled` | size-matched value ramp (16/24 lg, 14/22 md, 12/18 sm); field edge padding per size table |
| Number steppers | Neutral/500 → `icon-muted`†; no hover/pressed visuals drawn (A-12) | Neutral/400 → `text-disabled` | two 14px chevron instances, stacked at the trailing edge |
| Clear affordance | Neutral/400 → `action-clear`†; hover Neutral/500 → `action-clear-hover`†; pressed Neutral/600 → `action-clear-active`† | not rendered | 16px slot / 14.7px glyph, trailing |

#### Input — geometry & typography

| Size | Height | Horizontal padding | Font | Radius | Error message | Field↔message gap |
| ---- | ------ | ------------------ | ---- | ------ | ------------- | ------------------ |
| lg | 40 | 12 | 16/24 Regular | 4 → `radius-control` | 14/22 | 4 |
| md | 36 | 12 | 14/22 Regular | 4 → `radius-control` | 14/22 | 4 |
| sm | 24 | 8 | 12/18 Regular | 4 → `radius-control` | 12/18 | 4 |

#### Dialog — structure (from Figma sets `Basic` `13:11504`, `Warning` `13:11982`, `Scrollable` `13:12502`, `With divider` `13:12995`; each Size=Large/Medium/Small)

Dialog has no hover/active/disabled/error states in Figma — its states are
open/closed plus the structural presets below.

| Element | Spec (all sets, verified per node) |
| ------- | ---------------------------------- |
| Scrim | #000 @ 30% (`Light\|Dark/Background/Fill Color/Smoke/Default`) → `overlay`, full-viewport |
| Panel | fill White → `surface-raised`; **corner radius 4 on every set/size** → `radius-surface` (value correction, see Token Dependencies); shadow Elevation/4 → `shadow-elevation-4`; padding 24; gap content↔footer 32 |
| Panel width | sm 400 / md 600 / lg 900 |
| Title row | title + close button, gap 8; title Medium/Title 18/26 → `text-heading`†; title↔body gap 16 |
| Close button | 14×14 icon, Neutral/500 → `icon-muted`†; present in **all four** Figma sets |
| Body | Regular/Body 14/22, Neutral/600 → `text-control`† |
| Footer | md Buttons, 8px gap, right-aligned (Figma: Ghost + Primary; Warning set: Ghost + Outline-danger) |
| Scrollable preset | body region clips and scrolls; title and footer fixed |
| With-divider preset | full-bleed hairlines Neutral/200 → `border-strong`† under header and above footer; header 16/24 padding (divider at y58), body 24, footer 16/24 |
| Warning preset | composition, not API: leading Warning/600 → `feedback-warning` icon (16px) beside body text, gap 8; danger-outline confirm button |

### Accessibility Requirements *(for component features)*

- **A11Y-001** (Button): role `button` with accessible name = label text in all configurations; icon slots are presentational. Keyboard: Tab focuses, Enter/Space activate. `loading` sets busy semantics (`aria-busy`) and suppresses activation; `disabled` uses the native attribute.
- **A11Y-002** (Input): accessible name via associated `<label>` (or consumer-supplied labelling); `aria-invalid="true"` + `aria-describedby` → message element in error state; error never conveyed by color alone; disabled uses the native attribute.
- **A11Y-003** (Dialog): native `<dialog>` modal semantics (top layer, `aria-modal`); accessible name from `title` via `aria-labelledby`; focus moves into the dialog on open, is trapped while open, and is restored to the opener on close; background inert to pointer, keyboard, and assistive technology; Escape triggers `onClose` (never an uncontrolled self-close).
- **A11Y-004** (all): visible focus indicator on every interactive element via the `focus-ring` token under `:focus-visible` (A-1); all flows completable keyboard-only (US4).
- **A11Y-005** (all): accessibility behavior is asserted in Jest and Cypress (roles, names, ARIA attributes, focus transitions, keyboard flows) — never assumed.

### Token Dependencies

**Consumes (existing semantics)**: `action-primary[-hover/-active/-disabled]`,
`action-danger[-hover/-active/-disabled]`, `on-action`,
`action-secondary-border[-hover/-active/-disabled]`,
`action-secondary-text[-hover/-active/-disabled]`, `feedback-error`,
`feedback-warning`, `surface-raised`, `surface-sunken`, `overlay`,
`text-placeholder`, `text-disabled`, `border-default`, `border-disabled`,
`focus-ring`, `radius-control`, `radius-surface`, spacing grid, `font-sans`,
weight + type-ramp tokens, `shadow-elevation-4`.

**Introduces (†, primitive mapping; light values — no `Dark/*` counterparts
exist in Figma, dark values follow the foundation's documented derivation
pattern)**:

- `action-ghost-hover` → `neutral-100`; `action-ghost-active` → `neutral-300`
- `action-ghost-danger-hover` → `danger-100`; `action-ghost-danger-active` → `danger-300`
- `action-danger-outline` → `danger-600`; `-hover` → `danger-500`; `-active` → `danger-700`; `-disabled` → `danger-400`
- `action-link-disabled` → `primary-400` (link disabled differs from filled disabled `primary-300`)
- `border-hover` → `primary-500` (input hover border; same primitive as `action-secondary-border-hover` — final naming/reuse decided in plan)
- `border-strong` → `neutral-200` (dialog dividers; same primitive as `border-disabled` — final naming/reuse decided in plan)
- `text-control` → `neutral-600` (input value, dialog body)
- `text-heading` → `neutral-700` (dialog title)
- `text-placeholder-disabled` → `neutral-300`
- `icon-muted` → `neutral-500` (dialog close icon; input icon/affix/stepper adornments at rest — final naming in plan)
- `action-clear` → `neutral-400`; `action-clear-hover` → `neutral-500`; `action-clear-active` → `neutral-600` (input clear affordance)

**Corrections**: `radius-surface` is currently 8px in `tokens.css`, sourced
from the foundation extraction — re-verification against every Dialog panel
node shows corner radius **4** on all sets and sizes (the 8px reading came from
the demo artboard, not the panel). The token value must be corrected to 4px in
the token layer (zero component edits — exactly the rebrand path Principle I
guarantees). `--fui-radius-8` remains only if another consumer emerges.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Every cell of every matrix above is rendered by a story and asserted by at least one test; each component additionally ships a Playground story exposing every public prop as a control.
- **SC-002**: A keyboard-only user completes the full US4 journey (open dialog → fill invalid input → perceive error → fix → close) with zero pointer events, verified by an automated test.
- **SC-003**: All stories render in light AND dark mode with zero console errors or warnings.
- **SC-004**: Rebranding (e.g. changing the primary teal) requires edits only in `src/tokens/tokens.css`; a grep for hex/rgb/arbitrary-value literals in `src/components/` returns zero matches (`/token-audit` passes).
- **SC-005**: A screen reader (asserted via ARIA in tests) perceives: button busy state when loading, input invalid state + message text, dialog name + modal state.
- **SC-006**: `Button`, `Input`, `Dialog` and their prop types are importable from the package root and from nowhere else; the library build (ESM + d.ts + styles.css) succeeds with all three included.
- **SC-007**: Jest suite, Cypress component suite, lint, typecheck, and production build all pass locally; every component meets the constitution's Definition of Done.

## Assumptions

- **A-1 Focus visuals**: no Figma set defines a focus state (Button/Dialog) — all interactive elements use a visible ring driven by the existing `focus-ring` token (`primary-600`) under `:focus-visible`. Input is the one Figma-specified focus visual (border `primary-600`).
- **A-2 Outline/ghost surfaces in dark mode**: Figma paints outline-button fill as literal White with no `Dark/*` counterpart. It maps to `surface-raised` so dark mode renders it on the dark raised surface instead of glowing white (consistent with the foundation's dark-derivation pattern).
- **A-3 Error precedence**: Figma's Input `State` is a single axis, so error+hover and error+focus are undrawn. The error border (`feedback-error`) persists through hover and focus.
- **A-4 Dialog scrim click**: Figma specifies no scrim-click behavior; clicking the scrim does NOT call `onClose` (conservative default; Escape and buttons are the close paths).
- **A-5 Input label typography**: the Figma Input component contains no label element (label association is a code-level requirement from the brief). The label renders in the size-matched ramp, Regular weight, `text-heading`† color — the closest system style; revisit if a labelled-field spec appears in Figma.
- **A-6 Loading semantics**: regardless of Q3's visual outcome, `loading` keeps the button in the accessibility tree, sets busy state, and suppresses activation (not the native `disabled` attribute, so focus is not lost mid-flow).
- **A-7 Defaults**: `size` defaults to `md` — the only button size Figma itself composes (Dialog footers) — and `variant` to `primary`.
- **A-8 Dialog panel heights**: Figma frames fix panel heights per demo (202/400); real panels hug content up to a viewport-derived max, at which point the body scrolls (Scrollable set is the evidence scrolling is intended).
- **A-9 Clear visibility**: Figma draws the clear affordance only in `Typing=True` variants; the visibility rule "value present AND enabled" is the standard generalization (rest/hover/pressed colors are Figma-verified).
- **A-10 RTL**: out of scope for v1.
- **A-11 Icon-only coverage**: Figma defines circular icon-only sets only for `primary`, `outline`, and `ghost` in the default tone — no danger or link icon-only sets exist, so those combinations are outside the API contract (guarded at the type level where practical, asserted in tests).
- **A-12 Stepper feedback**: the Figma `Number` set draws no hover/pressed visuals for the stepper chevrons (no `State 2` axis); steppers keep their rest adornment color and change only when disabled — nothing is invented.
- **Dependency**: requires the foundation feature's token system, harnesses, and packaging (feature `001-foundation-tooling`, merged).
