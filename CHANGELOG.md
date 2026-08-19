# Changelog

All notable changes to `@mlopaev/faster-ui` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Versioning policy: the public API is everything exported from `src/index.ts`,
plus the `styles.css` / `a11y.css` entry points and the `--fui-*` custom
properties documented as the theming contract in the README. A change to any of
those follows semver; internal utility class names and primitive token *values*
do not form part of the contract.

Release process: bump the version, add a section here, tag `vX.Y.Z`. The release
workflow refuses to publish if the tag and `package.json` disagree, or if this
file has no section for the version being released.

## [Unreleased]

## [0.1.0] - 2026-08-19

The first published release: Button, Input and Dialog on a Figma-extracted
token layer, with the full Jest + Cypress + Storybook contract behind them.

### Added

- **Button** — `primary` / `outline` / `ghost` / `link` variants, a `danger`
  tone, three sizes, leading and trailing icon slots, a busy `loading` state
  that suppresses activation without dropping focus, and a circular `iconOnly`
  mode whose accessible-name requirement is enforced at the type level.
- **Input** — labelled field on a native `<input>` with error wiring
  (`aria-invalid` + `aria-describedby`), icon / prefix / suffix adornments, a
  clear affordance, and `type="number"` steppers that preserve native
  `step` / `min` / `max` semantics.
- **Dialog** — controlled modal on the native `<dialog>` element: top layer,
  inert background, focus trap while open, focus restore on close. It never
  closes itself; `Escape` is intercepted and reported as a close intent.
- **Design tokens** — a three-tier layer (primitives → semantics → Tailwind
  `@theme inline` bridge) extracted from the TapTap Design System, with a
  `dark` class contract that re-resolves every mode-aware value at runtime.
- **`@mlopaev/faster-ui/a11y.css`** — an optional stylesheet that raises the
  palette to WCAG 2.1 AA in both modes. See "Accessibility" in the README for
  why it is opt-in and what it changes.
- **Runtime theming** — every utility resolves through a live `var(--fui-*)`
  reference, so a consumer can rebrand by overriding custom properties with no
  rebuild. The supported surface is documented in the README.
- SSR-safe: no `window` or `document` access at module scope; all three
  components render under `renderToString`.

[Unreleased]: https://github.com/MustafaLopaev/faster-ui/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/MustafaLopaev/faster-ui/releases/tag/v0.1.0
