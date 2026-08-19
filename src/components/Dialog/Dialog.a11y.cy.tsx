/**
 * Dialog — axe sweep across open / closed, dividers, sizes and the footer slot,
 * in both modes and both palettes (004 FR-011).
 *
 * The closed case is scanned too, and deliberately: a closed `<dialog>` keeps
 * the UA's `display: none`, so its contents must be invisible to axe as well.
 * A dialog that leaks focusable content while closed is a real defect and this
 * is the cell that reports it.
 */
import { Button } from '../Button'
import { Dialog } from './Dialog'
import { CELLS, expectNoViolations } from '../../../cypress/support/a11y'

const SIZES = ['sm', 'md', 'lg'] as const

const Footer = (
  <>
    <Button variant="outline">Cancel</Button>
    <Button>Confirm</Button>
  </>
)

describe('Dialog — accessibility', () => {
  for (const { theme, palette } of CELLS) {
    describe(`${theme} / ${palette}`, () => {
      it('open, with a title and a close button', () => {
        expectNoViolations(
          <Dialog open onClose={() => {}} title="Delete this item?">
            This cannot be undone.
          </Dialog>,
          theme,
          palette,
        )
        // The accessible name comes from the title row via aria-labelledby.
        cy.get('dialog').should('have.attr', 'aria-labelledby')
        cy.get('button[aria-label="Close"]').should('exist')
      })

      it('closed', () => {
        expectNoViolations(
          <Dialog open={false} onClose={() => {}} title="Hidden">
            <Button>Should not be reachable</Button>
          </Dialog>,
          theme,
          palette,
        )
        cy.get('dialog').should('not.have.attr', 'open')
      })

      it('with dividers and a footer', () => {
        expectNoViolations(
          <Dialog open onClose={() => {}} title="Confirm" dividers footer={Footer}>
            Body content.
          </Dialog>,
          theme,
          palette,
        )
      })

      for (const size of SIZES) {
        it(`size ${size}`, () => {
          expectNoViolations(
            <Dialog open onClose={() => {}} size={size} title={`Size ${size}`} footer={Footer}>
              Body content.
            </Dialog>,
            theme,
            palette,
          )
        })
      }

      // No title and no close button: the panel has no accessible name from a
      // heading, so the consumer supplies one. If the component ever stopped
      // forwarding `aria-label`, this cell is where it would surface.
      it('untitled, named by aria-label', () => {
        expectNoViolations(
          <Dialog open onClose={() => {}} showClose={false} aria-label="Session expiring">
            Body content.
          </Dialog>,
          theme,
          palette,
        )
      })
    })
  }
})
