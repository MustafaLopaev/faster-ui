/**
 * Stop hook: lint and typecheck the files this session touched (004 C4).
 *
 * Like the token guard, this ENFORCES NOTHING NEW — `lint` and `typecheck` are
 * both required CI gates. It only moves the feedback from "after you push" to
 * "before you stop", which is the difference between a two-minute correction
 * and a red pull request.
 *
 * Scoped to changed files so it stays fast enough to actually leave enabled. A
 * check that adds thirty seconds to every turn gets removed within a week, and
 * then it is helping nobody.
 *
 * `typecheck` cannot be scoped — TypeScript's project graph is whole-program,
 * and checking one file in isolation would miss exactly the cross-file breakage
 * that matters. It runs only when a TS file changed, and it runs whole.
 */
import { spawnSync } from 'node:child_process'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const changed = spawnSync('git', ['status', '--porcelain', '--untracked-files=all'], {
  cwd: root,
  encoding: 'utf8',
})
  .stdout.split('\n')
  .map((line) => line.slice(3).trim())
  .filter((p) => /\.(ts|tsx|mjs|js|css)$/.test(p))

if (changed.length === 0) process.exit(0)

const problems = []

const lintable = changed.filter((p) => /\.(ts|tsx|mjs|js)$/.test(p))
if (lintable.length > 0) {
  const res = spawnSync('npx', ['--no-install', 'oxlint', '--max-warnings=0', ...lintable], {
    cwd: root,
    encoding: 'utf8',
  })
  if (res.status !== 0) problems.push(`lint:\n${(res.stdout || res.stderr).trim()}`)
}

if (changed.some((p) => /\.tsx?$/.test(p))) {
  const res = spawnSync('npx', ['--no-install', 'tsc', '-b'], { cwd: root, encoding: 'utf8' })
  if (res.status !== 0) problems.push(`typecheck:\n${(res.stdout || res.stderr).trim()}`)
}

if (problems.length === 0) process.exit(0)

console.error(
  [
    `${problems.length === 1 ? 'A check' : 'Checks'} failed on the files this session changed:`,
    '',
    ...problems,
    '',
    'Both of these are required CI gates — fixing them now costs less than a red',
    'pull request. Run `npm run lint` and `npm run typecheck` to reproduce.',
  ].join('\n'),
)
process.exit(2)
