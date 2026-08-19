---
name: production-audit
description: Full production-readiness audit of the Faster UI package — repo/file/folder structure, naming, public API surface, packaging (package.json/exports/dist), TypeScript config, component code quality, accessibility, test coverage, Storybook, documentation completeness, CI/release pipeline, and a gap list of what a top-tier open-source React component library would add. Use before a release, a portfolio review, or when asked "is this production ready?".
---

# Production-Readiness Audit

You are auditing `@mlopaev/faster-ui` — a React component library (Button,
Input, Dialog) built with Vite library mode, Tailwind v4 CSS-first tokens,
Jest, Cypress CT, and Storybook — as if you were a principal engineer
deciding whether to approve it for a public v1.0 npm release.

Audit scope: `$ARGUMENTS` if specific areas were named, otherwise the full
audit below. This skill is **read-only**: report findings, do not modify
files. Offer fixes only as a follow-up.

Ground rules:

- Judge against the project constitution (`.specify/memory/constitution.md`)
  and its Definition of Done first — those are the project's own laws — then
  against general industry standards for published React component libraries
  (Radix, Base UI, Mantine, shadcn-quality bars).
- Every finding must cite evidence: a `file:line` reference, a command output,
  or a concrete missing file. No vibes-based findings.
- Distinguish "violates the project's own rules" from "fine here, but a
  best-in-class library would also do X".
- Where the constitution and industry practice conflict, the constitution
  wins — note the tension instead of flagging a violation.

Work through every section. Use subagents in parallel for the read-heavy
sections (1, 4, 5, 6) if that speeds things up, but verify build/CI claims
yourself by actually running the commands.

## 1. Repo, file/folder structure & naming

- Verify the layout matches the documented contract in `CLAUDE.md` /
  `README.md`: co-located component contracts
  (`src/components/<Name>/<Name>.tsx` + `.test.tsx` + `.cy.tsx` +
  `.stories.tsx` + `index.ts`), `src/tokens/`, `src/lib/`, single public
  surface `src/index.ts`.
- Naming consistency: PascalCase component dirs/files, camelCase utilities,
  kebab-case config files, consistent test-file suffixes, consistent story
  titles/IDs in Storybook (`Components/Button` vs stray categories).
- Flag anything that leaked into the repo that shouldn't be tracked or
  shipped: build artifacts (`dist/`, `storybook-static/`) in git, dev
  playground files (`src/main.tsx`, `index.html`) accidentally exported,
  dead files, empty dirs, leftover spec scaffolding that contradicts the
  code.
- Check `.gitignore` covers dist, storybook-static, coverage, cypress
  artifacts (screenshots/videos), `.DS_Store`, editor junk.
- Internal import hygiene: components must not deep-import each other in
  ways that bypass barrels; no circular imports; `src/lib/` stays private
  (not exported from `src/index.ts` unless intended).

## 2. Packaging & publish readiness (package.json + dist)

This is the highest-stakes section — a library lives or dies on it.

- Run `npm run build`, then inspect `dist/` and run `npm pack --dry-run`.
  Verify exactly what a consumer downloads: ESM entry, `index.d.ts`,
  `styles.css`, no test/story/playground files, no sourcemap orphans, and
  that `files: ["dist"]` plus the `exports` map agree with reality.
- `exports` map correctness: `types` condition first, `./styles.css`
  resolvable, no missing `default` condition problems for common bundlers;
  decide whether a CJS build is deliberately omitted (fine — but it should
  be a documented decision, and `"type": "module"` implications noted).
- Missing/weak package.json fields for a public package: `description`,
  `keywords`, `license`, `author`, `repository`, `homepage`, `bugs`,
  `engines`, `packageManager`. Flag each absent one.
- Peer-dependency ranges: `react`/`react-dom` `^19` — is that deliberately
  narrow? Should it be `^18 || ^19`? Verify against actual API usage (does
  the code use anything React-19-only?).
- `sideEffects` correctness: CSS-only side effects declared — confirm JS is
  actually side-effect-free so tree-shaking works (no top-level DOM or
  global mutation in shipped modules).
- Verify d.ts quality: open `dist/index.d.ts` — prop types exported and
  resolvable, no `any` leaks, no absolute-path or `src/` imports, JSDoc
  comments survive into the declarations.
- Check the built `styles.css`: tokens present, no Tailwind preflight
  restyling host elements, `fui:` prefix intact, reasonable size.
- LICENSE file: `publishConfig.access: public` with no LICENSE file or
  `license` field is a release blocker — flag it as such if missing.

## 3. Versioning, changelog & release pipeline

- Read `.github/workflows/ci.yml` and `release.yml`. Verify: correct
  trigger conditions, Node version pinned and matching local, all quality
  gates actually run (lint, typecheck, jest, cypress ct, storybook build,
  library build), caching, and that release cannot happen with failing
  gates.
- Version management: is there a changelog (CHANGELOG.md) and a versioning
  strategy (changesets, semantic-release, or documented manual policy)?
  `0.1.0` with no changelog = flag with a concrete recommendation.
