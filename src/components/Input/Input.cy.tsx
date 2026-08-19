import { useState } from 'react'
import { Input } from './Input'

// Resolved token values (src/tokens/tokens.css ← figma-extraction.md §2)
const WHITE = 'rgb(255, 255, 255)'
const PRIMARY_500 = 'rgb(71, 207, 214)'
const PRIMARY_600 = 'rgb(21, 197, 206)'
const DANGER_600 = 'rgb(246, 76, 76)'
const NEUTRAL_50 = 'rgb(250, 250, 250)'
const NEUTRAL_200 = 'rgb(238, 238, 238)'
const NEUTRAL_300 = 'rgb(225, 225, 225)'
const NEUTRAL_400 = 'rgb(202, 202, 202)'
const NEUTRAL_500 = 'rgb(142, 142, 142)'
const NEUTRAL_600 = 'rgb(75, 75, 75)'

function ControlledNumber({ onChange }: { onChange: (value: string) => void }) {
  const [value, setValue] = useState('4')
  return (
    <Input
      label="Quantity"
      type="number"
      step={2}
      min={0}
      max={10}
      value={value}
      onChange={(event) => {
        setValue(event.target.value)
        onChange(event.target.value)
      }}
    />
  )
}

const wrapperOf = (selector: string) => cy.get(selector).parent()

describe('<Input /> state visuals on the wrapper (I5)', () => {
  it('default: raised fill, default border; hover and focus flip the border token', () => {
    cy.mount(
      <div>
        <Input label="Email" data-cy="field" />
        <div data-cy="park" className="fui:h-25" />
      </div>,
    )
    cy.get('[data-cy=park]').realHover()
    wrapperOf('[data-cy=field]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.backgroundColor, 'field fill').to.eq(WHITE)
      expect(cs.borderTopColor, 'default border').to.eq(NEUTRAL_300)
    })
    wrapperOf('[data-cy=field]').realHover()
    wrapperOf('[data-cy=field]').should(($el) => {
      expect(getComputedStyle($el[0]).borderTopColor, 'hover border').to.eq(PRIMARY_500)
    })
    cy.get('[data-cy=field]').focus()
    wrapperOf('[data-cy=field]').should(($el) => {
      expect(getComputedStyle($el[0]).borderTopColor, 'focus border').to.eq(PRIMARY_600)
    })
  })

  it('error: danger border persists through hover AND focus (A-3)', () => {
    cy.mount(
      <div>
        <Input label="Email" error="Required field" data-cy="field" />
        <div data-cy="park" className="fui:h-25" />
      </div>,
    )
    cy.get('[data-cy=park]').realHover()
    wrapperOf('[data-cy=field]').should(($el) => {
      expect(getComputedStyle($el[0]).borderTopColor, 'error border').to.eq(DANGER_600)
    })
    wrapperOf('[data-cy=field]').realHover()
    wrapperOf('[data-cy=field]').should(($el) => {
      expect(getComputedStyle($el[0]).borderTopColor, 'error border through hover').to.eq(DANGER_600)
    })
    cy.get('[data-cy=field]').focus()
    wrapperOf('[data-cy=field]').should(($el) => {
      expect(getComputedStyle($el[0]).borderTopColor, 'error border through focus').to.eq(DANGER_600)
    })
    cy.get('[data-cy=field]').should('have.attr', 'aria-invalid', 'true')
  })

  it('disabled: sunken fill, disabled border, distinct placeholder and value inks', () => {
    cy.mount(
      <div>
        <Input label="A" disabled placeholder="Placeholder" data-cy="empty" />
        <Input label="B" disabled defaultValue="Entered" data-cy="filled" />
      </div>,
    )
    wrapperOf('[data-cy=empty]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.backgroundColor, 'sunken fill').to.eq(NEUTRAL_50)
      expect(cs.borderTopColor, 'disabled border').to.eq(NEUTRAL_200)
    })
    cy.get('[data-cy=empty]').should(($el) => {
      expect(
        getComputedStyle($el[0], '::placeholder').color,
        'disabled placeholder ink',
      ).to.eq(NEUTRAL_300)
    })
    cy.get('[data-cy=filled]').should(($el) => {
      expect(getComputedStyle($el[0]).color, 'disabled value ink').to.eq(NEUTRAL_400)
    })
  })

  it('entered text and placeholder use their matrix inks when enabled', () => {
    cy.mount(<Input label="Email" placeholder="you@example.com" defaultValue="typed" data-cy="field" />)
    cy.get('[data-cy=field]').should(($el) => {
      expect(getComputedStyle($el[0]).color, 'entered text').to.eq(NEUTRAL_600)
      expect(getComputedStyle($el[0], '::placeholder').color, 'placeholder ink').to.eq(NEUTRAL_400)
    })
  })
})

