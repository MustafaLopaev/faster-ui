/**
 * One sticky comment per model-driven job per pull request.
 *
 * Each job owns a single comment identified by an HTML marker; re-runs update
 * it in place rather than stacking a new comment per push. This replaces the
 * `use_sticky_comment` behaviour of the retired claude-code-action, and it is
 * the SCRIPT that posts — the model returns text and holds no tools, so "the
 * verdict exists but was never posted" (findings.md F-9) is structurally gone.
 *
 * Posting needs `pull-requests: write` and GH_TOKEN; both come from the
 * calling workflow. With no PR number (local runs, MODEL_JOBS_DRY_RUN=1) the
 * comment is printed instead — that is the local test path, not an error.
 */
import { spawnSync } from 'node:child_process'

const gh = (args, input) => {
  const res = spawnSync('gh', args, { encoding: 'utf8', input, maxBuffer: 64 * 1024 * 1024 })
  if (res.status !== 0) console.error(`gh ${args.slice(0, 3).join(' ')} … failed:\n${res.stderr}`)
  return res.status === 0 ? res.stdout : ''
}

export function postStickyComment(prNumber, job, body) {
  const marker = `<!-- model-job:${job} -->`
  const full = `${marker}\n${body}\n\n<sub>\`${job}\` — model-driven and advisory. It cannot block this pull request (FR-017).</sub>`

  if (!prNumber || process.env.MODEL_JOBS_DRY_RUN === '1') {
    console.log(`\n── comment (${job}) — not posted (${prNumber ? 'dry run' : 'no PR number'}) ──\n`)
    console.log(full)
    return
  }

  const repo = process.env.GITHUB_REPOSITORY
  if (!repo) {
    console.error('GITHUB_REPOSITORY is not set — cannot post the comment.')
    console.log(full)
    return
  }

  const listed = gh(['api', `repos/${repo}/issues/${prNumber}/comments?per_page=100`])
  let existing
  try {
    existing = JSON.parse(listed || '[]').find((c) => typeof c.body === 'string' && c.body.startsWith(marker))
  } catch {
    existing = undefined
  }

  // The body travels via --input JSON so no shell/quoting rules apply to it.
  const payload = JSON.stringify({ body: full })
  if (existing) {
    gh(['api', '--method', 'PATCH', `repos/${repo}/issues/comments/${existing.id}`, '--input', '-'], payload)
    console.log(`Updated the sticky ${job} comment on #${prNumber}.`)
  } else {
    gh(['api', '--method', 'POST', `repos/${repo}/issues/${prNumber}/comments`, '--input', '-'], payload)
    console.log(`Posted the ${job} comment on #${prNumber}.`)
  }
}
