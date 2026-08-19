import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './Button'
import type { ButtonProps } from './Button.types'
import { BUTTON_DEFAULTS, ButtonSize, ButtonVariant } from './Button.types'

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
  /**
   * Authored rather than inferred, and declared at meta level so the autodocs
   * page carries them too.
   *
   * `ButtonProps` is a discriminated union (`TextButtonProps | IconOnlyButtonProps`)
   * so that illegal combinations — `iconOnly` with `danger`, or without an
   * `aria-label` — are compile errors. Neither `react-docgen` (Storybook's
   * default) nor `react-docgen-typescript` resolves props through a union, so
   * automatic extraction yields an empty table for this component and a full
   * one for Input and Dialog, which are plain interfaces. Both were measured.
   *
   * The union is the more valuable half of that trade, so the table is written
   * out here instead. Keep it in step with `Button.types.ts`.
   */
  argTypes: {
    variant: {
      control: 'select',
      options: Object.values(ButtonVariant),
      description: 'Visual style; maps 1:1 to the Figma text-button sets.',
      table: { defaultValue: { summary: BUTTON_DEFAULTS.variant }, type: { summary: "'primary' | 'outline' | 'ghost' | 'link'" } },
    },
    size: {
      control: 'select',
      options: Object.values(ButtonSize),
      description: 'Figma Small/Medium/Large (24/36/40px).',
      table: { defaultValue: { summary: BUTTON_DEFAULTS.size }, type: { summary: "'sm' | 'md' | 'lg'" } },
    },
    danger: {
      control: 'boolean',
      description: 'Switches the variant to its Figma danger counterpart set.',
      table: { defaultValue: { summary: 'false' }, type: { summary: 'boolean' } },
    },
    loading: {
      control: 'boolean',
      description:
        'Busy state: spinner in the leading slot, `aria-busy`, activation suppressed without dropping focus.',
      table: { defaultValue: { summary: 'false' }, type: { summary: 'boolean' } },
    },
    iconOnly: {
      control: 'boolean',
      description:
        'Circular icon button; children are the icon. Requires `aria-label`; primary/outline/ghost only, no `danger` or icon slots (enforced at the type level).',
      table: { defaultValue: { summary: 'false' }, type: { summary: 'true' } },
    },
    leftIcon: {
      control: false,
      description: 'Leading icon slot (Figma Left Icon=True); presentational.',
      table: { type: { summary: 'ReactNode' } },
    },
    rightIcon: {
      control: false,
      description: 'Trailing icon slot (Figma Right Icon=True); presentational.',
      table: { type: { summary: 'ReactNode' } },
    },
    'aria-label': {
      control: 'text',
      description: 'Required accessible name in `iconOnly` mode — there is no visible label.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'The native attribute; every variant has a Figma disabled set.',
      table: { type: { summary: 'boolean' } },
    },
    className: {
      control: 'text',
      description: 'Merge-safe escape hatch — appended after the component classes.',
      table: { type: { summary: 'string' } },
    },
    children: { control: 'text', table: { type: { summary: 'ReactNode' } } },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

// Largest first for the grid; derived from the union so a new size shows up here.
const SIZES = [ButtonSize.lg, ButtonSize.md, ButtonSize.sm] as const

// One grid per variant×tone: rows = sizes, columns = default/disabled/loading
// (hover/focus/active are live on the canvas and asserted in Cypress, R-11/R-14).
function MatrixGrid({ variant, danger }: { variant?: ButtonVariant; danger?: boolean }) {
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

export const Primary: Story = { render: () => <MatrixGrid variant={ButtonVariant.primary} /> }
export const PrimaryDanger: Story = { render: () => <MatrixGrid variant={ButtonVariant.primary} danger /> }
export const Outline: Story = { render: () => <MatrixGrid variant={ButtonVariant.outline} /> }
export const OutlineDanger: Story = { render: () => <MatrixGrid variant={ButtonVariant.outline} danger /> }
export const Ghost: Story = { render: () => <MatrixGrid variant={ButtonVariant.ghost} /> }
export const GhostDanger: Story = { render: () => <MatrixGrid variant={ButtonVariant.ghost} danger /> }
export const Link: Story = { render: () => <MatrixGrid variant={ButtonVariant.link} /> }
export const LinkDanger: Story = { render: () => <MatrixGrid variant={ButtonVariant.link} danger /> }

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
  // Controls come from the meta-level `argTypes` above.
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
