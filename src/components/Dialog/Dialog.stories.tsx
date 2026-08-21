import { useState } from "react";
import type { ReactNode } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../Button";
import { Dialog } from "./Dialog";
import type { DialogProps } from "./Dialog.types";
import { DIALOG_DEFAULTS, DialogSize } from "./Dialog.types";

const WarningIcon = (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    aria-hidden="true"
    className="fui:size-4 fui:shrink-0 fui:text-feedback-warning"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M8.87 1.97a1 1 0 0 0-1.74 0L.9 12.86A1 1 0 0 0 1.76 14.4h12.48a1 1 0 0 0 .87-1.53L8.87 1.97ZM7.25 6a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V6ZM8 12.6a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Z"
    />
  </svg>
);

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
  args: { open: false, onClose: () => {} },
  // Controls belong on `meta`, not on the Playground story alone — meta-level
  // argTypes apply to every story in the file, and they are what the autodocs
  // props table renders. `size` is spelled out rather than inferred because a
  // const-object union only resolves to its literal members under
  // react-docgen-typescript (.storybook/main.ts), and `title`/`footer` are
  // `ReactNode`, which has no inferrable control at all.
  argTypes: {
    size: {
      control: "select",
      options: Object.values(DialogSize),
      description: "Panel width: sm 400 / md 600 / lg 900, viewport-capped.",
      table: {
        defaultValue: { summary: DIALOG_DEFAULTS.size },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    title: {
      control: "text",
      description: "Title row content; becomes the accessible name via aria-labelledby.",
      table: { type: { summary: "ReactNode" } },
    },
    dividers: {
      control: "boolean",
      description: 'Hairline dividers under header / above footer (Figma "With divider").',
      table: {
        defaultValue: { summary: String(DIALOG_DEFAULTS.dividers) },
        type: { summary: "boolean" },
      },
    },
    showClose: {
      control: "boolean",
      description: "Header close button — present in every Figma Dialog set.",
      table: {
        defaultValue: { summary: String(DIALOG_DEFAULTS.showClose) },
        type: { summary: "boolean" },
      },
    },
    open: {
      control: false,
      description: "Controlled visibility — driven by the in-canvas trigger in these stories.",
      table: { type: { summary: "boolean" } },
    },
    onClose: {
      control: false,
      description: "Called on every close intent; the owner flips `open`.",
      table: { type: { summary: "() => void" } },
    },
    footer: {
      control: false,
      description: "Right-aligned action slot (Figma composes md Buttons, 8px gap).",
      table: { type: { summary: "ReactNode" } },
    },
    className: {
      control: "text",
      description: "Merge-safe escape hatch on the panel.",
      table: { type: { summary: "string" } },
    },
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

function DialogDemo({
  label,
  children,
  footer,
  ...dialogProps
}: Omit<Partial<DialogProps>, "children" | "footer"> & {
  label: string;
  children?: ReactNode;
  footer?: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        {label}
      </Button>
      <Dialog open={open} onClose={close} footer={footer?.(close)} {...dialogProps}>
        {children}
      </Dialog>
    </>
  );
}

/**
 * Storybook infers controls only for a story whose `render` accepts args
 * (`__isArgsStory = render.length > 0`). The compositions below take none, so
 * their controls could never do anything — the panel is switched off for them
 * and `Playground` carries the interactive surface. It comes first because
 * autodocs renders the first story of the file as its primary.
 */
const STATIC_COMPOSITION = { controls: { disable: true } };

export const Playground: Story = {
  args: {
    title: "Playground dialog",
    size: "md",
    dividers: false,
    showClose: true,
  },
  render: ({ open: _open, onClose: _onClose, footer: _footer, ...args }) => (
    <DialogDemo
      label="Open playground dialog"
      {...args}
      footer={(close) => (
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>Confirm</Button>
        </>
      )}
    >
      <p className="fui:m-0">Tweak every public prop from the controls panel.</p>
    </DialogDemo>
  ),
};

export const Basic: Story = {
  parameters: STATIC_COMPOSITION,
  render: () => (
    <DialogDemo
      label="Open basic dialog"
      title="Basic dialog"
      footer={(close) => (
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>Confirm</Button>
        </>
      )}
    >
      <p className="fui:m-0">
        Body copy explaining what this dialog is about, rendered in the Regular/Body ramp on the
        control ink.
      </p>
    </DialogDemo>
  ),
};

export const Warning: Story = {
  parameters: STATIC_COMPOSITION,
  render: () => (
    <DialogDemo
      label="Open warning dialog"
      title="Delete workspace?"
      footer={(close) => (
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button variant="outline" danger onClick={close}>
            Delete
          </Button>
        </>
      )}
    >
      <div className="fui:flex fui:items-start fui:gap-2">
        {WarningIcon}
        <p className="fui:m-0">
          This permanently removes the workspace and all of its content. This action cannot be
          undone.
        </p>
      </div>
    </DialogDemo>
  ),
};

export const Scrollable: Story = {
  parameters: STATIC_COMPOSITION,
  render: () => (
    <DialogDemo
      label="Open scrollable dialog"
      title="Terms of service"
      footer={(close) => (
        <>
          <Button variant="ghost" onClick={close}>
            Decline
          </Button>
          <Button onClick={close}>Accept</Button>
        </>
      )}
    >
      <div className="fui:flex fui:flex-col fui:gap-2">
        {Array.from({ length: 40 }, (_, i) => (
          <p key={i} className="fui:m-0">
            {i + 1}. The body region clips and scrolls while the title and footer stay fixed —
            exactly like the Figma Scrollable set.
          </p>
        ))}
      </div>
    </DialogDemo>
  ),
};

export const WithDividers: Story = {
  parameters: STATIC_COMPOSITION,
  render: () => (
    <DialogDemo
      label="Open divided dialog"
      title="Divided dialog"
      dividers
      footer={(close) => (
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>Confirm</Button>
        </>
      )}
    >
      <p className="fui:m-0">
        Full-bleed hairline dividers separate the header and footer from the body, with the 16/24
        padding rhythm from the With divider set.
      </p>
    </DialogDemo>
  ),
};

export const Sizes: Story = {
  parameters: STATIC_COMPOSITION,
  render: () => (
    <div className="fui:flex fui:gap-4">
      {(["sm", "md", "lg"] as const).map((size) => (
        <DialogDemo
          key={size}
          label={`Open ${size} (${{ sm: 400, md: 600, lg: 900 }[size]}px)`}
          title={`Size ${size}`}
          size={size}
          footer={(close) => <Button onClick={close}>Close</Button>}
        >
          <p className="fui:m-0">
            Panel width {{ sm: 400, md: 600, lg: 900 }[size]}px, viewport-capped.
          </p>
        </DialogDemo>
      ))}
    </div>
  ),
};
