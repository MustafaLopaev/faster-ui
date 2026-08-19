export { Button } from './Button'

// Each of these names is BOTH a const object and the union type derived from
// it (declaration merging), so a single value-export carries both meanings:
// `ButtonVariant.primary` as a value, `ButtonVariant` as a type.
export { ButtonSize, ButtonVariant, ButtonTone, IconOnlyButtonVariant } from './Button.types'

export type { ButtonProps, TextButtonProps, IconOnlyButtonProps } from './Button.types'
