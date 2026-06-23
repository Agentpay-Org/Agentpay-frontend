import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";

function ConfirmDialogHarness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <button type="button">Outside action</button>
      <ConfirmDialog
        open={open}
        title="Delete project"
        description="This action cannot be undone."
        onConfirm={jest.fn()}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

const openDialog = () => {
  const trigger = screen.getByRole("button", { name: /open dialog/i });
  trigger.focus();
  fireEvent.click(trigger);
  return {
    trigger,
    dialog: screen.getByRole("dialog", { name: /delete project/i }),
    cancelButton: screen.getByRole("button", { name: /cancel/i }),
    confirmButton: screen.getByRole("button", { name: /confirm/i }),
  };
};

describe("ConfirmDialog", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("moves focus to the first dialog action when opened", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton } = openDialog();
    const description = screen.getByText("This action cannot be undone.");

    expect(cancelButton).toHaveFocus();
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
  });

  it("omits aria-describedby when no description is rendered", () => {
    render(
      <ConfirmDialog
        open
        title="Delete project"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(
      screen.getByRole("dialog", { name: /delete project/i })
    ).not.toHaveAttribute("aria-describedby");
  });

  it("calls onCancel with Escape and restores focus to the trigger", () => {
    render(<ConfirmDialogHarness />);

    const { trigger, dialog } = openDialog();
    fireEvent.keyDown(dialog, { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("wraps Tab and Shift+Tab inside the dialog", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton, confirmButton } = openDialog();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(confirmButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancelButton).toHaveFocus();
  });

  it("keeps focus inside the dialog when only one action is focusable", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton, confirmButton } = openDialog();
    confirmButton.setAttribute("disabled", "");

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancelButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(cancelButton).toHaveFocus();
  });

  it("focuses the dialog container when no actions are focusable", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton, confirmButton } = openDialog();
    cancelButton.setAttribute("disabled", "");
    confirmButton.setAttribute("disabled", "");

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(dialog).toHaveFocus();
  });

  it("returns focus to the first action when active focus is outside", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton } = openDialog();
    screen.getByRole("button", { name: /outside action/i }).focus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancelButton).toHaveFocus();
  });

  it("restores focus to the trigger when the cancel button closes the dialog", () => {
    render(<ConfirmDialogHarness />);

    const { trigger, cancelButton } = openDialog();
    fireEvent.click(cancelButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("locks body scrolling while open and restores the previous overflow value", () => {
    document.body.style.overflow = "clip";
    render(<ConfirmDialogHarness />);

    const { cancelButton } = openDialog();
    expect(document.body.style.overflow).toBe("hidden");

    fireEvent.click(cancelButton);
    expect(document.body.style.overflow).toBe("clip");
  });

  it("handles rapid close and reopen without losing focus management", () => {
    render(<ConfirmDialogHarness />);

    const { cancelButton } = openDialog();
    fireEvent.click(cancelButton);

    const reopened = openDialog();
    expect(reopened.cancelButton).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("handles Escape when focus is on the dialog container", () => {
    render(<ConfirmDialogHarness />);

    const { trigger, dialog } = openDialog();
    dialog.focus();
    expect(dialog).toHaveFocus();

    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("ignores non-Tab navigation keys", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton } = openDialog();
    fireEvent.keyDown(dialog, { key: "Enter" });

    expect(screen.getByRole("dialog", { name: /delete project/i })).toBeInTheDocument();
    expect(cancelButton).toHaveFocus();
  });

  it("returns focus to dialog actions when Tab starts on the dialog container", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton, confirmButton } = openDialog();
    dialog.focus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancelButton).toHaveFocus();

    dialog.focus();
    fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
    expect(confirmButton).toHaveFocus();
  });
});
