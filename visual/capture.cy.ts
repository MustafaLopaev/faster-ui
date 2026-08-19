/**
 * Visual capture (004 FR-024/FR-025) — Pass 1 of three.
 *
 * Walks `visual/matrix.ts` over the story ids in the built workbench and writes
 * one PNG per cell into `visual/current/`. The server is `vite preview` on
 * **localhost** — started by `cypress.config.ts`, and not `127.0.0.1`: vite
 * binds the hostname, and the literal loopback address returns nothing
 * (verified, 000 vs 200).
 *
 * ── THE ANTI-FLAKE PROTOCOL ─────────────────────────────────────────────────
 * These four are requirements of the design, not tuning. A visual check that
 * cries wolf is switched off within a month, and then the whole baseline set is
 * dead weight nobody trusts.
 *
 *   1. Animation is zeroed. The Button spinner (`fui:animate-spin`) is
 *      otherwise a GUARANTEED per-run difference — it is never twice in the
 *      same rotation.
 *   2. `document.fonts.ready` is awaited. Racing the webfont produces a
 *      fallback-font diff on every cell, and it races differently each run.
 *   3. The caret is suppressed. A focused Input otherwise blinks into roughly
 *      half the captures.
 *   4. One pinned runner platform — enforced in visual.yml, not here. Baselines
 *      are valid for `ubuntu-latest` only; font rasterisation alone makes a
 *      macOS capture differ from a Linux one on every cell.
 *
 * Cypress captures the VIEWPORT, not the full page (research R-1's known risk),
 * so the height is fixed and stated rather than discovered.
 */
import { buildMatrix, cellName, type Cell } from './matrix'

const VIEWPORT_HEIGHT = 900

/** Injected into the story iframe before capture. */
const FREEZE_CSS = `
  *, *::before, *::after, *::backdrop {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
    caret-color: transparent !important;
  }
  /* Scrollbars are drawn by the platform and differ between runners even on the
     same OS version; the content behind them is what is under test. */
  ::-webkit-scrollbar { display: none !important; }
  html { scrollbar-width: none !important; }
`

/**
 * Reduced motion and colour-scheme go through CDP — the same channel
 * `cypress-real-events` already uses for the pseudo-state matrix, so this adds
 * no new mechanism to the repository.
 */
function emulateMedia(reduced: boolean) {
  return Cypress.automation('remote:debugger:protocol', {
    command: 'Emulation.setEmulatedMedia',
    params: {
      features: [
        { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
      ],
    },
  })
}

/**
 * Park the pointer in the far corner before every capture.
 *
 * The CDP mouse position PERSISTS across visits — this repository already
 * documents the same quirk for its pseudo-state matrix, where a rest-state
 * colour assertion after a hover test fails unless the mouse is parked on
 * `[data-cy="park"]`. Here the symptom was subtler: whichever Button happened
 * to sit under the pointer rendered in its `:hover` colour, so a cell drifted
 * whenever the layout moved beneath a stationary mouse. Button cells drifted;
 * Input and Dialog cells did not. That asymmetry is what gave it away.
 */
function parkPointer(width: number, height: number) {
  return Cypress.automation('remote:debugger:protocol', {
    command: 'Input.dispatchMouseEvent',
    params: { type: 'mouseMoved', x: width - 1, y: height - 1, button: 'none', clickCount: 0 },
  })
}

function urlFor(cell: Cell): string {
  const globals = `theme:${cell.theme};palette:${cell.palette}`
  return `/iframe.html?id=${encodeURIComponent(cell.storyId)}&viewMode=story&globals=${encodeURIComponent(globals)}`
}

/**
 * Retry until the rendered tree stops changing between polls. Cheaper and more
 * honest than a fixed `cy.wait()`: a sleep long enough to be safe on the
 * slowest cell is wasted on all 238 others, and is still a guess.
 */
function waitForSettledLayout() {
  let previous = ''
  cy.document({ log: false }).should((doc) => {
    const root = doc.querySelector('#storybook-root')
    const signature = [
      root?.innerHTML.length ?? 0,
      Math.round(root?.getBoundingClientRect().height ?? 0),
      doc.body.scrollHeight,
      doc.body.scrollWidth,
    ].join(':')
    const settled = signature === previous
    previous = signature
    expect(settled, `layout settled (${signature})`).to.equal(true)
  })
}

describe('visual capture', () => {
  let cells: Cell[] = []

  before(() => {
    cy.readFile('storybook-static/index.json').then((index: { entries: Record<string, { type: string }> }) => {
      const storyIds = Object.entries(index.entries)
        .filter(([, entry]) => entry.type === 'story')
        .map(([id]) => id)
      const matrix = buildMatrix(storyIds)
      cells = matrix.cells
      // The layer breakdown is printed every run: a matrix that silently grew
      // or shrank is otherwise only visible as a baseline-weight surprise.
      cy.task(
        'visual:log',
        [
          `${storyIds.length} stories in the workbench → ${matrix.cells.length} cells`,
          ...matrix.layers.map((l) => `  ${String(l.count).padStart(4)}  ${l.name} — ${l.why}`),
        ].join('\n'),
      )
    })
  })

  it('captures every cell in the matrix', () => {
    cy.then(() => {
      expect(cells.length, 'the matrix is empty — is storybook-static built?').to.be.greaterThan(0)
    })

    cy.then(() => {
      for (const cell of cells) {
        cy.viewport(cell.viewport, VIEWPORT_HEIGHT)
        cy.wrap(emulateMedia(cell.motion === 'reduced'), { log: false })

        cy.visit(urlFor(cell))

        cy.document().then((doc) => {
          // Writing direction is an attribute on the root, exactly as a
          // consumer would set it.
          doc.documentElement.setAttribute('dir', cell.direction)
          // 200% text scaling. The type ramp is rem-based (`--fui-size-*`), so
          // the root font-size is the mechanism a user's browser actually uses
          // — and because the ramp is rem, the boxes scale with it while the
          // VIEWPORT does not. That mismatch is precisely where clipping shows.
          doc.documentElement.style.fontSize = cell.scale === 200 ? '200%' : ''

          const style = doc.createElement('style')
          style.dataset.visualFreeze = ''
          style.textContent = FREEZE_CSS
          doc.head.append(style)
        })

        // Measure 2: never screenshot a page that is still swapping fonts.
        // `fonts.ready` is the promise; `fonts.status` reads 'loaded' during the
        // window before a lazily-triggered face has even started loading, so it
        // is not a substitute.
        cy.document().then((doc) => cy.wrap(doc.fonts.ready, { timeout: 20_000, log: false }))

        // Storybook renders asynchronously, and `#storybook-root` EXISTS long
        // before the story is in it. Screenshotting on existence alone captures
        // a partly-rendered frame — which is stable often enough to look fine
        // and different often enough to make every baseline worthless.
        cy.get('#storybook-root', { timeout: 20_000 })
          .should(($el) => expect($el[0].childElementCount).to.be.greaterThan(0))

        waitForSettledLayout()

        // Scroll position is not part of a cell's identity, and a page taller
        // than the viewport can be left mid-scroll by the previous cell.
        cy.window({ log: false }).then((win) => win.scrollTo(0, 0))
        cy.wrap(parkPointer(cell.viewport, VIEWPORT_HEIGHT), { log: false })

        cy.screenshot(cellName(cell), { capture: 'viewport', overwrite: true })
      }
    })
  })

  after(() => {
    // Leave the browser as it was found: emulation overrides persist across
    // specs in the same run, and a stale `prefers-reduced-motion` would silently
    // poison whatever ran next.
    cy.wrap(emulateMedia(false), { log: false })
  })
})
