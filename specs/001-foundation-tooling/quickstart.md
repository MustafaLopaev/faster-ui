# Quickstart: Validating Foundation & Tooling

Proves the feature end-to-end against the spec's success criteria. Run everything from the repo root.

## Prerequisites

- Node 20.19+ (or 22.12+), npm
- A browser Cypress supports (Chrome/Electron)
- For token extraction only: the user's duplicate [`taptap-design-copy`](https://www.figma.com/design/7OfpQVe2pYpE9MF5pQeXhH/taptap-design-copy) — MCP access verified; the community original is view-only (see [research.md R-1](research.md))

## 1. Fresh-clone gate (SC-002)

```bash
npm install
npm run lint          # exit 0
npm run typecheck     # exit 0 — all four TS projects
npm test              # exit 0 — Smoke Jest suite green
npm run cy:ct         # exit 0 — Smoke Cypress suite green
npm run build-storybook  # exit 0 — static workbench builds
npm run build         # exit 0 — dist/ produced
```

All commands green with no undocumented steps → SC-002 and SC-003 (test halves) pass.

## 2. Smoke component in all three harnesses (SC-003)

- `npm test` output lists the Smoke suite passing (render, children, ref, className merge).
- `npm run cy:ct` output lists the Smoke spec passing — includes an assertion on a **computed background color** equal to the resolved semantic token, proving the token chain is live in a real browser.
- `npm run storybook` → open http://localhost:6006 → Smoke story renders, controls work, browser console shows **zero errors/warnings**.

## 3. Mode switch (SC-007, FR-013)

In Storybook, flip the theme toolbar light → dark:

- Smoke's colors change to the dark-mode token values.
- No component file was touched (verify: `git status` clean on `src/components/`).

## 4. Rebrand test (SC-004, FR-003)

1. In `src/tokens/tokens.css`, change the primitive that `--fui-action-primary` points to (or repoint the semantic to a different primitive) — light and/or dark value.
2. Storybook (still running) hot-reloads: Smoke's background shows the new color in the affected mode(s).
3. `git diff --stat` shows **only** `src/tokens/tokens.css` changed. Revert afterwards.

## 5. Token traceability spot-check (SC-006, FR-004)

Pick 3 primitives in `tokens.css`; each carries a source comment (Figma variable/style or node + value). Compare against the Figma file's inspect values — 100% match or an inline deviation rationale.

## 6. Packaging inspection (SC-005, FR-009)

```bash
npm run build
npm pack --dry-run    # tarball lists ONLY package.json, README, dist/*
grep -L "from \"react\"" dist/index.js || true   # spot-check: react imported, not inlined
```

Verify against [contracts/package-contract.md](contracts/package-contract.md):

- `dist/index.js` (ESM) imports `react`/`react-dom`/`react/jsx-runtime` — never contains React's source.
- `dist/index.d.ts` exists and exports `Smoke` + its props type; no `dist/**/*.test.*`, `*.cy.*`, `*.stories.*`.
- `dist/styles.css` exists; every custom property/utility in it is `fui`-prefixed.
- `package.json` matches the contract manifest (name `faster-ui`, exports map, peers).

Optional end-to-end consumer check: `npm pack`, install the tarball into a scratch Vite React app, render `<Smoke>` with `import 'faster-ui/styles.css'` — styled output, types resolve, one React instance.

## 7. Token-first audit (SC-001)

Run `/token-audit` over `src/components/` — zero hardcoded colors/radii/spacing/typography and zero primitive-utility usage (primitive utilities shouldn't even exist; see [contracts/token-contract.md](contracts/token-contract.md) T4).

## Done when

Every numbered section passes → the feature meets SC-001…SC-007 and the FR-011 acceptance gate.
