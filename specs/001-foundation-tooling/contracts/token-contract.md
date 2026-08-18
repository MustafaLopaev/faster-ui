# Contract: Design Tokens

The token system's public shape. Component authors and future features (Button/Input/Dialog) code against THIS, not against raw values.

## Single source

All tokens live in `src/tokens/tokens.css`. No other file declares a visual value. Ships to consumers inside `faster-ui/styles.css`.

## File structure (normative)

```css
@import "tailwindcss" prefix(fui);

@theme {
  /* kill off-system defaults so no non-token color/radius utility exists */
  --color-*: initial;
  --radius-*: initial;
}

/* 1 ── PRIMITIVES: private. Raw values, defined once, no utilities generated. */
:root {
  --fui-blue-500: /* Figma value */;
  --fui-radius-8: /* Figma value */;
  /* … full palette / radius / spacing / typography scales from Figma … */
}

/* 2 ── SEMANTIC (mode-aware colors): purpose names → primitive refs. */
:root {
  --fui-action-primary: var(--fui-blue-500);          /* light */
  /* … */
}
.dark {
  --fui-action-primary: var(--fui-blue-400);          /* dark */
  /* … every semantic color re-declared (or inherits light per FR-013 fallback, gap noted) */
}

/* 3 ── BRIDGE: expose semantics to Tailwind → generates fui: utilities. */
@theme inline {
  --color-action-primary: var(--fui-action-primary);
  --radius-control: var(--fui-radius-8);
  /* … */
}
```

## Rules

| # | Rule | Enforced by |
| - | ---- | ----------- |
| T1 | Every token name carries the `fui` prefix (clarification 2026-08-19) | `prefix(fui)` for bridged vars/utilities; naming convention `--fui-*` for raw vars |
| T2 | Primitives hold literals; each literal appears exactly once | review + `/token-audit` |
| T3 | Semantic tokens hold only `var(--fui-…)` references, never literals | review + `/token-audit` |
| T4 | Components use semantic `fui:` utilities only; primitive utilities do not exist | structural (primitives not in `@theme`; defaults wiped) |
| T5 | Every semantic color resolves in both modes; `.dark` gaps documented next to the token | extraction task checklist |
| T6 | Every primitive value traceable to Figma (variable/style name or node + value); deviations get an inline rationale comment | SC-006 review |
| T7 | Rebrand = edit token values only; zero component edits | SC-004 validation (quickstart) |

## Mode switching contract

- Default mode: light (`:root` values).
- Dark mode: `dark` class on the document root (`<html class="dark">`). Nothing else.
- Components never reference modes (no `dark:` variants) — mode is resolved entirely in layer 2.

## Semantic name shape

`<purpose>[-<element>][-<state>]`, kebab-case. Examples: `action-primary`, `action-primary-hover`, `text-secondary`, `surface-raised`, `border-default`, `focus-ring`, `radius-control`, `radius-surface`. Exact roster is fixed by the extraction task and recorded in `tokens.css`; this contract fixes only the shape and layering.
