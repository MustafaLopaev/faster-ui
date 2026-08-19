import { createRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Dialog } from "./Dialog";

describe("Dialog", () => {
  it("renders nothing visible or perceivable while open={false}", () => {
    render(
      <Dialog open={false} onClose={jest.fn()} title="Quiet">
        body
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("body")).not.toBeVisible();
  });

  it("shows as a modal dialog when open flips true", () => {
    const { rerender } = render(
      <Dialog open={false} onClose={jest.fn()} title="Now visible">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={jest.fn()} title="Now visible">
        body
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Now visible" })).toBeVisible();
  });

  it("Escape (cancel) calls onClose exactly once and the dialog stays open", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Held open">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={onClose} title="Held open">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(dialog).toHaveAttribute("open");
  });

  it("header close button calls onClose exactly once without self-closing", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Held open">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={onClose} title="Held open">
        body
      </Dialog>,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("re-syncs a platform-forced close with exactly one onClose", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Forced">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={onClose} title="Forced">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    act(() => {
      dialog.close();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays open under controlled misuse (owner never flips open)", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Misuse">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={onClose} title="Misuse">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(dialog).toHaveAttribute("open");
  });

  it("restores focus to the opener when it closes", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <>
        <button type="button">Opener</button>
        <Dialog open={false} onClose={onClose} title="Restore">
          body
        </Dialog>
      </>,
    );
    const opener = screen.getByRole("button", { name: "Opener" });
    act(() => opener.focus());
    rerender(
      <>
        <button type="button">Opener</button>
        <Dialog open={true} onClose={onClose} title="Restore">
          body
        </Dialog>
      </>,
    );
    rerender(
      <>
        <button type="button">Opener</button>
        <Dialog open={false} onClose={onClose} title="Restore">
          body
        </Dialog>
      </>,
    );
    expect(opener).toHaveFocus();
  });

  it("restores focus to the opener when unmounted while open", () => {
    function Harness({ mounted }: { mounted: boolean }) {
      return (
        <>
          <button type="button">Opener</button>
          {mounted && (
            <Dialog open onClose={jest.fn()} title="Vanishing">
              body
            </Dialog>
          )}
        </>
      );
    }
    const { rerender } = render(<Harness mounted={false} />);
    const opener = screen.getByRole("button", { name: "Opener" });
    act(() => opener.focus());
    rerender(<Harness mounted={true} />);
    rerender(<Harness mounted={false} />);
    expect(opener).toHaveFocus();
  });

  it("takes its accessible name from the title via aria-labelledby", () => {
    const { rerender } = render(
      <Dialog open={false} onClose={jest.fn()} title="Invite teammate">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={jest.fn()} title="Invite teammate">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog", { name: "Invite teammate" });
    const heading = screen.getByText("Invite teammate");
    expect(dialog.getAttribute("aria-labelledby")).toBe(heading.id);
  });

  it("supports a consumer aria-label when there is no title", () => {
    const { rerender } = render(
      <Dialog open={false} onClose={jest.fn()} aria-label="Bare dialog" />,
    );
    rerender(<Dialog open={true} onClose={jest.fn()} aria-label="Bare dialog" />);
    const dialog = screen.getByRole("dialog", { name: "Bare dialog" });
    expect(dialog).not.toHaveAttribute("aria-labelledby");
  });

  it("forwards the ref to the <dialog> and passes unknown props through", () => {
    const ref = createRef<HTMLDialogElement>();
    const { rerender } = render(
      <Dialog ref={ref} open={false} onClose={jest.fn()} title="Ref" data-flavor="hickory">
        body
      </Dialog>,
    );
    rerender(
      <Dialog ref={ref} open={true} onClose={jest.fn()} title="Ref" data-flavor="hickory">
        body
      </Dialog>,
    );
    const dialog = screen.getByRole("dialog");
    expect(ref.current).toBe(dialog);
    expect(ref.current).toBeInstanceOf(HTMLDialogElement);
    expect(dialog).toHaveAttribute("data-flavor", "hickory");
  });

  it("does not treat a scrim (backdrop) click as a close intent (A-4)", () => {
    const onClose = jest.fn();
    const { rerender } = render(
      <Dialog open={false} onClose={onClose} title="Sticky">
        body
      </Dialog>,
    );
    rerender(
      <Dialog open={true} onClose={onClose} title="Sticky">
        body
      </Dialog>,
    );
    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
  });

  it("hides the header entirely when there is no title and showClose is false", () => {
    const { rerender } = render(
      <Dialog open={false} onClose={jest.fn()} showClose={false} aria-label="Headless" />,
    );
    rerender(<Dialog open={true} onClose={jest.fn()} showClose={false} aria-label="Headless" />);
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Headless" }).querySelector("header")).toBeNull();
  });
});
