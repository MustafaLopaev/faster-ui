/**
 * The mechanical half of the token audit — ONE definition, two consumers.
 *
 * `.claude/hooks/token-guard.mjs` (local, refuses an edit) and
 * `scripts/token-audit.mjs` (CI, blocks a merge) both import from here.
 *
 * That sharing is the point, not a convenience. FR-036 requires the local hook
 * enforce nothing the pipeline does not, and SC-013 verifies it by disabling
 * the hooks and confirming the gate still fails. Two copies of these patterns
 * would drift, and the day they drifted the hook would start enforcing
 * something no gate does — which is precisely the state SC-013 exists to
 * prevent. Sharing the module makes the property structural instead of
 * aspirational.
 *
 * The JUDGEMENT half — a token that is real and correctly spelled but means the
 * wrong thing — cannot be a regex and lives in the advisory `token-audit` review
 * job. Same split as `coverage-gate` versus `coverage-suggest`.
 */

export const TOKEN_RULES = [
  {
    id: 'raw-colour',
    test: /#[0-9a-fA-F]{3,8}\b(?![0-9a-zA-Z])/,
    name: 'raw colour literal',
    why: 'Components use semantic tokens only; raw values belong in src/tokens/ (Principle I).',
  },
  {
    id: 'arbitrary-value',
    // `bg-[#3b82f6]`, `rounded-[7px]`, `p-[13px]` — an arbitrary value carrying
    // a visual decision. The sanctioned exception is a BEHAVIOURAL appearance
    // reset (`[appearance:textfield]`, `[&::-webkit-…]`), which encodes no
    // colour, length or radius — hence the negative lookahead rather than a
    // blanket allowance.
    test: /\b(?:bg|text|border|shadow|rounded|p|m|w|h|gap|size)-\[(?!&|appearance:)[^\]]*(?:#|\d+(?:px|rem|em|%)|rgb|hsl|oklch)[^\]]*\]/,
    name: 'arbitrary-value utility carrying a visual value',
    why: 'Use a token-backed `fui:` utility. Arbitrary values bypass the token layer entirely (Principle I).',
  },
  {
    id: 'non-semantic-palette',
    test: /\b(?:bg|text|border|ring|from|to|via)-(?:slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/,
    name: 'non-semantic palette utility',
    why: 'Components name ROLES (`fui:bg-action-primary`), not colours. `reset.css` deliberately wipes these namespaces, so the class does nothing anyway.',
  },
  {
    id: 'inline-style-literal',
    test: /style=\{\{[^}]*(?:color|background|border(?:Color|Radius)|padding|margin|boxShadow)\s*:\s*['"][^'"]*(?:#|\d+px)/,
    name: 'inline style with a literal visual value',
    why: 'Same rule as a class: the value belongs to a token.',
  },
]

/**
 * Which files these rules apply to.
 *
 * `src/tokens/` is EXEMPT by construction — it is not listed below, and raw
 * values are exactly what that layer is for. Tests, stories and Cypress specs
 * are exempt too: asserting a resolved colour is how the token layer is
 * verified, so a hex there is evidence, not a violation.
 *
 * `src/assets/` IS audited. Icon assets carry `fui:` classes like any other
 * shipped markup, and moving them out of the component files must not move
 * them out of Principle I's reach.
 */
export function isAuditable(path) {
  return (
    /(^|\/)src\/(components|lib|assets)\/.+\.(tsx?|css)$/.test(path) &&
    !/\.(test|cy|stories)\.tsx?$/.test(path)
  )
}

/** @returns {{line:number, value:string, rule:typeof TOKEN_RULES[number]}[]} */
export function findViolations(text) {
  const found = []
  for (const [index, line] of text.split('\n').entries()) {
    for (const rule of TOKEN_RULES) {
      const match = rule.test.exec(line)
      if (match) found.push({ line: index + 1, value: match[0], rule })
    }
  }
  return found
}
