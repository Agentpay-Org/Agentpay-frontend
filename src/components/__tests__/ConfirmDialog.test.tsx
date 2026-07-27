import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { ConfirmDialog } from "../ConfirmDialog";

// ---------------------------------------------------------------------------
// Reusable harnesses
// ---------------------------------------------------------------------------

function ConfirmDialogHarness({
  dismissOnBackdrop = false,
}: {
  dismissOnBackdrop?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const onCancel = () => setOpen(false);

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
        dismissOnBackdrop={dismissOnBackdrop}
        onConfirm={jest.fn()}
        onCancel={onCancel}
      />
    </>
  );
}

/** Renders two independent dialogs open at the same time. */
function TwoDialogsHarness() {
  return (
    <>
      <ConfirmDialog
        open
        title="Revoke key"
        description="The key will stop working immediately."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
      <ConfirmDialog
        open
        title="Remove webhook"
        description="All pending deliveries will be dropped."
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("ConfirmDialog", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  // -------------------------------------------------------------------------
  // Unique-id contract (the core of this PR)
  // -------------------------------------------------------------------------

  describe("unique-id contract", () => {
    it("gives each dialog its own unique title id when two are mounted simultaneously", () => {
      render(<TwoDialogsHarness />);

      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs).toHaveLength(2);

      const titleIds = dialogs.map((d) => d.getAttribute("aria-labelledby"));

      // Both ids must be present
      expect(titleIds[0]).toBeTruthy();
      expect(titleIds[1]).toBeTruthy();

      // The ids must differ from each other
      expect(titleIds[0]).not.toBe(titleIds[1]);
    });

    it("each aria-labelledby resolves to its own <h2> element", () => {
      render(<TwoDialogsHarness />);

      const dialogs = screen.getAllByRole("dialog");

      dialogs.forEach((dialog) => {
        const labelledById = dialog.getAttribute("aria-labelledby")!;
        expect(labelledById).toBeTruthy();

        // The element with this id must exist exactly once in the document
        const labellers = document.querySelectorAll(`#${CSS.escape(labelledById)}`);
        expect(labellers).toHaveLength(1);

        // It must be an <h2> inside the same dialog panel
        const h2 = labellers[0];
        expect(h2.tagName).toBe("H2");
        expect(dialog.contains(h2)).toBe(true);
      });
    });

    it("no duplicate id attributes exist in the document when two dialogs are open", () => {
      render(<TwoDialogsHarness />);

      const allIds = Array.from(document.querySelectorAll("[id]")).map(
        (el) => el.id
      );

      const idCounts = allIds.reduce<Record<string, number>>((acc, id) => {
        acc[id] = (acc[id] ?? 0) + 1;
        return acc;
      }, {});

      const duplicates = Object.entries(idCounts)
        .filter(([, count]) => count > 1)
        .map(([id]) => id);

      expect(duplicates).toHaveLength(0);
    });

    it("resolves the accessible name of each dialog correctly via getByRole", () => {
      render(<TwoDialogsHarness />);

      // If aria-labelledby wiring is correct, both getByRole calls succeed.
      expect(
        screen.getByRole("dialog", { name: /revoke key/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("dialog", { name: /remove webhook/i })
      ).toBeInTheDocument();
    });

    it("each dialog's aria-labelledby points to an h2 with the matching title text", () => {
      render(<TwoDialogsHarness />);

      const revokeDialog = screen.getByRole("dialog", { name: /revoke key/i });
      const removeDialog = screen.getByRole("dialog", { name: /remove webhook/i });

      // Title text is inside the correct dialog panel
      expect(within(revokeDialog).getByRole("heading", { name: /revoke key/i })).toBeInTheDocument();
      expect(within(removeDialog).getByRole("heading", { name: /remove webhook/i })).toBeInTheDocument();
    });

    it("titleId and descriptionId are derived from the same baseId but have distinct suffixes", () => {
      render(
        <ConfirmDialog
          open
          title="Distinct ids"
          description="Should have -title and -description suffixes"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const dialog = screen.getByRole("dialog", { name: /distinct ids/i });
      const titleId = dialog.getAttribute("aria-labelledby")!;
      const descriptionId = dialog.getAttribute("aria-describedby")!;

      expect(titleId).toMatch(/-title$/);
      expect(descriptionId).toMatch(/-description$/);

      // Strip the suffix to confirm they share the same baseId prefix
      const baseFromTitle = titleId.replace(/-title$/, "");
      const baseFromDescription = descriptionId.replace(/-description$/, "");
      expect(baseFromTitle).toBe(baseFromDescription);
    });

    it("omits aria-describedby but still provides a unique title id when no description is given", () => {
      render(
        <ConfirmDialog
          open
          title="No description dialog"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      const dialog = screen.getByRole("dialog", { name: /no description dialog/i });
      const titleId = dialog.getAttribute("aria-labelledby");

      expect(titleId).toBeTruthy();
      expect(dialog).not.toHaveAttribute("aria-describedby");

      // The title element must exist with this id
      const titleEl = document.getElementById(titleId!);
      expect(titleEl).not.toBeNull();
      expect(titleEl?.tagName).toBe("H2");
    });
  });

  // -------------------------------------------------------------------------
  // Existing behavioural tests (all preserved)
  // -------------------------------------------------------------------------

  it("moves focus to the first dialog action when opened", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton } = openDialog();
    const description = screen.getByText("This action cannot be undone.");

    expect(cancelButton).toHaveFocus();
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
  });

  it("handles null activeElement when dialog opens", () => {
    const getActiveElement = jest.spyOn(document, "activeElement", "get");
    getActiveElement.mockReturnValue(null);

    render(
      <ConfirmDialog
        open
        title="Null active"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: /null active/i })).toBeInTheDocument();
  });

  it("ignores non-Escape, non-Tab keys without side effects", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();

    render(
      <ConfirmDialog
        open
        title="Key test"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    const dialog = screen.getByRole("dialog", { name: /key test/i });
    fireEvent.keyDown(dialog, { key: "ArrowDown" });

    expect(onCancel).not.toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
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

  it("wraps to dialog when no focusable children exist inside", () => {
    render(<ConfirmDialogHarness />);

    const { dialog } = openDialog();
    dialog.querySelectorAll("button").forEach((b) => b.remove());

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(document.activeElement).toBe(dialog);
  });

  it("moves focus to the first focusable when Tab is pressed on an outside element", () => {
    render(<ConfirmDialogHarness />);

    const { dialog, cancelButton } = openDialog();

    const outsideButton = screen.getByRole("button", { name: /outside action/i });
    outsideButton.focus();

    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(cancelButton).toHaveFocus();
  });

  it("does not cancel on backdrop click when dismissOnBackdrop is off", () => {
    render(<ConfirmDialogHarness dismissOnBackdrop={false} />);

    const { dialog, cancelButton } = openDialog();

    const onCancelSpy = jest.spyOn(cancelButton, "click");

    fireEvent.mouseDown(dialog);
    expect(screen.getByRole("dialog", { name: /delete project/i })).toBeInTheDocument();

    onCancelSpy.mockRestore();
  });

  it("cancels on backdrop click when dismissOnBackdrop is on", () => {
    render(<ConfirmDialogHarness dismissOnBackdrop={true} />);

    const { dialog } = openDialog();
    const backdrop = dialog.parentElement;
    expect(backdrop).not.toBeNull();

    fireEvent.mouseDown(backdrop!);

    expect(screen.queryByRole("dialog", { name: /delete project/i })).not.toBeInTheDocument();
  });

  it("does not cancel when clicking inside the dialog panel", () => {
    render(<ConfirmDialogHarness dismissOnBackdrop={true} />);

    const { cancelButton } = openDialog();

    fireEvent.mouseDown(cancelButton);

    expect(screen.getByRole("dialog", { name: /delete project/i })).toBeInTheDocument();
    // sanity: Cancel still works
    fireEvent.click(cancelButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
