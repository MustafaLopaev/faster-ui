# Research: Core Components — Button, Input, Dialog

**Feature**: `002-core-components` | **Date**: 2026-08-19
**Sources**: [spec.md](spec.md), [figma-extraction.md](figma-extraction.md),
foundation feature (`001-foundation-tooling`), repo state on branch
`001-foundation-tooling`.

Every unknown from the plan's Technical Context is resolved below. Format:
Decision / Rationale / Alternatives considered.

## R-1: Variant styling architecture (no class-variance library)

**Decision**: Plain TypeScript lookup maps per component — e.g.
`VARIANT_CLASSES[variant][danger ? 'danger' : 'default']` returning static
`fui:*` utility strings — composed with a tiny `cn(...parts)` join helper in
`src/lib/cn.ts` (filters falsy, joins with space; consumer `className` always
appended last).

**Rationale**: Principle VI caps runtime dependencies at zero-unless-justified;
Principle VII forbids speculative abstraction. Three components with fixed,
finite matrices don't need `cva`/`tailwind-merge`. Static class strings also
keep Tailwind's scanner happy (no dynamic class construction).

**Alternatives considered**: `class-variance-authority` (+1 runtime dep for
what a record type does); `tailwind-merge` (solves a conflict problem we don't
have — our utilities are `fui:`-prefixed and consumer overrides are additive).

## R-2: API typing pattern & native-prop collisions

**Decision**: Keep the repo's documented convention: `forwardRef` +
`ComponentPropsWithoutRef<element>` (as in CLAUDE.md and the Smoke precedent).
Collisions handled with `Omit`:

- **Input**: `Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'prefix'>` —
  native `size` (a number) is replaced by the `'sm' | 'md' | 'lg'` union;
  React's `HTMLAttributes` already declares `prefix` (the RDFa string
  attribute), which our `prefix?: ReactNode` slot supersedes.
- **Dialog**: `Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'onClose'>` —
  both are intercepted by the controlled API and never spread onto the
  element (a spread `open` attribute would render the dialog *non-modal*).
- **Button**: no collisions; `iconOnly` constraints via discriminated union
  (R-4).

**Rationale**: React 19 allows ref-as-prop, but the constitution's Principle
III examples, CLAUDE.md, and existing code all say `forwardRef` — settled
convention, zero migration value in churning it mid-library.

