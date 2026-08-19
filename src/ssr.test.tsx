/**
 * Server rendering and hydration — the regression guard (004 FR-007/FR-008).
 *
 * Every variant case is rendered with `renderToString`, then hydrated into that
 * exact markup. BOTH error channels are asserted empty, because neither is a
 * superset of the other (research R-5): React 19 reports some hydration
 * mismatches through `onRecoverableError` and recovers from others by
 * re-rendering, reporting those only to `console.error`. Asserting one leaves a
 * hole exactly the size of the other.
 *
 * Baseline: this suite passes on the commit that introduces it — all variant
 * cases render today (verified in research R-0). A red verdict here on the
 * introducing commit is a bug in the test, not in the library.
 *
 * The complementary check lives in `ssr-node.test.ts`: jsdom *provides*
 * `document`, so a module-scope DOM access passes silently in this environment.
 */
import { act } from 'react'
import type { ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { hydrateRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'

import { Button } from './components/Button'
import { Input } from './components/Input'
import { Dialog } from './components/Dialog'

// `act` outside React Testing Library needs the flag set explicitly; without it
// React logs an act-environment warning that the console spy would (correctly)
// report as a failure.
declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
)

/** Render on the server, hydrate into that markup, collect both error channels. */
function hydrateIntoServerMarkup(element: ReactElement) {
  const html = renderToString(element)

  const container = document.createElement('div')
  container.innerHTML = html
  document.body.append(container)

  const recoverable: unknown[] = []
  const consoleErrors: unknown[][] = []
  const spy = jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args)
  })

  let root: Root | undefined
  try {
    act(() => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverable.push(error),
      })
    })
    act(() => {
      root?.unmount()
    })
  } finally {
    spy.mockRestore()
    container.remove()
  }

  return { html, recoverable, consoleErrors }
}

function expectCleanHydration(element: ReactElement) {
  const { html, recoverable, consoleErrors } = hydrateIntoServerMarkup(element)
  expect(html.length).toBeGreaterThan(0)
  expect(recoverable).toEqual([])
  expect(consoleErrors).toEqual([])
  return html
}

// Every case is named, because a failure must say which variant broke without
// anyone opening the stack trace. Elements come from factories rather than an
// array of JSX literals: a literal inside an array reads as a rendered list to
// the linter, and a `key` on something never rendered as a list would be noise.
const CASES: Array<[name: string, render: () => ReactElement]> = [
  ['Button primary', () => <Button>Save</Button>],
  ['Button outline', () => <Button variant="outline">Cancel</Button>],
  ['Button ghost', () => <Button variant="ghost">Dismiss</Button>],
  ['Button link', () => <Button variant="link">Learn more</Button>],
  ['Button danger', () => <Button danger>Delete</Button>],
  [
    'Button link danger',
    () => (
      <Button variant="link" danger>
        Delete
      </Button>
    ),
  ],
  ['Button loading', () => <Button loading>Saving</Button>],
  ['Button disabled', () => <Button disabled>Save</Button>],
  [
    'Button with icon slots',
    () => (
      <Button leftIcon={Icon} rightIcon={Icon}>
        Both
      </Button>
    ),
  ],
  [
    'Button iconOnly',
    () => (
      <Button iconOnly aria-label="Add">
        {Icon}
      </Button>
    ),
  ],
  [
    'Button iconOnly loading',
    () => (
      <Button iconOnly loading aria-label="Adding">
        {Icon}
      </Button>
    ),
  ],

  ['Input bare', () => <Input />],
  ['Input labelled', () => <Input label="Email" />],
  ['Input error', () => <Input label="Email" error="Enter a valid address" />],
  ['Input disabled', () => <Input label="Email" disabled />],
  ['Input number', () => <Input label="Quantity" type="number" defaultValue={3} />],
  ['Input clearable', () => <Input label="Search" clearable defaultValue="query" />],
  [
    'Input adornments',
    () => <Input label="Amount" prefix="$" suffix="USD" leftIcon={Icon} rightIcon={Icon} />,
  ],

  [
    'Dialog closed',
    () => (
      <Dialog open={false} onClose={() => {}} title="Closed">
        Body
      </Dialog>
    ),
  ],
  [
    'Dialog open',
    () => (
      <Dialog open onClose={() => {}} title="Open">
        Body
      </Dialog>
    ),
  ],
  [
    'Dialog with dividers and footer',
    () => (
      <Dialog open onClose={() => {}} title="Dividers" dividers footer={<Button>OK</Button>}>
        Body
      </Dialog>
    ),
  ],
  [
    'Dialog sm',
    () => (
      <Dialog open onClose={() => {}} size="sm" title="Small">
        Body
      </Dialog>
    ),
  ],
  [
    'Dialog md',
    () => (
      <Dialog open onClose={() => {}} size="md" title="Medium">
        Body
      </Dialog>
    ),
  ],
  [
    'Dialog lg',
    () => (
      <Dialog open onClose={() => {}} size="lg" title="Large">
        Body
      </Dialog>
    ),
  ],
  [
    'Dialog without a title or close button',
    () => (
      <Dialog open={false} onClose={() => {}} showClose={false}>
        Body
      </Dialog>
    ),
  ],
]

describe('server rendering and hydration', () => {
  it.each(CASES)('%s renders on the server and hydrates cleanly', (_name, render) => {
    expectCleanHydration(render())
  })

  // The carve-out, recorded so nobody "fixes" it (research R-5, contract
  // deterministic-gates.md#ssr): `open` is applied by an effect, and effects do
  // not run during server rendering. The client's FIRST render also omits it —
  // only the subsequent effect opens the element — so the markup matches and
  // hydration is clean. A `<dialog open>` in the server output would be the bug.
  it('emits <dialog> WITHOUT the open attribute on the server, and that is correct', () => {
    const html = renderToString(
      <Dialog open onClose={() => {}} title="Server">
        Body
      </Dialog>,
    )
    expect(html).toContain('<dialog')
    expect(html).not.toMatch(/<dialog[^>]*\sopen[\s>]/)
    // And hydrating that markup reports nothing on either channel.
    expectCleanHydration(
      <Dialog open onClose={() => {}} title="Server">
        Body
      </Dialog>,
    )
  })

  // A composed tree, not just leaves: a Dialog whose footer holds Buttons is the
  // shape a consumer actually server-renders, and it exercises `useId` collision
  // across two components in one pass.
  it('renders a composed tree and hydrates cleanly', () => {
    expectCleanHydration(
      <form>
        <Input label="Email" error="Required" />
        <Dialog
          open
          onClose={() => {}}
          title="Confirm"
          dividers
          footer={
            <>
              <Button variant="outline">Cancel</Button>
              <Button danger>Delete</Button>
            </>
          }
        >
          <Input label="Reason" clearable defaultValue="typo" />
        </Dialog>
      </form>,
    )
  })
})
