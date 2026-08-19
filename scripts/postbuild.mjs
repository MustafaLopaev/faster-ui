/**
 * Post-build: ship the opt-in a11y stylesheet, then enforce the dist budget.
 *
 * `a11y.css` is pure custom-property declarations — no Tailwind directives, no
 * utilities — so it needs no compilation, only a copy. Keeping it out of the
 * Vite entry is deliberate: it must be separately importable, and bundling it
 * into `styles.css` would force the AA palette on everyone.
 */
import { readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

writeFileSync(r('dist/a11y.css'), readFileSync(r('src/tokens/a11y.css')))

/**
 * Every `fui:` class the shipped components reference must exist in the shipped
 * stylesheet.
 *
 * Tailwind only generates a utility it can SEE, and `tokens.css` narrows source
 * detection to an explicit `@source` list so stories and specs never leak their
 * classes to consumers. That makes the list load-bearing: a shipping file it
 * fails to name contributes no utilities at all, the build still succeeds, and
 * the components render unstyled. It happened for real when the style maps moved
 * into `*.styles.ts` while the glob still said `*.tsx` — `dist/styles.css` fell
 * from 18.5 kB to 6.6 kB, green all the way.
 *
 * Checked here rather than in a unit test because this is the only place the
 * real answer exists: emulating Tailwind's glob resolution would just be a
 * second implementation to get wrong.
 */
function checkStylesheetCoverage() {
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    )

  const sources = [r('src/components'), r('src/assets')]
    .flatMap(walk)
    .filter((f) => /\.tsx?$/.test(f) && !/\.(test|cy|stories)\.tsx?$/.test(f))

  const css = readFileSync(r('dist/styles.css'), 'utf8')
  // Tailwind escapes CSS-special characters in the generated selector.
  const selectorFor = (cls) => `.${cls.replace(/([:.[\]&/])/g, '\\$1')}`

  const missing = new Map()
  for (const file of sources) {
    for (const [cls] of readFileSync(file, 'utf8').matchAll(/fui:[a-zA-Z0-9_.:&[\]/-]+/g)) {
      if (!css.includes(selectorFor(cls))) {
        const where = missing.get(cls) ?? []
        where.push(relative(r('.'), file))
        missing.set(cls, where)
      }
    }
  }

  if (missing.size === 0) {
    console.log(`✔ stylesheet covers all ${sources.length} shipping source files`)
    return true
  }
  console.error(`✖ ${missing.size} class(es) used by shipped code are absent from dist/styles.css:`)
  for (const [cls, where] of missing) console.error(`    ${cls}  (${[...new Set(where)].join(', ')})`)
  console.error(
    '\n  Tailwind did not see the file that declares them. Check the `@source`\n' +
      '  directives at the bottom of src/tokens/tokens.css — they must name every\n' +
      '  shipping folder AND extension, including the `.styles.ts` maps.',
  )
  return false
}

let failed = !checkStylesheetCoverage()

// Budget: a guardrail, not a target. Raise deliberately in a PR that explains
// the growth — a silent creep is what this exists to catch.
const BUDGET = {
  'dist/index.js': 24 * 1024,
  'dist/styles.css': 26 * 1024,
  'dist/index.d.ts': 8 * 1024,
  'dist/a11y.css': 8 * 1024,
}

for (const [file, max] of Object.entries(BUDGET)) {
  const size = statSync(r(file)).size
  const pct = Math.round((size / max) * 100)
  const line = `${file.padEnd(18)} ${String(size).padStart(6)} B / ${max} B  (${pct}%)`
  if (size > max) {
    console.error(`✖ ${line}  OVER BUDGET`)
    failed = true
  } else {
    console.log(`✔ ${line}`)
  }
}
if (failed) {
  process.exit(1)
}
