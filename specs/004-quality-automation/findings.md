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
