# Contract: Button

Public API of `Button` (exported from `src/index.ts` with `ButtonProps`).
Spec: FR-001..FR-006, A11Y-001; matrices in [spec.md](../spec.md).

## Type signature

```ts
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps extends ComponentPropsWithoutRef<'button'> {
  size?: ButtonSize            // default 'md'
  loading?: boolean            // default false
}

interface TextButtonProps extends ButtonBaseProps {
  iconOnly?: false
  variant?: 'primary' | 'outline' | 'ghost' | 'link'  // default 'primary'
  danger?: boolean             // default false
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

interface IconOnlyButtonProps extends ButtonBaseProps {
  iconOnly: true
  variant?: 'primary' | 'outline' | 'ghost'           // default 'primary'
  danger?: never
  leftIcon?: never
  rightIcon?: never
  'aria-label': string         // required — the accessible name
}

export type ButtonProps = TextButtonProps | IconOnlyButtonProps
// component: forwardRef<HTMLButtonElement, ButtonProps>
```

## Behavioral guarantees (each one test-asserted)

| # | Guarantee | Source |
| - | --------- | ------ |
| B1 | Renders a native `<button>`; ref reaches it; unknown props pass through | FR-020 |
| B2 | `type` defaults to `"button"`; consumer `type="submit"` passes through | FR-003 |
| B3 | Accessible name = children text; icons/spinner `aria-hidden` | FR-003/004 |
| B4 | Click / Enter / Space each fire `onClick` exactly once | FR-002 |
| B5 | `disabled`: native attribute set, `onClick` never fires, disabled tokens render | FR-002 |
| B6 | `loading`: `aria-busy="true"`, `onClick` suppressed, form submission prevented, focus retained, spinner visible in leading slot with currentColor | FR-005, A-6 |
| B7 | Every variant×tone×size×state cell computes to its mapped token value (computed-style assertions in Cypress; hover/active via real events) | FR-001 |
| B8 | `iconOnly` without `aria-label` or with `danger`/`link` is a TS error; runtime dev-warning as backstop | FR-006, A-11 |
| B9 | `className` appends after component classes; rendering never requires it | FR-020 |
| B10 | Geometry: heights 40/36/24, min-widths 106/98/62 (none for `link`), icon gap 4, radius `radius-control` (`radius-full` when iconOnly) | matrices |
