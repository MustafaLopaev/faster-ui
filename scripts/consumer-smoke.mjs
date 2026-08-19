/**
 * Consumer smoke matrix (004 FR-009/FR-010).
 *
 * Packs the library ONCE, then installs that tarball into three fixtures that
 * consume it the way a real application would. The tarball is the point: a
 * workspace link or `npm link` resolves through symlinks and bypasses the
 * `exports` map entirely — the classic way to ship a package that installs
 * fine and imports nowhere (research R-8).
 *
 * Four distinct failure modes, one per check:
 *
 *   publint       the manifest's declared shape
 *   attw --pack   how each TypeScript resolution mode ACTUALLY resolves it
 *   vite-app      a bundler consuming the ESM entry and the stylesheet
 *   next-app      server render → hydrate through a real framework, with the
 *                 browser console captured
 *   ts-resolution `tsc` finding the declarations under bundler/node16/nodenext
 *
 * The existing tarball audit in ci.yml verifies files EXIST. None of this
 * overlaps with it — that is the whole reason this gate is separate.
 *
 * Fixtures are not workspaces and are never part of the root install: adding
 * them there would put a framework in the library's own dependency graph,
 * which FR-004 forbids.
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const r = (p) => resolve(root, p)

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'))
const wants = (name) => only.length === 0 || only.includes(name)

let failures = []

function step(title) {
  console.log(`\n[1m── ${title}[0m`)
}

function run(cmd, args, opts = {}) {
  const shown = [cmd, ...args].join(' ')
  console.log(`   $ ${shown}${opts.cwd ? `   (in ${opts.cwd.replace(root, '.')})` : ''}`)
  const res = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
    env: { ...process.env, ...opts.env },
  })
  return res.status === 0
}

/**
 * Poll until the fixture's server answers, or give up loudly.
 *
 * The awaits below are sequential by definition — the point of polling is to
 * wait BETWEEN attempts. Parallelising them, as the lint rule suggests, would
 * mean firing every request at once against a port nothing is listening on.
 */
/* oxlint-disable no-await-in-loop */
async function waitForPort(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      if (res.status > 0) return true
    } catch {
      /* not listening yet */
    }
    await new Promise((done) => setTimeout(done, 250))
  }
  return false
}
/* oxlint-enable no-await-in-loop */

function check(label, ok) {
  if (ok) console.log(`   ✔ ${label}`)
  else {
    console.error(`   ✖ ${label}`)
    failures.push(label)
  }
  return ok
}

// ── 1. Pack once ────────────────────────────────────────────────────────────
step('Packing the library')

if (!existsSync(r('dist/index.js'))) {
  console.error(
    '✖ dist/ is missing. The fixtures consume the PACKED artifact — run `npm run build` first.\n' +
      '  In CI the `consumers` job depends on `build` for exactly this reason.',
  )
  process.exit(1)
}

const packDir = mkdtempSync(join(tmpdir(), 'fui-pack-'))
if (!run('npm', ['pack', '--pack-destination', packDir, '--silent'], { cwd: root })) {
  console.error('✖ npm pack failed')
  process.exit(1)
}
const tarball = join(packDir, readdirSync(packDir).find((f) => f.endsWith('.tgz')))
console.log(`   tarball: ${tarball}`)

// ── 2. Packaging linters, against the same tarball ──────────────────────────
if (wants('publint')) {
  step('publint — is the manifest well-formed?')
  check('publint', run('npx', ['--no-install', 'publint', tarball], { cwd: root }))
}

if (wants('attw')) {
  step('attw — does every resolution mode actually resolve it?')
  // `--pack` points attw at the tarball rather than the working tree, so it
  // sees exactly what npm publishes. A misordered `types` condition is
  // reported here by name.
  check('attw', run('npx', ['--no-install', 'attw', '--pack', tarball], { cwd: root }))
}

