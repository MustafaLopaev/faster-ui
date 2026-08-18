import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Dev playground shell — token-styled content lands with the token system (US1).
function Playground() {
  return <main>Faster UI dev playground</main>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
)
