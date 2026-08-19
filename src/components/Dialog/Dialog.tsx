import { forwardRef, useEffect, useId, useRef } from 'react'
import type { ComponentPropsWithoutRef, ReactNode, SyntheticEvent } from 'react'
import { cn } from '../../lib/cn'

export type DialogSize = 'sm' | 'md' | 'lg'

// Native `open` and `onClose` are intercepted by the controlled API and never
// spread onto the element — a spread `open` attribute would render the dialog
// non-modal (R-2). The global `title` tooltip attribute (a string) is
// superseded by the title-row slot below.
export interface DialogProps
  extends Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'onClose' | 'title'> {
  /** Controlled visibility — the component never mutates it (FR-013). */
  open: boolean
  /** Called on every close intent (Escape, header close button); the owner flips `open`. */
  onClose: () => void
  /** Title row content; becomes the accessible name via aria-labelledby. */
  title?: ReactNode
  /** Right-aligned action slot (Figma composes md Buttons, 8px gap). */
  footer?: ReactNode
  /** Panel width: sm 400 / md 600 / lg 900, viewport-capped. */
  size?: DialogSize
  /** Hairline dividers under header / above footer (Figma "With divider"). */
  dividers?: boolean
  /** Header close button — present in every Figma Dialog set. */
  showClose?: boolean
}

const SIZE_WIDTH: Record<DialogSize, string> = {
  sm: 'fui:w-100',
  md: 'fui:w-150',
  lg: 'fui:w-225',
}

// `open:flex` keys the layout to [open] so the closed dialog keeps the UA's
// display:none; the ::backdrop scrim is the overlay token, no extra DOM (R-8).
const PANEL =
  'fui:box-border fui:open:flex fui:flex-col fui:bg-surface-raised fui:text-text-control fui:font-sans fui:rounded-surface fui:shadow-elevation-4 fui:border-0 fui:backdrop:bg-overlay'

const FOCUS_RING =
  'fui:focus-visible:outline-2 fui:focus-visible:outline-solid fui:focus-visible:outline-offset-2 fui:focus-visible:outline-focus-ring'

const closeGlyph = (
  <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(props, ref) {
  const {
    open,
    onClose,
    title,
    footer,
    size = 'md',
    dividers = false,
    showClose = true,
    className,
    children,
    ...rest
  } = props

  const innerRef = useRef<HTMLDialogElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  const setRefs = (node: HTMLDialogElement | null) => {
    innerRef.current = node
    if (typeof ref === 'function') ref(node)
    else if (ref) ref.current = node
  }

  // Controlled visibility: prop → element. Opener capture happens before
  // showModal() moves focus; restore is explicit and deterministic (R-8).
  useEffect(() => {
    const el = innerRef.current
    if (!el) return
    if (open && !el.open) {
      openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      el.showModal()
    } else if (!open && el.open) {
      el.close()
      openerRef.current?.focus()
      openerRef.current = null
    }
  }, [open])

  // Unmount-while-open must not strand focus (D4).
  useEffect(
    () => () => {
      openerRef.current?.focus()
      openerRef.current = null
    },
    [],
  )

  // Escape: the element never self-closes — cancel is intercepted and
  // translated into a close intent (FR-013).
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault()
    onClose()
  }

  // Re-sync guard: a platform-forced close while `open` is still true reports
  // exactly one close intent, keeping element and prop state converged (D3).
  const handleNativeClose = () => {
    if (open) onClose()
  }

  return (
    <dialog
      {...rest}
      ref={setRefs}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      aria-labelledby={title != null ? titleId : undefined}
      className={cn(PANEL, SIZE_WIDTH[size], dividers ? 'fui:p-0' : 'fui:p-6', className)}
    >
      {(title != null || showClose) && (
        <header
          className={cn(
            'fui:flex fui:shrink-0 fui:items-center fui:justify-between fui:gap-2',
            dividers ? 'fui:px-6 fui:py-4' : 'fui:mb-4',
          )}
        >
          {title != null ? (
            <h2 id={titleId} className="fui:m-0 fui:text-title fui:font-medium fui:text-text-heading">
              {title}
            </h2>
          ) : (
            <span aria-hidden="true" />
          )}
          {showClose && (
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className={cn(
                'fui:inline-flex fui:shrink-0 fui:items-center fui:justify-center fui:size-3.5 fui:p-0 fui:m-0 fui:bg-transparent fui:border-0 fui:cursor-pointer fui:text-icon-muted',
                FOCUS_RING,
              )}
            >
              {closeGlyph}
            </button>
          )}
        </header>
      )}
      {dividers && <div aria-hidden="true" data-divider className="fui:shrink-0 fui:border-0 fui:border-t fui:border-solid fui:border-border-strong" />}
      <section
        className={cn(
          'fui:flex-1 fui:min-h-0 fui:overflow-y-auto fui:text-body fui:font-regular fui:text-text-control',
          dividers && 'fui:px-6 fui:py-4',
        )}
      >
        {children}
      </section>
      {footer != null && dividers && (
        <div aria-hidden="true" data-divider className="fui:shrink-0 fui:border-0 fui:border-t fui:border-solid fui:border-border-strong" />
      )}
      {footer != null && (
        <footer
          className={cn(
            'fui:flex fui:shrink-0 fui:items-center fui:justify-end fui:gap-2',
            dividers ? 'fui:px-6 fui:py-4' : 'fui:mt-8',
          )}
        >
          {footer}
        </footer>
      )}
    </dialog>
  )
})

Dialog.displayName = 'Dialog'
