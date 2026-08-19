import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import type { ButtonProps } from './Button.types'

const icon = (
  <svg data-testid="probe-icon" viewBox="0 0 16 16">
    <path d="M8 3v10M3 8h10" />
  </svg>
)

describe('Button', () => {
  // B1 — native <button>, forwarded ref, unknown-prop passthrough
  it('renders a native <button>, forwards its ref to it and passes unknown props through', () => {
    const ref = createRef<HTMLButtonElement>()
    render(
      <Button ref={ref} id="save-btn" data-flavor="hickory" form="checkout">
        Save
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(ref.current).toBe(button)
    expect(button).toBeInstanceOf(HTMLButtonElement)
    expect(button).toHaveAttribute('id', 'save-btn')
    expect(button).toHaveAttribute('data-flavor', 'hickory')
    expect(button).toHaveAttribute('form', 'checkout')
  })

  // B2 — type defaults to "button"; consumer type passes through
  it('defaults type to "button" and lets the consumer override it', () => {
    const { rerender } = render(<Button>Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    rerender(<Button type="submit">Save</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })

  // B3 — accessible name = children text; icon slots are hidden from it
  it('exposes the label as the accessible name and hides icon slots from it', () => {
    render(
      <Button leftIcon={icon} rightIcon={icon}>
        Save
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Save' })
    expect(button).toBeInTheDocument()
    for (const probe of screen.getAllByTestId('probe-icon')) {
      expect(probe.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  // B4 — click / Enter / Space each fire onClick exactly once
  it('fires onClick exactly once per click, Enter and Space activation', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(<Button onClick={onClick}>Go</Button>)
    const button = screen.getByRole('button', { name: 'Go' })

    await user.click(button)
    expect(onClick).toHaveBeenCalledTimes(1)

    button.focus()
    await user.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(2)

    await user.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(3)
  })

  // B5 — disabled: native attribute, no activation
  it('never fires onClick while disabled and sets the native attribute', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(
      <Button disabled onClick={onClick}>
        Nope
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Nope' })
    expect(button).toBeDisabled()
    await user.click(button).catch(() => {})
    expect(onClick).not.toHaveBeenCalled()
  })

  // B6 — loading: aria-busy, suppressed activation, no submit, focus retained, spinner
  it('suppresses activation while loading, announces busy state and keeps focus', async () => {
    const user = userEvent.setup()
    const onClick = jest.fn()
    render(
      <Button loading onClick={onClick}>
        Sending
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Sending' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).not.toBeDisabled()

    button.focus()
    expect(button).toHaveFocus()
    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
    expect(button).toHaveFocus()

    const spinner = button.querySelector('svg')
    expect(spinner).not.toBeNull()
    expect(spinner).toHaveAttribute('aria-hidden', 'true')
    expect(spinner?.querySelector('path')).toHaveAttribute('stroke', 'currentColor')
  })

  it('prevents form submission while loading (and submits normally otherwise)', async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn((event: React.FormEvent) => event.preventDefault())
    const { rerender } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send
        </Button>
      </form>,
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).not.toHaveBeenCalled()

    rerender(
      <form onSubmit={onSubmit}>
        <Button type="submit">Send</Button>
      </form>,
    )
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('replaces the leading icon with the spinner while loading', () => {
    render(
      <Button loading leftIcon={icon}>
        Sending
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Sending' })
    expect(screen.queryByTestId('probe-icon')).not.toBeInTheDocument()
    expect(button.querySelector('svg')).not.toBeNull()
  })

  // B8 — iconOnly misuse is a TS error; runtime dev-warning as backstop
  it('rejects illegal iconOnly combinations at the type level', () => {
    const neverRendered = () => (
      <>
        {/* @ts-expect-error iconOnly requires an aria-label */}
        <Button iconOnly>{icon}</Button>
        {/* @ts-expect-error danger has no icon-only Figma set */}
        <Button iconOnly aria-label="Add" danger>{icon}</Button>
        {/* @ts-expect-error link has no icon-only Figma set */}
        <Button iconOnly aria-label="Add" variant="link">{icon}</Button>
        {/* @ts-expect-error icon slots are the children in iconOnly mode */}
        <Button iconOnly aria-label="Add" leftIcon={icon}>{icon}</Button>
      </>
    )
    expect(typeof neverRendered).toBe('function')
  })

  it('warns at runtime when iconOnly misuse slips past the types', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    const missingLabel = { iconOnly: true } as unknown as ButtonProps
    render(<Button {...missingLabel}>{icon}</Button>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('aria-label'))

    warn.mockClear()
    const illegalCombo = { iconOnly: true, 'aria-label': 'Add', danger: true } as unknown as ButtonProps
    render(<Button {...illegalCombo}>{icon}</Button>)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('primary/outline/ghost'))
    warn.mockRestore()
  })

  it('names an iconOnly button from its aria-label and hides the icon child', () => {
    render(
      <Button iconOnly aria-label="Add row">
        {icon}
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Add row' })
    expect(button).toBeInTheDocument()
    expect(screen.getByTestId('probe-icon').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  // B9 — className merges after component classes and is never required
  it('appends consumer className after component classes', () => {
    render(<Button className="consumer-extra">Merge</Button>)
    const button = screen.getByRole('button', { name: 'Merge' })
    // The contract is ordering, not any particular internal utility: component
    // classes come first, the consumer's last, so theirs wins the cascade.
    expect(button).toHaveClass('consumer-extra')
    expect(button.className.split(' ').length).toBeGreaterThan(1)
    expect(button.className.endsWith('consumer-extra')).toBe(true)
  })

  // B10 (prop-reachable part) — spinner replaces the icon in iconOnly loading mode
  it('renders the spinner instead of the icon when iconOnly is loading', () => {
    render(
      <Button iconOnly aria-label="Add row" loading>
        {icon}
      </Button>,
    )
    const button = screen.getByRole('button', { name: 'Add row' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByTestId('probe-icon')).not.toBeInTheDocument()
    expect(button.querySelector('svg')).not.toBeNull()
  })
})
