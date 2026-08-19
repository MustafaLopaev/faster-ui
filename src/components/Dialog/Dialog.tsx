import { forwardRef, useEffect, useId, useRef } from 'react'
import type { SyntheticEvent } from 'react'
import { cn } from '../../lib/cn'
import { CloseIcon } from '../../assets/icons'
import { SLOT_BASE } from '../internal'
import {
  DIALOG_BODY,
  DIALOG_BODY_SPACING,
  DIALOG_CLOSE_BUTTON,
  DIALOG_DIVIDER,
  DIALOG_FOCUS_RING,
  DIALOG_FOOTER,
  DIALOG_FOOTER_SPACING,
  DIALOG_HEADER,
  DIALOG_HEADER_SPACING,
  DIALOG_PANEL,
  DIALOG_PANEL_PADDING,
  DIALOG_SIZE_WIDTH,
  DIALOG_TITLE,
} from './Dialog.styles'
import { DIALOG_DEFAULTS } from './Dialog.types'
import type { DialogProps } from './Dialog.types'

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(props, ref) {
  const {
    open,
    onClose,
    title,
    footer,
    size = DIALOG_DEFAULTS.size,
    dividers = DIALOG_DEFAULTS.dividers,
    showClose = DIALOG_DEFAULTS.showClose,
    className,
    children,
    ...rest
  } = props

  const innerRef = useRef<HTMLDialogElement | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)
  const titleId = useId()

  // Which spacing column of the style maps this render uses.
  const spacing = dividers ? 'divided' : 'plain'

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
      className={cn(DIALOG_PANEL, DIALOG_SIZE_WIDTH[size], DIALOG_PANEL_PADDING[spacing], className)}
    >
      {(title != null || showClose) && (
        <header className={cn(DIALOG_HEADER, DIALOG_HEADER_SPACING[spacing])}>
          {title != null ? (
            <h2 id={titleId} className={DIALOG_TITLE}>
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
              className={cn(SLOT_BASE, DIALOG_CLOSE_BUTTON, DIALOG_FOCUS_RING)}
            >
              <CloseIcon />
            </button>
          )}
        </header>
      )}
      {dividers && <div aria-hidden="true" data-divider className={DIALOG_DIVIDER} />}
      <section className={cn(DIALOG_BODY, DIALOG_BODY_SPACING[spacing])}>{children}</section>
      {footer != null && dividers && (
        <div aria-hidden="true" data-divider className={DIALOG_DIVIDER} />
      )}
      {footer != null && (
        <footer className={cn(DIALOG_FOOTER, DIALOG_FOOTER_SPACING[spacing])}>{footer}</footer>
      )}
    </dialog>
  )
})

Dialog.displayName = 'Dialog'
