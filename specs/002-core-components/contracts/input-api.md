# Contract: Input

Public API of `Input` (exported from `src/index.ts` with `InputProps`).
Spec: FR-007..FR-012, A11Y-002; matrices in [spec.md](../spec.md).

## Type signature

```ts
type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps
  extends Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'prefix'> {
  size?: InputSize             // default 'md' — replaces the native numeric attr
  label?: ReactNode            // rendered <label htmlFor={inputId}>
  error?: string               // presence = error state + message + ARIA wiring
  leftIcon?: ReactNode         // in-field leading icon (presentational)
  rightIcon?: ReactNode        // in-field trailing icon (presentational)
  prefix?: ReactNode           // static leading affix (replaces RDFa `prefix`)
  suffix?: ReactNode           // static trailing affix
  clearable?: boolean          // default false
  onClear?: () => void         // fires after the clear affordance empties the value
}
// component: forwardRef<HTMLInputElement, InputProps>  (ref → the real <input>)
```

## DOM shape (contract-relevant)

```text
<div>                       ← root (className merges here)
  <label htmlFor>?          ← when `label`
  <div role=presentation>   ← field wrapper: border/fill/radius/height (matrix)
    leftIcon? prefix? <input/> suffix? rightIcon? steppers? clearButton?
  </div>
  <p id={errorId}>?         ← when `error`
</div>
```

## Behavioral guarantees (each one test-asserted)

| # | Guarantee | Source |
| - | --------- | ------ |
| I1 | Native `<input>` inside; ref reaches it; native props (placeholder, value, onChange, type, …) pass through; controlled AND uncontrolled both work | FR-011, FR-020 |
| I2 | `label` click focuses the input; accessible name = label; external labelling works when `label` omitted | FR-008 |
| I3 | `error`: `aria-invalid="true"`; message rendered 4px below in `feedback-error`; `aria-describedby` points at it and merges consumer values | FR-009 |
| I4 | `disabled`: unfocusable/uneditable; sunken fill + disabled border; distinct disabled placeholder vs disabled value colors | FR-010 |
| I5 | State visuals (default/hover/focus/error/disabled) per Basic matrix on the wrapper; error border persists through hover/focus | FR-007, A-3 |
| I6 | Adornments render inside the field, excluded from name and value; colors: rest `icon-muted`, disabled `text-disabled`; field state styling unchanged by adornments | FR-012a/b |
| I7 | `type="number"`: native spin UI hidden; chevron steppers step via native `stepUp/stepDown` (respect `step`/`min`/`max`), fire `onChange`, are `tabIndex=-1` + `aria-hidden`; disabled with the input | FR-012c |
| I8 | `clearable`: affordance visible iff value present ∧ enabled ∧ not readOnly; activation empties value, fires `onChange` then `onClear`, refocuses input; it is a labelled, keyboard-operable `<button>` | FR-012d |
| I9 | Sizes: heights 40/36/24, pad-x 12/12/8, ramps 16/24 / 14/22 / 12/18, radius `radius-control` | geometry table |
| I10 | Generated ids are stable (`useId`); consumer `id` wins | FR-008/009 |
