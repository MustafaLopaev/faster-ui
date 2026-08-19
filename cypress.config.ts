import { defineConfig } from 'cypress'
import { mkdirSync, renameSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const VISUAL_PORT = 8199
const CURRENT_DIR = 'visual/current'
const isConsumers = process.env.FUI_SUITE === 'consumers'

export default defineConfig({
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    // Two disjoint sets in one section. `cy:ct` and `test:a11y` are separate CI
    // gates and a red verdict must name exactly one of them (FR-002), so the
    // a11y sweep is excluded from the default set and selected by name.
    //
    // The switch is an env var rather than `--spec` or `--config specPattern`
    // because Cypress INTERSECTS both of those with the testing-type's own
    // `specPattern` — an excluded spec cannot be selected back in (verified:
    // both forms report "no spec files were found").
    specPattern:
      process.env.FUI_SUITE === 'a11y' ? 'src/**/*.a11y.cy.tsx' : 'src/**/!(*.a11y).cy.tsx',
    setupNodeEvents(on) {
      // axe violations are collected in the browser; without a task they never
      // reach the headless run's stdout and a CI failure says only "1 violation".
      on('task', {
        'a11y:log'(message: string) {
          console.log(`  ✖ ${message}`)
          return null
        },
      })
    },
  },

  // Two e2e suites, selected by FUI_SUITE (same switch idiom as the component
  // section above, and for the same reason — Cypress intersects `--spec` and
  // `--config specPattern` with the testing type's own value):
  //
  //   (unset)     visual capture against the built Storybook workbench
  //   consumers   the Next.js fixture's headless load, driven by
  //               scripts/consumer-smoke.mjs, which owns that server's lifecycle
  e2e: {
    // `vite preview` binds the hostname — a request to the literal loopback
    // address returns nothing (verified: 000 vs 200). Do not "normalise" this
    // to 127.0.0.1.
    baseUrl: isConsumers ? 'http://localhost:3100' : `http://localhost:${VISUAL_PORT}`,
    specPattern: isConsumers ? 'test/consumers/*.cy.ts' : 'visual/*.cy.ts',
    supportFile: false,
    video: false,
    screenshotsFolder: CURRENT_DIR,
    screenshotOnRunFailure: !isConsumers,
    trashAssetsBeforeRuns: true,
    // Neither e2e suite starts its own server: Cypress verifies `baseUrl` is
    // reachable BEFORE `before:run` fires, so a server started in this file is
    // always started too late. `scripts/visual-capture.mjs` and
    // `scripts/consumer-smoke.mjs` own their servers' lifecycles instead.
    setupNodeEvents(on) {
      on('task', {
        'visual:log'(message: string) {
          console.log(message)
          return null
        },
      })

      // Cypress nests screenshots under a per-spec folder and appends its own
      // suffixes. A visual cell's identity *is* its filename (data-model §6),
      // so the file is moved to exactly the name the spec asked for.
      on('after:screenshot', (details) => {
        const target = resolve(CURRENT_DIR, `${details.name ?? 'unnamed'}.png`)
        mkdirSync(dirname(target), { recursive: true })
        renameSync(details.path, target)
        return { path: target }
      })
    },
  },
})
