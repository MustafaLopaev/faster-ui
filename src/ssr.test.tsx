import { act } from "react";
import type { ReactElement } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import type { Root } from "react-dom/client";

import { Button } from "./components/Button";
import { Input } from "./components/Input";
import { Dialog } from "./components/Dialog";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const Icon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

function hydrateIntoServerMarkup(element: ReactElement) {
  const html = renderToString(element);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.append(container);

  const recoverable: unknown[] = [];
  const consoleErrors: unknown[][] = [];
  const spy = jest.spyOn(console, "error").mockImplementation((...args: unknown[]) => {
    consoleErrors.push(args);
  });

  let root: Root | undefined;
  try {
    act(() => {
      root = hydrateRoot(container, element, {
        onRecoverableError: (error) => recoverable.push(error),
      });
    });
    act(() => {
      root?.unmount();
    });
  } finally {
    spy.mockRestore();
    container.remove();
  }

  return { html, recoverable, consoleErrors };
}

function expectCleanHydration(element: ReactElement) {
  const { html, recoverable, consoleErrors } = hydrateIntoServerMarkup(element);
  expect(html.length).toBeGreaterThan(0);
  expect(recoverable).toEqual([]);
  expect(consoleErrors).toEqual([]);
  return html;
}

const CASES: Array<[name: string, render: () => ReactElement]> = [
  ["Button primary", () => <Button>Save</Button>],
  ["Button outline", () => <Button variant="outline">Cancel</Button>],
  ["Button ghost", () => <Button variant="ghost">Dismiss</Button>],
  ["Button link", () => <Button variant="link">Learn more</Button>],
  ["Button danger", () => <Button danger>Delete</Button>],
  [
    "Button link danger",
    () => (
      <Button variant="link" danger>
        Delete
      </Button>
    ),
  ],
  ["Button loading", () => <Button loading>Saving</Button>],
  ["Button disabled", () => <Button disabled>Save</Button>],
  [
    "Button with icon slots",
    () => (
      <Button leftIcon={Icon} rightIcon={Icon}>
        Both
      </Button>
    ),
  ],
  [
    "Button iconOnly",
    () => (
      <Button iconOnly aria-label="Add">
        {Icon}
      </Button>
    ),
  ],
  [
    "Button iconOnly loading",
    () => (
      <Button iconOnly loading aria-label="Adding">
        {Icon}
      </Button>
    ),
  ],

  ["Input bare", () => <Input />],
  ["Input labelled", () => <Input label="Email" />],
  ["Input error", () => <Input label="Email" error="Enter a valid address" />],
  ["Input disabled", () => <Input label="Email" disabled />],
  ["Input number", () => <Input label="Quantity" type="number" defaultValue={3} />],
  ["Input clearable", () => <Input label="Search" clearable defaultValue="query" />],
  [
    "Input adornments",
    () => <Input label="Amount" prefix="$" suffix="USD" leftIcon={Icon} rightIcon={Icon} />,
  ],

  [
    "Dialog closed",
    () => (
      <Dialog open={false} onClose={() => {}} title="Closed">
        Body
      </Dialog>
    ),
  ],
  [
    "Dialog open",
    () => (
      <Dialog open onClose={() => {}} title="Open">
        Body
      </Dialog>
    ),
  ],
  [
    "Dialog with dividers and footer",
    () => (
      <Dialog open onClose={() => {}} title="Dividers" dividers footer={<Button>OK</Button>}>
        Body
      </Dialog>
    ),
  ],
  [
    "Dialog sm",
    () => (
      <Dialog open onClose={() => {}} size="sm" title="Small">
        Body
      </Dialog>
    ),
  ],
  [
    "Dialog md",
    () => (
      <Dialog open onClose={() => {}} size="md" title="Medium">
        Body
      </Dialog>
    ),
  ],
  [
    "Dialog lg",
    () => (
      <Dialog open onClose={() => {}} size="lg" title="Large">
        Body
      </Dialog>
    ),
  ],
  [
    "Dialog without a title or close button",
    () => (
      <Dialog open={false} onClose={() => {}} showClose={false}>
        Body
      </Dialog>
    ),
  ],
];

describe("server rendering and hydration", () => {
  it.each(CASES)("%s renders on the server and hydrates cleanly", (_name, render) => {
    expectCleanHydration(render());
  });

  it("emits <dialog> WITHOUT the open attribute on the server, and that is correct", () => {
    const html = renderToString(
      <Dialog open onClose={() => {}} title="Server">
        Body
      </Dialog>,
    );
    expect(html).toContain("<dialog");
    expect(html).not.toMatch(/<dialog[^>]*\sopen[\s>]/);
    expectCleanHydration(
      <Dialog open onClose={() => {}} title="Server">
        Body
      </Dialog>,
    );
  });

  it("renders a composed tree and hydrates cleanly", () => {
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
    );
  });
});