describe('<Input /> number steppers (I7)', () => {
  it('steps by the native step, clamps at min/max and fires controlled onChange', () => {
    const changes: string[] = []
    cy.mount(<ControlledNumber onChange={(v) => changes.push(v)} />)
    cy.get('input[type=number]').as('field')

    cy.get('[data-stepper=up]').realClick()
    cy.get('@field').should('have.value', '6')
    cy.get('[data-stepper=up]').realClick()
    cy.get('@field').should('have.value', '8')
    cy.get('[data-stepper=up]').realClick()
    cy.get('@field').should('have.value', '10')
    // Clamped at max — native semantics, no wrap and no overflow
    cy.get('[data-stepper=up]').realClick()
    cy.get('@field')
      .should('have.value', '10')
      .then(() => {
        expect(changes.at(-1), 'controlled onChange saw the final value').to.eq('10')
      })
    cy.get('[data-stepper=down]').realClick()
    cy.get('@field').should('have.value', '8')
    // Stepping keeps focus on the input, not the chevron
    cy.get('@field').should('have.focus')
  })

  it('hides the native spin UI and keeps steppers out of tab order and the a11y tree', () => {
    cy.mount(<Input label="Quantity" type="number" defaultValue={5} />)
    cy.get('input[type=number]').should(($el) => {
      expect(getComputedStyle($el[0]).appearance, 'native spin UI hidden').to.eq('textfield')
    })
    cy.get('[data-stepper=up]').should('have.attr', 'tabindex', '-1')
    cy.get('[data-stepper=down]').should('have.attr', 'tabindex', '-1')
    cy.get('[data-stepper=up]').parent().should('have.attr', 'aria-hidden', 'true')
  })

  it('keeps native keyboard stepping intact', () => {
    cy.mount(<Input label="Quantity" type="number" defaultValue={5} step={1} />)
    cy.get('input[type=number]').focus()
    cy.realPress('ArrowUp')
    cy.get('input[type=number]').should('have.value', '6')
    cy.realPress('ArrowDown')
    cy.get('input[type=number]').should('have.value', '5')
  })

  it('disables the steppers with the input', () => {
    cy.mount(<Input label="Quantity" type="number" defaultValue={5} disabled />)
    cy.get('[data-stepper=up]').should('be.disabled')
    cy.get('[data-stepper=down]').should('be.disabled')
  })
})

describe('<Input /> clear affordance with real typing (I8)', () => {
  it('appears while typing, clears on real click, refocuses and disappears', () => {
    cy.mount(
      <div>
        <Input label="Search" clearable data-cy="field" />
        <div data-cy="park" className="fui:h-25" />
      </div>,
    )
    cy.get('button[aria-label=Clear]').should('not.exist')
    cy.get('[data-cy=field]').realClick()
    cy.realType('query')
    cy.get('button[aria-label=Clear]').should('be.visible')
    cy.get('button[aria-label=Clear]').realClick()
    cy.get('[data-cy=field]').should('have.value', '')
    cy.get('[data-cy=field]').should('have.focus')
    cy.get('button[aria-label=Clear]').should('not.exist')
  })

  it('renders the Figma rest/hover/pressed clear inks', () => {
    cy.mount(
      <div>
        <Input label="Search" clearable defaultValue="query" data-cy="field" />
        <div data-cy="park" className="fui:h-25" />
      </div>,
    )
    cy.get('[data-cy=park]').realHover()
    cy.get('button[aria-label=Clear]').should(($el) => {
      expect(getComputedStyle($el[0]).color, 'rest').to.eq(NEUTRAL_400)
    })
    cy.get('button[aria-label=Clear]').realHover()
    cy.get('button[aria-label=Clear]').should(($el) => {
      expect(getComputedStyle($el[0]).color, 'hover').to.eq(NEUTRAL_500)
    })
    cy.get('button[aria-label=Clear]').realMouseDown()
    cy.get('button[aria-label=Clear]').should(($el) => {
      expect(getComputedStyle($el[0]).color, 'pressed').to.eq(NEUTRAL_600)
    })
    cy.get('button[aria-label=Clear]').realMouseUp()
  })
})

