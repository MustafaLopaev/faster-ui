# Contract: Published Package (`@mlopaev/faster-ui`)

What a consuming developer receives from `npm install @mlopaev/faster-ui`. This is the outward face of constitution Principle VI.

## Identity

| Field | Value | Notes |
| ----- | ----- | ----- |
| Name | `@mlopaev/faster-ui` | Bare `faster-ui` is taken on npm (spec clarification); scope verified unclaimed 2026-08-19 |
| Access | `public` | Installable with zero authentication, unlike the private source repo |
| Version | Equals the release tag (`vX.Y.Z` → `X.Y.Z`) | Enforced by the release workflow's version-match abort |
| First release | `0.1.0` | Current manifest version; no bump needed |

## Contents (unchanged from the existing manifest — this feature renames, never restructures)

- `dist/index.js` — ESM module (React 19, JSX compiled)
- `dist/index.d.ts` — type declarations for `Button`, `Input`, `Dialog` + prop types
- `dist/styles.css` — tokens + component styles, imported by consumers as `@mlopaev/faster-ui/styles.css`
- `package.json` exports map: `.` (types + import) and `./styles.css`
- **Nothing else** — `files: ["dist"]` whitelist; no source, tests, stories, or configs in the tarball

## Dependency posture

- `react` / `react-dom` `^19` as **peer** dependencies — never bundled, never runtime deps.
- Zero runtime `dependencies` (FR-015 keeps it that way).

## Verification hooks (used by quickstart scenarios)

- `npm pack --dry-run` locally lists exactly the `dist/` contents + `package.json`/`README`.
- Post-release: `npm view @mlopaev/faster-ui version` returns the tag version; a scratch `npm install @mlopaev/faster-ui` succeeds unauthenticated and type-checks an import of `Button`.
