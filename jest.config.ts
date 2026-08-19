import type { Config } from 'jest'

// Standalone from Vite by design (constitution: Jest mandated over Vitest).
// @swc/jest transforms TS/TSX with the automatic JSX runtime; token CSS is
// stubbed — Jest asserts behavior, visual/token assertions live in Cypress.
const transform: Config['transform'] = {
  '^.+\\.(t|j)sx?$': [
    '@swc/jest',
    {
      jsc: {
        parser: { syntax: 'typescript', tsx: true },
        transform: { react: { runtime: 'automatic' } },
      },
    },
  ],
}

const moduleNameMapper = {
  '\\.css$': '<rootDir>/jest/style-stub.js',
}

// The SSR suites are selected by name (`npm run test:ssr`), never by the unit
// run: `ssr-node` needs a built `dist/`, and the `test` gate depends on
// `install` only. Keeping them in separate projects also keeps a red verdict
// attributable to one gate (004 FR-002).
const SSR_SPECS = ['<rootDir>/src/ssr\\.test\\.tsx$', '<rootDir>/src/ssr-node\\.test\\.ts$']

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
      testPathIgnorePatterns: SSR_SPECS,
      transform,
      moduleNameMapper,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
    {
      // Server render → hydrate. jsdom supplies the client half; the assertion
      // is that hydrating into server markup reports nothing on either channel.
      displayName: 'ssr-dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/src/ssr.test.tsx'],
      transform,
      moduleNameMapper,
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    },
    {
      // The only environment that can catch a module-scope `document` read:
      // jsdom *provides* `document`, so such an access passes silently there
      // (research R-5). Subject is the built artifact — what consumers execute.
      displayName: 'ssr-node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/src/ssr-node.test.ts'],
      transform,
      moduleNameMapper,
    },
  ],

  // Shipping code only: barrels re-export, stories and specs are the harness,
  // and main.tsx is the dev playground — none belong in the denominator.
  // The SSR specs match `*.test.ts?(x)` and are excluded by the same rules.
  //
  // `*.styles.ts` is excluded for the same reason as barrels: it declares class
  // strings and has no behaviour to exercise. Left in, istanbul reports partial
  // coverage on multi-line string literals, which invites a pointless test to
  // "fix" a number that never meant anything. `*.types.ts` stays IN — it holds
  // the exported const objects (`ButtonVariant`, prop defaults) that are real
  // runtime values on the public API.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.cy.tsx',
    '!src/**/*.stories.tsx',
    '!src/**/*.styles.ts',
    '!src/**/index.ts',
    '!src/main.tsx',
  ],
  // A floor, not a target — set just under the suite's current numbers so a
  // regression fails CI while normal churn does not. Raise it deliberately.
  coverageThreshold: {
    global: { statements: 95, branches: 88, functions: 100, lines: 97 },
  },
}

export default config
