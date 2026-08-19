# Contract: Deterministic Gates (added to `.github/workflows/ci.yml`)

Four new jobs joining the existing seven. Job **ids are API** — required-check configuration depends on them; renaming one is a breaking change to repository settings, exactly as 003 established.

These four need **no credential**. They are required checks from the first commit that introduces them, and they run identically for forks, contributors and the maintainer.

## Jobs

| Job id | `needs` | Command (identical locally) | Fails when |
| ------ | ------- | --------------------------- | ---------- |
| `ssr` | `install` | `npm run test:ssr` | Any variant throws on server render, any hydration mismatch is reported, or the built module fails to import without browser globals |
| `consumers` | `build` | `npm run test:consumers` | A fixture fails to build, the server-rendered page logs any console error or warning, a resolution mode fails, or the packaging linters report a defect |
| `a11y` | `install` | `npm run test:a11y` | Any axe violation in any variant × mode × palette cell |
| `api-surface` | `build` | `npm run api:check` | The generated surface record differs from the committed `etc/faster-ui.api.md` |

`consumers` and `api-surface` need the built output, so they depend on `build` rather than `install` — the only structural difference from the existing gate graph.

## Triggers and path filters

| Event | Filter | Effect |
| ----- | ------ | ------ |
| `push` | `branches: ['**']` | All four run |
| `pull_request` | default | All four run; each is a distinct PR check |
| `workflow_call` | — | Included, so `release.yml` gates on them automatically (003's research R-2 — gates stay single-sourced) |

**Path filter** (FR-005): all four are skipped when a change touches only `**.md`, `specs/**`, or `.github/**` *without* touching `src/**`, `package.json`, or `scripts/**`. A skip reports success — the run still receives a verdict (SC-004).

## `ssr` — server rendering and hydration

Two Jest projects, because jsdom *provides* `document` and therefore cannot detect a module-scope DOM access (research R-5).

| Project | Environment | Subject | Asserts |
| ------- | ----------- | ------- | ------- |
| `ssr-dom` | `jsdom` | Source components | Every variant renders under `renderToString`; hydrating into that markup calls neither `onRecoverableError` nor `console.error` |
| `ssr-node` | `node` | **Built** `dist/index.js` | The import resolves with no browser globals present |

**Both** error channels are asserted, because React recovers from some mismatches by re-rendering and reports others only as a console error — asserting one leaves a hole.

**Baseline**: all nine variant cases pass today *(verified — 589 to 1,919 bytes each, zero failures)*. This gate is a **regression guard**; a failure on the introducing commit is a bug in the test, not the library.

**Dialog carve-out**: with `open: true` the server emits `<dialog>` without the `open` attribute, because the attribute is applied by an effect and effects do not run on the server. The client's first render also omits it. This is correct — the assertion must tolerate it and must not be "fixed".

## `consumers` — real-consumer smoke matrix

One `npm pack`; three fixtures consume the tarball. Never a workspace link, which resolves through symlinks and is the classic way to miss a broken `exports` map.

| Fixture | Asserts |
| ------- | ------- |
| `vite-app` | Builds; the ESM entry and `styles.css` both resolve |
| `next-app` | Builds; a page using all three components loads headlessly with **zero** console errors and **zero** warnings |
| `ts-resolution` | Typechecks under `bundler`, `node16`, and `nodenext` |

Plus `publint` and `attw --pack` against the same tarball.

`next-app` **must import `styles.css` explicitly** — `dist/index.js` contains no CSS import *(verified)*, so this exercises a documented consumer step rather than a side effect.

**Infrastructure carve-out**: when a framework's own release breaks a fixture for reasons unrelated to this library, that is triaged under FR-033 as infrastructure, not a packaging regression. Fixture framework versions are pinned in their own lockfiles so this is a deliberate upgrade, never a surprise.

## `a11y` — axe per variant

`cypress-axe` in `*.a11y.cy.tsx` specs beside each component, inside the existing component-test section.

**Coverage**: every variant × `{light, dark}` × `{figma, aa}`.

**Rule scoping** — the decision that makes this gate shippable at all (research R-6):

| Palette | `color-contrast` | Every other rule |
| ------- | ---------------- | ---------------- |
| `figma` | **off** | on |
| `aa` | **on** | on |

The default palette fails AA by design: 27 deviations are pinned in `src/tokens/tokens.test.ts` *(verified)*, including the primary Button label at 2.11:1 against a 4.5:1 requirement. Enabling `color-contrast` there would fail on nearly every component, permanently. That property is already owned by the token test, and owned more strictly — its matrix is two-sided, so a value can neither worsen nor silently improve without the record being updated.

**This does not weaken FR-011.** Zero violations still holds; contrast is enforced by the tool that owns it.

**Stale-exception reporting** (FR-012): when a pinned deviation is no longer needed, the token test already fails on its two-sided bound. The a11y gate adds nothing here and must not duplicate it.

## `api-surface` — the public contract record

| Step | Command | Behaviour |
| ---- | ------- | --------- |
| Local regenerate | `npm run api:report` | Writes `etc/faster-ui.api.md` (api-extractor `--local`) |
| CI verify | `npm run api:check` | Runs without `--local`; non-zero exit when the committed file differs |

**Configuration**: `api-extractor.json` with entry `dist/index.d.ts`, and `tsconfig.api.json` carrying an empty `types` array to keep ambient `@types` out of analysis — the default configuration pulled in `@types/jsdom` and `@types/mdx`, producing four unrelated warnings *(verified)*.

**TypeScript skew is accepted, not suppressed**: the project is on 6.0.3, api-extractor bundles 5.9.3 and warns *(verified)*. Analysis succeeds. A suppressed skew warning becomes an invisible correctness risk when the language moves again.

**The record ships with one known warning.** `ae-forgotten-export` for `ButtonBaseProps` *(verified)* is a real pre-existing hole — consumers cannot name the base type that `TextButtonProps` and `IconOnlyButtonProps` extend. Fixing it changes the public API, which this feature's Out of Scope forbids. The warning stays visible and the fix is its own change. Silencing it to get a clean first commit would throw away the first real thing this gate found.

## Verdict contract

- A gate fails ⇔ its command exits non-zero. The run fails ⇔ any gate fails.
- Each appears on a pull request as `CI / <job id>` with its own status, so the failing gate is identifiable without opening logs (extending 003's SC-003).
- All four are configured as required checks on `main` wherever the plan permits enforcement (003's research R-6 — the red verdict is the plan-independent gate).
- Caching changes duration only, never a verdict (003's FR-004, unchanged).
