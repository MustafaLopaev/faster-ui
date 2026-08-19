import { ICON_BASE } from './icon.types'

/** Increment affordance for `Input type="number"` (Figma stepper). */
export function ChevronUpIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" aria-hidden="true" className={ICON_BASE}>
      <path
        d="M3.75 8.63 7 5.37l3.25 3.26"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
