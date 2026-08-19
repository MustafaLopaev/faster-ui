/**
 * Documentation and story coverage (004 FR-023).
 *
 * Constitution Principles III and V make three promises that nothing currently
 * enforces — they are honoured by discipline alone, which is another way of
 * saying they are honoured until someone is in a hurry:
 *
 *   1. every public prop carries JSDoc — it IS the IntelliSense and the
 *      Storybook autodocs table, so an undocumented prop is an undocumented
 *      component;
 *   2. every public prop is reachable from the Playground story's controls —
 *      the Playground is the promise that a reader can try every prop without
 *      writing code;
 *   3. every member of a `variant` or `size` union is rendered by some story —
 *      a variant with no story is a variant nobody reviews.
 *
 * DETECTION IS MECHANICAL, so it lives here and it blocks. WRITING the missing
 * story is a judgement call, so it lives in the advisory `coverage-suggest` job
 * in review.yml and cannot block. That split is the whole design.
 *
 * Parsed with TypeScript's own compiler API rather than matched with regular
 * expressions: the subject is a type declaration, and a regex that "mostly"
 * parses TypeScript fails in exactly the interesting cases.
 */
import ts from 'typescript'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COMPONENTS_DIR = join(root, 'src/components')

const problems = []

function report(file, line, rule, message) {
  problems.push({ file: relative(root, file), line, rule, message })
}

function parse(file) {
  return ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
}

const lineOf = (node, source) =>
  source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1

/** `'aria-label'` and `size` both arrive here as plain strings. */
function nameOf(member) {
  const n = member.name
  if (!n) return undefined
  return ts.isStringLiteral(n) || ts.isNumericLiteral(n) ? n.text : n.getText()
}

/** The string-literal members of a union type, following one alias hop. */
function unionMembers(typeNode, aliases) {
  if (!typeNode) return []
  if (ts.isLiteralTypeNode(typeNode) && ts.isStringLiteral(typeNode.literal)) {
    return [typeNode.literal.text]
  }
  if (ts.isUnionTypeNode(typeNode)) {
    return typeNode.types.flatMap((t) => unionMembers(t, aliases))
  }
  if (ts.isTypeReferenceNode(typeNode)) {
    const alias = aliases.get(typeNode.typeName.getText())
    // One hop only: an alias chain deep enough to matter is a design smell the
    // gate should not paper over.
    return alias ? unionMembers(alias, new Map()) : []
  }
  return []
}

function analyseComponent(name) {
  const dir = join(COMPONENTS_DIR, name)
  const implFile = join(dir, `${name}.tsx`)
  const storiesFile = join(dir, `${name}.stories.tsx`)
  const impl = parse(implFile)
  const stories = parse(storiesFile)
  const storiesText = readFileSync(storiesFile, 'utf8')

  // ── 1. What the component declares ────────────────────────────────────────
  const aliases = new Map()
  impl.forEachChild((node) => {
    if (ts.isTypeAliasDeclaration(node)) aliases.set(node.name.text, node.type)
  })

  const props = new Map() // name → { node, documented, union }
  impl.forEachChild((node) => {
    if (!ts.isInterfaceDeclaration(node) || !node.name.text.endsWith('Props')) return
    for (const member of node.members) {
      if (!ts.isPropertySignature(member)) continue
      const prop = nameOf(member)
      if (!prop) continue

      // `danger?: never` and friends are type-level EXCLUSIONS, not props.
      // They exist to make an illegal combination a compile error; there is
      // nothing for a consumer to pass, document, or put in a control.
      if (member.type?.kind === ts.SyntaxKind.NeverKeyword) continue

      const documented = (ts.getJSDocCommentsAndTags(member) ?? []).some((d) => ts.isJSDoc(d))
      const existing = props.get(prop)
      props.set(prop, {
        line: lineOf(member, impl),
        // A prop declared on two interfaces of a discriminated union needs
        // documenting once — the union that reaches the consumer is the sum.
        documented: existing?.documented || documented,
        union: [...new Set([...(existing?.union ?? []), ...unionMembers(member.type, aliases)])],
      })
    }
  })

  if (props.size === 0) {
    report(implFile, 1, 'no-props-found', `No \`*Props\` interface found for ${name}.`)
    return
  }

  // ── 2. What the Playground story exposes ──────────────────────────────────
  const controls = new Set()
  let playgroundLine = 1
  stories.forEachChild((node) => {
    if (!ts.isVariableStatement(node)) return
    for (const decl of node.declarationList.declarations) {
      if (decl.name.getText() !== 'Playground' || !decl.initializer) continue
      playgroundLine = lineOf(decl, stories)
      if (!ts.isObjectLiteralExpression(decl.initializer)) continue
      for (const entry of decl.initializer.properties) {
        if (!ts.isPropertyAssignment(entry)) continue
        const key = entry.name.getText()
        if (key !== 'args' && key !== 'argTypes') continue
        if (!ts.isObjectLiteralExpression(entry.initializer)) continue
        for (const control of entry.initializer.properties) {
          const controlName = nameOf(control) ?? control.name?.getText()
          if (controlName) controls.add(controlName.replace(/^['"]|['"]$/g, ''))
        }
      }
    }
  })

  if (controls.size === 0) {
    report(
      storiesFile,
      playgroundLine,
      'missing-playground',
      `${name} has no Playground story with args/argTypes. Principle V requires one — it is how a reader tries every prop without writing code.`,
    )
  }

  // ── 3. The three assertions ───────────────────────────────────────────────
  for (const [prop, info] of props) {
    if (!info.documented) {
      report(
        implFile,
        info.line,
        'undocumented-prop',
        `\`${name}.${prop}\` has no JSDoc. That comment is what IntelliSense and the Storybook autodocs table render — without it the prop is undocumented everywhere a consumer looks (Principle III).`,
      )
    }
    if (controls.size > 0 && !controls.has(prop)) {
      report(
        storiesFile,
        playgroundLine,
        'prop-not-in-playground',
        `\`${name}.${prop}\` is a public prop with no entry in the Playground story's args or argTypes. Add one (\`control: false\` is a legitimate answer for a ReactNode slot).`,
      )
    }
    for (const member of info.union) {
      // Source-text search, deliberately: whether a story RENDERS a value is a
      // runtime property, and static analysis of `render` bodies would either
      // miss real coverage or invent it. A literal that appears nowhere in the
      // stories file is definitely not rendered, which is the failure worth
      // catching.
      const used = new RegExp(`['"\`]${member}['"\`]`).test(storiesText)
      if (!used) {
        report(
          storiesFile,
          playgroundLine,
          'union-member-without-story',
          `\`${name}.${prop}\` accepts '${member}', but that value appears in no story. A variant with no story is a variant nobody reviews (Principle V).`,
        )
      }
    }
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────
const components = readdirSync(COMPONENTS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .toSorted()

console.log(`Coverage gate — ${components.length} components: ${components.join(', ')}\n`)
for (const name of components) analyseComponent(name)

if (problems.length === 0) {
  console.log('✔ Every public prop is documented, reachable from its Playground, and every')
  console.log('  variant and size value is rendered by at least one story.')
  process.exit(0)
}

for (const p of problems) {
  console.error(`✖ ${p.file}:${p.line}  [${p.rule}]\n  ${p.message}\n`)
}
console.error(`✖ coverage gate: ${problems.length} problem${problems.length === 1 ? '' : 's'}.`)
process.exit(1)
