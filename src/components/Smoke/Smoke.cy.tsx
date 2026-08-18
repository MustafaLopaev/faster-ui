import { Smoke } from './Smoke'

// Resolved token values (see src/tokens/tokens.css + figma-extraction.md):
const ACTION_PRIMARY = 'rgb(21, 197, 206)' // --fui-primary-600 #15C5CE
const BORDER_LIGHT = 'rgb(225, 225, 225)' // --fui-neutral-300 #E1E1E1
const BORDER_DARK = 'rgba(255, 255, 255, 0.07)' // Dark/Stroke Color/Control Stroke

describe('<Smoke />', () => {
  afterEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.remove('dark'))
  })

  it('mounts with the compiled token chain live', () => {
    cy.mount(<Smoke>token probe</Smoke>)
    cy.contains('token probe').should(($el) => {
      const style = getComputedStyle($el![0])
      // Computed background equals the resolved semantic token — proves
      // primitives → semantics → @theme bridge → utility, in a real browser.
      expect(style.backgroundColor).to.eq(ACTION_PRIMARY)
      expect(style.borderTopColor).to.eq(BORDER_LIGHT)
    })
  })

  it('re-resolves mode-aware tokens when .dark is set on the document root (FR-013)', () => {
    cy.mount(<Smoke>dark probe</Smoke>)
    cy.contains('dark probe').should(($el) => {
      expect(getComputedStyle($el![0]).borderTopColor).to.eq(BORDER_LIGHT)
    })
    cy.document().then((doc) => doc.documentElement.classList.add('dark'))
    cy.contains('dark probe').should(($el) => {
      const style = getComputedStyle($el![0])
      expect(style.borderTopColor).to.eq(BORDER_DARK)
      // action-primary keeps its light value by design (FR-013 fallback —
      // no Dark/* action tokens exist in the Figma file).
      expect(style.backgroundColor).to.eq(ACTION_PRIMARY)
    })
  })
})
