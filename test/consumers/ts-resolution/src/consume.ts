/**
 * Type-level consumption only — no rendering, no bundler, no framework.
 *
 * This fixture answers one question the other two cannot: does `tsc` FIND the
 * declarations, under each resolution mode a consumer's project might be set
 * to? `bundler` is what most app templates ship with; `node16`/`nodenext` are
 * what a library or a server project uses, and they are far stricter about the
 * ordering of conditions in an `exports` map. Reordering `types` after `import`
 * is invisible to `bundler` and fatal to `node16` — which is precisely the
 * regression this fixture exists to catch (quickstart Scenario 2).
 */
import type {
  ButtonProps,
  ButtonSize,
  DialogProps,
  DialogSize,
  IconOnlyButtonProps,
  InputProps,
  InputSize,
  TextButtonProps,
} from '@mlopaev/faster-ui'
import { Button, Dialog, Input } from '@mlopaev/faster-ui'

// Every value export is reachable…
export const components = { Button, Dialog, Input }

// …and every type export is nameable. A removed or renamed export fails here
// before it ever reaches a consumer.
export const text: TextButtonProps = { variant: 'link', danger: true }
export const icon: IconOnlyButtonProps = { iconOnly: true, 'aria-label': 'Add' }
export const button: ButtonProps = text
export const buttonSize: ButtonSize = 'lg'
export const input: InputProps = { label: 'Email', clearable: true }
export const inputSize: InputSize = 'sm'
export const dialog: DialogProps = { open: false, onClose: () => {} }
export const dialogSize: DialogSize = 'md'

// The discriminated union must still discriminate: `iconOnly: true` forbids
// `danger`, and narrowing must work in consumer code. If a member were added
// without a major bump, exhaustiveness here is where it would show.
export function label(props: ButtonProps): string {
  return props.iconOnly ? props['aria-label'] : (props.variant ?? 'primary')
}
