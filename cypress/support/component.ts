import { mount } from 'cypress/react'
// Real token styling for every mounted component — Cypress CT is where the
// compiled token chain is asserted (Jest stubs CSS).
import '../../src/tokens/tokens.css'

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
    }
  }
}

Cypress.Commands.add('mount', mount)
