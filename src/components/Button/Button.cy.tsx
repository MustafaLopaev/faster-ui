import { Button } from './Button'

// Resolved token values (src/tokens/tokens.css ← figma-extraction.md §1)
const WHITE = 'rgb(255, 255, 255)'
const TRANSPARENT = 'rgba(0, 0, 0, 0)'
const PRIMARY_300 = 'rgb(176, 235, 236)'
const PRIMARY_400 = 'rgb(125, 221, 225)'
const PRIMARY_500 = 'rgb(71, 207, 214)'
const PRIMARY_600 = 'rgb(21, 197, 206)'
const PRIMARY_700 = 'rgb(0, 171, 182)'
const DANGER_100 = 'rgb(254, 242, 242)'
const DANGER_300 = 'rgb(255, 204, 210)'
const DANGER_400 = 'rgb(244, 152, 152)'
const DANGER_500 = 'rgb(235, 111, 112)'
const DANGER_600 = 'rgb(246, 76, 76)'
const DANGER_700 = 'rgb(236, 45, 48)'
const NEUTRAL_100 = 'rgb(245, 245, 245)'
const NEUTRAL_200 = 'rgb(238, 238, 238)'
const NEUTRAL_300 = 'rgb(225, 225, 225)'
const NEUTRAL_400 = 'rgb(202, 202, 202)'
const NEUTRAL_600 = 'rgb(75, 75, 75)'

const SIZES = ['lg', 'md', 'sm'] as const

interface StateColors {
  bg?: string
  text: string
  border?: string
}

interface MatrixRow {
  name: string
  props: { variant?: 'primary' | 'outline' | 'ghost' | 'link'; danger?: boolean }
  default: StateColors
  hover: StateColors
  active: StateColors
  disabled: StateColors
}

// All 8 variant×tone rows of the Button matrix (spec §Variants & States).
const MATRIX: MatrixRow[] = [
  {
    name: 'primary',
    props: { variant: 'primary' },
    default: { bg: PRIMARY_600, text: WHITE },
    hover: { bg: PRIMARY_500, text: WHITE },
    active: { bg: PRIMARY_700, text: WHITE },
    disabled: { bg: PRIMARY_300, text: WHITE },
  },
  {
    name: 'primary danger',
    props: { variant: 'primary', danger: true },
    default: { bg: DANGER_600, text: WHITE },
    hover: { bg: DANGER_500, text: WHITE },
    active: { bg: DANGER_700, text: WHITE },
    disabled: { bg: DANGER_300, text: WHITE },
  },
  {
    name: 'outline',
    props: { variant: 'outline' },
    default: { bg: WHITE, text: NEUTRAL_600, border: NEUTRAL_300 },
    hover: { bg: WHITE, text: PRIMARY_500, border: PRIMARY_500 },
    active: { bg: WHITE, text: PRIMARY_700, border: PRIMARY_700 },
    disabled: { bg: WHITE, text: NEUTRAL_400, border: NEUTRAL_200 },
  },
  {
    name: 'outline danger',
    props: { variant: 'outline', danger: true },
    default: { bg: WHITE, text: DANGER_600, border: DANGER_600 },
    hover: { bg: WHITE, text: DANGER_500, border: DANGER_500 },
    active: { bg: WHITE, text: DANGER_700, border: DANGER_700 },
    disabled: { bg: WHITE, text: DANGER_400, border: DANGER_400 },
  },
  {
    name: 'ghost',
    props: { variant: 'ghost' },
    default: { bg: TRANSPARENT, text: NEUTRAL_600 },
    hover: { bg: NEUTRAL_100, text: NEUTRAL_600 },
    active: { bg: NEUTRAL_300, text: NEUTRAL_600 },
    disabled: { bg: TRANSPARENT, text: NEUTRAL_400 },
  },
  {
    name: 'ghost danger',
    props: { variant: 'ghost', danger: true },
    default: { bg: TRANSPARENT, text: DANGER_600 },
    hover: { bg: DANGER_100, text: DANGER_600 },
    active: { bg: DANGER_300, text: DANGER_700 },
    disabled: { bg: TRANSPARENT, text: DANGER_400 },
  },
  {
    name: 'link',
    props: { variant: 'link' },
    default: { text: PRIMARY_600 },
    hover: { text: PRIMARY_500 },
    active: { text: PRIMARY_700 },
    disabled: { text: PRIMARY_400 },
  },
  {
    name: 'link danger',
    props: { variant: 'link', danger: true },
    default: { text: DANGER_600 },
    hover: { text: DANGER_500 },
    active: { text: DANGER_700 },
    disabled: { text: DANGER_400 },
  },
]

