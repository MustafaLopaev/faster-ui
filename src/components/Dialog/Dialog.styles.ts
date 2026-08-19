import { DialogSize } from './Dialog.types'

/**
 * Dialog's style configuration — every class string the component can apply.
 * See `Button.styles.ts` for why these live outside the component file.
 *
 * The `dividers` preset moves padding from the panel onto each region, so most
 * maps below are keyed by that boolean rather than by size.
 */

/**
 * `open:flex` keys the layout to `[open]` so the closed dialog keeps the UA's
 * `display:none`; the `::backdrop` scrim is the overlay token, no extra DOM (R-8).
 */
export const DIALOG_PANEL =
  'fui:box-border fui:open:flex fui:flex-col fui:bg-surface-raised fui:text-text-control fui:font-sans fui:rounded-surface fui:shadow-elevation-4 fui:border-0 fui:backdrop:bg-overlay'

export const DIALOG_SIZE_WIDTH: Record<DialogSize, string> = {
  [DialogSize.sm]: 'fui:w-100',
  [DialogSize.md]: 'fui:w-150',
  [DialogSize.lg]: 'fui:w-225',
}

/** Undivided panels pad themselves; divided panels pad each region instead. */
export const DIALOG_PANEL_PADDING = {
  divided: 'fui:p-0',
  plain: 'fui:p-6',
} as const

export const DIALOG_HEADER = 'fui:flex fui:shrink-0 fui:items-center fui:justify-between fui:gap-2'

export const DIALOG_HEADER_SPACING = {
  divided: 'fui:px-6 fui:py-4',
  plain: 'fui:mb-4',
} as const

export const DIALOG_TITLE = 'fui:m-0 fui:text-title fui:font-medium fui:text-text-heading'

export const DIALOG_CLOSE_BUTTON =
  'fui:size-3.5 fui:p-0 fui:m-0 fui:bg-transparent fui:border-0 fui:cursor-pointer fui:text-icon-muted'

export const DIALOG_FOCUS_RING =
  'fui:focus-visible:outline-2 fui:focus-visible:outline-solid fui:focus-visible:outline-offset-2 fui:focus-visible:outline-focus-ring'

export const DIALOG_DIVIDER =
  'fui:shrink-0 fui:border-0 fui:border-t fui:border-solid fui:border-border-strong'

export const DIALOG_BODY =
  'fui:flex-1 fui:min-h-0 fui:overflow-y-auto fui:text-body fui:font-regular fui:text-text-control'

export const DIALOG_BODY_SPACING = {
  divided: 'fui:px-6 fui:py-4',
  plain: '',
} as const

export const DIALOG_FOOTER = 'fui:flex fui:shrink-0 fui:items-center fui:justify-end fui:gap-2'

export const DIALOG_FOOTER_SPACING = {
  divided: 'fui:px-6 fui:py-4',
  plain: 'fui:mt-8',
} as const
