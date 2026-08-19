/**
 * Weekly deep audit (004 C5 / FR-035 / FR-038), on the Batch API.
 *
 * THE DIFF IS THE PRODUCT. A standing audit that reports the same twelve
 * findings every week is ignored by week three, and the week it finds something
 * new nobody reads it. So this compares against last week's report and leads
 * with what changed — the findings themselves are supporting material.
 *
 * Off the pull-request path and blocking nothing, so FR-038 puts it on the
 * lower-cost asynchronous path. Along with the nightly visual sweep, this is
 * the reason `@anthropic-ai/sdk` is a devDependency.
 */
import Anthropic from '@anthropic-ai/sdk'
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const MODEL = 'claude-opus-5'
const ISSUE_TITLE_PREFIX = 'Weekly audit —'
const POLL_INTERVAL_MS = 30_000
const MAX_WAIT_MS = 4 * 60 * 60 * 1000

if (!process.env.ANTHROPIC_API_KEY) {
  console.log('ANTHROPIC_API_KEY is not set — skipping the audit. This is a success outcome.')
  process.exit(0)
}

const gh = (args, allowFailure = false) => {
  const res = spawnSync('gh', args, { cwd: root, encoding: 'utf8' })
  if (res.status !== 0 && !allowFailure) {
    console.error(`gh ${args.join(' ')} failed:\n${res.stderr}`)
  }
  return res.status === 0 ? res.stdout : ''
}

/** Last week's report, so this week's can lead with the delta rather than repeat it. */
function previousReport() {
  const json = gh(
    ['issue', 'list', '--search', `"${ISSUE_TITLE_PREFIX}" in:title`, '--limit', '1', '--state', 'all', '--json', 'number,title,body'],
    true,
  )
  try {
    const [issue] = JSON.parse(json || '[]')
    return issue?.body ?? null
  } catch {
    return null
  }
}

const skill = existsSync(r('.claude/skills/production-audit/SKILL.md'))
  ? readFileSync(r('.claude/skills/production-audit/SKILL.md'), 'utf8')
  : ''
const constitution = readFileSync(r('.specify/memory/constitution.md'), 'utf8')
const guide = readFileSync(r('CLAUDE.md'), 'utf8')
const metrics = existsSync(r('metrics.md')) ? readFileSync(r('metrics.md'), 'utf8') : '(not measured)'
const previous = previousReport()

const system = [
  {
    type: 'text',
    // Stable prefix: the skill, the constitution and the repository guide change
    // rarely, so they cache across weeks. Only the metrics and last week's
    // report — the volatile half — come after, in the user turn.
    text: [
      'You are running this repository\'s own production-readiness audit against `main`.',
      '',
      '── THE AUDIT DEFINITION ──',
      skill,
      '',
      '── THE CONSTITUTION ──',
      constitution,
      '',
      '── SETTLED ARCHITECTURE (do not re-litigate any of this) ──',
      guide,
    ].join('\n'),
    cache_control: { type: 'ephemeral' },
  },
]

const userText = [
  '── MEASURED THIS WEEK ──',
  metrics,
  '',
  previous
    ? ['── LAST WEEK\'S REPORT ──', previous].join('\n')
    : '── LAST WEEK\'S REPORT ──\n(none — this is the first run, so the whole report is the baseline)',
  '',
  '── WHAT TO WRITE ──',
  '',
  'THE DIFF IS THE PRODUCT, NOT THE FINDINGS.',
  '',
  'Structure the report as:',
  '',
  '1. **What changed since last week** — the whole point. A metric that moved',
  '   toward its limit, a finding that appeared, a finding that was fixed. If',
  '   nothing changed, say exactly that in one line and stop. Silence is a',
  '   correct and welcome output.',
  '2. **Approach to limits** — for each tracked metric, the value, the limit,',
  '   the percentage, and the direction of travel. Each limit already FAILS on',
  '   breach somewhere else (postbuild.mjs, jest thresholds, visual-accept.mjs);',
  '   reporting the approach is the only thing this audit adds.',
  '3. **Standing findings** — carried forward, listed by title only, with a',
  '   pointer to the issue or record. Do not restate them in full every week;',
  '   that is precisely how this report becomes unread.',
  '4. **New findings** — in full, each with `file:line` and quoted evidence.',
  '',
  'Do not re-report anything a deterministic gate already covers. Do not report',
  'the deviations recorded in `specs/004-quality-automation/findings.md`, which',
  'are known, pinned, and deliberately unfixed.',
  '',
  'Reply with the issue body in Markdown, and nothing else.',
].join('\n')

const client = new Anthropic()

console.log('Submitting the weekly audit to the Batch API…')
let batch = await client.messages.batches.create({
  requests: [
    {
      custom_id: 'weekly-audit',
      params: { model: MODEL, max_tokens: 8192, system, messages: [{ role: 'user', content: userText }] },
    },
  ],
})

const deadline = Date.now() + MAX_WAIT_MS
/* oxlint-disable no-await-in-loop -- polling is sequential by definition */
while (batch.processing_status === 'in_progress') {
  if (Date.now() > deadline) {
    console.error(`✖ Batch ${batch.id} did not finish within the wait window.`)
    process.exit(1)
  }
  await new Promise((done) => setTimeout(done, POLL_INTERVAL_MS))
  batch = await client.messages.batches.retrieve(batch.id)
  console.log(`  ${batch.processing_status}`)
}
/* oxlint-enable no-await-in-loop */

let body = ''
let usage = null
for await (const result of await client.messages.batches.results(batch.id)) {
  if (result.result.type !== 'succeeded') {
    console.error(`✖ The audit request did not succeed: ${result.result.type}`)
    process.exit(1)
  }
  usage = result.result.message.usage
  body = result.result.message.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

const date = new Date(batch.created_at ?? Date.now()).toISOString().slice(0, 10)
const title = `${ISSUE_TITLE_PREFIX} ${date}`
writeFileSync(r('audit-report.md'), body + '\n')

gh(['issue', 'create', '--title', title, '--body-file', r('audit-report.md'), '--label', 'audit'], true)

console.log(`\n${title}\n`)
console.log(body.slice(0, 2000))
console.log(
  `\nUsage — input ${usage?.input_tokens ?? 0}, output ${usage?.output_tokens ?? 0}, cache read ${
    usage?.cache_read_input_tokens ?? 0
  }`,
)
if ((usage?.cache_read_input_tokens ?? 0) === 0) {
  console.log(
    '⚠ Zero cache reads. Expected on the first run and after the skill, the constitution\n' +
      '  or CLAUDE.md change. If it stays zero week after week, something volatile has\n' +
      '  drifted into the cached prefix and every run is paying full price (FR-037).',
  )
}
