import { Button } from "../Button";
import { Dialog } from "./Dialog";
import { CELLS, expectNoViolations } from "../../../cypress/support/a11y";

const SIZES = ["sm", "md", "lg"] as const;

const Footer = (
  <>
    <Button variant="outline">Cancel</Button>
    <Button>Confirm</Button>
  </>
);

describe("Dialog — accessibility", () => {
  for (const { theme, palette } of CELLS) {
    describe(`${theme} / ${palette}`, () => {
      it("open, with a title and a close button", () => {
        expectNoViolations(
          <Dialog open onClose={() => {}} title="Delete this item?">
            This cannot be undone.
          </Dialog>,
          theme,
          palette,
        );
        cy.get("dialog").should("have.attr", "aria-labelledby");
        cy.get('button[aria-label="Close"]').should("exist");
      });

      it("closed", () => {
        expectNoViolations(
          <Dialog open={false} onClose={() => {}} title="Hidden">
            <Button>Should not be reachable</Button>
          </Dialog>,
          theme,
          palette,
        );
        cy.get("dialog").should("not.have.attr", "open");
      });

      it("with dividers and a footer", () => {
        expectNoViolations(
          <Dialog open onClose={() => {}} title="Confirm" dividers footer={Footer}>
            Body content.
          </Dialog>,
          theme,
          palette,
        );
      });

      for (const size of SIZES) {
        it(`size ${size}`, () => {
          expectNoViolations(
            <Dialog open onClose={() => {}} size={size} title={`Size ${size}`} footer={Footer}>
              Body content.
            </Dialog>,
            theme,
            palette,
          );
        });
      }

      it("untitled, named by aria-label", () => {
        expectNoViolations(
          <Dialog open onClose={() => {}} showClose={false} aria-label="Session expiring">
            Body content.
          </Dialog>,
          theme,
          palette,
        );
      });
    });
  }
});
