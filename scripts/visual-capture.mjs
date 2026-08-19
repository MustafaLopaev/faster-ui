/**
 * Visual capture driver (004 FR-024) — Pass 1 of three.
 *
 * Serves the built workbench and runs the Cypress capture spec against it.
 *
 * The server lives HERE rather than in `cypress.config.ts`'s `before:run` hook,
 * because Cypress verifies `baseUrl` is reachable BEFORE that hook fires — a
 * server started there is always started too late (verified: "Cypress failed to
 * verify that your server is running"). Owning the lifecycle here also means a
 * crashed run cannot leave a preview server holding the port.
 *
 * `vite preview` rather than a static-server package: Vite is already a
 * dependency and serves an arbitrary outDir, so this costs nothing (research
 * R-2). It binds **localhost** — a request to the literal loopback address
 * returns nothing (verified, 000 vs 200), which is why the origin is spelled
 * that way here and in cypress.config.ts.
 *
 * Cypress is spawned ASYNCHRONOUSLY and awaited. `spawnSync` would block this
 * process's event loop, and the preview server lives in it — the OS keeps
 * accepting connections into the listen backlog while nothing ever answers
 * them, so every capture dies with ESOCKETTIMEDOUT partway through the run
 * (verified the hard way).
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 8199

if (!existsSync(resolve(root, 'storybook-static/index.json'))) {
  console.error(
    '✖ storybook-static/ is missing. The workbench is what gets captured —\n' +
      '  run `npm run build-storybook` first.',
  )
  process.exit(1)
}

// `configFile: false` keeps the library build's lib-mode and dts plugins out of
// what is only ever a static file serve.
const server = await preview({
  configFile: false,
  root,
  build: { outDir: 'storybook-static' },
  preview: { port: PORT, strictPort: true, host: 'localhost' },
})

console.log(`Serving storybook-static on http://localhost:${PORT}`)

let status = 1
try {
  status = await new Promise((done, fail) => {
    const child = spawn('npx', ['--no-install', 'cypress', 'run', '--e2e'], {
      cwd: root,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.on('error', fail)
    child.on('close', (code) => done(code ?? 1))
  })
} finally {
  await server.close()
}

process.exit(status)
