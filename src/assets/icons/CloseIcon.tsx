import { ICON_BASE } from './icon.types'

/** Dismiss glyph for the Dialog header close button. */
export function CloseIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={ICON_BASE}>
      <path d="m3 3 8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
