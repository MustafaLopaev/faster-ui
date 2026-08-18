// Public API — the only export surface of `faster-ui`.
// The token stylesheet is imported here so the library build emits dist/styles.css.
import './tokens/tokens.css'

export { Button } from './components/Button'
export type { ButtonProps } from './components/Button'
