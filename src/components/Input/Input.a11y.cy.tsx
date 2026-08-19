/**
 * Input — axe sweep across label / error / disabled / adornments / number /
 * clearable, in both modes and both palettes (004 FR-011).
 *
 * The error case is the one worth naming: `aria-invalid` plus `aria-describedby`
 * pointing at the message is what makes the failure reach a screen reader, and
 * a broken wiring shows up here as an axe violation rather than as a silent
 * regression nobody notices until a user reports it.
 */
import { Input } from './Input'
import { CELLS, expectNoViolations } from '../../../cypress/support/a11y'

const SearchIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const SIZES = ['sm', 'md', 'lg'] as const

function StateMatrix() {
  return (
    <div className="fui:flex fui:flex-col fui:gap-4">
      {SIZES.map((size) => (
        <div key={size} className="fui:flex fui:flex-wrap fui:items-start fui:gap-4">
          <Input size={size} label="Email" placeholder="you@example.com" />
          <Input size={size} label="Email" error="Enter a valid address" defaultValue="nope" />
          <Input size={size} label="Email" disabled placeholder="Unavailable" />
          <Input size={size} label="Email" readOnly defaultValue="locked@example.com" />
        </div>
      ))}
    </div>
  )
}

function AdornmentMatrix() {
  return (
    <div className="fui:flex fui:flex-col fui:gap-4">
      {SIZES.map((size) => (
        <div key={size} className="fui:flex fui:flex-wrap fui:items-start fui:gap-4">
          <Input size={size} label="Search" leftIcon={SearchIcon} placeholder="Search" />
          <Input size={size} label="Amount" prefix="$" suffix="USD" defaultValue="12.00" />
          <Input size={size} label="Site" rightIcon={SearchIcon} defaultValue="example.com" />
        </div>
      ))}
    </div>
  )
}

describe('Input — accessibility', () => {
  for (const { theme, palette } of CELLS) {
    describe(`${theme} / ${palette}`, () => {
      it('label, error, disabled and read-only states', () => {
        expectNoViolations(<StateMatrix />, theme, palette)
      })

      it('adornment slots', () => {
        expectNoViolations(<AdornmentMatrix />, theme, palette)
      })

      // The stepper buttons are aria-hidden with tabIndex -1 on purpose:
      // keyboard users already have native ArrowUp/ArrowDown, so exposing
      // duplicate controls would be noise. axe must agree that hiding them is
      // legitimate rather than a focusable-but-hidden defect.
      it('number type with its steppers', () => {
        expectNoViolations(
          <div className="fui:flex fui:flex-wrap fui:gap-4">
            {SIZES.map((size) => (
              <Input key={size} size={size} label="Quantity" type="number" defaultValue={3} min={0} max={10} />
            ))}
          </div>,
          theme,
          palette,
        )
      })

      it('clearable affordance while the field holds a value', () => {
        expectNoViolations(
          <div className="fui:flex fui:flex-wrap fui:gap-4">
            {SIZES.map((size) => (
              <Input key={size} size={size} label="Search" clearable defaultValue="query" />
            ))}
          </div>,
          theme,
          palette,
        )
        cy.get('button[aria-label="Clear"]').should('have.length', SIZES.length)
      })

      // An input with no visible label must still get its name from somewhere.
      it('an unlabelled field named by aria-label', () => {
        expectNoViolations(<Input aria-label="Filter results" placeholder="Filter" />, theme, palette)
      })
    })
  }
})
