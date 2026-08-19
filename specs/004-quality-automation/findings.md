# Findings: what the new gates caught

Open defects the quality automation layer surfaced. None is fixed here — this
feature **observes**; spec Out of Scope reserves changes to component behaviour,
token values and the public API for their own changes. Each entry names where it
is pinned so it cannot be forgotten, and what fixing it would take.

Recorded during implementation of 004, 2026-08-20.

---

## F-1 — `ButtonBaseProps` is not exported, and the surface record is blind to it

**Severity**: the highest of the three, and worse than the plan anticipated.

**Pinned in**: `etc/faster-ui.api.md` (the `ae-forgotten-export` warning is
written *into* the committed record via `addToApiReportFile`, so it is reviewed
on every surface change), and [data-model.md](./data-model.md#4-public-surface-record).

`ButtonBaseProps` is extended by both `TextButtonProps` and `IconOnlyButtonProps`
but is not exported from `src/index.ts`. Research R-7 recorded the consequence as
"a consumer cannot name the base type these two extend". Verified during
implementation, the consequence is larger:

| Change | `npm run api:check` |
| ------ | ------------------- |
| Optional prop added to the **exported** `TextButtonProps` | **fails** — the record must be regenerated and reviewed *(verified)* |
| Optional prop added to the **unexported** `ButtonBaseProps` | **passes** — the change ships unrecorded *(verified)* |

`size` and `loading` live on `ButtonBaseProps`. They are part of every Button's
public API and they are **outside the recorded contract**: their types can be
narrowed, widened, or made required without the gate noticing. The forgotten
export is therefore not only a documentation gap — it is a hole in the gate that
was built to close exactly this class of gap.

**Fix**: export `ButtonBaseProps` from `src/components/Button` and `src/index.ts`,
regenerate the record, and confirm case (b) above starts failing. That is a
public API change (additive, `minor`), which is why it is not done here.

---

## F-2 — Input's `prefix`/`suffix` affixes render text in an icon-grade colour

**Severity**: a real WCAG 1.4.3 failure, present on **both** palettes.

**Pinned in**: `AA_DEVIATIONS` and `BASE_DEVIATIONS` in
`src/tokens/tokens.test.ts` (two-sided — it may not worsen, and a fix fails the
`toBeLessThan` so the entry must be deleted), and `RECORDED_DEVIATIONS` in
`cypress/support/a11y.ts`.

`Input` renders its `prefix` and `suffix` affixes — visible text such as `$` and
`USD` — in `--fui-icon-muted`. That token is solved for the 3:1 of WCAG 1.4.11
(non-text contrast), which it meets. As text, 1.4.3 asks 4.5:1:

| Palette | Light | Dark |
| ------- | ----- | ---- |
| `figma` | 3.27:1 | 4.11:1 |
| `aa` (overlay) | 3.27:1 | 4.11:1 |

The AA overlay does not help, because it re-points which *value* a token carries,
not which *token* a component reaches for. The existing token test did not catch
it because it pins the same token as `Input adornment icon` at `min: 3` — the
icon usage passes, and the passing icon pair is exactly what let the text usage
go unnoticed. A new `Input affix text` pair at `min: 4.5` now records it.

**Found by**: the new axe gate (`npm run test:a11y`), on its first run.

**Fix**: either introduce a text-grade adornment token, or move the affixes to
`--fui-text-control`. Both change token values or component styling.

---

## F-3 — `ssr-dom` cannot catch what quickstart Scenario 1 asked it to

**Severity**: documentation only; corrected in place.

Quickstart Scenario 1 expected a module-scope `document` read to fail `ssr-dom`.
It cannot: that project runs under jsdom, which *provides* `document` — the very
reason research R-5 specifies a second, node-environment project. Verified: with
the defect present, `ssr-dom` (27 tests) and the unit suite (159 tests) both pass,
and only `ssr-node` fails.

[quickstart.md](./quickstart.md) Scenario 1 now names the two defect classes
separately, with the verified outcome for each:

| Defect | Caught by |
| ------ | --------- |
| Module-scope browser global in the built bundle | `ssr-node` only |
| Server render diverging from the client's first render | `ssr-dom` only |

---

## F-4 — axe reports false contrast failures for off-screen nodes

**Severity**: harness correctness; fixed in the harness, recorded so it is not
reintroduced.

axe resolves an element's background colour with `elementsFromPoint`. For a node
rendered outside the viewport that lookup returns nothing and axe falls back to
assuming the page is white. In dark mode this produced a dozen "violations"
measuring dark-mode ink (`#7ddde1`) against `#ffffff` — every one of them a false
positive, and exactly the noise that gets a gate switched off.

`cypress/support/a11y.ts` now sets a 1280×1024 viewport, and every matrix in the
`*.a11y.cy.tsx` specs wraps (`fui:flex-wrap`) so it stays inside it. **A new
a11y spec must keep its content on screen**, or it will report contrast failures
that have nothing to do with the palette.

---

## F-5 — The package ships no `'use client'` directive

**Severity**: a real consumer-facing constraint, currently undocumented.

**Pinned in**: `test/consumers/next-app/app/page.tsx`, whose `'use client'` line
carries the explanation; removing it fails `npm run test:consumers` at the
Next.js build.

`dist/index.js` contains no `'use client'` banner *(verified)*. All three
components use hooks, so importing them into a React Server Component fails the
build with *"You're importing a component that needs `useState`"*. The consumer
must mark their own module `'use client'`.

This is the same shape as the `styles.css` requirement — a real step a
server-rendering consumer has to take — and, like it, the fixture now exercises
it rather than assuming it. Unlike it, **README.md does not mention it**.

**Fix**: either document the step in README.md alongside the stylesheet import,
or add the directive to the build so the components carry it themselves. The
second is the friendlier default for a component library and is a packaging
change, so it belongs in its own commit.

---

## F-6 — Quickstart Scenario 2's `types`-reordering break is a no-op here

**Severity**: documentation only; the gates are fine, the scenario was not.

Scenario 2 asked for the `types` condition to be moved after `import` in
`package.json#exports`, expecting `attw` and `ts-resolution` under `node16` to
fail. Verified: **both still pass**, and correctly so. `dist/index.d.ts` sits
beside `dist/index.js`, so TypeScript finds the declarations by the sibling-file
rule regardless of condition order. For this package layout, the reordering is
genuinely harmless.

Two breaks that *do* fail, and are more representative of a real packaging
regression, verified in their place:

| Break | Caught by | The contrast |
| ----- | --------- | ------------ |
| `exports["."].types` pointing at a path that does not exist | **`attw` fails**; `ts-resolution` still passes (TypeScript falls back to the sibling `.d.ts`) | attw is the stricter authority — the reason both checks exist |
| `"./styles.css"` dropped from `exports` | **`vite-app` build fails**: *"./styles.css is not exported"* | the existing 003 tarball audit **still passes** — the file is in the tarball, it is just unreachable. That is exactly the gap this gate was added to close |

`attw` is configured through `.attw.json` with two deliberate settings, each
documented in that file: the CSS subpaths are excluded (a stylesheet has no
types, so attw's question does not apply), and the `esm-only` profile is
selected (the package publishes ESM only, on purpose).

---

## F-7 — A "stylesheet reached the page" assertion needs a token, not a colour

**Severity**: harness correctness; fixed, recorded so it is not reintroduced.

The first version of the Next.js fixture's stylesheet assertion checked that a
Button's background was not transparent. It passed with the stylesheet import
removed entirely *(verified)* — an unstyled `<button>` still gets the UA's
`buttonface` background. The check proved nothing.

`test/consumers/next-app.cy.ts` now reads `--fui-surface-page` off the document
element: a custom property exists only if the token layer loaded, and it is
palette-independent, so re-theming cannot invalidate it. The font-family check
alongside it reads the expected value **from the token** rather than naming a
font, for the same reason.

Generalisable: *an assertion whose subject has a browser default cannot prove
that CSS arrived.*

---

## F-8 — Nothing deterministic caught a hardcoded colour, and SC-013 is what revealed it

**Severity**: a real hole in the pipeline. **Closed** in this feature, because
closing it is automation work rather than a change to component behaviour, token
values or the public API.

SC-013 asks for the local hooks to be disabled, the same violation pushed, and
the gate confirmed to fail anyway — *"this scenario tests the gate, not the
hook"*. Run for real, it found what it was written to find.

| Candidate gate | Catches `bg-[#ff0000]`? |
| -------------- | ----------------------- |
| `npm run lint` (oxlint) | **No.** oxlint has no Tailwind-arbitrary-value rule; the string is an ordinary string literal to it. |
| `token-audit` review job | Yes — but it is **advisory by construction** (FR-017) and can never block a merge. |
| `constitution-review` | Same: advisory. |
| `visual-compare` | Only once baselines exist, and only if the colour actually moves a captured pixel. |

So the local `PostToolUse` hook was the only thing enforcing Principle I's most
mechanical rule — precisely the *"the hook has quietly become load-bearing"*
state SC-013 exists to detect. The quickstart's expectation that "the
`token-audit` and lint gates still fail" was not true of any blocking gate.

**Closed by** `scripts/token-audit.mjs`, wired into the `lint` CI job as
`npm run lint:tokens`. It shares its rule definitions with the hook through
`scripts/token-rules.mjs` — one module, two consumers — so the two cannot drift
apart. That sharing makes FR-036's "the hook enforces nothing new" structural
rather than aspirational: they are literally the same rules.

Verified both ways: with the hook bypassed entirely, `npm run lint:tokens` fails
on `bg-[#ff0000]` naming file, line and rule; on the unmodified tree it passes.

The **judgement** half — a token that is real, correctly prefixed and correctly
spelled but *means* the wrong thing — stays advisory, because it cannot be a
regex. Same split as `coverage-gate` versus `coverage-suggest`.
