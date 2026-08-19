import { Button } from "./Button";
import { CELLS, expectNoViolations } from "../../../cypress/support/a11y";

const PlusIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const ArrowIcon = (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="fui:size-full">
    <path
      d="M3 8h10m0 0-4-4m4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const SIZES = ["sm", "md", "lg"] as const;
const TEXT_VARIANTS = ["primary", "outline", "ghost", "link"] as const;
const ICON_VARIANTS = ["primary", "outline", "ghost"] as const;

function TextMatrix({ danger }: { danger?: boolean }) {
  return (
    <div className="fui:flex fui:flex-col fui:gap-4">
      {TEXT_VARIANTS.map((variant) => (
        <div key={variant} className="fui:flex fui:flex-wrap fui:items-center fui:gap-4">
          {SIZES.map((size) => (
            <span key={size} className="fui:flex fui:flex-wrap fui:items-center fui:gap-2">
              <Button variant={variant} danger={danger} size={size}>
                Button
              </Button>
              <Button variant={variant} danger={danger} size={size} disabled>
                Disabled
              </Button>
              <Button variant={variant} danger={danger} size={size} loading>
                Loading
              </Button>
              <Button
                variant={variant}
                danger={danger}
                size={size}
                leftIcon={PlusIcon}
                rightIcon={ArrowIcon}
              >
                Slots
              </Button>
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

function IconOnlyMatrix() {
  return (
    <div className="fui:flex fui:flex-col fui:gap-4">
      {ICON_VARIANTS.map((variant) => (
        <div key={variant} className="fui:flex fui:flex-wrap fui:items-center fui:gap-4">
          {SIZES.map((size) => (
            <Button
              key={size}
              iconOnly
              variant={variant}
              size={size}
              aria-label={`Add ${variant} ${size}`}
            >
              {PlusIcon}
            </Button>
          ))}
          <Button iconOnly variant={variant} disabled aria-label={`Add ${variant} disabled`}>
            {PlusIcon}
          </Button>
          <Button iconOnly variant={variant} loading aria-label={`Add ${variant} loading`}>
            {PlusIcon}
          </Button>
        </div>
      ))}
    </div>
  );
}

describe("Button — accessibility", () => {
  for (const { theme, palette } of CELLS) {
    describe(`${theme} / ${palette}`, () => {
      it("text variants, default tone", () => {
        expectNoViolations(<TextMatrix />, theme, palette);
      });

      it("text variants, danger tone", () => {
        expectNoViolations(<TextMatrix danger />, theme, palette);
      });

      it("icon-only variants", () => {
        expectNoViolations(<IconOnlyMatrix />, theme, palette);
      });

      it("an icon-only button carries its accessible name", () => {
        expectNoViolations(
          <Button iconOnly aria-label="Add item">
            {PlusIcon}
          </Button>,
          theme,
          palette,
        );
        cy.get('button[aria-label="Add item"]').should("exist");
      });
    });
  }
});
