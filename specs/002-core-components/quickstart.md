# Quickstart: Validating Core Components

End-to-end validation guide for `002-core-components`. Contracts:
[button-api](contracts/button-api.md) · [input-api](contracts/input-api.md) ·
[dialog-api](contracts/dialog-api.md) · [tokens-delta](contracts/tokens-delta.md).

## Prerequisites

```bash
npm ci                      # Node 20+; installs the one new devDependency (cypress-real-events)
```

Quirk (VS Code extension terminals): run Cypress as
`env -u ELECTRON_RUN_AS_NODE npm run cy:ct`.

## 1. Static gates

```bash
npm run lint && npm run typecheck
```

Expected: clean. Typecheck also proves the API contracts — e.g.
`<Button iconOnly danger />` or `<Button iconOnly />` without `aria-label`
must FAIL compilation (contract B8).

## 2. Unit contract (Jest + RTL)

```bash
npm test
```

Expected: suites for `Button`, `Input`, `Dialog` (Smoke suite is gone —
research R-13) — green. Covers: contracts B1–B6/B8/B9, I1–I5/I8(behavioral)/
I10, D1/D3/D4/D6/D10, ARIA wiring, keyboard flows, controlled/uncontrolled
parity, `onClose` call counts.

## 3. Real-browser contract (Cypress CT)

```bash
env -u ELECTRON_RUN_AS_NODE npm run cy:ct
```

Expected: green. Covers what jsdom can't: hover/active matrix cells via
`cypress-real-events` with computed-color assertions (e.g. primary hover
resolves `rgb(71, 207, 214)` = `primary-500`), real `<dialog>` top-layer
behavior (D2/D5/D7/D8), number steppers + clear affordance on a real input
(I7/I8), light/dark computed-color flips (US5).

## 4. Storybook contract

```bash
npm run storybook           # → http://localhost:6006
```

Manual review checklist:

- Button: 8 variant×tone grid stories + IconOnly + WithIcons + Playground.
- Input: state stories + Adornments + Sizes + Playground.
- Dialog: Basic / Warning (composition) / Scrollable / WithDividers / Sizes /
  Playground — open each, close via Escape and ✕.
- Toolbar → Dark: every story renders correctly (SC-003); a11y addon panel
  shows no violations; browser console shows zero errors/warnings.

`npm run build-storybook` must also pass (CI gate).

## 5. Token discipline & packaging

```bash
# constitution Principle I — zero visual literals in components:
#   run the /token-audit skill, or equivalent grep:
grep -rnE '#[0-9a-fA-F]{3,8}|rgb\(|\[(width|height|padding|margin|gap|border-radius):' src/components/ && echo VIOLATION || echo CLEAN

npm run build               # → dist/index.js + index.d.ts + styles.css
```

Expected: `CLEAN`; build succeeds; `dist/index.d.ts` exports exactly
`Button/ButtonProps/Input/InputProps/Dialog/DialogProps`; `dist/styles.css`
contains the new `--fui-*` semantics and `--radius-surface` resolving to 4px.

## 6. End-to-end journey (US4)

Run the dedicated Cypress spec (part of step 3) that drives keyboard-only:
trigger Button → Dialog opens (focus inside) → Tab stays trapped → type into
Input → submit invalid → error announced (`aria-invalid` + message) → fix →
close via Escape → focus restored to trigger. Expected: passes with zero
pointer events.

## Sign-off = constitution Definition of Done

All six steps green + stories match Figma values in
[figma-extraction.md](figma-extraction.md) spot-checks (colors, heights,
radius 4 dialog panel, min-widths 106/98/62).
