import type { Config } from 'jest'

// Standalone from Vite by design (constitution: Jest mandated over Vitest).
// @swc/jest transforms TS/TSX with the automatic JSX runtime; token CSS is
// stubbed — Jest asserts behavior, visual/token assertions live in Cypress.
const config: Config = {
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/**/*.test.tsx'],
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
}

export default config
