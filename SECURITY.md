# Security Policy

## Supported versions

`@mlopaev/faster-ui` is pre-1.0. Only the latest published version receives
fixes; there are no maintained release branches yet.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅ |
| < 0.1   | ❌ |

## Reporting a vulnerability

Please report privately rather than opening a public issue — use GitHub's
[private vulnerability reporting](https://github.com/MustafaLopaev/faster-ui/security/advisories/new)
on this repository.

Include what you can: affected version, a reproduction, and the impact you
believe it has. You should get an acknowledgement within a few days, and an
assessment with a fix or mitigation plan after that. Please give a reasonable
window to ship a fix before disclosing publicly.

## Scope notes

This is a client-side rendering library with **no runtime dependencies** — the
published package contains only React components, TypeScript declarations and
CSS. `react` and `react-dom` are peer dependencies supplied by your app.

The realistic risk surface is small but not empty:

- Content you pass as `children`, `label`, `error`, `title`, `footer` or the
  icon/affix slots is rendered by React, which escapes strings. Passing
  attacker-controlled markup through `dangerouslySetInnerHTML` in your own
  slot content is out of scope.
- The stylesheet defines only `fui`-prefixed utilities and `--fui-*` custom
  properties, and deliberately ships no global resets, so it cannot restyle or
  mask your application's elements.
- Build and CI tooling are devDependencies; they never reach a consumer's
  bundle. Dependabot watches them weekly.
