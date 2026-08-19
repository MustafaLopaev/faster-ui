# Contract: Package Surface (`faster-ui`)

What a consuming project may rely on. Anything not listed is private and may change without notice.

## Manifest

```jsonc
{
  "name": "faster-ui",
  "version": "0.1.0",              // semver from here on
  "type": "module",
  "files": ["dist"],
  "sideEffects": ["**/*.css"],
  "exports": {
    ".":            { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./styles.css": "./dist/styles.css"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

## Guarantees

1. **Two import surfaces only**: `faster-ui` (components + types) and `faster-ui/styles.css` (tokens + compiled styles). Deep imports (`faster-ui/dist/...`, `faster-ui/src/...`) do not resolve — the exports map blocks them.
2. **ESM only**, with TypeScript declarations rolled up into `dist/index.d.ts` (no internal file paths leak into types).
3. **React is never bundled**: `react`, `react-dom`, `react/jsx-runtime` are externals; the host provides React 19+.
4. **Styling works without Tailwind in the host**: `styles.css` ships tokens and every utility the components use, pre-compiled. All selectors/variables are `fui`-prefixed; importing the stylesheet must not restyle host elements.
5. **No runtime dependencies** in this feature (`dependencies` stays empty).
6. Runtime behavior requires exactly: `import 'faster-ui/styles.css'` once, plus (for dark mode) toggling the `dark` class on the document root.

## Consumer smoke usage (validation target)

```tsx
import { Smoke } from 'faster-ui';
import 'faster-ui/styles.css';

<Smoke className="extra">hello</Smoke>   // renders token-styled, className merged
```

`Smoke` is temporary scaffolding (removed when the first real component lands) — its *packaging path* is the contract under test, not the component itself.
