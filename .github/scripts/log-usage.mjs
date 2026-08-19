/**
 * Per-run model usage, written to the job summary (004 FR-037/FR-039).
 *
 * The line that matters is `cache_read_input_tokens`. The review prompts are
 * built with a large stable prefix — constitution, contracts, CLAUDE.md — so
 * repeat runs should read most of their input from cache at roughly a tenth of
 * the price. If something volatile drifts ahead of the last cache breakpoint,
 * the prefix stops matching and caching silently stops working: nothing fails,
 * no output changes, the bill just goes up ~10×.
 *
 * A zero cache-read across repeated runs of the same job is that symptom, and
 * it is invisible without this line. That is the whole reason FR-037 asks for
 * it.
 *
 * Usage: node .github/scripts/log-usage.mjs <job-id> <execution-file>
 */
import { appendFileSync, existsSync, readFileSync } from 'node:fs'

const [job, executionFile] = process.argv.slice(2)

function findUsage(node, into = []) {
  if (!node || typeof node !== 'object') return into
  if (Array.isArray(node)) {
    for (const item of node) findUsage(item, into)
    return into
  }
  if (node.usage && typeof node.usage === 'object') into.push(node.usage)
  for (const value of Object.values(node)) findUsage(value, into)
  return into
}

const total = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
let parsed = false

if (executionFile && existsSync(executionFile)) {
  try {
    for (const usage of findUsage(JSON.parse(readFileSync(executionFile, 'utf8')))) {
      for (const key of Object.keys(total)) total[key] += Number(usage[key] ?? 0)
    }
    parsed = true
  } catch (error) {
    console.error(`Could not read usage from ${executionFile}: ${error.message}`)
  }
}

const lines = parsed
  ? [
      `### Model usage — \`${job}\``,
      '',
      '| input | output | cache read | cache write |',
      '| ----- | ------ | ---------- | ----------- |',
      `| ${total.input_tokens} | ${total.output_tokens} | ${total.cache_read_input_tokens} | ${total.cache_creation_input_tokens} |`,
      '',
      total.cache_read_input_tokens === 0
        ? '> **No cache read.** Expected on the first run of a changed prompt. If it stays zero across repeated runs of this job, something volatile has drifted ahead of the last cache breakpoint and the stable prefix is no longer matching — the run costs roughly 10× what it should, and nothing else will tell you.'
        : `> Cache read covered ${Math.round(
            (total.cache_read_input_tokens /
              Math.max(1, total.cache_read_input_tokens + total.input_tokens)) *
              100,
          )}% of input tokens.`,
      '',
    ]
  : [`### Model usage — \`${job}\``, '', '> No execution file to read usage from.', '']

console.log(lines.join('\n'))
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n')
}
