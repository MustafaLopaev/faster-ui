import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo } from 'react'

/**
 * The token catalogue reads itself out of the live stylesheet rather than a
 * hand-maintained list, so it can never disagree with `src/tokens/`. Add a
 * token and it shows up here; delete one and it disappears.
 */
function collectTokenNames(): string[] {
  const found = new Set<string>()
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList
    try {
      rules = sheet.cssRules
    } catch {
      continue // cross-origin sheet
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSStyleRule)) continue
      for (const prop of Array.from(rule.style)) {
        if (prop.startsWith('--fui-')) found.add(prop)
      }
    }
  }
  return [...found].toSorted()
}

function useTokens(): Array<[string, string]> {
  // Names come from the sheet once; values are read fresh on every render, so
  // flipping the Theme or Palette toolbar re-resolves them with no extra state.
  const names = useMemo(() => collectTokenNames(), [])
  const computed = getComputedStyle(document.documentElement)
  return names.map((n) => [n, computed.getPropertyValue(n).trim()])
}

const isColor = (v: string) => /^(#|rgb|hsl|oklch)/i.test(v)

function Swatch({ name, value }: { name: string; value: string }) {
  return (
    <div className="fui:flex fui:items-center fui:gap-3">
      <span
        aria-hidden="true"
        className="fui:shrink-0 fui:size-10 fui:rounded-control fui:border fui:border-solid fui:border-border-subtle"
        style={{ background: value }}
      />
      <span className="fui:flex fui:flex-col">
        <code className="fui:text-caption fui:text-text-primary">{name}</code>
        <code className="fui:text-caption fui:text-text-secondary">{value}</code>
      </span>
    </div>
  )
}

function Group({ title, tokens }: { title: string; tokens: Array<[string, string]> }) {
  if (tokens.length === 0) return null
  return (
    <section className="fui:flex fui:flex-col fui:gap-3">
      <h3 className="fui:m-0 fui:text-title fui:font-medium fui:text-text-heading">{title}</h3>
      <div className="fui:grid fui:grid-cols-3 fui:gap-3">
        {tokens.map(([n, v]) =>
          isColor(v) ? (
            <Swatch key={n} name={n} value={v} />
          ) : (
            <div key={n} className="fui:flex fui:flex-col">
              <code className="fui:text-caption fui:text-text-primary">{n}</code>
              <code className="fui:text-caption fui:text-text-secondary">{v}</code>
            </div>
          ),
        )}
      </div>
    </section>
  )
}

function Catalogue() {
  const tokens = useTokens()
  const pick = (test: (n: string) => boolean) => tokens.filter(([n]) => test(n))
  const semantic = (prefix: string) => pick((n) => n.startsWith(`--fui-${prefix}`))

  return (
    <div className="fui:flex fui:flex-col fui:gap-8 fui:font-sans">
      <header className="fui:flex fui:flex-col fui:gap-2">
        <h2 className="fui:m-0 fui:text-h2 fui:font-medium fui:text-text-heading">Design tokens</h2>
        <p className="fui:m-0 fui:text-body fui:text-text-secondary">
          Read live from the loaded stylesheet. Flip <strong>Theme</strong> to watch the semantic
          layer re-resolve, and <strong>Palette</strong> to load the opt-in WCAG AA overlay — the
          components below never change, only the tokens do.
        </p>
      </header>

      <Group title="Semantic — actions" tokens={semantic('action-')} />
      <Group title="Semantic — surfaces & overlay" tokens={[...semantic('surface-'), ...semantic('overlay')]} />
      <Group title="Semantic — text & icons" tokens={[...semantic('text-'), ...semantic('icon-')]} />
      <Group title="Semantic — borders & focus" tokens={[...semantic('border-'), ...semantic('focus-')]} />
      <Group title="Semantic — feedback" tokens={semantic('feedback-')} />
      <Group
        title="Primitives — palette"
        tokens={pick((n) =>
          /^--fui-(white|black|neutral|primary|auxiliary|danger|warning|success|info|ink)(-|$)/.test(n),
        )}
      />
      <Group title="Primitives — typography" tokens={pick((n) => /^--fui-(family|weight|size|lh)-/.test(n))} />
      <Group title="Primitives — geometry" tokens={pick((n) => /^--fui-(radius|spacing)-/.test(n))} />
      <Group title="Primitives — elevation" tokens={semantic('elevation-')} />
    </div>
  )
}

const meta = {
  title: 'Foundations/Design Tokens',
  component: Catalogue,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Catalogue>

export default meta
type Story = StoryObj<typeof meta>

export const AllTokens: Story = {}