function expectColors($el: JQuery, expected: StateColors) {
  const cs = getComputedStyle($el[0])
  if (expected.bg) expect(cs.backgroundColor, 'background').to.eq(expected.bg)
  expect(cs.color, 'text color').to.eq(expected.text)
  if (expected.border) expect(cs.borderTopColor, 'border color').to.eq(expected.border)
}

describe('<Button /> matrix (B7)', () => {
  MATRIX.forEach((row) => {
    it(`${row.name}: default/disabled/loading colors across all sizes`, () => {
      cy.mount(
        <div>
          {SIZES.map((size) => (
            <div key={size}>
              <Button {...row.props} size={size} data-cy={`default-${size}`}>
                Label
              </Button>
              <Button {...row.props} size={size} disabled data-cy={`disabled-${size}`}>
                Label
              </Button>
              <Button {...row.props} size={size} loading data-cy={`loading-${size}`}>
                Label
              </Button>
            </div>
          ))}
          <div data-cy="park" className="fui:h-25" />
        </div>,
      )
      // The CDP mouse persists across tests — park it on the spacer so no
      // rest-state cell accidentally renders its :hover colors.
      cy.get('[data-cy=park]').realHover()
      SIZES.forEach((size) => {
        cy.get(`[data-cy=default-${size}]`).should(($el) => expectColors($el, row.default))
        cy.get(`[data-cy=disabled-${size}]`).should(($el) => expectColors($el, row.disabled))
        // Loading keeps default-state colors and shows the spinner (FR-005)
        cy.get(`[data-cy=loading-${size}]`).should(($el) => expectColors($el, row.default))
        cy.get(`[data-cy=loading-${size}] svg`).should('be.visible')
      })
    })

    it(`${row.name}: hover and pressed colors via real events`, () => {
      cy.mount(
        <Button {...row.props} data-cy="target">
          Label
        </Button>,
      )
      cy.get('[data-cy=target]').realHover()
      cy.get('[data-cy=target]').should(($el) => expectColors($el, row.hover))
      cy.get('[data-cy=target]').realMouseDown()
      cy.get('[data-cy=target]').should(($el) => expectColors($el, row.active))
      cy.get('[data-cy=target]').realMouseUp()
    })
  })
})

describe('<Button /> loading behavior on a real browser', () => {
  it('shows the animated spinner and suppresses real clicks', () => {
    const onClick = cy.stub().as('onClick')
    cy.mount(
      <Button loading onClick={onClick} data-cy="target">
        Sending
      </Button>,
    )
    cy.get('[data-cy=target] svg')
      .should('be.visible')
      .and(($svg) => {
        expect(getComputedStyle($svg[0]).animationName, 'spinner animates').to.match(/spin/)
      })
    cy.get('[data-cy=target]').realClick()
    cy.get('@onClick').should('not.have.been.called')
  })

  it('fires clicks normally when not loading (control)', () => {
    const onClick = cy.stub().as('onClick')
    cy.mount(
      <Button onClick={onClick} data-cy="target">
        Send
      </Button>,
    )
    cy.get('[data-cy=target]').realClick()
    cy.get('@onClick').should('have.been.calledOnce')
  })
})

