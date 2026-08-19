import a11yCss from './a11y.css?raw'
import { Button } from '../components/Button'
import { Input } from '../components/Input'

/**
 * Real-browser proof of the two claims the token layer makes to consumers:
 *
 *  1. `a11y.css` re-themes the library by CSS custom property alone — no
 *     component change, no rebuild, and it composes with `.dark`.
 *  2. Overriding a `--fui-*` semantic from consumer CSS re-themes at runtime,
 *     which is the documented theming contract in README.md#theming.
 *
 * `tokens.test.ts` proves the *ratios* by parsing the stylesheet; this proves
 * the *mechanism* against computed styles the way the rest of the suite does.
 */
const OVERLAY_ID = 'fui-a11y-overlay-spec'

const applyCss = (css: string, id: string) =>
  cy.document().then((doc) => {
    const style = doc.createElement('style')
    style.id = id
    style.textContent = css
    doc.head.append(style)
  })

const removeCss = (id: string) =>
  cy.document().then((doc) => doc.getElementById(id)?.remove())

const PRIMARY_600 = 'rgb(21, 197, 206)' // Figma-faithful action-primary
const PRIMARY_AA = 'rgb(14, 130, 136)' // a11y.css --fui-primary-aa (#0e8288)
const PRIMARY_400 = 'rgb(125, 221, 225)' // a11y.css inverts filled actions on ink
const NEUTRAL_700 = 'rgb(31, 31, 31)' // …with a dark label

describe('token layer — a11y.css overlay', () => {
  afterEach(() => {
    removeCss(OVERLAY_ID)
    cy.document().then((doc) => doc.documentElement.classList.remove('dark'))
  })

  it('leaves the Figma palette in place until the overlay is loaded', () => {
    cy.mount(<Button data-cy="b">Send</Button>)
    cy.get('[data-cy=b]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor, 'default = Primary/600').to.eq(PRIMARY_600)
    })
  })

  it('repaints the primary Button through tokens alone once the overlay loads', () => {
    cy.mount(<Button data-cy="b">Send</Button>)
    applyCss(a11yCss, OVERLAY_ID)
    cy.get('[data-cy=b]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.backgroundColor, 'fill darkens to the AA teal').to.eq(PRIMARY_AA)
      expect(cs.color, 'label stays white on light surfaces').to.eq('rgb(255, 255, 255)')
    })
  })

  it('inverts filled actions to a light fill with a dark label on ink surfaces', () => {
    cy.document().then((doc) => doc.documentElement.classList.add('dark'))
    cy.mount(<Button data-cy="b">Send</Button>)
    applyCss(a11yCss, OVERLAY_ID)
    cy.get('[data-cy=b]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.backgroundColor, 'fill lightens on ink').to.eq(PRIMARY_400)
      expect(cs.color, 'label darkens to keep 4.5:1').to.eq(NEUTRAL_700)
    })
  })

  it('raises the Input boundary, which the Figma palette leaves at 1.30:1', () => {
    cy.mount(<Input label="Email" data-cy="i" />)
    cy.get('[data-cy=i]')
      .parent()
      .should(($el) => {
        expect(getComputedStyle($el[0]).borderTopColor, 'Neutral/300').to.eq('rgb(225, 225, 225)')
      })
    applyCss(a11yCss, OVERLAY_ID)
    cy.get('[data-cy=i]')
      .parent()
      .should(($el) => {
        expect(getComputedStyle($el[0]).borderTopColor, 'AA boundary').to.eq('rgb(146, 146, 146)')
      })
  })
})

describe('token layer — consumer theming contract', () => {
  const OVERRIDE_ID = 'fui-consumer-override-spec'
  afterEach(() => removeCss(OVERRIDE_ID))

  it('re-themes from a consumer CSS variable override, with no rebuild', () => {
    cy.mount(<Button data-cy="b">Send</Button>)
    // Exactly the snippet documented in README.md#theming.
    applyCss(':root { --fui-action-primary: #7c3aed; }', OVERRIDE_ID)
    cy.get('[data-cy=b]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor).to.eq('rgb(124, 58, 237)')
    })
  })

  it('re-themes a whole family by overriding one primitive', () => {
    cy.mount(<Button data-cy="b">Send</Button>)
    applyCss(':root { --fui-primary-600: #7c3aed; }', OVERRIDE_ID)
    cy.get('[data-cy=b]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor, 'semantic follows the primitive').to.eq(
        'rgb(124, 58, 237)',
      )
    })
  })
})
