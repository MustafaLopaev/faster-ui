import { createRef } from 'react'
import { render, screen } from '@testing-library/react'
import { Smoke } from './Smoke'

describe('Smoke', () => {
  it('renders its children', () => {
    render(<Smoke>smoke signal</Smoke>)
    expect(screen.getByText('smoke signal')).toBeInTheDocument()
  })

  it('forwards its ref to the root element', () => {
    const ref = createRef<HTMLDivElement>()
    render(<Smoke ref={ref}>with ref</Smoke>)
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
    expect(ref.current).toHaveTextContent('with ref')
  })

  it('merges className without losing base styling', () => {
    render(<Smoke className="consumer-extra">merged</Smoke>)
    const el = screen.getByText('merged')
    // The className *contract* is under test here: the consumer's class is
    // appended and the token-driven base classes survive the merge.
    expect(el).toHaveClass('consumer-extra')
    expect(el).toHaveClass('fui:bg-action-primary')
  })

  it('passes through native div attributes', () => {
    render(
      <Smoke id="smoke-1" role="status" aria-label="smoke region" data-flavor="hickory">
        native
      </Smoke>,
    )
    const el = screen.getByRole('status', { name: 'smoke region' })
    expect(el).toHaveAttribute('id', 'smoke-1')
    expect(el).toHaveAttribute('data-flavor', 'hickory')
  })
})
