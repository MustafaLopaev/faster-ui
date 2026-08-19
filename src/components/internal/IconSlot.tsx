import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Layout shared by every adornment box: centred, non-shrinking, inline. */
const SLOT_BASE = 'fui:inline-flex fui:shrink-0 fui:items-center fui:justify-center'

export interface IconSlotProps {
  /** The size ramp box (and, for Input, the adornment colour) for this slot. */
  className?: string
  children: ReactNode
}

/**
 * The presentational box an icon sits in.
 *
 * Always `aria-hidden`: an icon slot is decoration beside a labelled control,
 * so it must never contribute to the accessible name. Button and Input both
 * render it, which is why it lives here rather than in either of them.
 *
 * Internal — not part of the public API.
 */
export function IconSlot({ className, children }: IconSlotProps) {
  return (
    <span aria-hidden="true" className={cn(SLOT_BASE, className)}>
      {children}
    </span>
  )
}
