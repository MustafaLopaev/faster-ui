# Data Model: Core Components — Button, Input, Dialog

**Feature**: `002-core-components` | **Date**: 2026-08-19
For a component library the "entities" are the public prop models, the
internal state each component owns, and the token delta. Exact TypeScript
shapes live in [contracts/](contracts/); this file models behavior.

## 1. Button

**Props** (public): `variant`, `danger`, `size`, `loading`, `leftIcon`,
`rightIcon`, `iconOnly`, + native `<button>` passthrough.
Discriminated union (research R-4): `iconOnly: true` narrows `variant` to
`'primary' | 'outline' | 'ghost'`, forbids `danger`/icon slots, requires
`aria-label`.

**Internal state**: none (fully prop-driven).

**Derived values**:

| Derivation | Rule |
| ---------- | ---- |
| `interactive` | `!disabled && !loading` — gates the internal click handler |
| class set | `BASE + SIZE[size] + VARIANT[variant][tone]` where `tone = danger ? 'danger' : 'default'`; iconOnly swaps `SIZE` for `ICON_SIZE` map and `radius-control` for `radius-full` |
| leading slot | `loading ? <Spinner/> : leftIcon` (spinner size = icon slot: 18/16/14) |
| ARIA | `aria-busy={loading || undefined}`; `data-loading` for styling |

**Invariants**: activation handlers never fire while `!interactive`; the
accessible name equals the label text (or `aria-label` when `iconOnly`);
`type` defaults to `"button"`.

## 2. Input

**Props** (public): `size`, `label`, `error`, `leftIcon`, `rightIcon`,
`prefix`, `suffix`, `clearable`, `onClear`, + native `<input>` passthrough
(minus `size`/`prefix`, R-2).

**Internal state**:

| State | Type | Purpose |
| ----- | ---- | ------- |
| `hasValue` | boolean (uncontrolled only) | clear-affordance visibility; initialized from `defaultValue`, updated on `onChange`; controlled usage derives from `props.value` instead |

**Generated ids** (`useId`, consumer `id`/`aria-describedby` merged, consumer wins):
`inputId` (label `htmlFor`), `errorId` (`aria-describedby` target).

**Derived values**:

| Derivation | Rule |
| ---------- | ---- |
| field-state class branch | exactly one of: `disabled` → disabled set; `error` → error set (no hover/focus border classes — A-3 by construction); else → default set (with `hover:`/`focus-within:` borders) |
| `showClear` | `clearable && hasValue && !disabled && !readOnly` |
| steppers | rendered iff `type === 'number'`; disabled with the input |
| `aria-invalid` | `error != null` |
| `aria-describedby` | join(consumer value, `errorId` when error) |

**State transitions** (clear affordance): `visible --click--> value=''`
(native-setter + `input` event, R-7) `→ onChange fires → onClear fires →
focus returns to input → hasValue=false → hidden`.

**Invariants**: field visuals live on the wrapper, never the `<input>`;
adornments never enter the accessible name or the value; native
controlled/uncontrolled semantics untouched (FR-011).

## 3. Dialog

**Props** (public): `open`, `onClose` (required), `title`, `footer`, `size`,
`dividers`, `showClose`, + native `<dialog>` passthrough (minus
`open`/`onClose`, R-2). Body = `children`.

**Internal state / refs**:

| Ref | Purpose |
| --- | ------- |
| `dialogRef` | merged with the forwarded ref; drives `showModal()`/`close()` |
| `openerRef` | `document.activeElement` captured when `open` flips true; focus-restore target |

**Generated ids**: `titleId` → `aria-labelledby` (only when `title` given).

**Lifecycle state machine** (element state ↔ prop state):

```text
closed ──open=true──▶ showModal() ──▶ open (top layer, background inert,
   ▲                                   focus moves into dialog)
   │                                     │ Escape ──▶ cancel event:
   │                                     │   preventDefault + onClose()
   │                                     │ close button click ──▶ onClose()
   │                                     │ (dialog stays open — controlled)
   └──open=false──── close() + openerRef.focus() ◀───────────────┘
```

Re-sync guard: a platform-forced `close` event while `open` is still true
calls `onClose()` once (R-8), keeping element and prop state converged.

**Invariants**: the component never mutates its own visibility; `onClose`
fires exactly once per close intent; focus restore happens on close AND on
unmount-while-open; footer buttons are consumer-provided `Button`s (md).

## 4. Token delta (tokens.css §2 + §3 bridge)

New semantics — light value ⇒ dark value (derivation basis):

| Semantic token | Light | Dark | Basis |
| -------------- | ----- | ---- | ----- |
| `action-ghost-hover` | `neutral-100` | (same) | brand/action fallback, foundation FR-013 |
| `action-ghost-active` | `neutral-300` | (same) | 〃 |
| `action-ghost-danger-hover` | `danger-100` | (same) | 〃 |
| `action-ghost-danger-active` | `danger-300` | (same) | 〃 |
| `action-danger-outline` | `danger-600` | (same) | 〃 |
| `action-danger-outline-hover` | `danger-500` | (same) | 〃 |
| `action-danger-outline-active` | `danger-700` | (same) | 〃 |
| `action-danger-outline-disabled` | `danger-400` | (same) | 〃 |
| `action-link-disabled` | `primary-400` | (same) | 〃 |
| `action-clear` | `neutral-400` | (same) | mid-gray legible on ink; fallback |
| `action-clear-hover` | `neutral-500` | (same) | 〃 |
| `action-clear-active` | `neutral-600` | `white-a79` | dark needs lighter "pressed" ink |
| `border-hover` | `primary-500` | (same) | brand fallback |
| `border-strong` | `neutral-200` | `white-a7` | mirrors dark `border-default` (Figma-sourced dark stroke) |
| `text-control` | `neutral-600` | `white-a79` | Figma `Dark/Fill Color/Text/Secondary` |
| `text-heading` | `neutral-700` | `white-a90` | mirrors dark `text-color-primary` derivation |
| `text-placeholder-disabled` | `neutral-300` | `white-a30` | mirrors dark placeholder derivation |
| `icon-muted` | `neutral-500` | (same) | mid-gray legible on both surfaces |

Corrections: `--radius-surface` ⇒ `var(--fui-radius-4)`; delete primitive
`--fui-radius-8` (no remaining consumer). No new primitives. Every dark
choice re-checked visually in Storybook dark mode before sign-off (SC-003).
