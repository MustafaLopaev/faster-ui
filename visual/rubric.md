# Visual jury rubric

The cached prefix for Pass 3 (004 FR-027). Stable by design: everything here
changes rarely, so it caches cleanly, and only the changed cells — the volatile
part — come after it.

**You judge only cells the pixel comparison already flagged as `changed` or
`new`.** The comparison has settled *whether* something moved. Your job is the
part it cannot do: say *what* moved and whether it is a defect.

---

## The verdict

| Verdict | Meaning |
| ------- | ------- |
| `PASS` | The change is intended, or is a rendering difference with no user-visible consequence. |
| `WARN` | Something looks off but the evidence is thin — a 2px shift, a hairline that may be rounding. |
| `FAIL` | A real defect: content the user cannot read, reach, or use. |

`defect` is **required and non-empty** whenever the verdict is not `PASS`, and
it must name the defect:

> ✅ "the Button label is clipped at the right edge at 200% scaling; the last
> four characters are cut off by the 360px viewport"
>
> ❌ "differs from baseline"

The second says only what the comparison already said, at ten times the cost.
A finding a reviewer cannot act on is a finding they learn to scroll past.

`confidence: low` marks a cell for human attention. Use it rather than guessing —
a `low` is information; a confident wrong `PASS` is worse than no judgment.

---

## What is a defect

These are the failures a pixel comparison detects and cannot characterise. They
are why this pass exists.

- **Clipped or truncated text**, especially at 200% scaling (WCAG 1.4.4). The
  type ramp is rem-based, so the root font-size doubles the text *and* the boxes
  while the viewport stays 360px. Content that no longer fits is the finding.
- **The `lg` Dialog's 900px panel overflowing a 360px viewport** — the panel is
  viewport-capped; if it is not, say so.
- **A focus ring cropped** by an `overflow-hidden` ancestor. The ring is 2px
  with a 2px offset; a ring that is clipped on one side fails 2.4.11.
- **Icon baseline drift** at `sm` — the icon slot is 14px against a 12/18 ramp,
  and a misaligned glyph reads as a broken control.
- **Dark-mode borders vanishing** into their surface. `border-default` against
  `surface-raised` in dark mode is a low-contrast pair by design; disappearing
  entirely is not.
- **An error message reflowing the input row** rather than appearing beneath it.
- **Directional adornment order wrong under `rtl`** — a prefix that stays on the
  left, a chevron pointing the wrong way, a clear button that did not swap sides.
- **Adversarial content escaping its container** — the 200-character label
  pushing a neighbour off-screen, the 500-row body scrolling the page instead of
  the panel, an emoji sequence breaking the line box.

## What is not a defect

- **A deliberate token change.** If the diff is a colour shift consistent across
  every cell that uses that token, it is a re-theme, not a break. Say so and
  `PASS`.
- **Sub-pixel antialiasing differences** in text. The capture is pinned to one
  platform, so these should not occur — if you see only these, `PASS` with
  `confidence: low` and say the diff looks like rasterisation noise.
- **The default palette failing contrast.** It fails AA *by design*: 27
  deviations are pinned in `src/tokens/tokens.test.ts`, including the primary
  Button label at 2.11:1. That is a recorded, deliberate deviation and the token
  test owns it. Never report it here.
- **A `<dialog>` rendered without the `open` attribute in a server-rendered
  context.** Effects do not run on the server; this is correct.
- **Anything the deterministic gates already own** — axe violations, contrast
  ratios, packaging, the public surface. Re-reporting them is a false positive.

---

## The token contract, in one paragraph

Components use only semantic `fui:*` utilities. A raw colour or an
arbitrary-value utility is a constitution violation, but it is caught by the
token audit and the lint gate long before a pixel reaches you — do not look for
it here. What matters for judging pixels: `surface-page` is the page ground,
`surface-raised` is a panel or a field, `surface-sunken` is a disabled field.
`action-primary` is the brand fill, `on-action` is the label on it.
`border-default` is a control boundary, `border-strong` is a divider.
`feedback-error` is the error ink and the error border. In dark mode every one
of these is re-pointed by `.dark`, and the `aa` palette re-points a further
subset — so a colour that differs between a `figma` cell and its `aa`
counterpart is expected, and a colour that does *not* differ between them may be
the finding.

## Recorded deviations — never report these as defects

| What | Where it is recorded |
| ---- | -------------------- |
| The default palette does not reach AA (27 pinned pairs) | `src/tokens/tokens.test.ts` → `BASE_DEVIATIONS` |
| Input's `prefix`/`suffix` affixes are below 4.5:1 on **both** palettes | `src/tokens/tokens.test.ts` → `AA_DEVIATIONS`; `specs/004-quality-automation/findings.md` F-2 |
| `radius-surface` is 4px, not the 8px an early reading suggested | `specs/002-core-components/figma-extraction.md` |
| `ButtonBaseProps` is not exported | `etc/faster-ui.api.md`; findings.md F-1 |

## Cell identity

A cell's filename **is** its identity:

```
{storyId}__{theme}-{palette}-{viewport}-{scale}-{direction}-{motion}-{content}.png
```

So `components-button--primary__dark-aa-360-200-ltr-default-story.png` is the
Primary Button story, dark mode, AA overlay, 360px wide, 200% text scaling,
left-to-right, motion unrestricted, ordinary story content. Read the filename
before looking at the image — half the time it tells you what to look for.
