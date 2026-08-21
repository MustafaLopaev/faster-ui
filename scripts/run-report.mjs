/**
 * The overall results report — one self-contained HTML file per commit.
 *
 * Runs at the end of the pipeline (report.yml fires when CI completes) and
 * aggregates EVERYTHING that ran for that commit: every workflow, every job
 * with its conclusion and duration, the model-driven verdict comments, and the
 * artifacts each run produced. The file is uploaded as the `overall-report`
 * artifact and linked from a sticky pull-request comment.
 *
 * Two phases, one script:
 *   node scripts/run-report.mjs            gather + render overall-report.html
 *                                          (+ report-meta.json for phase 2)
 *   node scripts/run-report.mjs comment    post the sticky PR comment; reads
 *                                          report-meta.json and ARTIFACT_URL
 *
 * The split exists because the artifact URL only exists AFTER the upload step,
 * which sits between the two phases in report.yml.
 *
 * Reads only (GH_TOKEN + `actions: read`); no model credential anywhere in
 * this file. Everything that came from a run — job names, commit messages,
 * comment bodies — is escaped before it reaches the HTML: model comments are
 * derived from untrusted diffs, and this report must not be an injection
 * vector into the browser.
 *
 * Local use: HEAD_SHA defaults to the checked-out HEAD —
 *   npm run report && open overall-report.html
 */
import { spawnSync } from 'node:child_process'
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const SETTLE_INTERVAL_MS = 30_000
const SETTLE_MAX_MS = Number(process.env.REPORT_WAIT_MINUTES ?? 15) * 60_000

const sh = (cmd, args) => {
  const res = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return res.status === 0 ? res.stdout : ''
}
const ghJson = (path) => {
  const out = sh('gh', ['api', path])
  try {
    return JSON.parse(out)
  } catch {
    return null
  }
}

