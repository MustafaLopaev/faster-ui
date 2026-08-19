/**
 * Accessibility harness for the `*.a11y.cy.tsx` specs (004 FR-011).
 *
 * Mirrors how `.storybook/preview.tsx` switches the two token-layer axes, so a
 * cell here is the same cell a reviewer sees in the workbench:
 *
 *   theme    — the `dark` class on the document root, and nothing else
 *   palette  — `a11y.css` attached or detached, exactly as a consumer opts in
 *
 * ── The rule split, which is what makes this gate shippable at all ──────────
 *
 * `color-contrast` is DISABLED on the `figma` palette and ENABLED on `aa`.
 *
 * The default palette fails AA by design: `src/tokens/tokens.test.ts` pins 27
 * deviations (17 light, 10 dark), including the primary Button label at 2.11:1
 * against a 4.5:1 requirement. Enabling the rule there would report a violation
 * on nearly every component, permanently — the gate could never go green and
 * would be switched off inside a month.
 *
 * That property is not going unchecked: the token test owns it, and owns it
 * MORE strictly. Its matrix is two-sided — a pinned ratio may neither worsen
 * nor silently improve without the record being updated — which is a stronger
 * guarantee than a boolean axe pass. Duplicating it here would add a second,
 * weaker authority over the same property (research R-6).
 *
 * On the `aa` overlay the full rule set runs, contrast included. Reaching AA is
 * that stylesheet's entire promise, and this is where it is proven.
 *
 * Plain `.ts`, no JSX: the surface wrapper is built with `createElement` so this
 * module stays a support file rather than a spec.
 */
import 'cypress-axe'
import { createElement } from 'react'
import type { ReactNode } from 'react'
// axe's own result types rather than hand-rolled ones: `NodeResult['target']`
// is a frame-aware selector union, not `string[]`, and a local approximation of
// it silently diverges (the typecheck gate caught exactly that).
import type { CheckResult, NodeResult, Result } from 'axe-core'

export type Theme = 'light' | 'dark'
export type Palette = 'figma' | 'aa'

const OVERLAY_ID = 'fui-a11y-overlay'

/** Every cell a component spec sweeps: both modes × both palettes. */
export const CELLS: ReadonlyArray<{ theme: Theme; palette: Palette }> = [
  { theme: 'light', palette: 'figma' },
  { theme: 'light', palette: 'aa' },
  { theme: 'dark', palette: 'figma' },
  { theme: 'dark', palette: 'aa' },
]

/**
 * axe run options for a palette. Every rule not named here stays enabled on
 * both palettes — the split is exactly one rule wide, on purpose.
 */
export function axeOptionsFor(palette: Palette) {
  return palette === 'figma'
    ? { rules: { 'color-contrast': { enabled: false } } }
    : { rules: {} as Record<string, { enabled: boolean }> }
}

/**
 * Apply the token-layer axes to the app-under-test document.
 *
 * The overlay is read from disk rather than imported, so what is injected is
 * byte-for-byte the file a consumer imports — no bundler transform sits between
 * the assertion and the artifact. It is appended last and unlayered, which is
 * how it wins over the layered base tokens for a consumer too.
 */
export function applyTokenLayer(theme: Theme, palette: Palette) {
  cy.document().then((doc) => {
    doc.documentElement.classList.toggle('dark', theme === 'dark')
    const existing = doc.getElementById(OVERLAY_ID)
    if (palette === 'aa') {
      if (existing) return undefined
      return cy.readFile('src/tokens/a11y.css').then((css: string) => {
        const style = doc.createElement('style')
        style.id = OVERLAY_ID
        style.textContent = css
        doc.head.append(style)
      })
    }
    existing?.remove()
    return undefined
  })
}

/**
 * Mount under a page surface. Without it a component floats on the harness's
 * default white, and `color-contrast` would resolve its background against the
 * wrong colour in dark mode — the gate would pass for the wrong reason.
 */
export function mountOnSurface(ui: ReactNode, theme: Theme, palette: Palette) {
  // A viewport wide enough to hold a full matrix ON SCREEN. This is not
  // cosmetic: axe resolves an element's background with `elementsFromPoint`,
  // and for a node rendered outside the viewport that lookup fails and axe
  // falls back to assuming the page is white. In dark mode that produced a
  // dozen contrast "violations" measuring dark-mode ink against #ffffff —
  // pure false positives, and precisely the noise that gets a gate switched
  // off. Every spec keeps its matrix inside this box (see `fui:flex-wrap`).
  cy.viewport(1280, 1024)
  applyTokenLayer(theme, palette)
  cy.mount(
    createElement(
      'div',
      { className: 'fui:bg-surface-page fui:font-sans fui:p-6', 'data-a11y-surface': '' },
      ui,
    ),
  )
}

