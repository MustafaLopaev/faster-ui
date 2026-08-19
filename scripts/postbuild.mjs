/**
 * Post-build: ship the opt-in a11y stylesheet, then enforce the dist budget.
 *
 * `a11y.css` is pure custom-property declarations — no Tailwind directives, no
 * utilities — so it needs no compilation, only a copy. Keeping it out of the
 * Vite entry is deliberate: it must be separately importable, and bundling it
 * into `styles.css` would force the AA palette on everyone.
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

writeFileSync(r('dist/a11y.css'), readFileSync(r('src/tokens/a11y.css')))

// Budget: a guardrail, not a target. Raise deliberately in a PR that explains
// the growth — a silent creep is what this exists to catch.
const BUDGET = {
  'dist/index.js': 24 * 1024,
  'dist/styles.css': 26 * 1024,
  'dist/index.d.ts': 8 * 1024,
  'dist/a11y.css': 8 * 1024,
}

let failed = false
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
  console.error('\nDist size budget exceeded. Justify and raise it in scripts/postbuild.mjs.')
  process.exit(1)
}