- npm provenance / `--provenance` flag, tag protection, and whether the
  release workflow creates a GitHub Release with notes.
- Check git tags vs package.json version drift.

## 4. Component code quality & API consistency

Per the constitution's API principle, verify for each of Button, Input,
Dialog:

- Props extend `ComponentPropsWithoutRef<'element'>`, refs forwarded,
  `variant`/`size` typed unions with defaults, `className` merge-safe,
  `displayName` set.
- Public prop types exported from `src/index.ts` and named consistently
  (`ButtonProps`, not a mix of styles).
- No hardcoded visual values (delegate to the checks from `/token-audit`
  patterns — run those greps here rather than invoking the other skill).
- Dead code, unused exports, `console.log` leftovers (dev-only
  `console.warn` guards must be wrapped in a NODE_ENV check — verify they're
  stripped or guarded in the production build output).
- Dialog specifics: controlled `open`/`onClose` contract honored, `onCancel`
  Escape interception present, no self-closing behavior, focus handling.
- JSDoc on every public prop (this is what consumers see in IntelliSense) —
  missing prop docs are findings.

## 5. Accessibility

- Roles, accessible names, keyboard operability per component; `iconOnly`
  button enforces an accessible-name requirement at the type level and at
  runtime.
- Storybook a11y addon configured and not silenced; check stories cover
  disabled/error states where a11y differs.
- Focus-visible treatment, contrast of token pairs (spot-check semantic
  token values in `src/tokens/tokens.css` against WCAG AA for text-on-fill
  combos), `prefers-reduced-motion` if any animation exists.
- Dark mode: `.dark` re-declarations complete — no semantic token that
  silently keeps its light value in dark mode.

## 6. Tests: coverage & quality

- Inventory Jest + Cypress specs per component. Map each documented behavior
  (README props tables, spec acceptance criteria in `specs/002-*/spec.md`)
  to an existing assertion; list untested behaviors.
- Tests assert user-observable behavior, not class names (constitution
  rule) — flag violations.
- Is there a coverage report/threshold wired into CI? If not, recommend one
  with a realistic starting threshold.
- Check the US4 keyboard-only journey spec (`Dialog.journey.cy.tsx`) still
  matches the shipped behavior.

## 7. Documentation

- `README.md` as the front door: install instructions correct for the
  scoped package, peer-dep note, stylesheet import documented, quick-start
  code block actually compiles against the current API, props tables in
  sync with the real prop types (diff them — stale docs are findings),
  badges (CI, npm version) present or recommended.
- Missing standard docs for a public library — flag each: `CHANGELOG.md`,
  `CONTRIBUTING.md` (setup, test, PR conventions), `LICENSE`,
  `CODE_OF_CONDUCT.md` (optional — note as nice-to-have), SECURITY.md
  (nice-to-have).
- Storybook as living docs: every variant/size/state has a story, autodocs
  or MDX docs pages enabled, token/foundation documentation page exists
  (a "Design Tokens" story is a strong nice-to-have), Storybook deployed
  anywhere (GitHub Pages/Chromatic) or recommend it.
- Inline docs: JSDoc coverage on public API (overlaps §4 — report once).

## 8. Tooling & DX gaps

- Lint: oxlint config present? Are a11y lint rules (jsx-a11y equivalents)
  enabled? Formatting story (prettier or none — is it consistent either
  way)? `.editorconfig`?
- Node version pinning: `.nvmrc` / `engines` / CI agreement.
- Pre-commit hooks (husky/lefthook) or a documented decision not to use
  them.
- Bundle-size guardrail: recommend size-limit or a CI dist-size check with
  a budget.
- Visual regression: Cypress asserts computed colors, but recommend (as
  nice-to-have) Chromatic/Playwright screenshot tests for the matrix.
- `npm audit` / dependency freshness: run `npm audit --omit=dev` and report;
  recommend Dependabot/Renovate config if absent.

## 9. What would make it *perfect* (gap list)

Close with a short "beyond ready" list — things not required for v1.0 but
that would put the library in the top tier. Only include items not already
covered above, e.g.: RTL/`dir` support, SSR-safety statement (no window
access at module scope — verify, then document), controlled+uncontrolled
Input pattern, composable Dialog subcomponents (Header/Footer), tree-shaking
proof (`import { Button }` cost demo), a versioned docs site, Code Connect
mapping back to the Figma source.

## Report format

Produce a single report, most severe first:

1. **Blockers** — would break or embarrass a public v1.0 release (bad
   publish artifact, missing LICENSE, broken consumer snippet, a11y
   failure).
2. **High** — violates the project's own constitution/DoD or misleads
   consumers (stale docs, untested documented behavior).
3. **Medium** — industry-standard practice missing (changelog, contributing
   guide, coverage gate, package.json metadata).
4. **Nice-to-have** — the §9 perfection list.

Each finding: one-line title, evidence (`file:line` or command output),
and the concrete fix. End with: a scorecard table (section → pass/warn/fail),
the top 5 actions ranked by impact-per-effort, and a one-paragraph verdict
on whether it can ship as v1.0 today.
