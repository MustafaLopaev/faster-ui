---
name: token-audit
description: Audit Faster UI component code for design-token violations — hardcoded colors, arbitrary Tailwind values, raw spacing/radius literals — enforcing Constitution Principle I (Token-First Styling). Use after implementing or modifying any component, before marking work done.
---

# Design Token Audit

Audit scope: `$ARGUMENTS` if a path was given, otherwise all of
`src/components/` and `src/lib/`.

Token definitions themselves (`src/tokens/`) are EXEMPT — that layer is where
raw values are supposed to live.

## What counts as a violation

Search the scope for each pattern class and collect findings with
file:line references:

1. **Raw color values**: hex literals (`#[0-9a-fA-F]{3,8}` in class names,
   style objects, or CSS), `rgb(`/`rgba(`/`hsl(`/`oklch(` calls outside the
   token layer.
2. **Arbitrary-value Tailwind utilities carrying visual values**:
   `bg-[`, `text-[#`, `border-[#`, `shadow-[`, `rounded-[`, `p-[`, `m-[`,
   `w-[`, `h-[`, `gap-[` — flag any `[...]` arbitrary value that encodes a
   color, spacing, or radius instead of a token-backed utility.
3. **Non-semantic palette utilities in components**: direct primitive-scale
   classes like `bg-blue-500`, `text-red-600` — components must use semantic
   utilities (e.g. `bg-action-primary`, `text-feedback-error`) per the
   primitive → semantic layering.
4. **Inline style objects** setting `color`, `background`, `borderColor`,
   `borderRadius`, `padding`, `margin`, `boxShadow` with literal values.
5. **Magic numbers in animation/transition durations** where a token or
   Tailwind default exists.

## How to report

Output a compact report:

- **PASS** — if zero violations: state scope scanned and confirm compliance.
- **FAIL** — list each violation as `file:line — offending value — suggested
  semantic token/utility`. Group by file. End with the total count.

If a violation looks intentional (e.g. a one-off value the design genuinely
needs), do NOT silently accept it — report it and recommend either adding a
proper token or documenting a constitution exception in the feature plan's
Complexity Tracking table.

Do not modify any files; this skill is read-only reporting. Offer to fix
violations as a follow-up only.
