# Figma Extraction Record: TapTap Design System

**Source file**: `taptap-design-copy`, key `7OfpQVe2pYpE9MF5pQeXhH`
(user's duplicate of community file `WYuHdUuUq31HzkdJhoKwXl` — see [research R-1](research.md))
**Extracted**: 2026-08-19 via Figma MCP (`use_figma` Plugin-API reads; `get_variable_defs`
rejects page ids, and the file has **zero variable collections** — all tokens live as
**styles**: 78 paint, 14 text, 4 effect, plus remote library styles consumed by nodes).

## 1. Page map (T006)

Enumerated via `figma.root.children` (page listing quirk per R-1 confirmed — only Cover
shows in `get_metadata`). 50 pages; the ones used for extraction:

| Page | Node id | Used for |
| ---- | ------- | -------- |
| Color | `4:462` | palettes + consumed semantic styles |
| Typograghy *(sic)* | `4:1418` | type scale (local text styles) |
| Shadow | `4:1339` | elevations (local effect styles) |
| Button | `15:12480` | per-state action colors, radius, sizing |
| Input | `11:7661` | per-state border/text colors, radius, sizing |
| Dialog | `12:11244` | surface, overlay (Smoke), radius, elevation |

Other component pages (Anchor…Upload…Result) exist but are outside this library's scope
(Button/Input/Dialog only). Chart Color styles (20) noted and deliberately not tokenized.

## 2. Color palettes — local paint styles (T007)

Scales run 50 (lightest) → 700 (strongest). All values verified from style definitions.

| Step | Neutral | Primary (teal) | Auxiliary (orange) | Danger | Warning | Success | Info |
| ---- | ------- | -------------- | ------------------ | ------ | ------- | ------- | ---- |
| 50  | #FAFAFA | #F9FFFF | #FFFCFC | #FFFBFB | #FFFDFA | #FBFEFC | #F8FCFF |
| 100 | #F5F5F5 | #EEFCFC | #FFF6F3 | #FEF2F2 | #FFF9EE | #F2FAF6 | #F1F8FF |
| 200 | #EEEEEE | #DFF7F7 | #FFF2EE | #FFEBEE | #FFF7E1 | #E5F5EC | #E4F2FF |
| 300 | #E1E1E1 | #B0EBEC | #FFE1D6 | #FFCCD2 | #FFEAB3 | #C0E5D1 | #BDDDFF |
| 400 | #CACACA | #7DDDE1 | #FFC8B6 | #F49898 | #FFDD82 | #97D4B4 | #93C8FF |
| 500 | #8E8E8E | #47CFD6 | #FFA487 | #EB6F70 | #FFC62B | #6BC497 | #4BA1FF |
| 600 | #4B4B4B | #15C5CE | #FF8156 | #F64C4C | #FFAD0D | #47B881 | #3B82F6 |
| 700 | #1F1F1F | #00ABB6 | #FE632F | #EC2D30 | #FE9B0E | #0C9D61 | #3A70E2 |

Black & White: `Black & White/Black` #000000, `Black & White/White` #FFFFFF.
Base-palette (基础色板) styles also consumed on doc pages: `基础色板/Tap/6` #15C5CE,
`基础色板/Auxiliary/6` #FF8156, `基础色板/Neutral/7` **#1D2127** (TapTap dark ink —
used as the dark-mode surface base below), `基础色板/Neutral/5` #868C92.

## 3. Mode-scoped semantic styles (remote library, consumed by nodes) (T007)

Only styles actually referenced by nodes are readable on a drafts copy. Found:

| Style name | Value | Where seen |
| ---------- | ----- | ---------- |
| `Light/Fill Color/Text/Primary` | #000000 @ 90% | Color, Button, Input, Dialog pages |
| `Light/Fill Color/Text/Secondary` | #000000 @ 61% | Button, Input, Dialog pages |
| `Light/Stroke Color/Control Stroke/Default` | #000000 @ 6% | Button, Input, Dialog pages |
| `Light/Stroke Color/Divider Stroke/Default` | #000000 @ 8% | Button, Input, Dialog pages |
| `Light/Fill Color/Control Alt/Tertiary` | #000000 @ 6% | Input page |
| `Light/Background/Fill Color/Smoke/Default` | #000000 @ 30% | Dialog page (scrim) |
| `Light/Documentation/Background` | #FFFFFF | doc frames |
| `Dark/Fill Color/Text/Secondary` | **#FFFFFF @ 79%** | Input page |
| `Dark/Stroke Color/Control Stroke/Default` | **#FFFFFF @ 7%** | Input page |
| `Dark/Background/Fill Color/Smoke/Default` | **#000000 @ 30%** | Dialog page (scrim) |

