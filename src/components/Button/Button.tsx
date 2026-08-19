import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, MouseEvent, ReactNode } from 'react'
import { cn } from '../../lib/cn'

// Dev-only warnings read NODE_ENV without pulling Node's types into the lib project.
declare const process: { env: { NODE_ENV?: string } }

export type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonBaseProps extends ComponentPropsWithoutRef<'button'> {
  /** Figma Small/Medium/Large (24/36/40px). */
  size?: ButtonSize
  /** Busy state: spinner in the leading slot, `aria-busy`, activation suppressed. */
  loading?: boolean
}

interface TextButtonProps extends ButtonBaseProps {
  iconOnly?: false
  /** Visual style; maps 1:1 to the Figma text-button sets. */
  variant?: 'primary' | 'outline' | 'ghost' | 'link'
  /** Switches the variant to its Figma danger counterpart set. */
  danger?: boolean
  /** Leading icon slot (Figma Left Icon=True); presentational. */
  leftIcon?: ReactNode
  /** Trailing icon slot (Figma Right Icon=True); presentational. */
  rightIcon?: ReactNode
}

interface IconOnlyButtonProps extends ButtonBaseProps {
  /** Circular icon button (Figma icon-only sets); children are the icon. */
  iconOnly: true
  // Figma defines icon-only sets only for these three variants in the
  // default tone (A-11) — danger/link/icon-slot combinations are unrepresentable.
  variant?: 'primary' | 'outline' | 'ghost'
  danger?: never
  leftIcon?: never
  rightIcon?: never
  /** Required: the accessible name — there is no visible label (A11Y-001). */
  'aria-label': string
}

export type ButtonProps = TextButtonProps | IconOnlyButtonProps

const BASE =
  'fui:box-border fui:inline-flex fui:items-center fui:justify-center fui:gap-1 fui:whitespace-nowrap fui:font-sans fui:enabled:cursor-pointer fui:focus-visible:outline-2 fui:focus-visible:outline-solid fui:focus-visible:outline-offset-2 fui:focus-visible:outline-focus-ring'

// Geometry per matrix: heights 40/36/24, pad 8/8 · 7/8 · 3/4, min-w 106/98/62.
const SIZE: Record<ButtonSize, string> = {
  lg: 'fui:h-10 fui:px-2 fui:py-2 fui:min-w-26.5 fui:text-subtitle fui:rounded-control',
  md: 'fui:h-9 fui:px-2 fui:py-1.75 fui:min-w-24.5 fui:text-body fui:rounded-control',
  sm: 'fui:h-6 fui:px-1 fui:py-0.75 fui:min-w-15.5 fui:text-caption fui:rounded-control',
}

// Link has no box: no padding/radius/min-width; height = the line-height.
const LINK_SIZE: Record<ButtonSize, string> = {
  lg: 'fui:text-subtitle',
  md: 'fui:text-body',
  sm: 'fui:text-caption',
}

// Icon-only: square 40/36/24, circular, pad 11/10/5.
const ICON_ONLY_SIZE: Record<ButtonSize, string> = {
  lg: 'fui:size-10 fui:p-2.75 fui:text-subtitle fui:rounded-full',
  md: 'fui:size-9 fui:p-2.5 fui:text-body fui:rounded-full',
  sm: 'fui:size-6 fui:p-1.25 fui:text-caption fui:rounded-full',
}

// Icon slot boxes 18/16/14 (shared by icon slots and the loading spinner).
const ICON_SLOT: Record<ButtonSize, string> = {
  lg: 'fui:size-4.5',
  md: 'fui:size-4',
  sm: 'fui:size-3.5',
}

const SLOT = 'fui:inline-flex fui:shrink-0 fui:items-center fui:justify-center'

type Tone = 'default' | 'danger'

