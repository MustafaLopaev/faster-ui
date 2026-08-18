import type { Meta, StoryObj } from '@storybook/react-vite'
import { Smoke } from './Smoke'

// Serves as the Playground pattern for future components: every public prop
// is exposed as a control; native div props pass straight through.
const meta = {
  title: 'Foundation/Smoke',
  component: Smoke,
  parameters: { layout: 'centered' },
  args: {
    children: 'Token-styled Smoke',
  },
  argTypes: {
    children: { control: 'text', description: 'Rendered content (native children)' },
    className: { control: 'text', description: 'Merge-safe escape hatch — appended after base classes' },
  },
} satisfies Meta<typeof Smoke>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Playground: Story = {
  args: {
    children: 'Playground — tweak every prop',
    className: '',
    id: 'smoke-playground',
    title: 'Native attributes pass through',
  },
}
