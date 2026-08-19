import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "../Button";
import { Dialog } from "./Dialog";
import type { DialogProps } from "./Dialog.types";

const WHITE = "rgb(255, 255, 255)";
const OVERLAY = "rgba(0, 0, 0, 0.3)";
const NEUTRAL_200 = "rgb(238, 238, 238)";

type HarnessProps = Omit<Partial<DialogProps>, "children"> & {
  children?: ReactNode;
  onBackgroundClick?: () => void;
  startOpen?: boolean;
};

function Harness({ children, onBackgroundClick, startOpen = false, ...dialogProps }: HarnessProps) {
  const [open, setOpen] = useState(startOpen);
  return (
    <div>
      <button type="button" data-cy="trigger" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <button type="button" data-cy="background" onClick={onBackgroundClick}>
        Background action
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Dialog title"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Confirm</Button>
          </>
        }
        {...dialogProps}
      >
        {children ?? <p className="fui:m-0">Body content</p>}
      </Dialog>
    </div>
  );
}

const focusLocation = (doc: Document): "dialog" | "chrome" | string => {
  const active = doc.activeElement;
  const dialog = doc.querySelector("dialog");
  if (dialog?.contains(active)) return "dialog";
  if (active == null || active === doc.body || active === doc.documentElement) return "chrome";
  return `escaped:${(active as HTMLElement).dataset.cy ?? active.tagName}`;
};

describe("<Dialog /> top layer & inert background (D2)", () => {
  it("opens as a real modal: top layer, overlay backdrop, focus moves inside", () => {
    cy.mount(<Harness />);
    cy.get("[data-cy=trigger]").realClick();
    cy.get("dialog").should("have.attr", "open");
    cy.get("dialog").should(($el) => {
      expect($el[0].matches(":modal"), "renders in the modal top layer").to.eq(true);
      expect(getComputedStyle($el[0], "::backdrop").backgroundColor, "scrim = overlay token").to.eq(
        OVERLAY,
      );
    });
    cy.document().should((doc) => {
      expect(focusLocation(doc), "focus moved into the dialog on open").to.eq("dialog");
    });
  });

  it("makes the background inert to pointer and keyboard", () => {
    const onBackgroundClick = cy.stub().as("background");
    cy.mount(<Harness onBackgroundClick={onBackgroundClick} />);
    cy.get("[data-cy=background]").then(($btn) => {
      const rect = $btn[0].getBoundingClientRect();
      cy.get("[data-cy=trigger]").realClick();
      cy.get("dialog").should("have.attr", "open");
      cy.get("body").realClick({
        x: Math.round(rect.x + rect.width / 2),
        y: Math.round(rect.y + rect.height / 2),
      });
      cy.get("@background").should("not.have.been.called");
    });
    for (let i = 0; i < 6; i += 1) {
      cy.realPress("Tab");
      cy.document().should((doc) => {
        expect(focusLocation(doc), `Tab press ${i + 1} never reaches the background`).to.be.oneOf([
          "dialog",
          "chrome",
        ]);
      });
    }
  });
});

describe("<Dialog /> focus trap across full Tab cycles (D5)", () => {
  it("keeps Tab and Shift+Tab cycling within the dialog focusables", () => {
    cy.mount(<Harness />);
    cy.get("[data-cy=trigger]").realClick();
    cy.get("dialog").should("have.attr", "open");
    cy.get("dialog button[aria-label=Close]").should("have.focus");
    cy.realPress("Tab");
    cy.contains("dialog button", "Cancel").should("have.focus");
    cy.realPress("Tab");
    cy.contains("dialog button", "Confirm").should("have.focus");
    cy.realPress(["Shift", "Tab"]);
    cy.contains("dialog button", "Cancel").should("have.focus");
    cy.realPress(["Shift", "Tab"]);
    cy.get("dialog button[aria-label=Close]").should("have.focus");
    cy.realPress(["Shift", "Tab"]);
    cy.document().should((doc) => {
      expect(focusLocation(doc), "backward past the first focusable").to.be.oneOf([
        "dialog",
        "chrome",
      ]);
    });
    cy.mount(<Harness />);
    cy.get("[data-cy=trigger]").realClick();
    cy.contains("dialog button", "Confirm").focus();
    cy.realPress("Tab");
    cy.document().should((doc) => {
      expect(focusLocation(doc), "forward past the last focusable").to.be.oneOf([
        "dialog",
        "chrome",
      ]);
    });
  });

  it("Escape closes via onClose and restores focus to the opener", () => {
    cy.mount(<Harness />);
    cy.get("[data-cy=trigger]").realClick();
    cy.get("dialog").should("have.attr", "open");
    cy.realPress("Escape");
    cy.get("dialog").should("not.have.attr", "open");
    cy.get("[data-cy=trigger]").should("have.focus");
  });
});

