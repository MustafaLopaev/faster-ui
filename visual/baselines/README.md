# Visual baselines

Committed PNGs, one per cell of the matrix in `../matrix.ts`. This directory is
empty in a fresh clone and is populated by a workflow run, never by a developer
machine.

## Why this directory is not just filled in locally

**Baselines are captured on `ubuntu-latest` and are valid only there.** Font
rasterisation alone makes a macOS or Windows capture differ from a Linux one on
*every* cell, so a locally accepted set would replace a working baseline with
one that fails everything in CI — and the diff would look like a legitimate
visual change rather than a platform mismatch. `scripts/visual-accept.mjs`
refuses to run off Linux without `--force` for that reason.

Generate or refresh them on the runner:

```
gh workflow run visual.yml -f accept-baselines=true
```

That job captures once, accepts, then captures ten more times and **refuses to
open the pull request if any cell drifted** on the unchanged commit. An unstable
baseline set makes every later visual result meaningless, so it is refused
rather than committed (SC-006).

## Until this directory is populated

`visual-compare` reports **cold start**: it says no baseline set exists, exits 0,
and skips judgment. It does not claim a pass — nothing was established — and it
does not fail, because a failure it cannot substantiate would block every pull
request until someone muted the check. The same flag skips the nightly Batch
sweep.

## Reading a filename

```
{storyId}__{theme}-{palette}-{viewport}-{scale}-{direction}-{motion}-{content}.png
```

A cell's identity **is** its filename — there is no sidecar index that can fall
out of sync with the images beside it.

## Budget

12 MB, enforced by `scripts/visual-accept.mjs`. The current matrix projects to
about 7.7 MB across 239 cells. If it will not fit, **the matrix narrows** — the
budget does not silently rise, exactly as `scripts/postbuild.mjs` treats the
distribution size budget.

`.gitattributes` marks `*.png` here as `binary -diff`, so git never attempts a
textual diff on an accepted set.
