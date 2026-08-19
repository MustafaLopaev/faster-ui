import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

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

export const Default: Story = {
  args: { label: "Email", placeholder: "you@example.com" },
};

export const Error: Story = {
  args: { label: "Email", defaultValue: "not-an-email", error: "Enter a valid email address" },
};

export const Disabled: Story = {
  render: () => (
    <div className="fui:flex fui:flex-col fui:gap-4">
      <Input label="Empty" placeholder="Placeholder ink" disabled />
      <Input label="With value" defaultValue="Entered value ink" disabled />
    </div>
  ),
};

export const Adornments: Story = {
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
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    label: { control: "text" },
    error: { control: "text", description: "Presence switches the field into the error state" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    clearable: { control: "boolean" },
    prefix: { control: "text" },
    suffix: { control: "text" },
    leftIcon: { control: false, description: "Leading in-field icon (ReactNode)" },
    rightIcon: { control: false, description: "Trailing in-field icon (ReactNode)" },
    onClear: { control: false },
    className: { control: "text", description: "Merge-safe escape hatch on the root" },
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