describe('<Input /> dark mode (US5, data-model §4)', () => {
  const INK_800 = 'rgb(38, 43, 51)' // surface-raised on dark
  const WHITE_A7 = 'rgba(255, 255, 255, 0.07)' // border-default / border-strong on dark
  const WHITE_A79 = 'rgba(255, 255, 255, 0.79)' // text-control on dark
  const WHITE_A30 = 'rgba(255, 255, 255, 0.3)' // placeholder inks on dark

  beforeEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.add('dark'))
  })
  afterEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.remove('dark'))
  })

  it('flips field fill, border, value ink and disabled placeholder to the dark derivations', () => {
    cy.mount(
      <div>
        <Input label="Enabled" defaultValue="typed" placeholder="hint" data-cy="enabled" />
        <Input label="Disabled" disabled placeholder="hint" data-cy="disabled" />
        <div data-cy="park" className="fui:h-25" />
      </div>,
    )
    cy.get('[data-cy=park]').realHover()
    wrapperOf('[data-cy=enabled]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.backgroundColor, 'field fill flips to ink-800').to.eq(INK_800)
      expect(cs.borderTopColor, 'border flips to white-a7').to.eq(WHITE_A7)
    })
    cy.get('[data-cy=enabled]').should(($el) => {
      expect(getComputedStyle($el[0]).color, 'value ink flips to white-a79').to.eq(WHITE_A79)
    })
    cy.get('[data-cy=disabled]').should(($el) => {
      expect(
        getComputedStyle($el[0], '::placeholder').color,
        'disabled placeholder flips to white-a30',
      ).to.eq(WHITE_A30)
    })
  })
})

describe('<Input /> geometry (I9)', () => {
  const GEOMETRY = {
    lg: { height: '40px', padX: '12px', font: '16px', lineHeight: '24px' },
    md: { height: '36px', padX: '12px', font: '14px', lineHeight: '22px' },
    sm: { height: '24px', padX: '8px', font: '12px', lineHeight: '18px' },
  } as const

  it('renders matrix heights, padding, type ramps and radius per size', () => {
    cy.mount(
      <div>
        {(['lg', 'md', 'sm'] as const).map((size) => (
          <Input key={size} size={size} label={`Field ${size}`} defaultValue="text" data-cy={`field-${size}`} />
        ))}
      </div>,
    )
    ;(['lg', 'md', 'sm'] as const).forEach((size) => {
      wrapperOf(`[data-cy=field-${size}]`).should(($el) => {
        const cs = getComputedStyle($el[0])
        expect(cs.height, `${size} height`).to.eq(GEOMETRY[size].height)
        expect(cs.paddingLeft, `${size} pad-x`).to.eq(GEOMETRY[size].padX)
        expect(cs.borderTopLeftRadius, `${size} radius`).to.eq('4px')
      })
      cy.get(`[data-cy=field-${size}]`).should(($el) => {
        const cs = getComputedStyle($el[0])
        expect(cs.fontSize, `${size} font size`).to.eq(GEOMETRY[size].font)
        expect(cs.lineHeight, `${size} line height`).to.eq(GEOMETRY[size].lineHeight)
      })
    })
  })

  it('renders the error message 4px below the field in the error ink', () => {
    cy.mount(<Input label="Email" error="Required field" />)
    cy.contains('p', 'Required field').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.marginTop, 'field↔message gap').to.eq('4px')
      expect(cs.color, 'error ink').to.eq(DANGER_600)
    })
  })
})