// ── 3. Fixtures ─────────────────────────────────────────────────────────────
function installFixture(name) {
  const cwd = r(`test/consumers/${name}`)
  const lock = join(cwd, 'package-lock.json')
  // Framework versions are pinned exactly in each fixture's own manifest and
  // lockfile, so a framework major release is a deliberate upgrade rather than
  // a surprise red build (FR-033 triages that case as infrastructure).
  const installed = existsSync(lock)
    ? run('npm', ['ci', '--no-audit', '--no-fund'], { cwd })
    : run('npm', ['install', '--no-audit', '--no-fund'], { cwd })
  if (!installed) return false
  // --no-save: the fixture's manifest and lockfile must not record a path that
  // only exists on this machine for this run.
  if (!run('npm', ['install', '--no-save', '--no-audit', '--no-fund', tarball], { cwd })) return false
  return checkSingleReact(name, cwd)
}

/**
 * One React, or the fixture is testing something else.
 *
 * `react` and `react-dom` are PEER dependencies. If the package ever declared
 * one as a real dependency, npm would install a second copy inside the
 * package's own node_modules and every hook in it would run against a different
 * React instance — hooks throw, context silently returns defaults, and the
 * failure looks nothing like its cause. Cheap to assert, miserable to debug.
 */
function checkSingleReact(name, cwd) {
  const res = spawnSync('npm', ['ls', 'react', '--all', '--json'], {
    cwd,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  let versions = new Set()
  const walk = (deps) => {
    for (const [dep, node] of Object.entries(deps ?? {})) {
      // A deduped node carries no `version` — it points at the single hoisted
      // copy, which is exactly the state being asserted.
      if (dep === 'react' && node.version) versions.add(node.version)
      walk(node.dependencies)
    }
  }
  try {
    walk(JSON.parse(res.stdout).dependencies)
  } catch {
    return check(`${name}: could not read the dependency tree`, false)
  }
  return check(
    `${name}: exactly one React copy (${[...versions].join(', ') || 'none resolved'})`,
    versions.size === 1,
  )
}

if (wants('ts-resolution')) {
  step('ts-resolution — bundler | node16 | nodenext')
  const cwd = r('test/consumers/ts-resolution')
  if (check('ts-resolution install', installFixture('ts-resolution'))) {
    for (const mode of ['bundler', 'node16', 'nodenext']) {
      check(
        `ts-resolution: moduleResolution=${mode}`,
        run('npx', ['--no-install', 'tsc', '-p', `tsconfig.${mode}.json`], { cwd }),
      )
    }
  }
}

if (wants('vite-app')) {
  step('vite-app — a bundler consuming the ESM entry and the stylesheet')
  const cwd = r('test/consumers/vite-app')
  if (check('vite-app install', installFixture('vite-app'))) {
    check('vite-app: tsc', run('npx', ['--no-install', 'tsc', '-p', 'tsconfig.json'], { cwd }))
    check('vite-app: build', run('npm', ['run', 'build'], { cwd }))
  }
}

if (wants('next-app')) {
  step('next-app — server render → hydrate, with the browser console captured')
  const cwd = r('test/consumers/next-app')
  if (check('next-app install', installFixture('next-app'))) {
    if (check('next-app: build', run('npm', ['run', 'build'], { cwd }))) {
      // The headless load runs through Cypress — already a devDependency and
      // already binary-cached in CI, so this adds no dependency and no second
      // browser stack (research R-1's reasoning, applied again here).
      //
      // The script owns the server's lifecycle rather than the Cypress config,
      // so a crashed run cannot leave a `next start` listening on 3100.
      const server = spawn('npm', ['run', 'start'], {
        cwd,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      })
      try {
        const up = await waitForPort('http://localhost:3100', 60_000)
        if (check('next-app: server started', up)) {
          check(
            'next-app: loads with zero console errors or warnings',
            run('npx', ['--no-install', 'cypress', 'run', '--e2e'], {
              cwd: root,
              env: { FUI_SUITE: 'consumers' },
            }),
          )
        }
      } finally {
        server.kill('SIGTERM')
      }
    }
  }
}

rmSync(packDir, { recursive: true, force: true })

console.log('')
if (failures.length > 0) {
  console.error(`✖ consumer smoke matrix: ${failures.length} failed\n   ${failures.join('\n   ')}`)
  process.exit(1)
}
console.log('✔ consumer smoke matrix: the packed artifact installs, resolves and runs.')
