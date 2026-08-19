import type { ComponentPropsWithoutRef, ReactNode } from 'react'

/**
 * Const objects rather than `enum` — see `Button.types.ts` for the reasoning
 * (erasable-syntax-only builds, and `size="md"` must keep working for
 * consumers). Same pattern throughout the library.
 */

/** Figma Small/Medium/Large (24/36/40px). */
export const InputSize = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const
export type InputSize = (typeof InputSize)[keyof typeof InputSize]

/**
 * The field's visual state. Derived from props, never passed in: `disabled` is
 * the native attribute and `error` is a message, so there is nothing for a
 * consumer to set here. Mutually exclusive by construction — the error and
 * disabled style sets carry no hover or focus classes at all, which is what
 * makes precedence structural rather than cascade luck (A-3).
 */
export const InputState = {
  default: 'default',
  error: 'error',
  disabled: 'disabled',
} as const
export type InputState = (typeof InputState)[keyof typeof InputState]

/** Stepper direction for `type="number"`, mapped to native stepUp/stepDown. */
export const StepDirection = {
  up: 1,
  down: -1,
} as const
export type StepDirection = (typeof StepDirection)[keyof typeof StepDirection]

// Native `size` (a number) is replaced by the union; React already declares
// `prefix` (the RDFa string attribute), superseded by the affix slot (R-2).
export interface InputProps extends Omit<ComponentPropsWithoutRef<'input'>, 'size' | 'prefix'> {
  /** Figma Small/Medium/Large (24/36/40px). */
  size?: InputSize
  /** Visible label rendered above the field, associated via htmlFor. */
  label?: ReactNode
  /** Presence = error state: message below the field + aria-invalid/-describedby wiring. */
  error?: string
  /** Leading in-field icon (Figma `Left icon` set); presentational. */
  leftIcon?: ReactNode
  /** Trailing in-field icon (Figma `Right icon` set); presentational. */
  rightIcon?: ReactNode
  /** Static leading affix text inside the field (Figma `Prefix`). */
  prefix?: ReactNode
  /** Static trailing affix text inside the field (Figma `Suffix`). */
  suffix?: ReactNode
  /** Clear affordance while the field has a value (Figma `State 2`). */
  clearable?: boolean
  /** Called after the clear affordance empties the field. */
  onClear?: () => void
}

/** Prop defaults, applied when destructuring in `Input.tsx`. */
export const INPUT_DEFAULTS = {
  size: InputSize.md,
  clearable: false,
} as const

/** The `type` value that swaps the browser spinners for the Figma steppers. */
export const NUMBER_INPUT_TYPE = 'number'