const VARIANT: Record<'primary' | 'outline' | 'ghost' | 'link', Record<Tone, string>> = {
  primary: {
    default:
      'fui:font-medium fui:border-0 fui:bg-action-primary fui:text-on-action fui:enabled:hover:bg-action-primary-hover fui:enabled:active:bg-action-primary-active fui:disabled:bg-action-primary-disabled',
    danger:
      'fui:font-medium fui:border-0 fui:bg-action-danger fui:text-on-action fui:enabled:hover:bg-action-danger-hover fui:enabled:active:bg-action-danger-active fui:disabled:bg-action-danger-disabled',
  },
  outline: {
    default:
      'fui:font-regular fui:bg-surface-raised fui:border fui:border-solid fui:border-action-secondary-border fui:text-action-secondary-text fui:enabled:hover:border-action-secondary-border-hover fui:enabled:hover:text-action-secondary-text-hover fui:enabled:active:border-action-secondary-border-active fui:enabled:active:text-action-secondary-text-active fui:disabled:border-action-secondary-border-disabled fui:disabled:text-action-secondary-text-disabled',
    danger:
      'fui:font-regular fui:bg-surface-raised fui:border fui:border-solid fui:border-action-danger-outline fui:text-action-danger-outline fui:enabled:hover:border-action-danger-outline-hover fui:enabled:hover:text-action-danger-outline-hover fui:enabled:active:border-action-danger-outline-active fui:enabled:active:text-action-danger-outline-active fui:disabled:border-action-danger-outline-disabled fui:disabled:text-action-danger-outline-disabled',
  },
  ghost: {
    default:
      'fui:font-regular fui:border-0 fui:bg-transparent fui:text-action-secondary-text fui:enabled:hover:bg-action-ghost-hover fui:enabled:active:bg-action-ghost-active fui:disabled:text-action-secondary-text-disabled',
    danger:
      'fui:font-regular fui:border-0 fui:bg-transparent fui:text-action-danger-outline fui:enabled:hover:bg-action-ghost-danger-hover fui:enabled:active:bg-action-ghost-danger-active fui:enabled:active:text-action-danger-outline-active fui:disabled:text-action-danger-outline-disabled',
  },
  link: {
    default:
      'fui:font-regular fui:border-0 fui:bg-transparent fui:p-0 fui:no-underline fui:text-action-primary fui:enabled:hover:text-action-primary-hover fui:enabled:active:text-action-primary-active fui:disabled:text-action-link-disabled',
    danger:
      'fui:font-regular fui:border-0 fui:bg-transparent fui:p-0 fui:no-underline fui:text-action-danger fui:enabled:hover:text-action-danger-hover fui:enabled:active:text-action-danger-active fui:disabled:text-action-danger-outline-disabled',
  },
}

// Circular sets: outline tints its FILL on hover/active while the border
// stays neutral — deliberately different from the text outline set (§1a).
const ICON_ONLY_VARIANT: Record<'primary' | 'outline' | 'ghost', string> = {
  primary: VARIANT.primary.default,
  outline:
    'fui:font-regular fui:bg-surface-raised fui:border fui:border-solid fui:border-action-secondary-border fui:text-action-secondary-text fui:enabled:hover:bg-action-ghost-hover fui:enabled:active:bg-action-ghost-active fui:disabled:border-action-secondary-border-disabled fui:disabled:text-action-secondary-text-disabled',
  ghost: VARIANT.ghost.default,
}

function Spinner() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:animate-spin fui:size-full">
      <path d="M14 8a6 6 0 1 1-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(props, ref) {
  const {
    variant = 'primary',
    danger = false,
    size = 'md',
    loading = false,
    iconOnly = false,
    leftIcon,
    rightIcon,
    type = 'button',
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
    if (danger || variant === 'link' || leftIcon != null || rightIcon != null) {
      console.warn(
        'faster-ui: <Button iconOnly> supports only the primary/outline/ghost variants in the default tone, without icon slots — no Figma source exists for other combinations.',
      )
    }
  }

  const tone: Tone = danger ? 'danger' : 'default'
  const iconOnlyVariant = variant === 'outline' || variant === 'ghost' ? variant : 'primary'
  const classes = cn(
    BASE,
    iconOnly
      ? cn(ICON_ONLY_SIZE[size], ICON_ONLY_VARIANT[iconOnlyVariant])
      : variant === 'link'
        ? cn(LINK_SIZE[size], VARIANT.link[tone])
        : cn(SIZE[size], VARIANT[variant][tone]),
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
        <span aria-hidden="true" className={cn(SLOT, ICON_SLOT[size])}>
          {loading ? <Spinner /> : children}
        </span>
      ) : (
        <>
          {(loading || leftIcon != null) && (
            <span aria-hidden="true" className={cn(SLOT, ICON_SLOT[size])}>
              {loading ? <Spinner /> : leftIcon}
            </span>
          )}
          {children}
          {rightIcon != null && (
            <span aria-hidden="true" className={cn(SLOT, ICON_SLOT[size])}>
              {rightIcon}
            </span>
          )}
        </>
      )}
    </button>
  )
})
