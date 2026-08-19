/**
 * The visual matrix (004 FR-024, contract: contracts/visual-matrix.md).
 *
 * A LAYERED SET, NOT A CROSS-PRODUCT. This is the single most important thing
 * about this file, and the thing most likely to be "improved" back into a bug.
 *
 * The cross-product of every axis — 23 stories × 2 themes × 2 palettes ×
 * 3 viewports × 2 scaling levels × 2 writing directions × 2 motion settings —
 * is 4,416 cells at roughly 145 MB. In a repository that fails its own build
 * over 24 KB of JavaScript, that is disqualifying. It is also mostly redundant:
 * the palette overlay only re-points colour, so capturing it at three widths
 * says the same thing three times.
 *
 * So: one base grid, plus four sweeps that each vary ONE axis off it, plus the
 * adversarial layer. Each sweep is placed where its defect actually surfaces —
 * text scaling at the tightest width, because that is where clipping happens;
 * writing direction at a middle width, because directional defects are
 * width-independent.
 */

export type Theme = 'light' | 'dark'
export type Palette = 'figma' | 'aa'
export type Viewport = 360 | 768 | 1280
export type Scale = 100 | 200
export type Direction = 'ltr' | 'rtl'
export type Motion = 'default' | 'reduced'
export type Content = 'story' | 'adversarial'

export interface Cell {
  storyId: string
  theme: Theme
  palette: Palette
  viewport: Viewport
  scale: Scale
  direction: Direction
  motion: Motion
  content: Content
}

/**
 * A documentation page rendering the entire palette, measured at **1.4 MB per
 * capture** — a 42× outlier against a 33 KB component-story mean. Captured
 * across the base grid alone it would be roughly 40% of the whole baseline set,
 * for a page that changes whenever any token changes and tells a reviewer
 * nothing a component cell does not.
 *
 * Recorded here rather than merely omitted, so nobody "restores" it.
 */
export const EXCLUDED_STORY_IDS: ReadonlySet<string> = new Set([
  'foundations-design-tokens--all-tokens',
])

/** Adversarial stories form their own layer; they are not part of the base grid. */
export const ADVERSARIAL_PREFIX = 'visual-adversarial-content--'

/**
 * The reduced-motion sweep covers only what animates, and three cells reach
 * every context the one animation renders in: the spinner on a filled fill, on
 * an outlined fill, and inside a circular icon-only button. Every other Button
 * story shows the same spinner in one of those three contexts, so capturing
 * them would spend baseline weight re-photographing the same element.
 */
export const ANIMATING_STORY_IDS: readonly string[] = [
  'components-button--primary',
  'components-button--outline',
  'components-button--icon-only',
]

export const BASE_VIEWPORTS: readonly Viewport[] = [360, 768, 1280]
export const THEMES: readonly Theme[] = ['light', 'dark']

const base = (storyId: string): Cell => ({
  storyId,
  theme: 'light',
  palette: 'figma',
  viewport: 1280,
  scale: 100,
  direction: 'ltr',
  motion: 'default',
  content: 'story',
})

/**
 * Cell identity IS the filename — there is no sidecar index that can fall out
 * of sync with the images beside it (data-model §6).
 */
export function cellName(cell: Cell): string {
  return [
    cell.storyId,
    '__',
    [cell.theme, cell.palette, cell.viewport, cell.scale, cell.direction, cell.motion, cell.content].join(
      '-',
    ),
  ].join('')
}

export interface Matrix {
  cells: Cell[]
  layers: Array<{ name: string; count: number; why: string }>
}

/**
 * @param storyIds every story id in `storybook-static/index.json`
 */
export function buildMatrix(storyIds: readonly string[]): Matrix {
  const stories = storyIds
    .filter((id) => !EXCLUDED_STORY_IDS.has(id) && !id.startsWith(ADVERSARIAL_PREFIX))
    .toSorted()
  const adversarial = storyIds.filter((id) => id.startsWith(ADVERSARIAL_PREFIX)).toSorted()

  const cells: Cell[] = []
  const layers: Matrix['layers'] = []
  const layer = (name: string, why: string, produce: () => void) => {
    const before = cells.length
    produce()
    layers.push({ name, why, count: cells.length - before })
  }

  layer('base grid', 'every story, every mode, every width — the regression net', () => {
    for (const storyId of stories) {
      for (const theme of THEMES) {
        for (const viewport of BASE_VIEWPORTS) {
          cells.push({ ...base(storyId), theme, viewport })
        }
      }
    }
  })

  layer('palette sweep', 'the overlay only re-points colour, so width adds nothing', () => {
    for (const storyId of stories) {
      for (const theme of THEMES) {
        cells.push({ ...base(storyId), theme, palette: 'aa' })
      }
    }
  })

  layer('scaling sweep', 'clipping surfaces at the tightest width — that is the point', () => {
    for (const storyId of stories) {
      cells.push({ ...base(storyId), viewport: 360, scale: 200 })
    }
  })

  layer('direction sweep', 'directional layout defects are width-independent', () => {
    for (const storyId of stories) {
      cells.push({ ...base(storyId), viewport: 768, direction: 'rtl' })
    }
  })

  layer('motion sweep', 'only the spinner animates, in three rendering contexts', () => {
    for (const storyId of ANIMATING_STORY_IDS) {
      if (stories.includes(storyId)) cells.push({ ...base(storyId), motion: 'reduced' })
    }
  })

  layer(
    'adversarial layer',
    'frozen hostile content at the tightest width, where it actually breaks (FR-028)',
    () => {
      for (const storyId of adversarial) {
        cells.push({ ...base(storyId), viewport: 360, content: 'adversarial' })
      }
    },
  )

  return { cells, layers }
}
