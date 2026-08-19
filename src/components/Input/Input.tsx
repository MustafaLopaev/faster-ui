import { forwardRef, useId, useRef, useState } from 'react'
import type { ChangeEvent, MouseEvent } from 'react'
import { cn } from '../../lib/cn'
import { ChevronDownIcon, ChevronUpIcon, ClearIcon } from '../../assets/icons'
import { IconSlot, SLOT_BASE } from '../internal'
import {
  INPUT_ADORNMENT_COLOR,
  INPUT_AFFIX,
  INPUT_CLEAR_BUTTON,
  INPUT_FIELD_BASE,
  INPUT_FOCUS_RING,
  INPUT_ICON_SLOT,
  INPUT_LABEL,
  INPUT_MESSAGE,
  INPUT_MESSAGE_RAMP,
  INPUT_NUMBER_RESET,
  INPUT_ROOT,
  INPUT_STEPPER_BUTTON,
  INPUT_STEPPER_COLUMN,
  INPUT_TEXT_RAMP,
  INPUT_WRAPPER_BASE,
  INPUT_WRAPPER_SIZE,
  INPUT_WRAPPER_STATE,
} from './Input.styles'
import { INPUT_DEFAULTS, InputState, NUMBER_INPUT_TYPE, StepDirection } from './Input.types'
import type { InputProps, InputState as State, StepDirection as Direction } from './Input.types'

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(props, ref) {
  const {
    size = INPUT_DEFAULTS.size,
    label,
    error,
    leftIcon,
    rightIcon,
    prefix,
    suffix,
    clearable = INPUT_DEFAULTS.clearable,
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
  const stepBy = (direction: Direction) => {
    const el = innerRef.current
    if (!el || disabled || readOnly) return
    if (direction === StepDirection.up) el.stepUp()
    else el.stepDown()
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.focus()
  }

  const state: State = disabled
    ? InputState.disabled
    : error
      ? InputState.error
      : InputState.default
  const adornmentColor = disabled
    ? INPUT_ADORNMENT_COLOR.disabled
    : INPUT_ADORNMENT_COLOR.enabled
  const isNumber = type === NUMBER_INPUT_TYPE
  const describedBy = [ariaDescribedBy, error ? errorId : null].filter(Boolean).join(' ') || undefined

  return (
    <div className={cn(INPUT_ROOT, className)}>
      {label != null && (
        <label htmlFor={inputId} className={cn(INPUT_LABEL, INPUT_TEXT_RAMP[size])}>
          {label}
        </label>
      )}
      <div
        role="presentation"
        onClick={focusFromWrapper}
        className={cn(INPUT_WRAPPER_BASE, INPUT_WRAPPER_SIZE[size], INPUT_WRAPPER_STATE[state])}
      >
        {leftIcon != null && (
          <IconSlot className={cn(INPUT_ICON_SLOT[size], adornmentColor)}>{leftIcon}</IconSlot>
        )}
        {prefix != null && (
          <span aria-hidden="true" className={cn(INPUT_AFFIX, INPUT_TEXT_RAMP[size], adornmentColor)}>
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
          className={cn(INPUT_FIELD_BASE, INPUT_TEXT_RAMP[size], isNumber && INPUT_NUMBER_RESET)}
        />
        {showClear && (
          <button
            type="button"
            aria-label="Clear"
            onClick={handleClear}
            className={cn(SLOT_BASE, INPUT_CLEAR_BUTTON, INPUT_FOCUS_RING)}
          >
            <ClearIcon />
          </button>
        )}
        {suffix != null && (
          <span aria-hidden="true" className={cn(INPUT_AFFIX, INPUT_TEXT_RAMP[size], adornmentColor)}>
            {suffix}
          </span>
        )}
        {rightIcon != null && (
          <IconSlot className={cn(INPUT_ICON_SLOT[size], adornmentColor)}>{rightIcon}</IconSlot>
        )}
        {isNumber && (
          // tabIndex -1 + aria-hidden: keyboard users already have native
          // ArrowUp/ArrowDown; duplicate AT controls would be noise (R-6).
          <span aria-hidden="true" className={INPUT_STEPPER_COLUMN}>
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(StepDirection.up)}
              data-stepper="up"
              className={cn(INPUT_STEPPER_BUTTON, adornmentColor)}
            >
              <ChevronUpIcon />
            </button>
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => stepBy(StepDirection.down)}
              data-stepper="down"
              className={cn(INPUT_STEPPER_BUTTON, adornmentColor)}
            >
              <ChevronDownIcon />
            </button>
          </span>
        )}
      </div>
      {error ? (
        <p id={errorId} className={cn(INPUT_MESSAGE, INPUT_MESSAGE_RAMP[size])}>
          {error}
        </p>
      ) : null}
    </div>
  )
})

Input.displayName = 'Input'
