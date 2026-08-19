/**
 * Token-layer contract tests.
 *
 * Two jobs no other suite can do:
 *
 *  1. DRIFT GUARD. The `@theme inline` bridge restates every semantic name by
 *     hand. Forgetting a line generates no utility at all — a silent failure
 *     with no error and no visual diff until someone notices the class does
 *     nothing. These tests assert the bijection in both directions, plus that
 *     no `var()` in the layer dangles and no dark/a11y block overrides a token
 *     that does not exist.
 *
 *  2. CONTRAST MATRIX. Constitution Principle II makes WCAG 2.1 AA
 *     non-negotiable, and the audit measured real failures in the Figma
 *     palette. The base layer's known deviations are pinned here (so they
 *     cannot get worse, and a fix shows up as a failing expectation to
 *     update), and the opt-in `a11y.css` layer is asserted to actually reach
 *     AA for every pair a component renders — in both modes.
 *
 * Everything is computed from the CSS itself, so the numbers cannot drift out
 * of sync with the tokens the way a comment would.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const TOKENS = join(__dirname)
const read = (p: string) => readFileSync(join(TOKENS, p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const PRIMITIVE_FILES = [
  'primitives/color.css',
  'primitives/typography.css',
  'primitives/geometry.css',
  'primitives/elevation.css',
]

/** Pull `--name: value` pairs out of the first block matching `selector`. */
function block(css: string, selector: string): Record<string, string> {
  const re = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`, 'g')
  const out: Record<string, string> = {}
  for (const m of css.matchAll(re)) {
    for (const d of m[1].split(';')) {
      const i = d.indexOf(':')
      if (i === -1) continue
      const name = d.slice(0, i).trim()
      if (name.startsWith('--')) out[name] = d.slice(i + 1).trim()
    }
  }
  return out
}

const primitives: Record<string, string> = Object.assign(
  {},
  ...PRIMITIVE_FILES.map((f) => block(read(f), ':root')),
)
const semanticLight = block(read('semantic/light.css'), ':root')
const semanticDark = block(read('semantic/dark.css'), '.dark')
const a11yLight = block(read('a11y.css'), ':root')
const a11yDark = block(read('a11y.css'), '.dark')
const bridge = block(read('bridge.css'), '@theme inline')

/** Resolve a value's `var()` chain against a variable map. */
function resolve(value: string, vars: Record<string, string>, depth = 0): string {
  if (depth > 20) throw new Error(`circular var() chain: ${value}`)
  const next = value.replace(/var\((--[a-z0-9-]+)\)/gi, (_, name) => {
    const v = vars[name]
    if (v === undefined) throw new Error(`unresolved variable ${name}`)
    return v
  })
  return next === value ? value : resolve(next, vars, depth + 1)
}

// ── colour maths ────────────────────────────────────────────────────────────
type RGBA = [number, number, number, number]

function parseColor(input: string): RGBA {
  const s = input.trim()
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(s)
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].replace(/./g, (c) => c + c) : hex[1]
    return [
      parseInt(h.slice(0, 2), 16) / 255,
      parseInt(h.slice(2, 4), 16) / 255,
      parseInt(h.slice(4, 6), 16) / 255,
      1,
    ]
  }
  const fn = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)$/i.exec(s)
  if (fn) {
    return [+fn[1] / 255, +fn[2] / 255, +fn[3] / 255, fn[4] === undefined ? 1 : +fn[4]]
  }
  throw new Error(`cannot parse colour: ${input}`)
}

/** Composite a possibly-translucent colour over an opaque background. */
function over(fg: RGBA, bg: RGBA): RGBA {
  return [
    fg[0] * fg[3] + bg[0] * (1 - fg[3]),
    fg[1] * fg[3] + bg[1] * (1 - fg[3]),
    fg[2] * fg[3] + bg[2] * (1 - fg[3]),
    1,
  ]
}

function luminance([r, g, b]: RGBA): number {
  const f = (v: number) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(fg: RGBA, bg: RGBA): number {
  const a = luminance(over(fg, bg))
  const b = luminance(bg)
  const [hi, lo] = a > b ? [a, b] : [b, a]
  return (hi + 0.05) / (lo + 0.05)
}

/** Build the resolved variable map for one (mode, layer) combination. */
function palette(mode: 'light' | 'dark', a11y: boolean): Record<string, RGBA> {
  const vars: Record<string, string> = {
    ...primitives,
    ...semanticLight,
    ...(mode === 'dark' ? semanticDark : {}),
    ...(a11y ? a11yLight : {}),
    ...(a11y && mode === 'dark' ? a11yDark : {}),
  }
  const out: Record<string, RGBA> = {}
  for (const [name, raw] of Object.entries(vars)) {
    let value: string
    try {
      value = resolve(raw, vars)
    } catch {
      continue
    }
    try {
      out[name] = parseColor(value)
    } catch {
      /* not a colour (a length, a shadow, a font stack) — skip */
    }
  }
  return out
}

const ratio = (mode: 'light' | 'dark', a11y: boolean, fg: string, bg: string) => {
  const p = palette(mode, a11y)
  const f = p[fg]
  const b = p[bg]
  if (!f) throw new Error(`no colour token ${fg}`)
  if (!b) throw new Error(`no colour token ${bg}`)
  return contrast(f, over(b, [1, 1, 1, 1]))
}

// ═══════════════════════════════════════════════════════════════════════════
describe('token layer — structural integrity', () => {
  it('bridges every semantic token (a missing bridge line generates no utility)', () => {
    const bridged = new Set(
      Object.values(bridge).flatMap((v) => [...v.matchAll(/var\((--fui-[a-z0-9-]+)\)/g)].map((m) => m[1])),
    )
    const unbridged = Object.keys(semanticLight).filter((t) => !bridged.has(t))
    expect(unbridged).toEqual([])
  })

  it('resolves every bridge reference to a declared token', () => {
    const declared = new Set([...Object.keys(primitives), ...Object.keys(semanticLight)])
    const dangling = Object.values(bridge)
      .flatMap((v) => [...v.matchAll(/var\((--fui-[a-z0-9-]+)\)/g)].map((m) => m[1]))
      .filter((t) => !declared.has(t))
    expect(dangling).toEqual([])
  })

  it('resolves every var() in the whole layer with no dangling or circular refs', () => {
    const all = { ...primitives, ...semanticLight, ...semanticDark, ...a11yLight, ...a11yDark }
    const broken = Object.entries(all).filter(([, raw]) => {
      try {
        resolve(raw, all)
        return false
      } catch {
        return true
      }
    })
    expect(broken.map(([name]) => name)).toEqual([])
  })

  it('never overrides a token that does not exist in the light base', () => {
    const base = new Set(Object.keys(semanticLight))
    const a11yPrimitives = new Set(Object.keys(a11yLight).filter((t) => /-aa(-|$)/.test(t)))
    for (const [label, blk] of [
      ['semantic/dark.css', semanticDark],
      ['a11y.css :root', a11yLight],
      ['a11y.css .dark', a11yDark],
    ] as const) {
      const orphans = Object.keys(blk).filter((t) => !base.has(t) && !a11yPrimitives.has(t))
      expect({ [label]: orphans }).toEqual({ [label]: [] })
    }
  })

  it('never lets a bridge key collide with a token name', () => {
    // `prefix(fui)` emits every `@theme` key as `--fui-<key>`. If a primitive
    // or semantic already owns that exact name, the bridge emits a
    // self-referential `--fui-x: var(--fui-x)` — which resolves today only
    // because unlayered `:root` outranks `@layer theme`. This asserts the
    // namespaces stay disjoint instead of relying on that.
    const declared = new Set([...Object.keys(primitives), ...Object.keys(semanticLight)])
    const collisions = Object.keys(bridge)
      .map((key) => `--fui-${key.replace(/^--/, '')}`)
      .filter((emitted) => declared.has(emitted))
    expect(collisions).toEqual([])
  })

  it('declares no raw colour literal in any semantic or dark block', () => {
    for (const [label, blk] of [
      ['semantic/light.css', semanticLight],
      ['semantic/dark.css', semanticDark],
    ] as const) {
      const literals = Object.entries(blk)
        .filter(([, v]) => !v.startsWith('var('))
        .map(([k]) => k)
      expect({ [label]: literals }).toEqual({ [label]: [] })
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════
/**
 * Every pair a shipped component actually renders. `min` is the WCAG floor:
 * 4.5 for text (1.4.3), 3 for boundaries, focus rings and meaningful icons
 * (1.4.11 / 2.4.11). Disabled states are omitted — both SCs exempt inactive
 * components.
 */
const PAIRS: ReadonlyArray<{ what: string; fg: string; bg: string; min: number }> = [
  // Button — filled
  { what: 'Button primary label', fg: '--fui-on-action', bg: '--fui-action-primary', min: 4.5 },
  { what: 'Button primary hover label', fg: '--fui-on-action', bg: '--fui-action-primary-hover', min: 4.5 },
  { what: 'Button primary active label', fg: '--fui-on-action', bg: '--fui-action-primary-active', min: 4.5 },
  { what: 'Button danger label', fg: '--fui-on-action', bg: '--fui-action-danger', min: 4.5 },
  { what: 'Button danger hover label', fg: '--fui-on-action', bg: '--fui-action-danger-hover', min: 4.5 },
  { what: 'Button danger active label', fg: '--fui-on-action', bg: '--fui-action-danger-active', min: 4.5 },
  // Button — outline / ghost / link
  { what: 'Button outline label', fg: '--fui-action-secondary-text', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Button outline hover label', fg: '--fui-action-secondary-text-hover', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Button outline active label', fg: '--fui-action-secondary-text-active', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Button outline border', fg: '--fui-action-secondary-border', bg: '--fui-surface-raised', min: 3 },
  { what: 'Button ghost label', fg: '--fui-action-secondary-text', bg: '--fui-surface-page', min: 4.5 },
  { what: 'Button link label', fg: '--fui-action-primary', bg: '--fui-surface-page', min: 4.5 },
  { what: 'Button danger outline label', fg: '--fui-action-danger-outline', bg: '--fui-surface-raised', min: 4.5 },
  // Input
  { what: 'Input value ink', fg: '--fui-text-control', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Input label ink', fg: '--fui-text-heading', bg: '--fui-surface-page', min: 4.5 },
  { what: 'Input placeholder ink', fg: '--fui-text-color-placeholder', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Input border', fg: '--fui-border-default', bg: '--fui-surface-raised', min: 3 },
  { what: 'Input error message', fg: '--fui-feedback-error', bg: '--fui-surface-page', min: 4.5 },
  { what: 'Input error border', fg: '--fui-feedback-error', bg: '--fui-surface-raised', min: 3 },
  { what: 'Input adornment icon', fg: '--fui-icon-muted', bg: '--fui-surface-raised', min: 3 },
  // The SAME token, rendered as TEXT. Input's `prefix`/`suffix` affixes ("$",
  // "USD") take the adornment colour, and 1.4.3 asks 4.5:1 of text where 1.4.11
  // asks 3:1 of a graphic. Split into its own pair because one number cannot
  // carry two requirements — and because the pair above passing is exactly what
  // let this one go unnoticed. Found by the 004 axe gate (FR-011).
  { what: 'Input affix text', fg: '--fui-icon-muted', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Input clear affordance', fg: '--fui-action-clear', bg: '--fui-surface-raised', min: 3 },
  // Dialog
  { what: 'Dialog title ink', fg: '--fui-text-heading', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Dialog body ink', fg: '--fui-text-control', bg: '--fui-surface-raised', min: 4.5 },
  { what: 'Dialog close icon', fg: '--fui-icon-muted', bg: '--fui-surface-raised', min: 3 },
  // Focus (2.4.11)
  { what: 'Focus ring on page', fg: '--fui-focus-ring', bg: '--fui-surface-page', min: 3 },
  { what: 'Focus ring on raised', fg: '--fui-focus-ring', bg: '--fui-surface-raised', min: 3 },
]

/**
 * The base layer is Figma-faithful, and the TapTap palette does not reach AA
 * on these pairs. Each is pinned to the ratio measured at audit time so it can
 * only improve: raising a value fails the `toBeLessThan` and the entry gets
 * deleted, lowering one fails the floor. `a11y.css` fixes every one of them.
 */
const BASE_DEVIATIONS: Record<string, Record<string, number>> = {
  light: {
    'Button primary label': 2.11,
    'Button primary hover label': 1.88,
    'Button primary active label': 2.79,
    'Button danger label': 3.46,
    'Button danger hover label': 2.98,
    'Button danger active label': 4.21,
    'Button outline hover label': 1.88,
    'Button outline active label': 2.79,
    'Button outline border': 1.3,
    'Button link label': 2.11,
    'Button danger outline label': 3.46,
    'Input placeholder ink': 1.63,
    'Input border': 1.3,
    'Input affix text': 3.27,
    'Input error message': 3.46,
    'Input clear affordance': 1.63,
    'Focus ring on page': 2.11,
    'Focus ring on raised': 2.11,
  },
  dark: {
    'Button primary label': 2.11,
    'Button primary hover label': 1.88,
    'Button primary active label': 2.79,
    'Button danger label': 3.46,
    'Button danger hover label': 2.98,
    'Button danger active label': 4.21,
    'Button outline border': 2.64,
    'Button danger outline label': 4.1,
    'Input placeholder ink': 2.64,
    'Input border': 1.24,
    'Input affix text': 4.11,
  },
}

/**
 * Deviations the OVERLAY does not fix either.
 *
 * `a11y.css` re-points semantic tokens; it does not change which token a
 * component reaches for. `--fui-icon-muted` is an icon colour solved for the
 * 3:1 of WCAG 1.4.11, and Input renders its `prefix`/`suffix` affixes in it —
 * as text, which 1.4.3 holds to 4.5:1. The overlay leaves it where it is, so
 * the pair fails AA on both palettes.
 *
 * Recorded rather than fixed, deliberately: feature 004 observes and does not
 * change token values or component behaviour (spec Out of Scope). The fix is
 * its own change — either a text-grade adornment token, or the affixes moving
 * to `--fui-text-control`.
 *
 * Two-sided, exactly like BASE_DEVIATIONS: the ratio may not worsen, and if a
 * later change fixes it the `toBeLessThan` fails so the entry is deleted
 * instead of quietly outliving the problem it documents (FR-012).
 */
const AA_DEVIATIONS: Record<string, Record<string, number>> = {
  light: {
    'Input affix text': 3.27,
  },
  dark: {
    'Input affix text': 4.11,
  },
}

describe.each(['light', 'dark'] as const)('contrast — %s mode, base (Figma-faithful) layer', (mode) => {
  it.each(PAIRS)('$what', ({ what, fg, bg, min }) => {
    const r = ratio(mode, false, fg, bg)
    const known = BASE_DEVIATIONS[mode][what]
    if (known === undefined) {
      expect(r).toBeGreaterThanOrEqual(min)
    } else {
      // A recorded deviation. Two-sided on purpose: it may not get worse, and
      // if a palette change fixes it the `toBeLessThan` fails so the entry is
      // removed rather than quietly outliving the problem it documents.
      expect(r).toBeGreaterThanOrEqual(known)
      expect(r).toBeLessThan(min)
    }
  })

  it('records no deviation for a pair that already meets AA', () => {
    const stale = Object.keys(BASE_DEVIATIONS[mode]).filter((what) => {
      const pair = PAIRS.find((p) => p.what === what)
      return !pair || ratio(mode, false, pair.fg, pair.bg) >= pair.min
    })
    expect(stale).toEqual([])
  })
})

describe.each(['light', 'dark'] as const)('contrast — %s mode, with a11y.css (must reach AA)', (mode) => {
  it.each(PAIRS)('$what', ({ what, fg, bg, min }) => {
    const r = ratio(mode, true, fg, bg)
    const known = AA_DEVIATIONS[mode][what]
    if (known === undefined) {
      expect(r).toBeGreaterThanOrEqual(min)
    } else {
      expect(r).toBeGreaterThanOrEqual(known)
      expect(r).toBeLessThan(min)
    }
  })

  it('records no overlay deviation for a pair the overlay already fixes', () => {
    const stale = Object.keys(AA_DEVIATIONS[mode]).filter((what) => {
      const pair = PAIRS.find((p) => p.what === what)
      return !pair || ratio(mode, true, pair.fg, pair.bg) >= pair.min
    })
    expect(stale).toEqual([])
  })
})
