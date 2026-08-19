import type { ComponentPropsWithoutRef, ReactNode } from 'react'

/**
 * Const objects rather than `enum` — see `Button.types.ts` for the reasoning
 * (erasable-syntax-only builds, and `size="md"` must keep working for
 * consumers). Same pattern throughout the library.
 */

/** Panel width: sm 400 / md 600 / lg 900, viewport-capped. */
export const DialogSize = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
} as const
export type DialogSize = (typeof DialogSize)[keyof typeof DialogSize]

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

/** Prop defaults, applied when destructuring in `Dialog.tsx`. */
export const DIALOG_DEFAULTS = {
  size: DialogSize.md,
  dividers: false,
  showClose: true,
} as const
