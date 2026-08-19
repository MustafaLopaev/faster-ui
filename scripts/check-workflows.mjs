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
 * The one model-driven JOB allowed to write, and only ever onto a new branch
 * (FR-034).
 *
 * The unit here is the job, not the file, and that distinction is load-bearing:
 * `visual.yml` contains both a job that writes (`accept-baselines`, which opens
 * a baseline pull request and holds no credential) and jobs that hold the
 * credential (`visual-judge`, `nightly-sweep`, which cannot write). Neither job
 * holds both, so the pairing this rule exists to prevent — something that can be
 * talked into an action AND can carry it out — never arises. A file-level rule
 * would have to be silenced here, and silencing it would also stop it catching
 * the real thing.
 */
const MODEL_DRIVEN_JOBS_THAT_MAY_WRITE = new Set(['draft-changelog'])

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

  // A workflow-level `contents: write` reaches every job in the file, so it is
  // read once and applied per job below.
  const workflowGrantsWrite = /^permissions:\n(?:\s+\w[\w-]*:.*\n)*?\s+contents:\s*write/m.test(text)

  const triggersOnPullRequest = /^\s+pull_request:/m.test(text)

  for (const job of jobs) {
    if (!job.text.includes(SECRET)) continue

    // 3. The pairing that matters: a job that holds the model credential must
    //    not also hold write access. A job that cannot write cannot be talked
    //    into writing — injection hardening measure 1, the strongest of the four.
    const jobGrantsWrite = workflowGrantsWrite || /^\s+contents:\s*write/m.test(job.text)
    if (jobGrantsWrite && !MODEL_DRIVEN_JOBS_THAT_MAY_WRITE.has(job.id)) {
      fail(
        file,
        `job \`${job.id}\` holds ${SECRET} AND has \`contents: write\`. A model-driven ` +
          'job that can write is a job an injected instruction can make write.',
      )
    }

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
    //    A job pinned to a non-pull_request event cannot be reached from a fork
    //    at all — a scheduled run has no pull-request context — so requiring the
    //    guard there would be noise, and noise is how a check gets ignored.
    const pinnedToOtherEvent =
      /github\.event_name\s*==\s*'(?!pull_request')[a-z_]+'/.test(job.text) &&
      !/github\.event_name\s*==\s*'pull_request'/.test(job.text)

    if (triggersOnPullRequest && !pinnedToOtherEvent && !job.text.includes(FORK_GUARD)) {
      fail(
        file,
        `job \`${job.id}\` uses ${SECRET} and can run on a pull_request event without the ` +
          `fork guard \`if: ${FORK_GUARD}\`.`,
      )
    }
  }
}

console.log(`Workflow invariants — ${files.length} files: ${files.join(', ')}\n`)

if (problems.length === 0) {
  console.log('✔ No required workflow touches the credential; no job holds it without the')
  console.log('  guard and the fork condition; nothing uses pull_request_target; no')
  console.log('  model-driven job can both hold the credential and write.')
  process.exit(0)
}

for (const p of problems) console.error(`✖ ${p}`)
console.error(`\n✖ ${problems.length} workflow invariant violation(s).`)
process.exit(1)
