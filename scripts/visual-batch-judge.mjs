/**
 * The nightly full-matrix jury, on the Batch API (004 FR-038).
 *
 * WHY THIS EXISTS AT ALL, given the pull-request path already judges cells
 * through `anthropics/claude-code-action`: FR-038 requires checks that block
 * nothing to take the lower-cost asynchronous path, and the action does not
 * expose the Batch API. That is the sole justification for the
 * `@anthropic-ai/sdk` devDependency, and it is confined to this file.
 *
 * The pull-request path judges the handful of cells a change moved, and does it
 * synchronously because a reviewer is waiting. This one judges the whole matrix
 * overnight, when nobody is, at roughly half the price.
 *
 * The rubric is sent as a CACHED prefix. It is identical for every cell, so the
 * first request pays for it and the remaining ~238 read it back at about a tenth
 * of the cost. `cache_read_input_tokens` is reported at the end: a zero there
 * across a run of this size means the prefix is silently not caching, and
 * nothing else would tell you.
 */
import Anthropic from '@anthropic-ai/sdk'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const MODEL = 'claude-opus-5'
const POLL_INTERVAL_MS = 30_000
const MAX_WAIT_MS = 6 * 60 * 60 * 1000

if (!process.env.ANTHROPIC_API_KEY) {
  // Credential-absent is a success outcome, never a failure (FR-019). Pass 2
  // has already run and already reported every difference.
  console.log('ANTHROPIC_API_KEY is not set — skipping judgment. The comparison already ran.')
  process.exit(0)
}

const reportPath = r('visual/report.json')
if (!existsSync(reportPath)) {
  console.error('✖ visual/report.json is missing. Run `npm run visual:compare` first.')
  process.exit(1)
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const cells = report.toJudge ?? []

if (cells.length === 0) {
  console.log('✔ No changed or new cells — nothing to judge. (This is the common case.)')
  writeFileSync(r('visual/judgment.json'), JSON.stringify({ verdicts: [] }, null, 2) + '\n')
  process.exit(0)
}

const rubric = readFileSync(r('visual/rubric.md'), 'utf8')

const SCHEMA_INSTRUCTION = `Reply with a single JSON object and nothing else:
{"cell":"<filename>","verdict":"PASS"|"WARN"|"FAIL","defect":"<names the defect, empty only when PASS>","confidence":"high"|"low"}`

const imagePart = (path) => ({
  type: 'image',
  source: { type: 'base64', media_type: 'image/png', data: readFileSync(path).toString('base64') },
})

function requestFor(cell) {
  const baseline = r(`visual/baselines/${cell}`)
  const current = r(`visual/current/${cell}`)
  const content = []

  if (existsSync(baseline)) {
    content.push({ type: 'text', text: `BASELINE — ${cell}` }, imagePart(baseline))
    content.push({ type: 'text', text: 'CURRENT — the same cell after this change' })
  } else {
    content.push({
      type: 'text',
      text: `NEW CELL — ${cell}. There is no baseline; judge the image on its own merits and say what it shows.`,
    })
  }
  content.push(imagePart(current))
  content.push({ type: 'text', text: SCHEMA_INSTRUCTION })

  return {
    // The Batch API returns results out of order; the custom id is how a
    // verdict finds its way back to a cell.
    custom_id: cell.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 64),
    params: {
      model: MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: `You are the visual jury for a React component library. Judge one rendered cell.\n\n${rubric}`,
          // The whole point: identical for every request in the batch.
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content }],
    },
  }
}

const client = new Anthropic()
const requests = cells.map((cell) => requestFor(cell))
const byCustomId = new Map(cells.map((cell) => [requestFor(cell).custom_id, cell]))

console.log(`Submitting ${requests.length} cells to the Batch API…`)
let batch = await client.messages.batches.create({ requests })
console.log(`Batch ${batch.id} created.`)

const deadline = Date.now() + MAX_WAIT_MS
/* oxlint-disable no-await-in-loop -- polling is sequential by definition */
while (batch.processing_status === 'in_progress') {
  if (Date.now() > deadline) {
    console.error(`✖ Batch ${batch.id} did not finish within the wait window.`)
    process.exit(1)
  }
  await new Promise((done) => setTimeout(done, POLL_INTERVAL_MS))
  batch = await client.messages.batches.retrieve(batch.id)
  const c = batch.request_counts
  console.log(`  ${batch.processing_status} — succeeded ${c.succeeded}, errored ${c.errored}`)
}
/* oxlint-enable no-await-in-loop */

const verdicts = []
const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0 }

for await (const result of await client.messages.batches.results(batch.id)) {
  const cell = byCustomId.get(result.custom_id) ?? result.custom_id
  if (result.result.type !== 'succeeded') {
    verdicts.push({
      cell,
      verdict: 'WARN',
      defect: `judgment did not complete: ${result.result.type}`,
      confidence: 'low',
    })
    continue
  }
  const message = result.result.message
  for (const key of Object.keys(usage)) usage[key] += Number(message.usage?.[key] ?? 0)

  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
  try {
    const parsed = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1))
    // FR-027: a non-PASS verdict without a stated defect is not a verdict.
    if (parsed.verdict !== 'PASS' && !parsed.defect?.trim()) {
      parsed.defect = 'NO DEFECT STATED — treat as unjudged'
      parsed.confidence = 'low'
    }
    verdicts.push({ ...parsed, cell })
  } catch {
    verdicts.push({
      cell,
      verdict: 'WARN',
      defect: 'the reply could not be parsed as a verdict',
      confidence: 'low',
    })
  }
}

writeFileSync(r('visual/judgment.json'), JSON.stringify({ batch: batch.id, usage, verdicts }, null, 2) + '\n')

const count = (v) => verdicts.filter((x) => x.verdict === v).length
console.log(`\nJudged ${verdicts.length} cells — PASS ${count('PASS')}, WARN ${count('WARN')}, FAIL ${count('FAIL')}`)
for (const v of verdicts.filter((x) => x.verdict !== 'PASS')) {
  console.log(`  ${v.verdict} [${v.confidence}] ${v.cell}\n      ${v.defect}`)
}

console.log(
  `\nUsage — input ${usage.input_tokens}, output ${usage.output_tokens}, cache read ${usage.cache_read_input_tokens}`,
)
if (usage.cache_read_input_tokens === 0 && verdicts.length > 1) {
  console.log(
    '⚠ Zero cache reads across a multi-cell batch. The rubric prefix is identical for\n' +
      '  every request, so it should be read from cache after the first. A zero here means\n' +
      "  caching is silently not working and this run cost ~10× what it should — nothing\n" +
      '  else will tell you (FR-037).',
  )
}

// Advisory. The blocking half is the pixel comparison, which has already run.
process.exit(0)
