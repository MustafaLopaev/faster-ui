/**
 * Baseline acceptance (004 FR-029).
 *
 * Copies `visual/current/` over `visual/baselines/` and removes orphans. The
 * result is a normal repository change, reviewed like any other — which is the
 * requirement, and the reason baselines are committed images rather than rows
 * in a hosted service.
 *
 * BULK ACCEPTANCE IS BOUNDED, NOT FORBIDDEN. A legitimate token change really
 * does move hundreds of cells. What the contract prevents is an *unreviewable*
 * one, so the count is printed here and appears in the pull request. A 200-cell
 * acceptance must not be able to look like a 2-cell one.
 *
 * PLATFORM: baselines are valid for `ubuntu-latest` only. Font rasterisation
 * alone makes a macOS capture differ from a Linux one on every cell, so
 * accepting locally on another platform would replace a valid baseline set with
 * one that fails every cell in CI. This script refuses to do that silently.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { platform } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CURRENT = join(root, 'visual/current')
const BASELINES = join(root, 'visual/baselines')

/** SC-011. If the matrix will not fit, the matrix narrows — the budget does not rise. */
const BUDGET_BYTES = 12 * 1024 * 1024

const force = process.argv.includes('--force')

if (!existsSync(CURRENT) || readdirSync(CURRENT).filter((f) => f.endsWith('.png')).length === 0) {
  console.error('✖ visual/current/ is empty. Run `npm run visual:capture` first.')
  process.exit(1)
}

if (platform() !== 'linux' && !force) {
  console.error(
    `✖ Refusing to accept baselines on ${platform()}.\n\n` +
      '  Baselines are captured on `ubuntu-latest` and are valid only there — font\n' +
      '  rasterisation alone makes a capture from another platform differ on every\n' +
      '  cell. Accepting here would replace a working baseline set with one that\n' +
      '  fails everything in CI, and the diff would look like a legitimate visual\n' +
      '  change rather than a platform mismatch.\n\n' +
      '  Generate them on the runner instead:\n' +
      '    gh workflow run visual.yml -f accept-baselines=true\n\n' +
      '  Use --force only to inspect the mechanics locally. Do not commit the result.',
  )
  process.exit(1)
}

mkdirSync(BASELINES, { recursive: true })

const current = readdirSync(CURRENT).filter((f) => f.endsWith('.png'))
const existing = existsSync(BASELINES)
  ? readdirSync(BASELINES).filter((f) => f.endsWith('.png'))
  : []
const currentSet = new Set(current)

let added = 0
let updated = 0
for (const file of current) {
  const target = join(BASELINES, file)
  if (existsSync(target)) updated++
  else added++
  copyFileSync(join(CURRENT, file), target)
}

let removed = 0
for (const file of existing) {
  if (!currentSet.has(file)) {
    rmSync(join(BASELINES, file))
    removed++
  }
}

const total = readdirSync(BASELINES)
  .filter((f) => f.endsWith('.png'))
  .reduce((sum, f) => sum + statSync(join(BASELINES, f)).size, 0)

console.log(`Accepted ${current.length} cells as baselines:`)
console.log(`  ${added} new`)
console.log(`  ${updated} updated`)
console.log(`  ${removed} orphaned baselines removed`)
console.log(
  `\nBaseline set: ${current.length} files, ${(total / 1024 / 1024).toFixed(2)} MB of ${(
    BUDGET_BYTES /
    1024 /
    1024
  ).toFixed(0)} MB (${Math.round((total / BUDGET_BYTES) * 100)}%)`,
)

if (total > BUDGET_BYTES) {
  console.error(
    '\n✖ Baseline set exceeds the 12 MB budget (SC-011).\n' +
      '  Narrow the matrix in visual/matrix.ts — the budget does not silently rise.\n' +
      '  This mirrors how scripts/postbuild.mjs treats the distribution budget.',
  )
  process.exit(1)
}

console.log('\nReview `git diff --stat visual/baselines` before committing.')
