# Figma Extraction Record: Button / Input / Dialog component pages

**Source file**: `taptap-design-copy`, key `7OfpQVe2pYpE9MF5pQeXhH`
**Extracted**: 2026-08-19 via Figma MCP (`use_figma` Plugin-API reads; 9 calls:
3 full page scans, 3 compact aggregations, 3 targeted gap probes).
Complements the foundation record
(`specs/001-foundation-tooling/figma-extraction.md`) with the complete per-set,
per-variant component evidence this feature's spec matrix is built from.

## 1. Button page (`15:12480`) — 11 component sets

Text-button sets (36 variants each = Size[Large/Medium/Small] ×
State[Default/Hover/Pressed/Disabled] × Left Icon[F/T] × Right Icon[F/T]):

| Set (node) | Role | Fill D/H/P/Dis | Stroke D/H/P/Dis | Text D/H/P/Dis | Weight |
| ---------- | ---- | -------------- | ---------------- | -------------- | ------ |
| Primary `15:12968` | primary | Primary/600/500/700/300 | — | White | Medium |
| Primary `15:13574` | primary danger | Danger/600/500/700/300 | — | White | Medium |
| Outline `15:14180` | outline | White | Neutral/300, Primary/500, Primary/700, Neutral/200 | Neutral/600, Primary/500, Primary/700, Neutral/400 | Regular |
| Outline `15:14786` | outline danger | White | Danger/600/500/700/400 | Danger/600/500/700/400 | Regular |
| Ghost `15:15392` | ghost | none, Neutral/100, Neutral/300, none | — | Neutral/600 ×3, Neutral/400 | Regular |
| Ghost `15:16001` | ghost danger | none, Danger/100, Danger/300, none | — | Danger/600, Danger/600, Danger/700, Danger/400 | Regular |
| Link `15:16610` | link | none | — | Primary/600/500/700/**400** | Regular |
| Link `15:17093` | link danger | none | — | Danger/600/500/700/400 | Regular |

Notes: NO Focus state on any set. NO Loading state on any set. Link has
`textDecoration: NONE` in every state (no underline). Link disabled is
Primary/400 — deliberately different from filled disabled Primary/300.

### 1a. Icon-only circular sets (in scope per Q1=B; 12 variants = Size × State, radius **100**, no label)

| Set (node) | Fill D/H/P/Dis | Stroke D/H/P/Dis | Icon glyph D/H/P/Dis |
| ---------- | -------------- | ---------------- | -------------------- |
| Primary `15:20350` | Primary/600, 500, 700, 300 | — | White ×4 |
| Outline `15:20577` | White, Neutral/100, Neutral/300, White | Neutral/300 ×3, Neutral/200 | Neutral/600 ×3, Neutral/400 |
| Ghost `15:20824` | none, Neutral/100, Neutral/300, none | — | Neutral/600 ×3, Neutral/400 |

Note the circular Outline hover/pressed pattern differs from the text Outline
set: the fill tints (Neutral/100/300) while the border stays Neutral/300 —
the border never turns teal. No danger or link icon-only sets exist.
Geometry (all 3 sets): square 40/36/24; padding 11/11, 10/10, 5/5; radius 100;
icon slot 18/16/14 with glyph 15/13.33/11.67 (L/M/S).

Geometry (all 8 text sets identical): radius 4; heights 40/36/24;
padding t/r/b/l 8/8/8/8, 7/8/7/8, 3/4/3/4; icon–label gap 4 (inner
auto-layout frame); icon instance 18px at Large; label ramps 16/24, 14/22,
12/18. Min-width guide lines (` Min Width` LINE nodes inside variants):
content 90/82/54 → total button min-width **106/98/62**. Link exception: no
padding/radius; height = line-height 24/22/18.

## 2. Input page (`11:7661`) — 7 component sets

Inventory: Basic `11:7949` (39), Left icon `11:8536` (39), Right icon
`11:9189` (39), Number `11:9747` (30), Prefix & Suffix `11:10328` (30),
Prefix `11:10945` (30), Suffix `11:11523` (30). Scope decision → spec Q2.

Basic variant axes: Size[Large/Medium/**Small**] ×
State[Default/Hover/Pressed & Focus/Disabled/Error] × Typing[F/T] ×
Text Entered[F/T] × State 2[Not Applicable/Clear Hover/Clear Pressed].
(Small size exists — corrects the foundation record which listed 40/36 only.)

Per-state evidence — border/fill live on inner `Base` RECTANGLE, stroke 1px,
radius 4 (Size=Large, Typing=F, Text Entered=F probes):

| State | Base fill | Base stroke | Placeholder | Entered text |
| ----- | --------- | ----------- | ----------- | ------------ |
| Default | White | Neutral/300 | Neutral/400 | Neutral/600 |
| Hover | White | Primary/500 | Neutral/400 | Neutral/600 |
| Pressed & Focus | White | Primary/600 | Neutral/400 | Neutral/600 |
| Disabled | Neutral/50 | Neutral/200 | **Neutral/300** | Neutral/400 |
| Error | White | Danger/600 | Neutral/400 | Neutral/600 |

Error message: `Error Text` node, Danger/600, 14/22 at Large/Medium and 12/18
at Small, **4px** below the field. Geometry: heights 40/36/24; text left
padding 12/12/8; value ramps 16/24, 14/22, 12/18 Regular.

### 2a. Adornment sets (in scope per Q2=C; field fill/border/text identical to Basic in every set)

- **Left icon `11:8536` / Right icon `11:9189`** (×39, same axes as Basic):
  icon instance 18px box / 15px glyph; fill **Neutral/500** in Default (and
  unchanged in Error — icons do NOT turn danger), **Neutral/400** Disabled.
- **Prefix `11:10945` / Suffix `11:11523` / Prefix & Suffix `11:10328`**
  (×30; axes Size × State × Text Entered — no Typing/State 2): static affix
  TEXT inside the field (demo: "http://", ".com", "¥ … CNY"), size-matched
  value ramp, fill **Neutral/500** rest / **Neutral/400** Disabled. Affix
  sits at the field edge padding (11px observed at Large vs Basic's 12 —
  treated as the same 12px pad, off-by-one in the source file).
- **Number `11:9747`** (×30; axes Size × State × Text Entered): two stacked
  14px chevron instances (`Up`/`Down`, glyph 6.49px) at the trailing edge,
  fill **Neutral/500** rest / **Neutral/400** Disabled. No stepper
  hover/pressed variants exist (no `State 2` axis on this set).
- **Clear affordance** (Basic/Left icon/Right icon `State 2` axis): 16px
  `Theme=Fill` circle-x instance (glyph 14.67px); fill **Neutral/400** rest
  (`State 2=Not Applicable`, `Typing=True`), **Neutral/500** Clear Hover,
  **Neutral/600** Clear Pressed. Drawn only in `Typing=True` variants.

## 3. Dialog page (`12:11244`) — 4 sets × Size[Large/Medium/Small]

Sets: Basic `13:11504`, Warning `13:11982`, Scrollable `13:12502`,
With divider `13:12995`.

Common anatomy (verified per node):

- Scrim `Smoke`: #000 @ 30% (`Light|Dark/Background/Fill Color/Smoke/Default`).
- Panel `Modal`: fill White; corners **[4,4,4,4] on every set and size**
  (`topLeft..bottomLeft` read individually — the foundation record's "radius 8"
  was the demo artboard COMPONENT frame, not the panel → `radius-surface`
  token needs correcting 8→4); effect Elevation/4 (Scrollable uses the
  identically-valued remote `Shadows/Elevation 4`); padding 24/24/24/24;
  auto-layout vertical, gap 32 (content↔footer), `counterAxisAlignItems: MAX`
  → footer right-aligned (grid x 672 + w 204 + pad 24 = 900 ✓).
- Panel widths: Large 900, Medium 600, Small 400.
- Title row: gap 8; Title = Medium/Title 18/26, **Neutral/700**; trailing
  14×14 `Close / Theme=Line` instance, fill **Neutral/500** — present in ALL
  four sets (not only With divider). Title↔body gap 16.
- Body: Regular/Body 14/22, Neutral/600.
- Footer `Button Grid`: two Medium buttons, gap 8. Basic/Scrollable/With
  divider: Ghost + Primary; Warning: Ghost + **Outline-danger**.
- Warning body: leading 16px icon, fill **Warning/600**, gap 8 before text.
- Scrollable: body frame `clipsContent: true`, fixed height — body scrolls,
  title/footer fixed.
- With divider: panel `layoutMode: NONE` (absolute): Title at (24,16), Close
  at (862,22), full-bleed `devider/horizon` LINEs stroke **Neutral/200** at
  y58 and y332, Body at (24,74), footer at (672,348) → header padding 16/24,
  divider↔body 16, body↔divider 16, footer padding 16/24 bottom 16.

No hover/focus/active/disabled/error states exist on any Dialog set.

## 4. Extraction-call budget

11 MCP calls this feature (3 page scans + 3 aggregations + 3 gap probes +
2 clarification-scope probes for icon-only glyphs and Input adornments);
21 cumulative with the foundation's 10 — well under the 200/day limit.
