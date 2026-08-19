import { forwardRef } from 'react'
import type { MouseEvent } from 'react'
import { cn } from '../../lib/cn'
import { SpinnerIcon } from '../../assets/icons'
import { IconSlot } from '../internal'
import {
  BUTTON_BASE,
  BUTTON_ICON_ONLY_SIZE,
  BUTTON_ICON_ONLY_VARIANT,
  BUTTON_ICON_SLOT,
  BUTTON_LINK_SIZE,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from './Button.styles'
import { BUTTON_DEFAULTS, ButtonTone, ButtonVariant, IconOnlyButtonVariant } from './Button.types'
import type { ButtonProps, ButtonTone as Tone, IconOnlyButtonVariant as IconOnlyVariant } from './Button.types'

// Dev-only warnings read NODE_ENV without pulling Node's types into the lib project.
declare const process: { env: { NODE_ENV?: string } }

/** Icon-only sets exist for primary/outline/ghost; anything else falls back. */
const toIconOnlyVariant = (variant: ButtonVariant): IconOnlyVariant =>
  variant === ButtonVariant.outline || variant === ButtonVariant.ghost
    ? variant
    : IconOnlyButtonVariant.primary

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant = BUTTON_DEFAULTS.variant,
    danger = BUTTON_DEFAULTS.danger,
    size = BUTTON_DEFAULTS.size,
    loading = BUTTON_DEFAULTS.loading,
    iconOnly = BUTTON_DEFAULTS.iconOnly,
    leftIcon,
    rightIcon,
    type = BUTTON_DEFAULTS.type,
    className,
    children,
    onClick,
    ...rest
  } = props

  if (process.env.NODE_ENV !== 'production' && iconOnly) {
    if (!rest['aria-label']) {
      console.warn(
        'faster-ui: <Button iconOnly> requires an `aria-label` — it has no visible label to provide an accessible name.',
      )
    }
    if (danger || variant === ButtonVariant.link || leftIcon != null || rightIcon != null) {
      console.warn(
        'faster-ui: <Button iconOnly> supports only the primary/outline/ghost variants in the default tone, without icon slots — no Figma source exists for other combinations.',
      )
    }
  }

  const tone: Tone = danger ? ButtonTone.danger : ButtonTone.default
  const classes = cn(
    BUTTON_BASE,
    iconOnly
      ? cn(BUTTON_ICON_ONLY_SIZE[size], BUTTON_ICON_ONLY_VARIANT[toIconOnlyVariant(variant)])
      : variant === ButtonVariant.link
        ? cn(BUTTON_LINK_SIZE[size], BUTTON_VARIANT[ButtonVariant.link][tone])
        : cn(BUTTON_SIZE[size], BUTTON_VARIANT[variant][tone]),
    className,
  )

  // Activation guard: loading suppresses the consumer handler AND default
  // behavior (form submission) without the native `disabled` attribute, so
  // focus is never dropped mid-flow (A-6).
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      event.preventDefault()
      return
    }
    onClick?.(event)
  }

  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      data-loading={loading ? '' : undefined}
      onClick={handleClick}
    >
      {iconOnly ? (
        <IconSlot className={BUTTON_ICON_SLOT[size]}>
          {loading ? <SpinnerIcon /> : children}
        </IconSlot>
      ) : (
        <>
          {(loading || leftIcon != null) && (
            <IconSlot className={BUTTON_ICON_SLOT[size]}>
              {loading ? <SpinnerIcon /> : leftIcon}
            </IconSlot>
          )}
          {children}
          {rightIcon != null && (
            <IconSlot className={BUTTON_ICON_SLOT[size]}>{rightIcon}</IconSlot>
          )}
        </>
      )}
    </button>
  )
})

// Explicit: `forwardRef` leaves `displayName` undefined, which some test
// renderers and snapshot serialisers surface as `ForwardRef`.
Button.displayName = 'Button'
