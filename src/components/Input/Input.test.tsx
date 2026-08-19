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

  // I11 — the number stepper drives the native value, honouring step/min/max
  it('steps the value with the native stepper semantics and keeps them out of the a11y tree', async () => {
    const user = userEvent.setup()
    const onChange = jest.fn()
    render(
      <Input label="Quantity" type="number" defaultValue="2" step={2} min={0} max={6} onChange={onChange} />,
    )
    const input = screen.getByRole('spinbutton', { name: 'Quantity' }) as HTMLInputElement
    const up = document.querySelector('[data-stepper=up]') as HTMLButtonElement
    const down = document.querySelector('[data-stepper=down]') as HTMLButtonElement

    // tabIndex -1 + aria-hidden: keyboard users already have ArrowUp/ArrowDown
    expect(up).toHaveAttribute('tabindex', '-1')
    expect(up.closest('[aria-hidden=true]')).not.toBeNull()
    expect(screen.queryByRole('button', { name: /increment|up/i })).toBeNull()

    await user.click(up)
    expect(input.value).toBe('4')
    await user.click(up)
    expect(input.value).toBe('6')
    await user.click(up) // clamped by max
    expect(input.value).toBe('6')
    await user.click(down)
    expect(input.value).toBe('4')
    // Every step reaches the consumer through the normal onChange contract
    expect(onChange).toHaveBeenCalled()
    // Stepping keeps focus in the field, never on the (unfocusable) chevron
    expect(input).toHaveFocus()
  })

  it('never steps a disabled or readOnly number field', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Input label="Qty" type="number" defaultValue="2" disabled />)
    const up = () => document.querySelector('[data-stepper=up]') as HTMLButtonElement
    expect(up()).toBeDisabled()

    rerender(<Input label="Qty" type="number" defaultValue="2" readOnly />)
    await user.click(up())
    expect((screen.getByRole('spinbutton', { name: 'Qty' }) as HTMLInputElement).value).toBe('2')
  })

  it('renders no stepper for any type other than number', () => {
    render(<Input label="Email" type="email" />)
    expect(document.querySelector('[data-stepper=up]')).toBeNull()
  })

  // I12 — clicking the field chrome (padding, adornments) focuses the input
  it('focuses the input when the wrapper chrome or an adornment is clicked', async () => {
    const user = userEvent.setup()
    render(<Input label="Search" leftIcon={<span data-testid="icon" />} />)
    const input = screen.getByRole('textbox', { name: 'Search' })

    await user.click(input.parentElement as HTMLElement)
    expect(input).toHaveFocus()

    input.blur()
    await user.click(screen.getByTestId('icon'))
    expect(input).toHaveFocus()
  })

  it('does not focus a disabled input when its wrapper chrome is clicked', async () => {
    const user = userEvent.setup()
    render(<Input label="Search" disabled leftIcon={<span data-testid="icon" />} />)
    const input = screen.getByRole('textbox', { name: 'Search' })

    await user.click(input.parentElement as HTMLElement)
    expect(input).not.toHaveFocus()
    await user.click(screen.getByTestId('icon'))
    expect(input).not.toHaveFocus()
  })

  // I13 — the clear button must not steal focus away from the field
  it('does not move focus to the wrapper when the clear affordance is used', async () => {
    const user = userEvent.setup()
    render(<Input label="Query" defaultValue="abc" clearable />)
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByRole('textbox', { name: 'Query' })).toHaveFocus()
  })
})