const repo = process.env.GITHUB_REPOSITORY || sh('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim()
let sha = process.env.HEAD_SHA || sh('git', ['rev-parse', 'HEAD']).trim()
const selfRunId = process.env.GITHUB_RUN_ID || ''
if (!repo || !sha) {
  console.error('✖ Need a repository (GITHUB_REPOSITORY or gh auth) and a commit (HEAD_SHA or a checkout).')
  process.exit(1)
}
// The runs endpoint filters on the FULL sha; a short one silently matches nothing.
if (sha.length < 40) {
  const full = ghJson(`repos/${repo}/commits/${sha}`)?.sha
  if (!full) {
    console.error(`✖ Could not resolve ${sha} to a full commit sha on ${repo}.`)
    process.exit(1)
  }
  sha = full
}

// ── status vocabulary ────────────────────────────────────────────────────────
// Status colors are reserved and never carry meaning alone — every badge pairs
// an icon and a label with its color (dataviz non-negotiable).
const STATUS = {
  success: { label: 'pass', icon: '✓', cls: 'good' },
  failure: { label: 'fail', icon: '✕', cls: 'critical' },
  cancelled: { label: 'cancelled', icon: '⊘', cls: 'serious' },
  timed_out: { label: 'timed out', icon: '⊘', cls: 'serious' },
  action_required: { label: 'action required', icon: '!', cls: 'serious' },
  skipped: { label: 'skipped', icon: '–', cls: 'neutral' },
  neutral: { label: 'neutral', icon: '–', cls: 'neutral' },
  in_progress: { label: 'in progress', icon: '…', cls: 'warning' },
  queued: { label: 'queued', icon: '…', cls: 'warning' },
}
const statusOf = (conclusion, status) => STATUS[conclusion ?? ''] ?? STATUS[status ?? ''] ?? STATUS.neutral

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const fmtDuration = (start, end) => {
  if (!start || !end) return '—'
  const s = Math.max(0, Math.round((new Date(end) - new Date(start)) / 1000))
  return s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
}

/**
 * Minimal, escape-first Markdown for the model comments. The input is escaped
 * BEFORE any transform, so nothing an injected diff smuggled into a verdict
 * can become live markup here.
 */
function mdLite(raw) {
  const lines = esc(raw).split('\n')
  const out = []
  let inList = false
  for (const line of lines) {
    const inline = (t) =>
      t
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    if (/^\s*[-*] /.test(line)) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(line.replace(/^\s*[-*] /, ''))}</li>`)
      continue
    }
    if (inList) {
      out.push('</ul>')
      inList = false
    }
    if (/^#{1,4} /.test(line)) {
      out.push(`<p class="md-h">${inline(line.replace(/^#{1,4} /, ''))}</p>`)
    } else if (line.startsWith('&gt; ')) {
      out.push(`<p class="md-quote">${inline(line.slice(5))}</p>`)
    } else if (line.startsWith('|')) {
      out.push(`<p class="md-row">${inline(line)}</p>`)
    } else if (line.trim() === '') {
      out.push('')
    } else {
      out.push(`<p>${inline(line)}</p>`)
    }
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}

// ── phase 2: the sticky comment ──────────────────────────────────────────────
if (process.argv[2] === 'comment') {
  const meta = JSON.parse(readFileSync(r('report-meta.json'), 'utf8'))
  if (!meta.prNumber) {
    console.log('No pull request is associated with this commit — nothing to comment on.')
    process.exit(0)
  }
  const { postStickyComment } = await import('./sticky-comment.mjs')
  const link = process.env.ARTIFACT_URL
    ? `**[Download the full HTML report](${process.env.ARTIFACT_URL})** (\`overall-report\` artifact)`
    : '_The full HTML report is the `overall-report` artifact on the report run._'
  postStickyComment(
    meta.prNumber,
    'overall-report',
    [`**Overall results for \`${meta.sha.slice(0, 7)}\`** — ${meta.headline}`, '', meta.table, '', link].join('\n'),
  )
  process.exit(0)
}

// ── phase 1: gather ──────────────────────────────────────────────────────────
console.log(`Collecting results for ${repo}@${sha.slice(0, 7)}…`)

const fetchRuns = () =>
  (ghJson(`repos/${repo}/actions/runs?head_sha=${sha}&per_page=100`)?.workflow_runs ?? []).filter(
    (run) => String(run.id) !== selfRunId,
  )

// The pipeline is several workflows; CI finishing (our trigger) does not mean
// Review or Visual have. Wait for the whole picture, bounded.
let runs = fetchRuns()
const deadline = Date.now() + SETTLE_MAX_MS
/* oxlint-disable no-await-in-loop -- polling is sequential by definition */
while (runs.some((run) => run.status !== 'completed') && Date.now() < deadline) {
  const busy = runs.filter((run) => run.status !== 'completed').map((run) => run.name)
  console.log(`  waiting on: ${busy.join(', ')}`)
  await new Promise((done) => setTimeout(done, SETTLE_INTERVAL_MS))
  runs = fetchRuns()
}
/* oxlint-enable no-await-in-loop */
if (runs.some((run) => run.status !== 'completed')) {
  console.log('  ⚠ some runs are still going after the wait window — reporting them as in progress.')
}
if (runs.length === 0) {
  console.log('⚠ No workflow runs found for this commit — the report will be an empty shell.')
}
runs.sort((a, b) => new Date(a.run_started_at) - new Date(b.run_started_at))

const commit = ghJson(`repos/${repo}/commits/${sha}`)
const prs = ghJson(`repos/${repo}/commits/${sha}/pulls`) ?? []
const pr = prs[0] ?? null

const details = runs.map((run) => ({
  run,
  jobs: ghJson(`repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`)?.jobs ?? [],
  artifacts: ghJson(`repos/${repo}/actions/runs/${run.id}/artifacts`)?.artifacts ?? [],
}))

// The model jobs' verdicts live as sticky comments on the PR, one marker each.
const modelComments = pr
  ? (ghJson(`repos/${repo}/issues/${pr.number}/comments?per_page=100`) ?? [])
      .filter((c) => typeof c.body === 'string' && c.body.startsWith('<!-- model-job:') && !c.body.startsWith('<!-- model-job:overall-report'))
      .map((c) => ({
        job: c.body.match(/<!-- model-job:([\w-]+) -->/)?.[1] ?? 'model job',
        body: c.body.replace(/<!-- model-job:[\w-]+ -->\n?/, '').replace(/\n*<sub>.*<\/sub>\s*$/s, ''),
        updated: c.updated_at,
        url: c.html_url,
      }))
  : []

// ── tallies ──────────────────────────────────────────────────────────────────
const allJobs = details.flatMap((d) => d.jobs)
const tally = { pass: 0, fail: 0, skipped: 0, other: 0 }
for (const job of allJobs) {
  if (job.conclusion === 'success') tally.pass += 1
  else if (job.conclusion === 'failure') tally.fail += 1
  else if (job.conclusion === 'skipped') tally.skipped += 1
  else tally.other += 1
}
const overallCls = tally.fail > 0 ? 'critical' : tally.other > 0 ? 'warning' : 'good'
const overallText = tally.fail > 0 ? 'failing' : tally.other > 0 ? 'unsettled' : 'all green'
const overallIcon = tally.fail > 0 ? '✕' : tally.other > 0 ? '…' : '✓'

// ── render ───────────────────────────────────────────────────────────────────
const branch = runs[0]?.head_branch ?? ''
const title = `Results — ${sha.slice(0, 7)}`
const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC'

const badge = (conclusion, status) => {
  const s = statusOf(conclusion, status)
  return `<span class="badge ${s.cls}"><span class="icon" aria-hidden="true">${s.icon}</span>${s.label}</span>`
}

const workflowSection = ({ run, jobs, artifacts }) => `
  <section class="card">
    <div class="card-head">
      <h2><a href="${esc(run.html_url)}">${esc(run.name)}</a></h2>
      <div class="card-meta">
        <span class="event">${esc(run.event)}</span>
        <span class="dur">${fmtDuration(run.run_started_at, run.updated_at)}</span>
        ${badge(run.conclusion, run.status)}
      </div>
    </div>
    <table>
      <thead><tr><th>Job</th><th>Result</th><th>Duration</th></tr></thead>
      <tbody>
        ${jobs
          .map(
            (job) => `<tr>
          <td><a href="${esc(job.html_url)}">${esc(job.name)}</a></td>
          <td>${badge(job.conclusion, job.status)}</td>
          <td class="dur">${job.conclusion === 'skipped' ? '—' : fmtDuration(job.started_at, job.completed_at)}</td>
        </tr>`,
          )
          .join('\n')}
      </tbody>
    </table>
    ${
      artifacts.length
        ? `<p class="artifacts">Artifacts: ${artifacts
            .map((a) => `<a href="${esc(run.html_url)}#artifacts"><code>${esc(a.name)}</code></a> (${Math.round(a.size_in_bytes / 1024)} KB)`)
            .join(' · ')}</p>`
        : ''
    }
  </section>`

const modelSection = modelComments.length
  ? `
  <section class="card">
    <div class="card-head"><h2>Model-driven verdicts</h2>
      <div class="card-meta"><span class="event">advisory — none of these can block a merge</span></div>
    </div>
    ${modelComments
      .map(
        (c) => `<details class="verdict" open>
      <summary><code>${esc(c.job)}</code> <a class="dur" href="${esc(c.url)}">updated ${esc(c.updated.replace('T', ' ').slice(0, 16))} UTC</a></summary>
      <div class="md">${mdLite(c.body)}</div>
    </details>`,
      )
      .join('\n')}
  </section>`
  : ''

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  :root {
    --bg: #fcfcfb; --surface: #ffffff; --border: #e4e4e0;
    --ink: #1f2328; --ink-2: #57606a; --ink-3: #8b949e;
    --good: #0ca30c; --warning: #b97e02; --serious: #c05621; --critical: #d03b3b; --neutral: #6e7781;
    --good-bg: #0ca30c1a; --warning-bg: #fab2192b; --serious-bg: #ec835a26; --critical-bg: #d03b3b1a; --neutral-bg: #6e778117;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #1a1a19; --surface: #232322; --border: #3a3a38;
      --ink: #e6e6e3; --ink-2: #a8a8a4; --ink-3: #7c7c78;
      --good: #35c435; --warning: #fab219; --serious: #ec835a; --critical: #e46262; --neutral: #9a9a95;
      --good-bg: #0ca30c26; --warning-bg: #fab21921; --serious-bg: #ec835a21; --critical-bg: #d03b3b26; --neutral-bg: #9a9a9517;
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 32px 20px 64px; background: var(--bg); color: var(--ink);
    font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
  main { max-width: 880px; margin: 0 auto; }
  a { color: inherit; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.92em;
         background: var(--neutral-bg); padding: 1px 5px; border-radius: 4px; }
  header h1 { margin: 0 0 4px; font-size: 24px; }
  header .sub { color: var(--ink-2); margin: 0 0 6px; }
  header .msg { color: var(--ink-2); font-style: italic; margin: 0; }
  .tiles { display: flex; flex-wrap: wrap; gap: 12px; margin: 24px 0; }
  .tile { flex: 1 1 150px; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 14px 18px; }
  .tile .n { font-size: 30px; font-weight: 700; line-height: 1.15; }
  .tile .t { color: var(--ink-2); font-size: 13px; }
  .tile.overall .n { display: flex; align-items: center; gap: 10px; font-size: 22px; }
  .tile.good .n { color: var(--good); } .tile.critical .n { color: var(--critical); }
  .tile.warning .n { color: var(--warning); } .tile.neutral .n { color: var(--neutral); }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px; padding: 18px 20px; margin: 18px 0; }
  .card-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px; }
  .card-head h2 { margin: 0; font-size: 17px; }
  .card-head h2 a { text-decoration: none; }
  .card-head h2 a:hover { text-decoration: underline; }
  .card-meta { display: flex; align-items: center; gap: 12px; }
  .event { color: var(--ink-3); font-size: 13px; }
  .dur { color: var(--ink-2); font-size: 13px; font-variant-numeric: tabular-nums; }
  .table-wrap, table { width: 100%; }
  table { border-collapse: collapse; margin-top: 10px; }
  th { text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em;
       color: var(--ink-3); font-weight: 600; padding: 6px 10px 6px 0; border-bottom: 1px solid var(--border); }
  td { padding: 7px 10px 7px 0; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: 0; }
  td a { text-decoration: none; }
  td a:hover { text-decoration: underline; }
  .badge { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600;
           padding: 2px 10px 2px 8px; border-radius: 999px; white-space: nowrap; }
  .badge .icon { font-weight: 700; }
  .badge.good { color: var(--good); background: var(--good-bg); }
  .badge.critical { color: var(--critical); background: var(--critical-bg); }
  .badge.serious { color: var(--serious); background: var(--serious-bg); }
  .badge.warning { color: var(--warning); background: var(--warning-bg); }
  .badge.neutral { color: var(--neutral); background: var(--neutral-bg); }
  .artifacts { color: var(--ink-2); font-size: 13.5px; margin: 12px 0 0; }
  .verdict { border-top: 1px solid var(--border); padding: 10px 0; }
  .verdict summary { cursor: pointer; display: flex; align-items: baseline; gap: 10px; }
  .md { margin-top: 8px; color: var(--ink); font-size: 14px; }
  .md p { margin: 6px 0; }
  .md .md-h { font-weight: 700; margin-top: 12px; }
  .md .md-quote { color: var(--ink-2); border-left: 3px solid var(--border); padding-left: 10px; }
  .md .md-row { font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; white-space: pre-wrap; margin: 2px 0; }
  .md ul { margin: 6px 0; padding-left: 22px; }
  footer { color: var(--ink-3); font-size: 12.5px; margin-top: 28px; }
</style>
</head>
<body>
<main>
  <header>
    <h1>Overall results</h1>
    <p class="sub">
      <code>${esc(repo)}</code> ·
      <a href="https://github.com/${esc(repo)}/commit/${esc(sha)}"><code>${esc(sha.slice(0, 7))}</code></a>
      on <code>${esc(branch)}</code>
      ${pr ? ` · <a href="${esc(pr.html_url)}">PR #${esc(String(pr.number))}: ${esc(pr.title)}</a>` : ''}
    </p>
    ${commit ? `<p class="msg">“${esc(commit.commit.message.split('\n')[0])}” — ${esc(commit.commit.author?.name ?? '')}</p>` : ''}
  </header>

  <div class="tiles">
    <div class="tile overall ${overallCls}"><div class="n"><span aria-hidden="true">${overallIcon}</span>${overallText}</div><div class="t">overall</div></div>
    <div class="tile ${tally.pass ? 'good' : 'neutral'}"><div class="n">${tally.pass}</div><div class="t">jobs passed</div></div>
    <div class="tile ${tally.fail ? 'critical' : 'neutral'}"><div class="n">${tally.fail}</div><div class="t">jobs failed</div></div>
    <div class="tile neutral"><div class="n">${tally.skipped}</div><div class="t">skipped (by design)</div></div>
    <div class="tile ${tally.other ? 'warning' : 'neutral'}"><div class="n">${tally.other}</div><div class="t">other / unsettled</div></div>
  </div>

  ${details.map(workflowSection).join('\n')}
  ${modelSection}

  <footer>
    Generated ${esc(generatedAt)} by <code>scripts/run-report.mjs</code> (report.yml, fires when CI completes).
    Skipped jobs are path-filtered or mode-gated, not errors. Model-driven verdicts are advisory and can never
    block a merge (FR-017).
  </footer>
</main>
</body>
</html>
`

writeFileSync(r('overall-report.html'), html)

// ── the compact summary: stdout, step summary, and phase 2's input ───────────
const rows = details.map(({ run }) => {
  const s = statusOf(run.conclusion, run.status)
  return `| [${run.name}](${run.html_url}) | ${run.event} | ${s.icon} ${s.label} | ${fmtDuration(run.run_started_at, run.updated_at)} |`
})
const table = ['| Workflow | Event | Result | Duration |', '| -------- | ----- | ------ | -------- |', ...rows].join('\n')
const headline = `${overallIcon} **${overallText}** — ${tally.pass} passed, ${tally.fail} failed, ${tally.skipped} skipped across ${details.length} workflow(s)`

writeFileSync(r('report-meta.json'), JSON.stringify({ sha, prNumber: pr?.number ?? null, headline, table }, null, 2) + '\n')

const summary = `## Overall results — \`${sha.slice(0, 7)}\`\n\n${headline}\n\n${table}\n`
console.log(`\n${summary}`)
console.log(`Wrote overall-report.html (${Math.round(html.length / 1024)} KB) and report-meta.json.`)
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)

process.exit(tally.fail > 0 && process.env.REPORT_FAIL_ON_RED === '1' ? 1 : 0)
