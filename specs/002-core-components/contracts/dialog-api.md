# Contract: Dialog

Public API of `Dialog` (exported from `src/index.ts` with `DialogProps`).
Spec: FR-013..FR-017, A11Y-003; structure matrix in [spec.md](../spec.md).

## Type signature

```ts
type DialogSize = 'sm' | 'md' | 'lg'

export interface DialogProps
  extends Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'onClose'> {
  open: boolean                // controlled visibility (required)
  onClose: () => void          // every close intent (required)
  title?: ReactNode            // title row; accessible name via aria-labelledby
  footer?: ReactNode           // right-aligned actions (consumer passes md Buttons)
  size?: DialogSize            // default 'md' → panel width 400/600/900
  dividers?: boolean           // default false — "With divider" preset
  showClose?: boolean          // default true — header close button
}
// component: forwardRef<HTMLDialogElement, DialogProps>
```

## DOM shape (contract-relevant)

```text
<dialog aria-labelledby={titleId}?>   ← native element, showModal(); ::backdrop = overlay token
  <header>? title + closeButton(aria-label="Close")   ← unless !title && !showClose
  [divider]?                          ← when `dividers`
  <section>children</section>         ← body; scrolls when content overflows
  [divider]?                          ← when `dividers` and `footer`
  <footer>?                           ← right-aligned, gap 8
</dialog>
```

## Behavioral guarantees (each one test-asserted)

| # | Guarantee | Source |
| - | --------- | ------ |
| D1 | `open=false`: not rendered visible, absent from the a11y tree | FR-013 |
| D2 | `open` true → `showModal()`: top layer, background inert (pointer, Tab, AT), focus moves into the dialog | FR-013/014 |
| D3 | Escape fires `onClose()` exactly once and the dialog does NOT close itself; header close button likewise; a platform-forced close re-syncs via one `onClose()` | FR-013, R-8 |
| D4 | Close (open→false) and unmount-while-open both restore focus to the pre-open element | FR-014 |
| D5 | Focus is trapped: Tab from the last focusable stays within the dialog | FR-014 |
| D6 | Accessible name = `title` (aria-labelledby); consumer `aria-label` supported when no title | FR-016 |
| D7 | Panel geometry per matrix: width by `size` (400/600/900, viewport-capped), `radius-surface` (4px), Elevation/4, padding 24, content gap 16, footer gap 32, actions right-aligned gap 8; scrim = `overlay` token via `::backdrop` | FR-015/017 |
| D8 | Overflowing body scrolls; title/footer stay fixed | FR-017 |
| D9 | `dividers`: hairlines (`border-strong`) under header / above footer with the 16/24 padding rhythm | FR-017 |
| D10 | Ref reaches the `<dialog>`; unknown props pass through; scrim click does NOT close (A-4) | FR-020, A-4 |

Note: the Figma `Warning` preset is a composition story (research R-15), not API.
