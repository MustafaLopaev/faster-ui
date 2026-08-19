/**
 * Every component rendered against the frozen adversarial content set
 * (004 FR-028: "rendered for every component").
 *
 * These stories live under `visual/` rather than beside the components because
 * they are visual-regression fixtures, not documentation of the API — a reader
 * learning what Button does should not meet a 200-character label first.
 * `.storybook/main.ts` widens its glob to pick them up, so they are reviewable
 * in the workbench like anything else.
 *
 * The visual matrix captures them as their OWN layer, at the tightest viewport,
 * one cell each — they are excluded from the base grid and every sweep. Putting
 * them in the base grid would multiply six hostile cases across six axes for
 * information that only the tight-viewport cell actually carries.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button, Dialog, Input } from '../../src'
import {
  EMOJI_TEXT,
  EMPTY_TEXT,
  LONG_BODY_ROWS,
  LONG_LABEL,
  RTL_TEXT,
  SINGLE_CHAR_TEXT,
  ZWJ_TEXT,
} from './adversarial'

const meta = {
  title: 'Visual/Adversarial Content',
  parameters: { layout: 'fullscreen' },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const PlusIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

/** One frame per case: all three components, same content, same page. */
function Frame({
  caption,
  text,
  dir,
  body,
}: {
  caption: string
  text: string
  dir?: 'ltr' | 'rtl'
  body?: React.ReactNode
}) {
  return (
    <div dir={dir} className="fui:bg-surface-page fui:font-sans fui:p-4 fui:flex fui:flex-col fui:gap-4">
      <p className="fui:m-0 fui:text-caption fui:text-text-placeholder">{caption}</p>

      <div className="fui:flex fui:flex-wrap fui:items-start fui:gap-2">
        <Button>{text}</Button>
        <Button variant="outline" leftIcon={PlusIcon} rightIcon={PlusIcon}>
          {text}
        </Button>
        <Button variant="link">{text}</Button>
        <Button size="sm" loading>
          {text}
        </Button>
        <Button iconOnly aria-label={text || 'Icon action'}>
          {PlusIcon}
        </Button>
      </div>

      <div className="fui:flex fui:flex-wrap fui:items-start fui:gap-2">
        <Input label={text} placeholder={text} defaultValue={text} />
        <Input label={text} error={text} defaultValue={text} />
        <Input label={text} prefix={text} suffix={text} clearable defaultValue={text} />
      </div>

      <Dialog
        open
        onClose={() => {}}
        title={text}
        dividers
        footer={
          <>
            <Button variant="outline">{text}</Button>
            <Button>{text}</Button>
          </>
        }
      >
        {body ?? <p className="fui:m-0">{text}</p>}
      </Dialog>
    </div>
  )
}

export const LongLabel: Story = {
  render: () => (
    <Frame caption="200-character label — overflow, wrapping, min-width interaction" text={LONG_LABEL} />
  ),
}

export const Rtl: Story = {
  render: () => (
    <Frame
      caption="Arabic string — right-to-left layout and adornment order"
      text={RTL_TEXT}
      dir="rtl"
    />
  ),
}

export const Emoji: Story = {
  render: () => (
    <Frame
      caption="Emoji with combining marks — line-height and baseline stability"
      text={EMOJI_TEXT}
    />
  ),
}

export const Zwj: Story = {
  render: () => (
    <Frame caption="Zero-width-joiner sequence — grapheme handling under truncation" text={ZWJ_TEXT} />
  ),
}

export const LongBody: Story = {
  render: () => (
    <Frame
      caption="500-row modal body — scroll containment, header and footer stickiness"
      text="Scroll containment"
      body={
        <div>
          {LONG_BODY_ROWS.map((row) => (
            <p key={row} className="fui:m-0">
              {row}
            </p>
          ))}
        </div>
      }
    />
  ),
}

export const Boundary: Story = {
  render: () => (
    <div className="fui:flex fui:flex-col fui:gap-4">
      <Frame caption="Empty string — the opposite boundary from the long label" text={EMPTY_TEXT} />
      <Frame caption="A single character" text={SINGLE_CHAR_TEXT} />
    </div>
  ),
}