describe('<Button /> geometry (B10)', () => {
  it('renders matrix heights, min-widths, radius and icon gap per size', () => {
    const geometry = { lg: ['40px', '106px'], md: ['36px', '98px'], sm: ['24px', '62px'] } as const
    cy.mount(
      <div>
        {SIZES.map((size) => (
          <Button key={size} size={size} data-cy={`btn-${size}`}>
            Label
          </Button>
        ))}
      </div>,
    )
    SIZES.forEach((size) => {
      cy.get(`[data-cy=btn-${size}]`).should(($el) => {
        const cs = getComputedStyle($el[0])
        expect(cs.height, `${size} height`).to.eq(geometry[size][0])
        expect(cs.minWidth, `${size} min-width`).to.eq(geometry[size][1])
        expect(cs.borderTopLeftRadius, `${size} radius`).to.eq('4px')
        expect(cs.columnGap, `${size} icon gap`).to.eq('4px')
      })
    })
  })

  it('link variant has no box: no padding, no min-width, line-height-driven height', () => {
    cy.mount(
      <Button variant="link" data-cy="link">
        Link label
      </Button>,
    )
    cy.get('[data-cy=link]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.minWidth, 'no matrix min-width').to.be.oneOf(['auto', '0px'])
      expect(cs.paddingLeft, 'no padding').to.eq('0px')
      expect(cs.height, 'height = line-height').to.eq('22px')
    })
  })

  it('iconOnly renders circular squares 40/36/24 with pad 11/10/5', () => {
    const geometry = { lg: ['40px', '11px'], md: ['36px', '10px'], sm: ['24px', '5px'] } as const
    cy.mount(
      <div>
        {SIZES.map((size) => (
          <Button key={size} iconOnly aria-label={`Add ${size}`} size={size} data-cy={`icon-${size}`}>
            <svg viewBox="0 0 16 16" className="fui:size-full" aria-hidden="true">
              <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </Button>
        ))}
      </div>,
    )
    SIZES.forEach((size) => {
      cy.get(`[data-cy=icon-${size}]`).should(($el) => {
        const cs = getComputedStyle($el[0])
        expect(cs.width, `${size} square width`).to.eq(geometry[size][0])
        expect(cs.height, `${size} square height`).to.eq(geometry[size][0])
        expect(cs.paddingTop, `${size} padding`).to.eq(geometry[size][1])
        expect(cs.borderTopLeftRadius, `${size} circular`).to.eq('999px')
      })
    })
  })
})

describe('<Button /> dark mode (US5)', () => {
  const INK_800 = 'rgb(38, 43, 51)' // surface-raised on dark

  beforeEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.add('dark'))
  })
  afterEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.remove('dark'))
  })

  it('flips outline/ghost surfaces to the dark raised surface while action colors stay brand', () => {
    cy.mount(
      <div>
        <Button variant="primary" data-cy="primary">
          Primary
        </Button>
        <Button variant="outline" data-cy="outline">
          Outline
        </Button>
        <Button variant="ghost" data-cy="ghost">
          Ghost
        </Button>
        <Button iconOnly aria-label="Add" variant="outline" data-cy="icon-outline">
          <svg viewBox="0 0 16 16" aria-hidden="true" className="fui:size-full">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </Button>
        <div data-cy="park" className="fui:h-25" />
      </div>,
    )
    cy.get('[data-cy=park]').realHover()
    // Outline surfaces follow surface-raised → ink-800 (A-2)
    cy.get('[data-cy=outline]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor, 'outline fill flips').to.eq(INK_800)
    })
    cy.get('[data-cy=icon-outline]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor, 'iconOnly outline fill flips').to.eq(INK_800)
    })
    // Ghost keeps no fill; brand action colors stay light values (FR-013 fallback)
    cy.get('[data-cy=ghost]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor, 'ghost stays transparent').to.eq(TRANSPARENT)
    })
    cy.get('[data-cy=primary]').should(($el) => {
      expect(getComputedStyle($el[0]).backgroundColor, 'brand action unchanged').to.eq(PRIMARY_600)
    })
  })
})

describe('<Button /> keyboard focus indicator (A11Y-004)', () => {
  it('shows the focus-ring token outline under :focus-visible', () => {
    cy.mount(<Button data-cy="target">Focus me</Button>)
    cy.get('body').realClick({ position: 'bottomRight' })
    cy.realPress('Tab')
    cy.get('[data-cy=target]').should(($el) => {
      const cs = getComputedStyle($el[0])
      expect(cs.outlineColor, 'focus ring color').to.eq(PRIMARY_600)
      expect(cs.outlineStyle, 'focus ring style').to.eq('solid')
      expect(cs.outlineWidth, 'focus ring width').to.eq('2px')
    })
  })
})
