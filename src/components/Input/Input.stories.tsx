import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";
import { INPUT_DEFAULTS, InputSize } from "./Input.types";

const SearchIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
    <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CalendarIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <rect x="2.5" y="3.5" width="11" height="10" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M2.5 6.5h11M5.5 2v3M10.5 2v3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const meta = {
  title: "Components/Input",
  component: Input,
  parameters: { layout: "centered" },
  // Controls belong on `meta`, not on one story: meta-level argTypes apply to
  // every story in the file — including the one autodocs renders as its
  // primary — so a reader can drive the component from wherever they landed.
  // Declared here rather than left to docgen for two reasons: a `ReactNode`
  // prop has no inferrable control (it would fall through to a JSON editor),
  // and the native `<input>` attributes are filtered out of docgen on purpose
  // (see .storybook/main.ts), so without these rows `placeholder`, `disabled`
  // and `type` have no control at all.
  argTypes: {
    size: {
      control: "select",
      options: Object.values(InputSize),
      description: "Figma Small/Medium/Large (24/36/40px).",
      table: {
        defaultValue: { summary: INPUT_DEFAULTS.size },
        type: { summary: "'sm' | 'md' | 'lg'" },
      },
    },
    label: {
      control: "text",
      description: "Visible label rendered above the field, associated via htmlFor.",
      table: { type: { summary: "ReactNode" } },
    },
    error: {
      control: "text",
      description: "Presence switches the field into the error state.",
      table: { type: { summary: "string" } },
    },
    prefix: {
      control: "text",
      description: "Static leading affix text inside the field.",
      table: { type: { summary: "ReactNode" } },
    },
    suffix: {
      control: "text",
      description: "Static trailing affix text inside the field.",
      table: { type: { summary: "ReactNode" } },
    },
    clearable: {
      control: "boolean",
      description: "Clear affordance while the field has a value.",
      table: {
        defaultValue: { summary: String(INPUT_DEFAULTS.clearable) },
        type: { summary: "boolean" },
      },
    },
    leftIcon: {
      control: false,
      description: "Leading in-field icon (ReactNode); presentational.",
      table: { type: { summary: "ReactNode" } },
    },
    rightIcon: {
      control: false,
      description: "Trailing in-field icon (ReactNode); presentational.",
      table: { type: { summary: "ReactNode" } },
    },
    onClear: { control: false, table: { type: { summary: "() => void" } } },
    placeholder: {
      control: "text",
      description: "The native attribute; renders in the placeholder ink.",
      table: { type: { summary: "string" } },
    },
    disabled: {
      control: "boolean",
      description: "The native attribute; drives the Figma disabled set.",
      table: { type: { summary: "boolean" } },
    },
    readOnly: {
      control: "boolean",
      description: "The native attribute; suppresses the clear affordance and the steppers.",
      table: { type: { summary: "boolean" } },
    },
    required: { control: "boolean", table: { type: { summary: "boolean" } } },
    type: {
      control: "select",
      options: ["text", "email", "password", "search", "tel", "url", "number"],
      description: "The native attribute; `number` adds the stepper column.",
      table: { type: { summary: "string" } },
    },
    className: {
      control: "text",
      description: "Merge-safe escape hatch on the root.",
      table: { type: { summary: "string" } },
    },
  },
  decorators: [
    (Story) => (
      <div className="fui:w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * `Disabled`, `Adornments` and `Sizes` render fixed grids from a zero-arity
 * `render`, so Storybook infers no controls for them and the meta-level
 * argTypes would only offer widgets that change nothing. `Default`, `Error`
 * and `Playground` are args-driven and keep their panel.
 */
const STATIC_GRID = { controls: { disable: true } };

export const Default: Story = {
  args: { label: "Email", placeholder: "you@example.com" },
};

export const Error: Story = {
  args: { label: "Email", defaultValue: "not-an-email", error: "Enter a valid email address" },
};

export const Disabled: Story = {
  parameters: STATIC_GRID,
  render: () => (
    <div className="fui:flex fui:flex-col fui:gap-4">
      <Input label="Empty" placeholder="Placeholder ink" disabled />
      <Input label="With value" defaultValue="Entered value ink" disabled />
    </div>
  ),
};

export const Adornments: Story = {
  parameters: STATIC_GRID,
  render: () => (
    <div className="fui:flex fui:flex-col fui:gap-4">
      <Input label="Search" leftIcon={SearchIcon} placeholder="Left icon" clearable />
      <Input label="Date" rightIcon={CalendarIcon} placeholder="Right icon" />
      <Input label="Website" prefix="http://" suffix=".com" placeholder="prefix & suffix" />
      <Input label="Price" prefix="¥" suffix="CNY" defaultValue="1024" />
      <Input label="Quantity" type="number" defaultValue={4} min={0} max={10} step={2} />
      <Input label="Clearable" clearable defaultValue="Clear me" />
    </div>
  ),
};

export const Sizes: Story = {
  parameters: STATIC_GRID,
  render: () => (
    <div className="fui:flex fui:flex-col fui:gap-4">
      <Input size="lg" label="Large (40px)" placeholder="16/24 ramp" />
      <Input size="md" label="Medium (36px)" placeholder="14/22 ramp" />
      <Input size="sm" label="Small (24px)" placeholder="12/18 ramp" />
    </div>
  ),
};

export const Playground: Story = {
  args: {
    label: "Playground",
    placeholder: "Type here…",
    size: "md",
    error: "",
    disabled: false,
    clearable: false,
    prefix: "",
    suffix: "",
    className: "",
  },
  render: ({ error, prefix, suffix, ...args }) => (
    <Input
      {...args}
      error={error || undefined}
      prefix={prefix || undefined}
      suffix={suffix || undefined}
    />
  ),
};
