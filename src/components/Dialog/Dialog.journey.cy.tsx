import { useState } from "react";
import { Button } from "../Button";
import { Input } from "../Input";
import { Dialog } from "./Dialog";

const PRIMARY_600 = "rgb(21, 197, 206)"; // focus-ring token

function JourneyHarness() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const close = () => setOpen(false);
  const submit = () => {
    if (!value.includes("@")) {
      setError("Enter a valid email address");
    } else {
      setError(undefined);
      close();
    }
  };
  return (
    <div>
      {/* Sequential-navigation start point: focused programmatically (not a
          pointer event) so the journey's first Tab genuinely lands on the trigger. */}
      <button type="button" data-cy="start">
        start
      </button>
      <Button data-cy="trigger" onClick={() => setOpen(true)}>
        Invite teammate
      </Button>
      <Dialog
        open={open}
        onClose={close}
        title="Invite teammate"
        footer={
          <>
            <Button variant="ghost" onClick={close}>
              Cancel
            </Button>
            <Button data-cy="submit" onClick={submit}>
              Send invite
            </Button>
          </>
        }
      >
        <Input
          data-cy="email"
          label="Email"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={error}
        />
      </Dialog>
    </div>
  );
}

const expectFocusRing = (selector: string, label: string) =>
  cy.get(selector).should(($el) => {
    const cs = getComputedStyle($el[0]);
    expect(cs.outlineColor, `${label}: ring = focus-ring token`).to.eq(PRIMARY_600);
    expect(cs.outlineStyle, `${label}: ring visible`).to.eq("solid");
    expect(cs.outlineWidth, `${label}: ring width`).to.eq("2px");
  });

describe("US4 — keyboard-only & screen-reader journey", () => {
  it("completes the full flow with zero pointer events", () => {
    cy.mount(<JourneyHarness />);

    cy.get("[data-cy=start]").focus();

    cy.realPress("Tab");
    cy.get("[data-cy=trigger]").should("have.focus");
    expectFocusRing("[data-cy=trigger]", "trigger");

    cy.realPress("Enter");
    cy.get("dialog").should("have.attr", "open");
    cy.get("dialog button[aria-label=Close]").should("have.focus");
    expectFocusRing("dialog button[aria-label=Close]", "close button");

    cy.realPress("Tab");
    cy.get("[data-cy=email]").should("have.focus");
    cy.get("[data-cy=email]")
      .parent()
      .should(($el) => {
        expect(getComputedStyle($el[0]).borderTopColor, "input focus border").to.eq(PRIMARY_600);
      });

    cy.realType("not-an-email");
    cy.get("[data-cy=email]").should("have.value", "not-an-email");

    cy.realPress("Tab");
    cy.contains("dialog button", "Cancel").should("have.focus");
    expectFocusRing("dialog button:contains(Cancel)", "cancel button");
    cy.realPress("Tab");
    cy.get("[data-cy=submit]").should("have.focus");
    expectFocusRing("[data-cy=submit]", "submit button");
    cy.document().should((doc) => {
      expect(
        doc.querySelector("dialog")!.contains(doc.activeElement),
        "every stop so far stayed inside the dialog",
      ).to.eq(true);
    });

    cy.realPress("Enter");
    cy.get("[data-cy=email]").should("have.attr", "aria-invalid", "true");
    cy.contains("p", "Enter a valid email address").should("be.visible");
    cy.get("[data-cy=email]").then(($input) => {
      const describedBy = $input.attr("aria-describedby")!;
      cy.get(`[id="${describedBy}"]`).should("contain.text", "Enter a valid email address");
    });
    cy.get("dialog").should("have.attr", "open");

    cy.realPress(["Shift", "Tab"]);
    cy.realPress(["Shift", "Tab"]);
    cy.get("[data-cy=email]").should("have.focus");
    cy.realPress("End");
    cy.realType("@example.com");
    cy.get("[data-cy=email]").should("have.value", "not-an-email@example.com");

    cy.realPress("Escape");
    cy.get("dialog").should("not.have.attr", "open");
    cy.get("[data-cy=trigger]").should("have.focus");
  });
});
