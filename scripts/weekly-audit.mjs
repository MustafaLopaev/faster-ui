/**
 * Weekly deep audit (004 C5 / FR-035), on Azure OpenAI chat completions.
 *
 * THE DIFF IS THE PRODUCT. A standing audit that reports the same twelve
 * findings every week is ignored by week three, and the week it finds something
 * new nobody reads it. So this compares against last week's report and leads
 * with what changed — the findings themselves are supporting material.
 *
 * The audit definition, the constitution and the repository guide change
 * rarely, so they lead the prompt as a stable prefix Azure's prompt cache can
 * hold across weeks; only the metrics and last week's report — the volatile
 * half — come after (FR-037).
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chat, hasCredential, logUsage } from './azure-openai.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const ISSUE_TITLE_PREFIX = 'Weekly audit —'

if (!hasCredential()) {
  console.log('AZURE_OPENAI_API_KEY is not set — skipping the audit. This is a success outcome.')
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
].join('\n')

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

console.log('Running the weekly audit on Azure OpenAI…')
const { text: body } = await chat(
  [
    { role: 'system', content: system },
    { role: 'user', content: userText },
  ],
  { maxTokens: 8192 },
)

const date = new Date().toISOString().slice(0, 10)
const title = `${ISSUE_TITLE_PREFIX} ${date}`
writeFileSync(r('audit-report.md'), body + '\n')

// Loud on failure: an audit that runs and tells nobody is the silent-failure
// class this pipeline exists to prevent. (First hit: the `audit` label did not
// exist on the repo and `gh issue create` failed invisibly for it.)
const created = gh(['issue', 'create', '--title', title, '--body-file', r('audit-report.md'), '--label', 'audit'])
if (!created) {
  console.error('✖ The audit ran but the issue was not created. The report is in the run artifact.')
  process.exitCode = 1
}

console.log(`\n${title}\n`)
console.log(body.slice(0, 2000))
logUsage('weekly-audit')