**Alternatives considered**: React 19 ref-as-prop (cleaner, but contradicts
the repo's written convention for no functional gain).

## R-3: Button loading implementation (Q3=A)

**Decision**: `loading` renders an inline `<svg>` spinner (circular arc,
`stroke="currentColor"`, `aria-hidden`) in the leading-icon slot — replacing
`leftIcon` when present — animated with the stock `fui:animate-spin` utility
(Tailwind's `--animate-*` theme defaults were not wiped by the foundation
`@theme` reset, which zeroed only `--color-*`/`--radius-*`). The button gets
`aria-busy="true"` and `data-loading`; activation is suppressed by an internal
click handler that returns early (and prevents default form submission)
instead of the native `disabled` attribute, so focus is not dropped mid-flow
(spec A-6). Spinner box follows the icon-slot size (18/16/14 for lg/md/sm).

**Rationale**: `currentColor` makes the spinner inherit the exact per-variant
label token with zero extra tokens — satisfying "spinner inherits the label
color token" for all 8 variant×tone combinations for free.

**Alternatives considered**: CSS-only spinner via border tricks (worse
legibility at 14px); disabling via `disabled` attribute (loses focus,
regresses keyboard/AT flow); new `spinner` token (unneeded — currentColor).

## R-4: `iconOnly` constraint enforcement (Q1=B)

**Decision**: Discriminated union on `ButtonProps`:

- `iconOnly?: false` branch — full surface (any variant, `danger`, icon slots).
- `iconOnly: true` branch — `variant?: 'primary' | 'outline' | 'ghost'`,
  `danger?: never`, `leftIcon`/`rightIcon`: `never`, `'aria-label': string`
  (required), children = the icon.

Plus a dev-only `console.warn` when an unsupported combination or missing
`aria-label` slips past `any`-typed call sites. Tests assert the warning and
the accessible name.

**Rationale**: Spec A-11 says these combinations have no Figma source and are
"guarded at the type level where practical"; a discriminated union makes the
illegal states unrepresentable for TS consumers while the runtime warning
covers JS consumers.

**Alternatives considered**: runtime-only warning (weak contract); separate
`IconButton` component (rejected in clarification Q1=B).

## R-5: Input anatomy — field wrapper carries the visuals

**Decision**: Render `label? → field wrapper (div) → [leftIcon | prefix |
<input> | suffix | rightIcon | steppers | clear] → error message (p)`. The
wrapper carries border/fill/radius/height/padding (Figma puts them on the
`Base` rect, not the text); the `<input>` inside is visually bare
(transparent, no outline, full flex). State styling on the wrapper:

- hover → `fui:hover:border-…` ; focus → `fui:focus-within:border-…`
- `error` and `disabled` are applied as **mutually exclusive class sets**
  computed in TS (error branch omits hover/focus border classes entirely) —
  no CSS-cascade precedence gambling; A-3 (error persists) falls out of the
  branch structure.

The wrapper is presentational; clicking it focuses the input (native label
behavior covers the label; an `onClick → input.focus()` covers adornment
areas).

**Rationale**: Adornments must sit *inside* the bordered box (Figma), which is
impossible styling the `<input>` alone; branch-computed classes make state
precedence explicit and testable.

**Alternatives considered**: styling the input directly + absolutely
positioned adornments (fragile padding math per adornment combination);
CSS-only precedence via ordering (implicit, breaks under refactor).

## R-6: Number steppers (FR-012c)

**Decision**: When `type="number"`, hide the native spin UI with
arbitrary-*property* utilities (`fui:[appearance:textfield]`,
`[&::-webkit-inner-spin-button]:appearance-none` equivalents) — behavioral
CSS, not a visual token value, so no Principle I violation — and render two
14px chevron buttons at the trailing edge. They are `tabIndex={-1}` and
`aria-hidden` (keyboard users already have native ArrowUp/ArrowDown; exposing
duplicate controls to AT adds noise — the pattern of mainstream libraries).
Stepping calls the native `stepUp()`/`stepDown()` (respecting
`step`/`min`/`max` for free) and then dispatches a native `input` event
through the value-setter bypass (see R-7) so controlled React `onChange`
fires. No stepper hover/pressed visuals (spec A-12).

**Rationale**: native stepping = native clamping semantics with zero
reimplementation; hidden-from-AT steppers keep A11Y-002 clean.

**Alternatives considered**: manual value math (reimplements
step/min/max/precision, guaranteed drift from native); focusable steppers
(pollutes tab order inside a form field).

## R-7: Clear affordance + programmatic value change in React (FR-012d)

**Decision**: The clear control is a real `<button type="button"
aria-label="Clear">` (16px slot). Clearing uses the **native value-setter
bypass**: `HTMLInputElement.prototype` value setter via
`Object.getOwnPropertyDescriptor(...).set.call(input, '')` followed by
`input.dispatchEvent(new Event('input', { bubbles: true }))` — this defeats
React's internal value tracker so the synthetic `onChange` fires for both
controlled and uncontrolled usage; then `onClear?.()` and `input.focus()`.
Visibility: controlled → `props.value !== '' && != null`; uncontrolled →
internal mirror state updated from the input's `onChange`/`defaultValue`.
Hidden when `disabled` or `readOnly`.

**Rationale**: the setter-bypass is the established mechanism for
programmatic input mutation under React's value tracking (same technique
`user-event` uses); anything else silently breaks controlled inputs.

**Alternatives considered**: calling consumer `onChange` with a synthetic
fake event (type-unsafe, skips uncontrolled case); requiring controlled usage
for `clearable` (violates FR-011 parity).

## R-8: Dialog on native `<dialog>` — controlled lifecycle

**Decision**:

- Visibility effect: `open && !el.open → el.showModal()`;
  `!open && el.open → el.close()`. `showModal()` gives top layer, `:modal`
  semantics, and spec-level inertness of the rest of the document (the
  focus-trap + inert-background requirement rides on the platform, per the
  settled architecture decision).
- Escape: `onCancel` handler calls `e.preventDefault()` then `onClose()` —
  the element never self-closes. (Known platform quirk: some engines let a
  second rapid Escape bypass `preventDefault`; the `close` event handler
  re-syncs by calling `onClose` if `open` is still true, so the controlled
  contract survives.)
- Focus restore: capture `document.activeElement` when `open` flips true;
  restore `.focus()` on close/unmount. Explicit rather than relying on
  engine-specific auto-restore — deterministic and assertable in jsdom.
- Scrim: style the native `::backdrop` with the overlay token via Tailwind's
  `backdrop:` variant (`fui:backdrop:bg-overlay`) — no extra DOM node.
- Close button: a dedicated minimal internal button (14px inline X SVG,
  `icon-muted` color, focus-ring) — NOT a `Button iconOnly` reuse, because
  Figma's dialog close (14px bare glyph, Neutral/500) matches no icon-only
  matrix cell.
- No body-scroll locking: not in Figma or spec; top layer already prevents
  interaction (documented as out of scope).

**Rationale**: everything the spec's FR-013/014 demand is native `<dialog>`
behavior; custom code is limited to the controlled-API translation layer,
focus restore, and the close button.

**Alternatives considered**: portal + manual focus trap + `inert` attribute
management (reimplements the platform, the exact thing the settled
architecture decision forbids); `react-remove-scroll` (new runtime dep, no
spec requirement).