**FR-013 dark-gap list**: no `Dark/*` counterpart was readable for Text/Primary,
Divider Stroke, Documentation/Background, any surface color, or any action/feedback
color. Handling per token is recorded inline in `src/tokens/tokens.css`:
Figma-sourced dark values are used where read (3 rows above); text-primary /
text-disabled / surfaces derive documented values consistent with the read dark
pattern (white-alpha text on #1D2127 ink); action/feedback colors keep their light
values in both modes (FR-013 fallback — the teal/danger scales are the brand and
read correctly on dark ink).

## 4. Per-state component evidence (T007)

### Button (`15:12480`, component sets "Primary"/"Outline" ×36 variants each)

| Variant | State | Fill | Stroke | Text |
| ------- | ----- | ---- | ------ | ---- |
| Primary | Default | Primary/600 | — | White |
| Primary | Hover | Primary/500 | — | White |
| Primary | Pressed | Primary/700 | — | White |
| Primary | Disabled | Primary/300 | — | White |
| Primary-danger | Default/Hover/Pressed/Disabled | Danger/600 / 500 / 700 / 300 | — | White |
| Outline | Default | White | Neutral/300 | Neutral/600 |
| Outline | Hover | White | Primary/500 | Primary/500 |
| Outline | Pressed | White | Primary/700 | Primary/700 |
| Outline | Disabled | White | Neutral/200 | Neutral/400 |
| Outline-danger | Default | White | Danger/600* | Danger/600* |
| Outline-danger | Disabled | White | Danger/400 | Danger/400 |

*danger-outline default/hover/pressed follow the Danger scale symmetric to Primary.

Geometry: radius **4** on every variant; heights Large **40** / Medium **36** / Small
**24**; padding (t/r/b/l) 8/8/8/8, 7/8/7/8, 3/4/3/4; icon gaps 4–8.

### Input (`11:7661`, set "Basic" ×39; border lives on inner "Base" frame, stroke 1px)

| State | Base fill | Base stroke | Placeholder | Entered text |
| ----- | --------- | ----------- | ----------- | ------------ |
| Default | White | Neutral/300 | Neutral/400 | Neutral/600 |
| Hover | White | Primary/500 | Neutral/400 | Neutral/600 |
| Pressed & Focus | White | **Primary/600** | Neutral/400 | Neutral/600 |
| Error | White | **Danger/600** | Neutral/400 | Neutral/600 |
| Disabled | **Neutral/50** | Neutral/200 | Neutral/300 | Neutral/400 |

Error prefix icon/text: Danger/600. Geometry: radius **4**, heights 40 (Large) / 36
(Medium), stroke weight 1.

### Dialog (`12:11244`, sets Basic/Warning/Scrollable/With divider)

- Scrim (full-bleed rect behind panel): `Light|Dark/Background/Fill Color/Smoke/Default`
  = #000000 @ 30% (both modes defined, same value).
- Panel: fill White, corner radius **8**, effect `Elevation/4`, padding 24 (t/r/b/l
  observed `24/24/24/24`, header variant `21/24/24/24`), content gaps 8–16.
- Text nodes: Title (18/26 Medium ramp) + Body (14/22 Regular ramp).

## 5. Typography — local text styles (T008)

Family **PingFang SC** for every style; weights Regular (400) and Medium (500);
letter-spacing 0 throughout.

| Ramp | Size / Line height |
| ---- | ------------------ |
| Caption | 12 / 18 |
| Body | 14 / 22 |
| Subtitle | 16 / 24 |
| Title | 18 / 26 |
| H3 | 20 / 28 |
| H2 | 24 / 32 |
| H1 | 30 / 38 |

(Each exists twice: `Regular/*` and `Medium/*` — 14 styles total.)

## 6. Elevation — local effect styles (T008)

| Style | Shadows |
| ----- | ------- |
| Elevation/1 | 0 2 4 0 rgba(0,0,0,.04); 0 1 1 0 rgba(0,0,0,.02) |
| Elevation/2 | 0 4 10 0 rgba(0,0,0,.08); 0 1 4 0 rgba(0,0,0,.04) |
| Elevation/3 | 0 8 32 0 rgba(0,0,0,.08); 0 2 20 0 rgba(0,0,0,.04) |
| Elevation/4 | 0 24 60 0 rgba(0,0,0,.12); 0 8 20 0 rgba(0,0,0,.06) |

## 7. Radius & spacing (T008)

- Radius in scope: **4** (Button, Input — "control"), **8** (Dialog panel — "surface"),
  999 (pill/circular doc artifacts; kept as `full`). Other page radii (1, 5, 11, 16, 30,
  100) belong to doc frames/out-of-scope components.
- Spacing: every observed padding/gap on component pages (4, 8, 10*, 12, 16, 24, 32 …)
  sits on a **4px grid** (*10 appears only inside doc-layout frames). Tailwind's default
  `--spacing: 0.25rem` = 4px matches the grid exactly and is adopted as the spacing base.
- Control heights for the record: 40 / 36 / 24 (Button L/M/S), 40 / 36 (Input L/M).

## 8. Extraction-call budget

10 MCP calls total (1 page enum, 1 style dump, 4 page scans, 3 component-set probes,
1 input-border probe) — well under the 200/day, 15/min limits (R-1).
