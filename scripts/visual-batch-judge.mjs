/**
 * The visual jury (004 FR-026/FR-027), on Azure OpenAI chat completions.
 *
 * Judges exactly the cells `visual/report.json` names in `toJudge` — the pixel
 * comparison has already settled every other cell, and re-judging them costs
 * real money for nothing. Two callers, one script:
 *
 *   - the nightly sweep (visual.yml `nightly-sweep`) after a full-matrix
 *     capture and compare — no PR, so verdicts land in judgment.json only
 *   - the pull-request path (visual.yml `visual-judge`), which sets PR_NUMBER
 *     so the verdicts also land as one sticky comment
 *
 * The Anthropic Batch API this script was first written for is gone with the
 * Azure migration; cells are judged through the shared client with a small
 * concurrency pool instead. The rubric is sent as an identical prefix on every
 * request so Azure's prompt cache absorbs the repetition — `logUsage` reports
 * the cached-token count because a silently cold cache is invisible otherwise
 * (FR-037).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chat, hasCredential, imagePart, logUsage, usage } from './azure-openai.mjs'
import { postStickyComment } from './sticky-comment.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const CONCURRENCY = 3

if (!hasCredential()) {
  // Credential-absent is a success outcome, never a failure (FR-019). Pass 2
  // has already run and already reported every difference.
  console.log('AZURE_OPENAI_API_KEY is not set — skipping judgment. The comparison already ran.')
  process.exit(0)
}

const reportPath = r('visual/report.json')
if (!existsSync(reportPath)) {
  console.error('✖ visual/report.json is missing. Run `npm run visual:compare` first.')
  process.exit(1)
}

const report = JSON.parse(readFileSync(reportPath, 'utf8'))
const cells = report.toJudge ?? []

if (report.coldStart) {
  // Same reasoning as visual.yml's `cold-start` guard: with no baseline set
  // every cell is `new`, and judging the whole matrix against nothing to
  // compare it to costs real money and characterises no change.
  console.log(
    'No baseline set — skipping judgment.\n' +
      'Establish baselines first: gh workflow run visual.yml -f accept-baselines=true',
  )
  writeFileSync(
    r('visual/judgment.json'),
    JSON.stringify({ coldStart: true, verdicts: [] }, null, 2) + '\n',
  )
  process.exit(0)
}

if (cells.length === 0) {
  console.log('✔ No changed or new cells — nothing to judge. (This is the common case.)')
  writeFileSync(r('visual/judgment.json'), JSON.stringify({ verdicts: [] }, null, 2) + '\n')
  process.exit(0)
}

const rubric = readFileSync(r('visual/rubric.md'), 'utf8')

// Identical for every cell — the cacheable prefix.
const SYSTEM = `You are the visual jury for a React component library. Judge one rendered cell.\n\n${rubric}`

const SCHEMA = {
  type: 'object',
  required: ['verdict', 'defect', 'confidence'],
  additionalProperties: false,
  properties: {
    verdict: { type: 'string', enum: ['PASS', 'WARN', 'FAIL'] },
    defect: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'low'] },
  },
}

async function judge(cell) {
  const baseline = r(`visual/baselines/${cell}`)
  const current = r(`visual/current/${cell}`)
  const diff = r(`visual/diff/${cell}`)
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
  if (existsSync(baseline) && existsSync(diff)) {
    content.push({ type: 'text', text: 'DIFF — the differing pixels, highlighted' }, imagePart(diff))
  }

  const { json } = await chat(
    [
      { role: 'system', content: SYSTEM },
      { role: 'user', content },
    ],
    { maxTokens: 1024, schema: SCHEMA, schemaName: 'verdict' },
  )
  // FR-027: a non-PASS verdict without a stated defect is not a verdict.
  if (json.verdict !== 'PASS' && !json.defect?.trim()) {
    json.defect = 'NO DEFECT STATED — treat as unjudged'
    json.confidence = 'low'
  }
  return { ...json, cell }
}

console.log(`Judging ${cells.length} cells (${CONCURRENCY} at a time)…`)
const queue = [...cells]
const verdicts = []
/* oxlint-disable no-await-in-loop -- each worker drains the queue sequentially */
await Promise.all(
  Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
    for (let cell = queue.shift(); cell !== undefined; cell = queue.shift()) {
      try {
        verdicts.push(await judge(cell))
      } catch (error) {
        verdicts.push({
          cell,
          verdict: 'WARN',
          defect: `judgment did not complete: ${error.message}`,
          confidence: 'low',
        })
      }
      console.log(`  ${verdicts.length}/${cells.length} — ${verdicts.at(-1).verdict} ${cell}`)
    }
  }),
)
/* oxlint-enable no-await-in-loop */

writeFileSync(r('visual/judgment.json'), JSON.stringify({ usage, verdicts }, null, 2) + '\n')

const count = (v) => verdicts.filter((x) => x.verdict === v).length
console.log(`\nJudged ${verdicts.length} cells — PASS ${count('PASS')}, WARN ${count('WARN')}, FAIL ${count('FAIL')}`)
for (const v of verdicts.filter((x) => x.verdict !== 'PASS')) {
  console.log(`  ${v.verdict} [${v.confidence}] ${v.cell}\n      ${v.defect}`)
}

// On the pull-request path the verdicts are also the review comment.
if (process.env.PR_NUMBER) {
  const nonPass = verdicts.filter((v) => v.verdict !== 'PASS')
  const body = [
    `**Visual jury — ${verdicts.length} moved cell(s): PASS ${count('PASS')}, WARN ${count('WARN')}, FAIL ${count('FAIL')}.**`,
    '',
    ...(nonPass.length
      ? [
          '| verdict | confidence | cell | defect |',
          '| ------- | ---------- | ---- | ------ |',
          ...nonPass.map((v) => `| ${v.verdict} | ${v.confidence} | \`${v.cell}\` | ${v.defect.replaceAll('|', '\\|')} |`),
        ]
      : ['Every judged cell passes the rubric.']),
    '',
    'The blocking half is the pixel comparison, which has already run.',
  ].join('\n')
  postStickyComment(process.env.PR_NUMBER, 'visual-judge', body)
}

logUsage('visual-judge')

// Advisory. The blocking half is the pixel comparison, which has already run.
process.exit(0)
