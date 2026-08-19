/**
 * The browserless import probe (004 FR-008) — `testEnvironment: 'node'`.
 *
 * This is the only environment that can catch a module-scope DOM access. jsdom
 * *provides* `document`, so `const w = document.body.clientWidth` at module
 * scope passes silently in `ssr.test.tsx`'s environment (research R-5). Here the
 * global does not exist, so the import itself throws.
 *
 * The subject is the BUILT `dist/index.js`, not source: that is what a consumer
 * executes, and it is where a bundler could have hoisted something into module
 * scope that source review would not reveal.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_ENTRY = resolve(__dirname, '../dist/index.js')

// Non-literal specifier on purpose: a literal would make `tsc -b` resolve
// `dist/index.d.ts` at typecheck time, and the typecheck gate runs without a
// build (`needs: install`). The runtime resolution is what this suite tests.
const importBuiltEntry = () => import(DIST_ENTRY) as Promise<Record<string, unknown>>

describe('the built module in a browserless environment', () => {
  beforeAll(() => {
    if (!existsSync(DIST_ENTRY)) {
      throw new Error(
        `dist/index.js is missing. This suite tests the built artifact — run \`npm run build\` first. ` +
          `In CI the \`ssr\` job depends on \`build\` for exactly this reason.`,
      )
    }
  })

  it('has no browser globals available — the premise of every assertion below', () => {
    expect(typeof document).toBe('undefined')
    expect(typeof window).toBe('undefined')
    // `navigator` is deliberately NOT asserted absent: Node has shipped it as a
    // platform global since v21, so its presence proves nothing about a browser
    // environment and asserting on it would fail for the wrong reason.
  })

  it('imports without touching a browser global', async () => {
    await expect(importBuiltEntry()).resolves.toBeDefined()
  })

  it('exposes exactly the three documented components', async () => {
    const mod = await importBuiltEntry()
    const components = Object.keys(mod)
      .filter((key) => key !== 'default' && key !== '__esModule')
      .toSorted()
    expect(components).toEqual(['Button', 'Dialog', 'Input'])
    for (const name of components) {
      expect(typeof mod[name]).toBe('object') // forwardRef exotic component
    }
  })

  // Recorded as an assertion, not a comment: the Next.js consumer fixture and
  // README both instruct consumers to import `styles.css` explicitly. If the
  // bundle ever started importing CSS itself, that instruction would become
  // wrong AND every server-rendering consumer would break on an unparsable
  // import — the failure this line makes loud.
  it('contains no CSS import — the stylesheet is a separate, explicit entry point', () => {
    const source = readFileSync(DIST_ENTRY, 'utf8')
    expect(source).not.toMatch(/from\s*['"][^'"]+\.css['"]/)
    expect(source).not.toMatch(/import\s*['"][^'"]+\.css['"]/)
  })
})
