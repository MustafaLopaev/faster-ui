/**
 * Structural safety invariants for the workflow files (004 FR-017/FR-018/FR-019).
 *
 * These are the properties that keep the pipeline usable by someone who has no
 * credential, and keep a secret away from unreviewed code. Every one of them is
 * true today by construction — which is exactly why they need a check. They are
 * the kind of property that stays true until one hurried edit, and whose breach
 * is silent: nothing fails, the pipeline just quietly becomes unusable for fork
 * contributors, or quietly starts handing a secret to code nobody has read.
 *
 * Deliberately no YAML parser: these five assertions are about which strings
 * appear in which job of which file, the files are few and we author all of
 * them, and Principle VII asks a dependency to earn itself.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const WORKFLOWS = join(root, '.github/workflows')

const SECRET = 'ANTHROPIC_API_KEY'
const GUARD = 'actions/claude-guard'
const FORK_GUARD = 'github.event.pull_request.head.repo.full_name == github.repository'

/** ci.yml's jobs are the ones configured as required checks on `main`. */
const REQUIRED_CHECK_WORKFLOWS = new Set(['ci.yml', 'release.yml'])

/**
 * The one model-driven workflow allowed to write, and only ever onto a new
 * branch (FR-034). `release.yml` and `docs.yml` also write, but neither goes
 * anywhere near the model credential, so the pairing this rule guards against
 * — a job that can be talked into something AND can act on it — does not arise.
 */
const MODEL_DRIVEN_MAY_WRITE_CONTENTS = new Set(['changelog.yml'])

const problems = []
const fail = (file, message) => problems.push(`${file}: ${message}`)

/** Split a workflow into `jobs:` blocks by their two-space-indented ids. */
function jobsOf(text) {
  const jobsAt = text.indexOf('\njobs:')
  if (jobsAt === -1) return []
  const body = text.slice(jobsAt)
  const out = []
  const re = /^ {2}([A-Za-z0-9_-]+):$/gm
  const starts = [...body.matchAll(re)]
  for (const [i, m] of starts.entries()) {
    const end = i + 1 < starts.length ? starts[i + 1].index : body.length
    out.push({ id: m[1], text: body.slice(m.index, end) })
  }
  return out
}

const files = readdirSync(WORKFLOWS).filter((f) => f.endsWith('.yml'))

for (const file of files) {
  const text = readFileSync(join(WORKFLOWS, file), 'utf8')
  const jobs = jobsOf(text)

  // 1. FR-018 — `pull_request_target` is the mechanism that runs with
  //    repository secrets in the context of an unreviewed head ref. There is no
  //    configuration of it that makes reviewing untrusted diff content safe.
  if (/^\s*pull_request_target:/m.test(text)) {
    fail(file, 'uses `pull_request_target`, which FR-018 forbids outright.')
  }

  // 2. The Check invariant (data-model §1): needsCredential && required is
  //    forbidden. A check that cannot run for a fork must never block one, and
  //    the enforcement point is that no required workflow may touch the secret.
  if (REQUIRED_CHECK_WORKFLOWS.has(file) && text.includes(SECRET)) {
    fail(
      file,
      `references ${SECRET}, but its jobs are required checks. A check that cannot ` +
        'run for a fork must never be able to block one — move it to review.yml.',
    )
  }

  // 3. The pairing that matters: a workflow that holds the model credential must
  //    not also hold write access. A job that cannot write cannot be talked into
  //    writing — injection hardening measure 1, the strongest of the four.
  //    `changelog.yml` is the single exception, and it writes onto a new branch
  //    only; it may never push to the default branch (FR-034).
  if (
    text.includes(SECRET) &&
    /^\s+contents:\s*write/m.test(text) &&
    !MODEL_DRIVEN_MAY_WRITE_CONTENTS.has(file)
  ) {
    fail(
      file,
      'holds ' +
        SECRET +
        ' AND grants `contents: write`. A model-driven job that can write is a ' +
        'job an injected instruction can make write.',
    )
  }

  for (const job of jobs) {
    if (!job.text.includes(SECRET)) continue

    // 4. FR-019 — every model-driven job skips GREEN without the credential.
    if (!job.text.includes(GUARD)) {
      fail(
        file,
        `job \`${job.id}\` uses ${SECRET} without ./.github/actions/claude-guard. ` +
          'Without the guard the step runs with an empty key and the job turns red for ' +
          'a reason the contributor cannot fix (FR-019).',
      )
    }

    // 5. A fork-originated pull request must never reach a job holding a secret.
    if (/^on:/m.test(text) && /^\s+pull_request:/m.test(text) && !job.text.includes(FORK_GUARD)) {
      fail(
        file,
        `job \`${job.id}\` uses ${SECRET} on a pull_request trigger without the fork guard ` +
          `\`if: ${FORK_GUARD}\`.`,
      )
    }
  }
}

console.log(`Workflow invariants — ${files.length} files: ${files.join(', ')}\n`)

if (problems.length === 0) {
  console.log('✔ No required workflow touches the credential; no job holds it without the')
  console.log('  guard and the fork condition; nothing uses pull_request_target; no')
  console.log('  model-driven workflow can write except the changelog drafter.')
  process.exit(0)
}

for (const p of problems) console.error(`✖ ${p}`)
console.error(`\n✖ ${problems.length} workflow invariant violation(s).`)
process.exit(1)