/**
 * Deviations this gate found and the project has recorded rather than fixed.
 *
 * FR-012 requires recorded exceptions be enumerated explicitly, that a new one
 * or a widening of an existing one fail the gate, and that a stale one be
 * reported. All three hold here:
 *
 *  - enumerated — one entry per (rule, foreground, background) triple, with the
 *    ratio measured at the time it was recorded;
 *  - cannot widen — a violation matching the triple but measuring BELOW the
 *    recorded ratio is not matched, and fails;
 *  - cannot go stale — the authoritative two-sided record is `AA_DEVIATIONS` in
 *    `src/tokens/tokens.test.ts`, whose `toBeLessThan` bound fails the moment
 *    the pair reaches AA, forcing the entry's deletion. That test owns
 *    contrast; this list only keeps the sweep honest about what it is ignoring.
 *
 * Matching on the measured COLOURS, not on a selector, is deliberate: any
 * palette change invalidates the record and turns the gate red, which is the
 * behaviour that keeps an exception from outliving its justification.
 */
interface RecordedDeviation {
  rule: string
  palette: Palette
  theme: Theme
  fg: string
  bg: string
  measured: number
  why: string
}

const RECORDED_DEVIATIONS: readonly RecordedDeviation[] = [
  {
    rule: 'color-contrast',
    palette: 'aa',
    theme: 'light',
    fg: '#8e8e8e',
    bg: '#ffffff',
    measured: 3.27,
    why: "Input prefix/suffix affixes render in --fui-icon-muted, an icon colour solved for 1.4.11's 3:1. As text, 1.4.3 wants 4.5:1. The overlay re-points tokens, not which token a component reaches for. Recorded in tokens.test.ts#AA_DEVIATIONS; fixing it changes component styling, which 004 is out of scope for.",
  },
  {
    rule: 'color-contrast',
    palette: 'aa',
    theme: 'dark',
    fg: '#888a8f',
    bg: '#262b33',
    measured: 4.11,
    why: 'Same pair as above, dark mode. See tokens.test.ts#AA_DEVIATIONS.',
  },
]

function recordedFor(theme: Theme, palette: Palette, ruleId: string, check: CheckResult) {
  const d = check.data as Record<string, unknown> | undefined | null
  if (!d || typeof d.contrastRatio !== 'number') return undefined
  return RECORDED_DEVIATIONS.find(
    (r) =>
      r.rule === ruleId &&
      r.theme === theme &&
      r.palette === palette &&
      String(d.fgColor).toLowerCase() === r.fg &&
      String(d.bgColor).toLowerCase() === r.bg &&
      // A widening fails: the ratio may improve, never worsen. The 0.01 slack
      // absorbs the browser's rounding of its own reported value.
      (d.contrastRatio as number) >= r.measured - 0.01,
  )
}

/**
 * Mount a cell and assert zero UNRECORDED violations. `[data-cy-root]` scopes
 * the scan to the mounted tree; axe still resolves inherited background colours
 * by walking ancestors, so scoping does not weaken the contrast check on `aa`.
 */
export function expectNoViolations(
  ui: ReactNode,
  theme: Theme,
  palette: Palette,
  context: string = '[data-cy-root]',
) {
  mountOnSurface(ui, theme, palette)
  cy.injectAxe()

  const unexpected: string[] = []
  // `skipFailures: true` hands the verdict to the assertion below, so a
  // recorded deviation can be tolerated by name instead of by lowering the bar
  // for every rule at once.
  cy.checkA11y(
    context,
    axeOptionsFor(palette),
    (violations: Result[]) => {
      for (const v of violations) {
        for (const node of v.nodes) {
          const recorded = (node.any ?? []).map((c) => recordedFor(theme, palette, v.id, c)).find(Boolean)
          const line = describeNode(theme, palette, v, node)
          cy.task('a11y:log', recorded ? `RECORDED DEVIATION — ${line}` : line, { log: false })
          if (!recorded) unexpected.push(line)
        }
      }
    },
    true,
  )

  cy.then(() => {
    expect(unexpected, `unrecorded axe violations in ${theme}/${palette}`).to.deep.equal([])
  })
}

/**
 * Report the measured numbers, not just the rule id. A contrast failure that
 * says only "1 violation" sends the reader to a browser; one that says
 * `3.27 where 4.5 is required, #8e8e8e on #ffffff` names the defect and can be
 * acted on straight from the CI log.
 */
function describeNode(theme: Theme, palette: Palette, v: Result, node: NodeResult): string {
  const measured = (node.any ?? [])
    .map((check) => describeCheck(check))
    .filter(Boolean)
    .join('; ')
  return (
    `[${theme}/${palette}] ${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n` +
    `      at ${selectorOf(node)}` +
    (measured ? `\n      ${measured}` : '') +
    (node.html ? `\n      ${node.html.slice(0, 160)}` : '')
  )
}

/** Flatten axe's frame-aware selector union into something a log can print. */
function selectorOf(node: NodeResult): string {
  return node.target.map((t) => (Array.isArray(t) ? t.join(' >> ') : String(t))).join(' ')
}

function describeCheck(check: CheckResult): string {
  const d = check.data
  if (d && typeof d === 'object' && 'contrastRatio' in d) {
    return `measured ${String(d.contrastRatio)}:1, needs ${String(d.expectedContrastRatio)} — fg ${String(
      d.fgColor,
    )} on bg ${String(d.bgColor)} (${String(d.fontSize)}, ${String(d.fontWeight)})`
  }
  return check.message ?? ''
}
