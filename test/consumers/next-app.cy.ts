/**
 * The Next.js fixture's headless load (004 FR-009).
 *
 * This is the only check in the suite that exercises the RSC boundary,
 * streaming SSR, hydration and stylesheet order together, through a real
 * framework, in a real browser. `src/ssr.test.tsx` is the per-variant scalpel;
 * this is the coarse end-to-end complement — it says *a page* broke, and the
 * SSR suite says *which variant*.
 *
 * Zero console errors AND zero warnings. React reports some hydration
 * mismatches only as a console error and recovers from others silently, so a
 * pass here means the page genuinely hydrated clean.
 */
describe('a Next.js App Router consumer', () => {
  it('server-renders, hydrates and stays silent on the console', () => {
    const errors: unknown[][] = []
    const warnings: unknown[][] = []

    cy.visit('/', {
      onBeforeLoad(win) {
        // Wrapped before any application code runs, so nothing logged during
        // hydration can slip past.
        const origError = win.console.error.bind(win.console)
        const origWarn = win.console.warn.bind(win.console)
        win.console.error = (...args: unknown[]) => {
          errors.push(args)
          origError(...args)
        }
        win.console.warn = (...args: unknown[]) => {
          warnings.push(args)
          origWarn(...args)
        }
      },
    })

    // Server-rendered markup is present before hydration.
    cy.contains('h1', 'faster-ui consumer').should('exist')
    cy.contains('button', 'Open dialog').should('exist')
    cy.get('input').should('have.length.at.least', 3)

    // The stylesheet resolved. Asserted on a TOKEN, not on a rendered colour:
    // an unstyled `<button>` still has the UA's `buttonface` background, so
    // "the background is not transparent" passes with no stylesheet at all
    // (verified — the first version of this assertion did exactly that). A
    // `--fui-*` custom property exists only if the token layer loaded, and it
    // is palette-independent, so re-theming cannot invalidate it.
    cy.document().then((doc) => {
      const token = getComputedStyle(doc.documentElement)
        .getPropertyValue('--fui-surface-page')
        .trim()
      expect(token, '@mlopaev/faster-ui/styles.css did not reach the page').to.not.equal('')
    })

    // …and the token actually reaches a component: the utility layer compiled
    // and the class names on the shipped markup match the shipped stylesheet.
    // The expected family is READ FROM THE TOKEN rather than written here — a
    // fixture that hardcodes a font name goes stale the first time the design
    // source changes one, and fails for a reason that has nothing to do with
    // packaging.
    cy.document().then((doc) => {
      const firstFamily = (name: string) =>
        name.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '').toLowerCase() ?? ''
      const expected = firstFamily(
        getComputedStyle(doc.documentElement).getPropertyValue('--fui-family-sans'),
      )
      cy.contains('button', 'Open dialog').should(($el) => {
        const styles = getComputedStyle($el[0])
        expect(styles.backgroundColor, 'Button did not receive its action fill').to.not.equal(
          'rgba(0, 0, 0, 0)',
        )
        expect(
          firstFamily(styles.fontFamily),
          'Button did not receive the token font stack',
        ).to.equal(expected)
      })
    })

    // Interaction proves hydration actually completed — a page that server-
    // rendered but failed to hydrate looks identical until you click it.
    cy.contains('button', 'Open dialog').click()
    cy.get('dialog').should('be.visible').and('have.attr', 'open')
    cy.contains('dialog button', 'Close').click()
    cy.get('dialog').should('not.be.visible')

    cy.then(() => {
      expect(errors, `console.error during server render + hydration`).to.deep.equal([])
      expect(warnings, `console.warn during server render + hydration`).to.deep.equal([])
    })
  })
})
