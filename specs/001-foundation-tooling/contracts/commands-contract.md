# Contract: Command Set

The npm scripts every developer and (later) CI relies on. FR-010. All run from the repo root after `npm install`, no undocumented setup (SC-002).

| Script | Command | Contract |
| ------ | ------- | -------- |
| `dev` | `vite` | Serves the dev playground with live token styling; hot-reloads token edits |
| `build` | `tsc -b && vite build` | Fails on any type error; on success `dist/` contains `index.js`, `index.d.ts`, `styles.css` and nothing test/story-related |
| `lint` | `oxlint` | Exit 0 = no violations across `src/`, config, test, and story files |
| `typecheck` | `tsc -b` | Checks all four TS projects (lib / jest / cypress / node) in one run |
| `test` | `jest` | Runs every `src/**/*.test.tsx` once, non-interactive, exit 0 = all green |
| `test:watch` | `jest --watch` | Local TDD loop |
| `cy:ct` | `cypress run --component` | Headless run of every `src/**/*.cy.tsx` with token CSS applied; exit 0 = all green |
| `cy:open` | `cypress open --component` | Interactive runner |
| `storybook` | `storybook dev -p 6006` | Workbench at :6006; light/dark toolbar present; zero console errors/warnings on story render |
| `build-storybook` | `storybook build` | Static build to `storybook-static/`, exit 0 (CI-ready) |

Removed from the scaffold: `preview` (app-preview is meaningless for a library).

**Stability**: names are the contract — the CI feature (next spec) transcribes these; renaming any script after CI lands is a breaking workflow change.
