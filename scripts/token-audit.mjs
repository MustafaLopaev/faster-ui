/**
 * Token audit — the deterministic, BLOCKING half (004 FR-021, Principle I).
 *
 * Runs the same rules as the local `PostToolUse` hook, from the same module, so
 * a contributor with the hooks disabled is slower but never less safe (FR-036).
 *
 * WHY THIS EXISTS AS A SEPARATE GATE: SC-013 asks for the hooks to be turned
 * off and the same violation pushed, expecting a gate to catch it anyway. When
 * that was tried during implementation, nothing deterministic did — `oxlint`
 * has no Tailwind rules, and the model-driven token audit is advisory by
 * construction (FR-017) and cannot block. The local hook was therefore the only
 * thing enforcing Principle I's most mechanical rule, which is exactly the
 * "the hook has quietly become load-bearing" state SC-013 is written to detect.
 * This closes it. See specs/004-quality-automation/findings.md F-8.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findViolations, isAuditable } from './token-rules.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const walk = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    return entry.isDirectory() ? walk(full) : [full]
  })

const scope = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const roots = scope.length > 0 ? scope.map((p) => resolve(root, p)) : [resolve(root, 'src')]

const files = roots
  .flatMap((p) => (statSync(p).isDirectory() ? walk(p) : [p]))
  .map((p) => relative(root, p))
  .filter((p) => isAuditable(p))
  .toSorted()

const problems = []
for (const file of files) {
  for (const v of findViolations(readFileSync(resolve(root, file), 'utf8'))) {
    problems.push({ file, ...v })
  }
}

console.log(`Token audit — ${files.length} component and shared-internal files\n`)

if (problems.length === 0) {
  console.log('✔ No raw colours, arbitrary visual values, non-semantic palette classes')
  console.log('  or literal inline styles. Every visual value comes from the token layer.')
  process.exit(0)
}

for (const p of problems) {
  console.error(`✖ ${p.file}:${p.line}  [${p.rule.id}]  \`${p.value}\``)
  console.error(`  ${p.rule.why}\n`)
}
console.error(
  `✖ ${problems.length} token violation(s). Rewrite using semantic \`fui:\` utilities\n` +
    '  from src/tokens/bridge.css. Whether a token is the SEMANTICALLY right one is a\n' +
    '  separate question, and belongs to the advisory token-audit review job.',
)
process.exit(1)
