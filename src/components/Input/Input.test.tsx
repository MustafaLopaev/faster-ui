import { createRef, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from './Input'

function ControlledProbe({ onClear }: { onClear?: () => void }) {
  const [value, setValue] = useState('start')
  return (
    <Input
      label="Controlled"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      clearable
      onClear={onClear}
    />
  )
}

describe('Input', () => {
  // I1 — native input, ref, passthrough, controlled + uncontrolled parity
  it('renders a native <input>, forwards the ref to it and passes native props through', () => {
    const ref = createRef<HTMLInputElement>()
    render(<Input ref={ref} label="Email" placeholder="you@example.com" name="email" data-flavor="hickory" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(ref.current).toBe(input)
    expect(input).toBeInstanceOf(HTMLInputElement)
    expect(input).toHaveAttribute('placeholder', 'you@example.com')
    expect(input).toHaveAttribute('name', 'email')
    expect(input).toHaveAttribute('data-flavor', 'hickory')
  })

  it('works uncontrolled exactly like the native element', async () => {
    const user = userEvent.setup()
    render(<Input label="Name" defaultValue="Ada" />)
    const input = screen.getByRole('textbox', { name: 'Name' })
    expect(input).toHaveValue('Ada')
    await user.clear(input)
    await user.type(input, 'Grace')
    expect(input).toHaveValue('Grace')
  })

  it('works controlled exactly like the native element', async () => {
    const user = userEvent.setup()
    render(<ControlledProbe />)
    const input = screen.getByRole('textbox', { name: 'Controlled' })
    expect(input).toHaveValue('start')
    await user.clear(input)
    await user.type(input, 'next')
    expect(input).toHaveValue('next')
  })

  // I2 — label association + external labelling
  it('associates the visible label: clicking it focuses the input and names it', async () => {
    const user = userEvent.setup()
    render(<Input label="Email" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    await user.click(screen.getByText('Email'))
    expect(input).toHaveFocus()
  })

  it('supports external labelling when `label` is omitted', () => {
    render(
      <>
        <label htmlFor="ext-input">External label</label>
        <Input id="ext-input" />
      </>,
    )
    expect(screen.getByRole('textbox', { name: 'External label' })).toBeInTheDocument()
  })

  // I3 — error ARIA wiring incl. consumer aria-describedby merge
  it('wires the error state: aria-invalid + message referenced via aria-describedby', () => {
    render(<Input label="Email" error="Required field" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toHaveAttribute('aria-invalid', 'true')
    const message = screen.getByText('Required field')
    expect(input.getAttribute('aria-describedby')).toBe(message.id)
    expect(input).toHaveAccessibleDescription('Required field')
  })

  it('merges a consumer aria-describedby with the error id', () => {
    render(
      <>
        <p id="hint">Use your work address</p>
        <Input label="Email" error="Required field" aria-describedby="hint" />
      </>,
    )
    const input = screen.getByRole('textbox', { name: 'Email' })
    const describedBy = input.getAttribute('aria-describedby')!.split(' ')
    expect(describedBy).toContain('hint')
    expect(describedBy).toContain(screen.getByText('Required field').id)
  })

  it('drops the error wiring when error is absent', () => {
    render(<Input label="Email" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  // I4 — disabled: unfocusable, uneditable
  it('is unfocusable and uneditable while disabled', async () => {
    const user = userEvent.setup()
    render(<Input label="Email" disabled defaultValue="kept" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    expect(input).toBeDisabled()
    await user.click(input).catch(() => {})
    expect(input).not.toHaveFocus()
    await user.type(input, 'nope').catch(() => {})
    expect(input).toHaveValue('kept')
  })

  // I6 — adornments excluded from name and value
  it('renders adornments presentationally: never in the accessible name or value', () => {
    render(
      <Input
        label="Amount"
        defaultValue="42"
        leftIcon={<svg data-testid="left-icon" />}
        rightIcon={<svg data-testid="right-icon" />}
        prefix="¥"
        suffix="CNY"
      />,
    )
    const input = screen.getByRole('textbox', { name: 'Amount' })
    expect(input).toHaveValue('42')
    expect(input).toHaveAccessibleName('Amount')
    expect(screen.getByTestId('left-icon').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByTestId('right-icon').closest('[aria-hidden="true"]')).not.toBeNull()
    expect(screen.getByText('¥')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('CNY')).toHaveAttribute('aria-hidden', 'true')
  })

  // I8 (behavioral) — clear affordance
  it('clears the value, fires onChange then onClear, and refocuses (uncontrolled)', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    const onClear = jest.fn()
    render(<Input label="Search" clearable defaultValue="query" onChange={onChange} onClear={onClear} />)
    const input = screen.getByRole('textbox', { name: 'Search' })
    const clear = screen.getByRole('button', { name: 'Clear' })

    await user.click(clear)
    expect(input).toHaveValue('')
    expect(onChange).toHaveBeenCalled()
    expect(onChange.mock.calls.at(-1)![0].target.value).toBe('')
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(onChange.mock.invocationCallOrder[0]).toBeLessThan(onClear.mock.invocationCallOrder[0])
    expect(input).toHaveFocus()
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('clears a controlled value through the native change path', async () => {
    const user = userEvent.setup()
    const onClear = jest.fn()
    render(<ControlledProbe onClear={onClear} />)
    const input = screen.getByRole('textbox', { name: 'Controlled' })
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(input).toHaveValue('')
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(input).toHaveFocus()
  })

  it('never renders the clear affordance when empty, disabled or readOnly', () => {
    const { rerender } = render(<Input label="Search" clearable />)
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()

    rerender(<Input label="Search" clearable defaultValue="q" disabled />)
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()

    rerender(<Input label="Search" clearable defaultValue="q" readOnly />)
    expect(screen.queryByRole('button', { name: 'Clear' })).not.toBeInTheDocument()
  })

  it('keeps the clear affordance keyboard-operable and labelled', async () => {
    const user = userEvent.setup()
    const onClear = jest.fn()
    render(<Input label="Search" clearable defaultValue="query" onClear={onClear} />)
    const clear = screen.getByRole('button', { name: 'Clear' })
    clear.focus()
    expect(clear).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onClear).toHaveBeenCalledTimes(1)
  })

  // I10 — stable generated ids; consumer id wins
  it('generates stable ids and lets a consumer id win', () => {
    const { rerender } = render(<Input label="Email" error="Bad" />)
    const input = screen.getByRole('textbox', { name: 'Email' })
    const firstId = input.id
    const firstDescribedBy = input.getAttribute('aria-describedby')
    rerender(<Input label="Email" error="Bad" />)
    expect(input.id).toBe(firstId)
    expect(input.getAttribute('aria-describedby')).toBe(firstDescribedBy)

    rerender(<Input label="Email" error="Bad" id="custom-id" />)
    expect(screen.getByRole('textbox', { name: 'Email' }).id).toBe('custom-id')
    // The label follows the consumer id
    expect(screen.getByText('Email')).toHaveAttribute('for', 'custom-id')
  })
})