## R-9: Accessible naming & id wiring

**Decision**: `useId` generates stable ids: Input (input id, error-message
id — merged into any consumer `aria-describedby`, consumer `id` wins if
provided) and Dialog (title id for `aria-labelledby` when `title` is
present). Error message element is a plain `<p>`; `aria-invalid` +
`aria-describedby` on the input are the announcement mechanism (no
`role="alert"` — un-specced live-region behavior).

**Rationale**: FR-008/FR-009/FR-016 verbatim; `useId` is SSR-safe.

## R-10: `<dialog>` in Jest (jsdom)

**Decision**: Rely on jsdom's `HTMLDialogElement` support
(`show`/`showModal`/`close` landed in jsdom 26; the repo runs
jest-environment-jsdom 30). First implementation task verifies it; if any
gap surfaces (e.g. `::backdrop`, top-layer focus specifics), add a minimal
shim in `jest.setup.ts` for the missing method only, and leave the real
behavioral proof to Cypress CT (real browser). Jest still owns: controlled
contract (`onClose` call counts, never-self-close), ARIA wiring, focus
restore.

**Rationale**: Test the contract where each harness is strong; never mock
what the environment provides.

## R-11: Testing pseudo-state matrix cells (hover/active)

**Decision**: Add **`cypress-real-events`** as a devDependency. Cypress CT
asserts hover/active cells by firing real CDP events and checking computed
colors (resolved token values), e.g. primary hover background resolves to
`rgb(71, 207, 214)` (`primary-500`) in light mode. Class-name assertions stay
banned (Principle IV). Jest covers prop-reachable states (disabled, loading,
error) via computed class-independent observables (attributes, a11y tree,
suppressed handlers).

**Rationale**: `:hover`/`:active` are unreachable by synthetic events;
`cypress-real-events` is dev-only (ships nothing — Principle VI untouched)
and the standard answer in Cypress CT.

**Alternatives considered**: `storybook-addon-pseudo-states` (visual-only,
asserts nothing); skipping hover assertions (leaves matrix cells untested,
violates SC-001's "asserted by at least one test").

## R-12: Token-layer delta (Principle I gate)

**Decision**: All spec-introduced semantics land in `tokens.css` §2 with
`@theme inline` bridge entries — final names as specced: `action-ghost-hover/
-active`, `action-ghost-danger-hover/-active`, `action-danger-outline[-hover/
-active/-disabled]`, `action-link-disabled`, `action-clear[-hover/-active]`,
`border-hover`, `border-strong`, `text-control`, `text-heading`,
`text-placeholder-disabled`, `icon-muted`. No new primitives needed (every
referenced scale step exists). Dark mode: `text-control`, `text-heading`,
`text-placeholder-disabled`, `icon-muted`, `border-strong`, `border-hover`
get `.dark` re-declarations derived per the foundation FR-013 pattern
(white-alpha/ink derivations, documented inline); action-* stay light values
(foundation fallback). **Correction**: `--radius-surface` → `var(--fui-radius-4)`
and the now-consumerless `--fui-radius-8` primitive is deleted.

**Rationale**: spec Token Dependencies verbatim; keeping `border-hover`
separate from `action-secondary-border-hover` (same primitive) preserves
purpose-naming — inputs and buttons must be rebrandable independently.

## R-13: Smoke retirement

**Decision**: Delete `src/components/Smoke/` (component + test + cy + story)
and its `src/index.ts` exports in the same change that lands Button — the
foundation marked it "removed when the first real component lands"; its
harness-proof role is inherited by the real suites.

**Rationale**: Public API must expose exactly Button/Input/Dialog (SC-006);
a leftover gate component is dead public API.

## R-14: Storybook organization for a 3-component matrix

**Decision**: Per component: one story per variant×tone (Button: 8, each
rendering its size×prop-state grid — default/disabled/loading rows), plus
IconOnly, WithIcons, and Playground; Input: one story per state
(default/disabled/error) plus Adornments (icons/affixes/number/clearable),
Sizes, and Playground; Dialog: one story per preset (Basic, Warning
composition, Scrollable, WithDividers) plus Sizes and Playground. Hover/
focus/active cells are exercised live on the canvas and *asserted* in
Cypress (R-11); `@storybook/addon-a11y` (already installed) runs on all
stories. Every story renders in the existing light/dark toolbar.

**Rationale**: Principle V ("one story per variant and per meaningful
state") at matrix scale without 100+ near-identical stories; reviewers see
each full grid at a glance.

## R-15: Warning dialog is a story, not API

**Decision**: The Figma `Warning` set ships as a documented composition story
(Warning/600 16px icon + body text + `danger` outline confirm button) — no
`tone`/`variant` prop on Dialog.

**Rationale**: The set differs from Basic only in slotted content; a prop
would duplicate what `children`/`footer` already express (Principle VII).
