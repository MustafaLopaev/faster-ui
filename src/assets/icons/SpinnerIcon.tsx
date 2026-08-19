import { cn } from '../../lib/cn'
import { ICON_BASE } from './icon.types'

/**
 * Busy indicator for the Button's loading state.
 *
 * `motion-reduce:animate-none` honours `prefers-reduced-motion` (WCAG 2.3.3):
 * the spinner still marks the busy slot, it just stops rotating.
 */
export function SpinnerIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn('fui:animate-spin fui:motion-reduce:animate-none', ICON_BASE)}
    >
      <path d="M14 8a6 6 0 1 1-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
