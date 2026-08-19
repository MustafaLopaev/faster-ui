/**
 * The public surface record (004 FR-013).
 *
 *   npm run api:report   regenerate etc/faster-ui.api.md  (api-extractor --local)
 *   npm run api:check    fail if the committed record drifted
 *
 * Same tool, same config, one flag apart — that is the whole mechanism. A change
 * to the exported contract cannot be made silently: either the committed record
 * changes in the same commit and a reviewer sees it, or `api:check` exits
 * non-zero. `etc/faster-ui.api.md`, not `dist/index.d.ts`, is the reviewable
 * contract.
 *
 * The report ships with one known warning — `ae-forgotten-export` for
 * `ButtonBaseProps` — recorded rather than silenced. See api-extractor.json.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const local = process.argv.includes('--local')
const REPORT = r('etc/faster-ui.api.md')
const ENTRY = r('dist/index.d.ts')

if (!existsSync(ENTRY)) {
  console.error(
    '✖ dist/index.d.ts is missing. The surface record is extracted from the BUILT\n' +
      '  declaration file — run `npm run build` first. In CI the `api-surface` job\n' +
      '  depends on `build` for exactly this reason.',
  )
  process.exit(1)
}

const before = existsSync(REPORT) ? readFileSync(REPORT, 'utf8') : null

if (!local && before === null) {
  console.error(
    '✖ etc/faster-ui.api.md does not exist.\n' +
      '  Run `npm run api:report`, review the generated record, and commit it.\n' +
      '  A missing record is not an empty contract — it is an unrecorded one.',
  )
  process.exit(1)
}

const result = spawnSync(
  process.execPath,
  [r('node_modules/@microsoft/api-extractor/bin/api-extractor'), 'run', ...(local ? ['--local'] : [])],
  { cwd: root, stdio: 'inherit' },
)

// api-extractor writes a temp copy next to the report; it is a build artifact.
rmSync(r('temp'), { recursive: true, force: true })

if (result.status !== 0) {
  if (!local) {
    console.error(
      '\n✖ The public surface has changed and etc/faster-ui.api.md does not record it.\n' +
        '  Run `npm run api:report`, read the diff — it is the change your consumers\n' +
        '  will see — and commit it alongside the change that caused it.',
    )
  }
  process.exit(result.status ?? 1)
}

// TypeScript version skew is ACCEPTED, not suppressed: the project is on 6.0.x
// and api-extractor bundles 5.9.x. Analysis succeeds (verified). A suppressed
// skew warning becomes an invisible correctness risk the next time the language
// moves, so it is surfaced here rather than filtered out of the log.
if (local) {
  const after = readFileSync(REPORT, 'utf8')
  console.log(
    before === null
      ? `\n✔ Wrote etc/faster-ui.api.md (${after.length} B). Review it — this file is the public contract.`
      : before === after
        ? '\n✔ etc/faster-ui.api.md is already up to date.'
        : `\n✔ Updated etc/faster-ui.api.md (${before.length} B → ${after.length} B). Review the diff before committing.`,
  )
} else {
  console.log('\n✔ The public surface matches the committed record.')
}
