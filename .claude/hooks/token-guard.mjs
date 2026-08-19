/**
 * PostToolUse hook: the token-audit regex fast path (004 C4 / FR-036).
 *
 * THIS HOOK ENFORCES NOTHING NEW. Every rule it applies is also applied by a
 * gate that cannot be bypassed — `npm run lint`, the `token-audit` review job,
 * and the constitution review. A contributor without this hook is slower, never
 * less safe, and SC-013 verifies that by disabling the hooks entirely and
 * confirming the gate still fails.
 *
 * That property is the whole design. The moment this hook catches something no
 * gate catches, it has quietly become load-bearing and there is a hole in the
 * pipeline — and the correct response is to fix the pipeline, not to rely on
 * the hook.
 *
 * SCOPE GUARD: it fires only on `src/components/**`. A hook that fires on every
 * file is a hook that gets switched off, and a switched-off hook helps nobody.
 *
 * Reads a PostToolUse payload on stdin; exit 2 with a message on stderr asks
 * the agent to correct the edit.
 */
import { readFileSync } from 'node:fs'
// ONE definition, shared with scripts/token-audit.mjs — the blocking CI gate.
// Two copies would drift, and the day they drifted this hook would start
// enforcing something no gate does, which is the exact state SC-013 exists to
// detect (FR-036).
import { findViolations, isAuditable } from '../../scripts/token-rules.mjs'

let payload = {}
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}')
} catch {
  process.exit(0) // Never break the session over an unparsable payload.
}

const path = payload.tool_input?.file_path ?? ''

// Scope guard (US6 scenario 4): src/components/ and src/lib/ only, and never a
// spec or story. A hook that fires on every file is a hook that gets disabled.
if (!isAuditable(path)) process.exit(0)

const text = [payload.tool_input?.content, payload.tool_input?.new_string]
  .filter((v) => typeof v === 'string')
  .join('\n')
if (!text) process.exit(0)

const found = findViolations(text)

if (found.length === 0) process.exit(0)

console.error(
  [
    `Token violation in ${path} — the edit was not what the constitution allows.`,
    '',
    ...found.map((f) => `  line ${f.line}: ${f.rule.name} — \`${f.value}\`\n    ${f.rule.why}`),
    '',
    'Rewrite using semantic `fui:` utilities from src/tokens/bridge.css.',
    'This check is a convenience only: `npm run lint:tokens` is a required CI gate',
    'applying these exact rules from the same module, and it cannot be bypassed.',
  ].join('\n'),
)
process.exit(2)
