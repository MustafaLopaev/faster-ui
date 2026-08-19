// Public API — the only export surface of `@mlopaev/faster-ui`.
// The token stylesheet is imported here so the library build emits dist/styles.css.
import './tokens/tokens.css'

export { Button } from './components/Button'
export type {
  ButtonProps,
  ButtonSize,
  TextButtonProps,
  IconOnlyButtonProps,
} from './components/Button'

export { Input } from './components/Input'
export type { InputProps, InputSize } from './components/Input'

export { Dialog } from './components/Dialog'
export type { DialogProps, DialogSize } from './components/Dialog'
