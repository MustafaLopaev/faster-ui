/**
 * Visual comparison (004 FR-025/FR-026) — Pass 2 of three.
 *
 * Diffs `visual/current/` against `visual/baselines/` and writes a changed-cell
 * manifest to `visual/report.json`. Deterministic, needs no credential, and
 * runs for forks — a visual check that goes blind without a secret would be
 * useless to exactly the contributors who most need it (FR-030).
 *
 * THE ORDER IS THE CONTRACT: compare first, judge only what moved. Judging
 * every cell costs roughly 12× for information this pass already settled, which
 * is why FR-026 is written as an ordering rather than a preference.
 *
 * States:
 *   unchanged  identical within tolerance
 *   changed    differs — goes to judgment
 *   new        captured with no baseline — goes to judgment, never silently accepted
 *   orphaned   a baseline nothing captured; REPORTED, never silently kept, because
 *              a baseline for a story that no longer exists is dead weight that
 *              quietly inflates the budget and can never fail
 */
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CURRENT = join(root, 'visual/current')
const BASELINES = join(root, 'visual/baselines')
const DIFFS = join(root, 'visual/diff')
const REPORT = join(root, 'visual/report.json')

/** Per-pixel colour-distance threshold, and the share of pixels a cell may move. */
const PIXEL_THRESHOLD = 0.1
const CELL_TOLERANCE = 0.001 // 0.1%

const pngsIn = (dir) =>
  existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.png')).toSorted() : []

const current = pngsIn(CURRENT)
const baselines = pngsIn(BASELINES)

if (current.length === 0) {
  console.error(
    '✖ visual/current/ is empty. Run `npm run visual:capture` first — and it needs\n' +
      '  `npm run build-storybook`, because the workbench is what gets captured.',
  )
  process.exit(1)
}

rmSync(DIFFS, { recursive: true, force: true })
mkdirSync(DIFFS, { recursive: true })

const baselineSet = new Set(baselines)
const currentSet = new Set(current)
const results = []

for (const file of current) {
  if (!baselineSet.has(file)) {
    results.push({ cell: file, state: 'new', diffRatio: null, judged: true })
    continue
  }

  const a = PNG.sync.read(readFileSync(join(BASELINES, file)))
  const b = PNG.sync.read(readFileSync(join(CURRENT, file)))

  // Different dimensions cannot be diffed pixel-for-pixel, and a size change is
  // itself a layout change worth a human — never a silent pass.
  if (a.width !== b.width || a.height !== b.height) {
    results.push({
      cell: file,
      state: 'changed',
      diffRatio: 1,
      judged: true,
      note: `dimensions changed: ${a.width}×${a.height} → ${b.width}×${b.height}`,
    })
    continue
  }

  const diff = new PNG({ width: a.width, height: a.height })
  const differing = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
    threshold: PIXEL_THRESHOLD,
  })
  const diffRatio = differing / (a.width * a.height)

  if (diffRatio > CELL_TOLERANCE) {
    writeFileSync(join(DIFFS, file), PNG.sync.write(diff))
    results.push({ cell: file, state: 'changed', diffRatio, judged: true })
  } else {
    results.push({ cell: file, state: 'unchanged', diffRatio, judged: false })
  }
}

for (const file of baselines) {
  if (!currentSet.has(file)) {
    results.push({ cell: file, state: 'orphaned', diffRatio: null, judged: false })
  }
}

const by = (state) => results.filter((r) => r.state === state)
const changed = by('changed')
const added = by('new')
const orphaned = by('orphaned')

writeFileSync(
  REPORT,
  JSON.stringify(
    {
      tolerance: { pixelThreshold: PIXEL_THRESHOLD, cellTolerance: CELL_TOLERANCE },
      counts: {
        total: results.length,
        unchanged: by('unchanged').length,
        changed: changed.length,
        new: added.length,
        orphaned: orphaned.length,
      },
      // Only these reach Pass 3.
      toJudge: [...changed, ...added].map((r) => r.cell),
      results,
    },
    null,
    2,
  ) + '\n',
)

console.log(`Visual comparison — ${results.length} cells`)
console.log(`  unchanged ${by('unchanged').length}`)
console.log(`  changed   ${changed.length}`)
console.log(`  new       ${added.length}`)
console.log(`  orphaned  ${orphaned.length}`)
console.log(`\nManifest: visual/report.json`)

for (const r of changed) {
  console.log(
    `  ✖ changed  ${r.cell}${r.note ? `  (${r.note})` : `  ${(r.diffRatio * 100).toFixed(3)}% of pixels`}`,
  )
}
for (const r of added) console.log(`  + new      ${r.cell}`)
for (const r of orphaned) {
  console.log(`  ? orphaned ${r.cell}  — no cell captured this. Delete it, or restore the story.`)
}

if (changed.length + added.length + orphaned.length === 0) {
  console.log('\n✔ Every cell matches its baseline.')
  process.exit(0)
}

console.log(
  '\nIf these changes are intended, run `npm run visual:accept` and commit the result.\n' +
    'The accepted-cell COUNT appears in that output and in the diff, so a 200-cell\n' +
    'acceptance cannot be mistaken for a 2-cell one (FR-029).',
)
process.exit(1)
