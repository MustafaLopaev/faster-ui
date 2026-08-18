import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

export type SmokeProps = ComponentPropsWithoutRef<'div'>

// Temporary FR-011 gate component: proves the token chain, the API contract
// (native props, forwarded ref, merge-safe className), and all three harnesses.
// Removed when the first real component lands.
const BASE_CLASSES =
  'fui:inline-flex fui:items-center fui:gap-2 fui:bg-action-primary fui:text-on-action fui:font-sans fui:text-body fui:rounded-control fui:border fui:border-border-default fui:px-4 fui:py-2'

export const Smoke = forwardRef<HTMLDivElement, SmokeProps>(function Smoke(
  { className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={className ? `${BASE_CLASSES} ${className}` : BASE_CLASSES} {...props}>
      {children}
    </div>
  )
})