describe("<Dialog /> panel geometry (D7)", () => {
  beforeEach(() => {
    cy.viewport(1280, 800);
  });

  const WIDTHS = { sm: "400px", md: "600px", lg: "900px" } as const;

  (["sm", "md", "lg"] as const).forEach((size) => {
    it(`${size}: width ${WIDTHS[size]}, radius 4px, raised panel, Elevation/4, padding 24`, () => {
      cy.mount(<Harness size={size} startOpen />);
      cy.get("dialog").should(($el) => {
        const cs = getComputedStyle($el[0]);
        expect(cs.width, "panel width").to.eq(WIDTHS[size]);
        expect(cs.borderTopLeftRadius, "radius-surface = 4px").to.eq("4px");
        expect(cs.backgroundColor, "raised surface").to.eq(WHITE);
        expect(cs.boxShadow, "elevation shadow").to.not.eq("none");
        expect(cs.paddingTop, "panel padding").to.eq("24px");
        expect(cs.paddingLeft, "panel padding").to.eq("24px");
      });
    });
  });

  it("lays out title/body/footer with the 16/32 rhythm and right-aligned 8px-gap actions", () => {
    cy.mount(<Harness startOpen />);
    cy.get("dialog header").should(($el) => {
      expect(getComputedStyle($el[0]).marginBottom, "title↔body gap").to.eq("16px");
    });
    cy.get("dialog footer").should(($el) => {
      const cs = getComputedStyle($el[0]);
      expect(cs.marginTop, "content↔footer gap").to.eq("32px");
      expect(cs.justifyContent, "right-aligned actions").to.eq("flex-end");
      expect(cs.columnGap, "action gap").to.eq("8px");
    });
  });

  it("caps the panel to the viewport when the size exceeds it", () => {
    cy.viewport(500, 500);
    cy.mount(<Harness size="lg" startOpen />);
    cy.get("dialog").should(($el) => {
      expect($el[0].getBoundingClientRect().width, "viewport-capped").to.be.lessThan(500);
    });
  });
});

describe("<Dialog /> scrollable body (D8)", () => {
  it("scrolls overflowing body content while title and footer stay fixed", () => {
    cy.viewport(1280, 600);
    cy.mount(
      <Harness startOpen>
        <div>
          {Array.from({ length: 60 }, (_, i) => (
            <p key={i} className="fui:m-0">
              Body line {i + 1}
            </p>
          ))}
        </div>
      </Harness>,
    );
    cy.get("dialog section").should(($el) => {
      expect($el[0].scrollHeight, "body overflows").to.be.greaterThan($el[0].clientHeight);
    });
    cy.get("dialog header").then(($header) => {
      cy.get("dialog footer").then(($footer) => {
        const headerTop = $header[0].getBoundingClientRect().top;
        const footerTop = $footer[0].getBoundingClientRect().top;
        cy.get("dialog section").scrollTo("bottom");
        cy.get("dialog section").should(($el) => {
          expect($el[0].scrollTop, "body scrolled").to.be.greaterThan(0);
        });
        cy.get("dialog header").should(($el) => {
          expect($el[0].getBoundingClientRect().top, "header fixed").to.eq(headerTop);
        });
        cy.get("dialog footer").should(($el) => {
          expect($el[0].getBoundingClientRect().top, "footer fixed").to.eq(footerTop);
        });
      });
    });
  });
});

describe("<Dialog /> dark mode (US5)", () => {
  const INK_800 = "rgb(38, 43, 51)"; // surface-raised on dark
  const WHITE_A7 = "rgba(255, 255, 255, 0.07)"; // border-strong on dark
  const WHITE_A90 = "rgba(255, 255, 255, 0.9)"; // text-heading on dark

  beforeEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.add("dark"));
  });
  afterEach(() => {
    cy.document().then((doc) => doc.documentElement.classList.remove("dark"));
  });

  it("flips panel, title ink and dividers while the overlay scrim stays put", () => {
    cy.viewport(1280, 800);
    cy.mount(<Harness dividers startOpen />);
    cy.get("dialog").should(($el) => {
      const cs = getComputedStyle($el[0]);
      expect(cs.backgroundColor, "panel flips to ink-800").to.eq(INK_800);
      expect(
        getComputedStyle($el[0], "::backdrop").backgroundColor,
        "overlay unchanged (both-modes Figma smoke)",
      ).to.eq(OVERLAY);
    });
    cy.get("dialog h2").should(($el) => {
      expect(getComputedStyle($el[0]).color, "title flips to white-a90").to.eq(WHITE_A90);
    });
    cy.get("dialog [data-divider]").each(($divider) => {
      expect(getComputedStyle($divider[0]).borderTopColor, "dividers flip to white-a7").to.eq(
        WHITE_A7,
      );
    });
  });
});

describe("<Dialog /> dividers preset (D9)", () => {
  it("renders border-strong hairlines with the 16/24 padding rhythm", () => {
    cy.viewport(1280, 800);
    cy.mount(<Harness dividers startOpen />);
    cy.get("dialog [data-divider]").should("have.length", 2);
    cy.get("dialog [data-divider]").each(($divider) => {
      const cs = getComputedStyle($divider[0]);
      expect(cs.borderTopWidth, "hairline").to.eq("1px");
      expect(cs.borderTopColor, "border-strong").to.eq(NEUTRAL_200);
    });
    cy.get("dialog").should(($el) => {
      expect(getComputedStyle($el[0]).paddingTop, "full-bleed panel").to.eq("0px");
    });
    cy.get("dialog header").should(($el) => {
      const cs = getComputedStyle($el[0]);
      expect(cs.paddingTop, "header rhythm").to.eq("16px");
      expect(cs.paddingLeft, "header rhythm").to.eq("24px");
    });
    cy.get("dialog footer").should(($el) => {
      const cs = getComputedStyle($el[0]);
      expect(cs.paddingBottom, "footer rhythm").to.eq("16px");
      expect(cs.paddingLeft, "footer rhythm").to.eq("24px");
    });
  });
});
