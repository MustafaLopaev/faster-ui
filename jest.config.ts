import type { Config } from 'jest'

// Standalone from Vite by design (constitution: Jest mandated over Vitest).
// @swc/jest transforms TS/TSX with the automatic JSX runtime; token CSS is
// stubbed — Jest asserts behavior, visual/token assertions live in Cypress.
const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.ts?(x)'],
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true },
          transform: { react: { runtime: 'automatic' } },
        },
      },
    ],
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/jest/style-stub.js',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

  // Shipping code only: barrels re-export, stories and specs are the harness,
  // and main.tsx is the dev playground — none belong in the denominator.
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.cy.tsx',
    '!src/**/*.stories.tsx',
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
