import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import type { ButtonProps } from './Button'

const PlusIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

const ArrowIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="M3 8h10m0 0-4-4m4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

const SIZES = ['lg', 'md', 'sm'] as const

// One grid per variant×tone: rows = sizes, columns = default/disabled/loading
// (hover/focus/active are live on the canvas and asserted in Cypress, R-11/R-14).
function MatrixGrid({ variant, danger }: { variant?: 'primary' | 'outline' | 'ghost' | 'link'; danger?: boolean }) {
  return (
    <div className="fui:flex fui:flex-col fui:gap-4">
      {SIZES.map((size) => (
        <div key={size} className="fui:flex fui:items-center fui:gap-4">
          <Button variant={variant} danger={danger} size={size}>
            Button
          </Button>
          <Button variant={variant} danger={danger} size={size} disabled>
            Disabled
          </Button>
          <Button variant={variant} danger={danger} size={size} loading>
            Loading
          </Button>
        </div>
      ))}
    </div>
  )
}

export const Primary: Story = { render: () => <MatrixGrid variant="primary" /> }
export const PrimaryDanger: Story = { render: () => <MatrixGrid variant="primary" danger /> }
export const Outline: Story = { render: () => <MatrixGrid variant="outline" /> }
export const OutlineDanger: Story = { render: () => <MatrixGrid variant="outline" danger /> }
export const Ghost: Story = { render: () => <MatrixGrid variant="ghost" /> }
export const GhostDanger: Story = { render: () => <MatrixGrid variant="ghost" danger /> }
export const Link: Story = { render: () => <MatrixGrid variant="link" /> }
export const LinkDanger: Story = { render: () => <MatrixGrid variant="link" danger /> }

// Circular icon-only sets: primary/outline/ghost only (A-11), aria-label required.
export const IconOnly: Story = {
  render: () => (
    <div className="fui:flex fui:flex-col fui:gap-4">
      {(['primary', 'outline', 'ghost'] as const).map((variant) => (
        <div key={variant} className="fui:flex fui:items-center fui:gap-4">
          {SIZES.map((size) => (
            <Button key={size} iconOnly aria-label={`Add (${variant} ${size})`} variant={variant} size={size}>
              {PlusIcon}
            </Button>
          ))}
          <Button iconOnly aria-label={`Add (${variant} disabled)`} variant={variant} disabled>
            {PlusIcon}
          </Button>
          <Button iconOnly aria-label={`Add (${variant} loading)`} variant={variant} loading>
            {PlusIcon}
          </Button>
        </div>
      ))}
    </div>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <div className="fui:flex fui:items-center fui:gap-4">
      <Button leftIcon={PlusIcon}>Add item</Button>
      <Button variant="outline" rightIcon={ArrowIcon}>
        Continue
      </Button>
      <Button variant="ghost" leftIcon={PlusIcon} rightIcon={ArrowIcon}>
        Both slots
      </Button>
    </div>
  ),
}

export const Playground: Story = {
  args: {
    children: 'Playground',
    variant: 'primary',
    danger: false,
    size: 'md',
    loading: false,
    disabled: false,
    iconOnly: false,
    'aria-label': '',
    className: '',
  } as ButtonProps,
  argTypes: {
    variant: { control: 'select', options: ['primary', 'outline', 'ghost', 'link'] },
    size: { control: 'select', options: ['sm', 'md', 'lg'] },
    danger: { control: 'boolean' },
    loading: { control: 'boolean' },
    disabled: { control: 'boolean' },
    iconOnly: {
      control: 'boolean',
      description: 'Circular icon button — set an aria-label and icon children when on',
    },
    'aria-label': { control: 'text', description: 'Required accessible name in iconOnly mode' },
    leftIcon: { control: false, description: 'Leading icon slot (ReactNode)' },
    rightIcon: { control: false, description: 'Trailing icon slot (ReactNode)' },
    className: { control: 'text', description: 'Merge-safe escape hatch — appended last' },
    children: { control: 'text' },
  },
  render: (args) => {
    // The discriminated union can't be spread straight from loose Storybook
    // args — normalize the iconOnly branch before handing props to Button.
    const raw = args as Record<string, unknown>
    const props = (
      raw.iconOnly
        ? { ...raw, variant: raw.variant === 'link' ? 'primary' : raw.variant, danger: undefined, 'aria-label': (raw['aria-label'] as string) || 'Icon action', children: PlusIcon }
        : { ...raw, 'aria-label': (raw['aria-label'] as string) || undefined }
    ) as unknown as ButtonProps
    return <Button {...props} />
  },
}
