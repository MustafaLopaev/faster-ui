import { forwardRef, useId, useRef, useState } from 'react'
import type { ChangeEvent, ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type InputSize = 'sm' | 'md' | 'lg'

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

// The field wrapper carries every visual (Figma puts them on the Base rect,
// not the text); the <input> inside is visually bare (R-5).
const WRAPPER_BASE =
  'fui:box-border fui:flex fui:items-center fui:font-sans fui:border fui:border-solid fui:rounded-control'

const WRAPPER_SIZE: Record<InputSize, string> = {
  lg: 'fui:h-10 fui:px-3 fui:gap-1',
  md: 'fui:h-9 fui:px-3 fui:gap-1',
  sm: 'fui:h-6 fui:px-2 fui:gap-1',
}

// Mutually exclusive state branches: the error/disabled sets carry no hover or
// focus border classes at all, so precedence is structural, not cascade luck (A-3).
const WRAPPER_STATE = {
  default:
    'fui:bg-surface-raised fui:border-border-default fui:not-focus-within:hover:border-border-hover fui:focus-within:border-focus-ring',
  error: 'fui:bg-surface-raised fui:border-feedback-error',
  disabled: 'fui:bg-surface-sunken fui:border-border-disabled',
} as const

const TEXT_RAMP: Record<InputSize, string> = {
  lg: 'fui:text-subtitle',
  md: 'fui:text-body',
  sm: 'fui:text-caption',
}

// Error message: 14/22 at lg+md, 12/18 at sm (figma-extraction §2).
const MESSAGE_RAMP: Record<InputSize, string> = {
  lg: 'fui:text-body',
  md: 'fui:text-body',
  sm: 'fui:text-caption',
}

const ICON_SLOT: Record<InputSize, string> = {
  lg: 'fui:size-4.5',
  md: 'fui:size-4',
  sm: 'fui:size-3.5',
}

const SLOT = 'fui:inline-flex fui:shrink-0 fui:items-center fui:justify-center'

const INPUT_BASE =
  'fui:min-w-0 fui:w-full fui:flex-1 fui:bg-transparent fui:border-0 fui:outline-none fui:p-0 fui:m-0 fui:font-sans fui:font-regular fui:text-text-control fui:placeholder:text-text-placeholder fui:disabled:text-text-disabled fui:disabled:placeholder:text-text-placeholder-disabled'

// Behavioral appearance resets only — the single sanctioned arbitrary-property
// use (R-6): hide the native spin UI so the Figma steppers replace it.
const NUMBER_RESET =
  'fui:[appearance:textfield] fui:[&::-webkit-inner-spin-button]:appearance-none fui:[&::-webkit-outer-spin-button]:appearance-none'

const FOCUS_RING =
  'fui:focus-visible:outline-2 fui:focus-visible:outline-solid fui:focus-visible:outline-offset-2 fui:focus-visible:outline-focus-ring'

const STEPPER_BUTTON =
  'fui:flex fui:items-center fui:justify-center fui:size-3.5 fui:p-0 fui:m-0 fui:bg-transparent fui:border-0 fui:enabled:cursor-pointer'

const chevronUp = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="M3.75 8.63 7 5.37l3.25 3.26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const chevronDown = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="M3.75 5.37 7 8.63l3.25-3.26" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const clearGlyph = (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="fui:size-full">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8 15.33A7.33 7.33 0 1 0 8 .67a7.33 7.33 0 0 0 0 14.66ZM5.55 4.85a.5.5 0 0 0-.7.7L7.29 8l-2.44 2.45a.5.5 0 1 0 .7.7L8 8.71l2.45 2.44a.5.5 0 0 0 .7-.7L8.71 8l2.44-2.45a.5.5 0 1 0-.7-.7L8 7.29 5.55 4.85Z"
    />
  </svg>
)

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    size = 'md',
    label,
    error,
    leftIcon,
    rightIcon,
    prefix,
    suffix,
    clearable = false,
    onClear,
    id: idProp,
    className,
    disabled,
    readOnly,
    type,
    value,
    defaultValue,
    onChange,
    'aria-describedby': ariaDescribedBy,
    ...rest
  } = props

  const autoId = useId()
  const inputId = idProp ?? autoId
  const errorId = `${autoId}-error`
  const innerRef = useRef<HTMLInputElement | null>(null)

  const setRefs = (node: HTMLInputElement | null) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  // Clear-affordance visibility: controlled usage derives from props.value,
  // uncontrolled mirrors the DOM value through onChange (R-7).
  const isControlled = value !== undefined
  const [uncontrolledHasValue, setUncontrolledHasValue] = useState(
    () => defaultValue != null && defaultValue !== '',
  )
  const hasValue = isControlled ? value != null && value !== '' : uncontrolledHasValue
  const showClear = clearable && hasValue && !disabled && !readOnly

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setUncontrolledHasValue(event.target.value !== '')
    onChange?.(event)
  }

  // Native label behavior covers the label; this covers clicks on adornment
  // and padding areas of the presentational wrapper.
  const focusFromWrapper = (event: MouseEvent<HTMLDivElement>) => {
    if (disabled) return
    const target = event.target as Element
    if (target === innerRef.current || target.closest('button')) return
    innerRef.current?.focus()
  }

  // Native value-setter bypass so React's value tracker sees the mutation and
  // the synthetic onChange fires for controlled AND uncontrolled usage (R-7).
  const handleClear = () => {
    const el = innerRef.current
    if (!el) return
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
    setter?.call(el, '')
    el.dispatchEvent(new Event('input', { bubbles: true }))
    onClear?.()
    el.focus()
  }

  // Native stepUp/stepDown = native step/min/max clamping for free (R-6).
  const stepBy = (direction: 1 | -1) => {
    const el = innerRef.current
    if (!el || disabled || readOnly) return
    if (direction === 1) el.stepUp()
    else el.stepDown()
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.focus()
  }

  const state = disabled ? 'disabled' : error ? 'error' : 'default'
  const adornmentColor = disabled ? 'fui:text-text-disabled' : 'fui:text-icon-muted'
  const describedBy = [ariaDescribedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn('fui:flex fui:flex-col fui:font-sans', className)}>
      {label != null && (
        <label
          htmlFor={inputId}
          className={cn('fui:mb-1 fui:font-regular fui:text-text-heading', TEXT_RAMP[size])}
        >
          {label}
        </label>
      )}
      <div
        role="presentation"
        onClick={focusFromWrapper}
        className={cn(WRAPPER_BASE, WRAPPER_SIZE[size], WRAPPER_STATE[state])}
      >
        {leftIcon != null && (
          <span aria-hidden="true" className={cn(SLOT, ICON_SLOT[size], adornmentColor)}>
            {leftIcon}
          </span>
        )}
        {prefix != null && (
          <span aria-hidden="true" className={cn('fui:shrink-0 fui:font-regular', TEXT_RAMP[size], adornmentColor)}>
            {prefix}
          </span>
        )}
        <input
          {...rest}
          ref={setRefs}
          id={inputId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          disabled={disabled}
          readOnly={readOnly}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(INPUT_BASE, TEXT_RAMP[size], type === 'number' && NUMBER_RESET)}
        />
        {showClear && (
          <button
            type="button"
            aria-label="Clear"
            onClick={handleClear}
            className={cn(
              SLOT,
              'fui:size-4 fui:p-0 fui:m-0 fui:bg-transparent fui:border-0 fui:cursor-pointer fui:text-action-clear fui:hover:text-action-clear-hover fui:active:text-action-clear-active',
              FOCUS_RING,
            )}
          >
            {clearGlyph}
          </button>
        )}
        {suffix != null && (
          <span aria-hidden="true" className={cn('fui:shrink-0 fui:font-regular', TEXT_RAMP[size], adornmentColor)}>
            {suffix}
          </span>
        )}
        {rightIcon != null && (
          <span aria-hidden="true" className={cn(SLOT, ICON_SLOT[size], adornmentColor)}>
            {rightIcon}
          </span>
        )}
        {type === 'number' && (
          // tabIndex -1 + aria-hidden: keyboard users already have native
          // ArrowUp/ArrowDown; duplicate AT controls would be noise (R-6).
          <span aria-hidden="true" className="fui:flex fui:flex-col fui:shrink-0 fui:items-center fui:justify-center">
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(1)}
              data-stepper="up"
              className={cn(STEPPER_BUTTON, adornmentColor)}
            >
              {chevronUp}
            </button>
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(-1)}
              data-stepper="down"
              className={cn(STEPPER_BUTTON, adornmentColor)}
            >
              {chevronDown}
            </button>
          </span>
        )}
      </div>
      {error ? (
        <p
          id={errorId}
          className={cn('fui:m-0 fui:mt-1 fui:font-regular fui:text-feedback-error', MESSAGE_RAMP[size])}
        >
          {error}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
