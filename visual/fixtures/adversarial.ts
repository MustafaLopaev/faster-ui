/**
 * The adversarial content set (004 FR-028).
 *
 * GENERATED ONCE, THEN FROZEN. Every string below is a literal, checked in, and
 * never computed at run time. A fixture that regenerates itself — a random
 * string, a `.repeat()` driven by a changing length, a locale-dependent format —
 * makes the visual matrix irreproducible: two runs of the same commit produce
 * different pixels and every baseline comparison becomes noise.
 *
 * If a case needs to change, change it here, in a commit, and re-accept the
 * baselines it moves. That is the whole mechanism.
 *
 * Each case targets a failure mode that ordinary example content never reaches.
 */

/** 200 characters. Overflow, wrapping, and the interaction with `min-width`. */
export const LONG_LABEL =
  'Reticulating splines across the entire viewport until something finally gives way and the layout has to decide whether to wrap, to truncate, or to push its neighbour off the edge of the screen entirely'

/** Arabic. Right-to-left layout, and the order adornments resolve to under rtl. */
export const RTL_TEXT = 'حفظ التغييرات إلى مساحة العمل'

/**
 * Emoji with combining marks and a skin-tone modifier. Line-height and baseline
 * stability: these glyphs are routinely taller than the Latin ramp and are what
 * pushes a fixed-height control's text off centre.
 */
export const EMOJI_TEXT = 'Save 👍🏽 to é́́ cloud ☁️ now'

/**
 * A zero-width-joiner sequence — one user-perceived character built from four
 * code points. Grapheme handling under truncation: a naive `slice()` splits it
 * and renders two people and a stray glyph instead of a family.
 */
export const ZWJ_TEXT = 'Family 👨‍👩‍👧‍👦 plan'

/** The opposite boundary from LONG_LABEL: nothing, and almost nothing. */
export const EMPTY_TEXT = ''
export const SINGLE_CHAR_TEXT = 'M'

/** 500 rows. Scroll containment, and whether header and footer stay put. */
export const LONG_BODY_ROWS: readonly string[] = Array.from(
  { length: 500 },
  (_, i) => `Row ${String(i + 1).padStart(3, '0')} — every one of these must scroll inside the panel.`,
)

export interface AdversarialCase {
  /** Story-name fragment; also the `-adversarial-<id>` part of a cell filename. */
  id: string
  /** What this case is for — rendered as the story's caption so a diff is legible. */
  purpose: string
}

export const ADVERSARIAL_CASES: readonly AdversarialCase[] = [
  { id: 'long-label', purpose: '200-character label — overflow, wrapping, min-width interaction' },
  { id: 'rtl', purpose: 'Arabic string — right-to-left layout and adornment order' },
  { id: 'emoji', purpose: 'Emoji with combining marks — line-height and baseline stability' },
  { id: 'zwj', purpose: 'Zero-width-joiner sequence — grapheme handling under truncation' },
  { id: 'long-body', purpose: '500-row modal body — scroll containment, header/footer stickiness' },
  { id: 'boundary', purpose: 'Empty string and a single character — the opposite boundary' },
]
