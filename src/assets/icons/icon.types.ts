/**
 * Icon assets are presentational by contract.
 *
 * Each one hides itself from the accessibility tree (`aria-hidden`), inherits
 * its colour from the surrounding text (`currentColor`), and fills whatever box
 * its slot gives it (`fui:size-full`). None takes props: the slot owns the
 * geometry and the control owns the colour, so an icon that accepted a size or
 * a colour would be a second, competing source of truth for both.
 *
 * They are private to the library — reachable from components, never exported
 * through `src/index.ts`.
 */

/** The class every icon carries: fill the slot, nothing else. */
export const ICON_BASE = 'fui:size-full'
