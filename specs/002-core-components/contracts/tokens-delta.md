# Contract: Token-layer delta for core components

Extends the foundation token contract
(`specs/001-foundation-tooling/contracts/token-contract.md`). All changes live
in `src/tokens/tokens.css`; components consume only the bridge utilities.

## New semantic tokens (§2) + bridge entries (§3)

Every entry: `--fui-<name>: var(--fui-<primitive>)` in §2, plus
`--color-<name>: var(--fui-<name>)` in the `@theme inline` bridge →
utilities `fui:bg-<name>` / `fui:text-<name>` / `fui:border-<name>`.

| Semantic | Primitive (light) | `.dark` re-declaration |
| -------- | ----------------- | ---------------------- |
| `action-ghost-hover` | `neutral-100` | — |
| `action-ghost-active` | `neutral-300` | — |
| `action-ghost-danger-hover` | `danger-100` | — |
| `action-ghost-danger-active` | `danger-300` | — |
| `action-danger-outline` | `danger-600` | — |
| `action-danger-outline-hover` | `danger-500` | — |
| `action-danger-outline-active` | `danger-700` | — |
| `action-danger-outline-disabled` | `danger-400` | — |
| `action-link-disabled` | `primary-400` | — |
| `action-clear` | `neutral-400` | — |
| `action-clear-hover` | `neutral-500` | — |
| `action-clear-active` | `neutral-600` | `white-a79` |
| `border-hover` | `primary-500` | — |
| `border-strong` | `neutral-200` | `white-a7` |
| `text-control` | `neutral-600` | `white-a79` |
| `text-heading` | `neutral-700` | `white-a90` |
| `text-placeholder-disabled` | `neutral-300` | `white-a30` |
| `icon-muted` | `neutral-500` | — |

"—" = light value serves both modes (foundation FR-013 fallback; rationale
per token in [data-model.md](../data-model.md) §4). Each CSS line carries its
Figma style-name comment, matching the foundation file's documentation style.

## Corrections

| Token | Was | Becomes | Evidence |
| ----- | --- | ------- | -------- |
| `--radius-surface` | `var(--fui-radius-8)` (8px) | `var(--fui-radius-4)` (4px) | Dialog panel corners [4,4,4,4] on all sets/sizes ([figma-extraction.md](../figma-extraction.md) §3) |
| `--fui-radius-8` primitive | `0.5rem` | **deleted** | sole consumer was `radius-surface`; comment trail updated |

## Guarantees

- No new primitives; no component-level color/spacing/radius/typography
  literals (Principle I — `/token-audit` must pass).
- Rebrand path intact: changing any of these values restyles components with
  zero component edits.
- Existing token names/values untouched except the radius correction above
  (Smoke, the only current consumer of `radius-surface`… does not consume it;
  no downstream breakage — verified by grep before merge).
