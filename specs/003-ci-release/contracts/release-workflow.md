# Contract: Release Workflow (`.github/workflows/release.yml`)

Tag-triggered packaging and publication of the library. Publishes **only** behind the full quality suite.

## Trigger

| Event | Filter | Effect |
| ----- | ------ | ------ |
| `push` | `tags: ['v*']` | Release attempt for the tagged commit |

Nothing else can start a release; branch pushes and PRs never reach this workflow (FR-007).

## Jobs & sequencing

```text
quality  ── uses: ./.github/workflows/ci.yml (workflow_call)
   │           all seven gates re-run on the tagged commit
   ▼ needs: quality (all green)
publish  ── checkout → setup Node (.nvmrc, registry-url npmjs) → npm ci
            → npm run build                (identical local command)
            → version-match check          (abort on mismatch)
            → npm publish                  (auth: NPM_TOKEN as NODE_AUTH_TOKEN)
```

## Abort conditions (each must abort BEFORE anything is published)

| # | Condition | Outcome |
| - | --------- | ------- |
| 1 | Any quality gate red on the tagged commit | `publish` never starts (FR-008) |
| 2 | `tag without leading 'v'` ≠ `package.json` version | Version-check step fails the run with an explicit mismatch message (FR-010) |
| 3 | Registry rejects (version already published, auth failure) | Run fails visibly; nothing silently succeeds |

## Publication contract

- Target: public npm registry (`registry.npmjs.org`), package `@mlopaev/faster-ui` — see [package.md](./package.md).
- Access: `public`, declared in `package.json#publishConfig` (not a CLI flag).
- Version published = tag version, guaranteed by abort condition 2.
- Credentials: repository secret `NPM_TOKEN`, exposed as `NODE_AUTH_TOKEN` only inside the `publish` job (FR-012). Workflow permissions: `contents: read`.
- No provenance attestation while the repo is private (research R-5 — it would publish the private repo's URL to a public transparency log).
