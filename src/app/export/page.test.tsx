import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ToastProvider";
import { ExportActions } from "./ExportActions";

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
let clickSpy: jest.SpyInstance;

function renderExportActions() {
  return render(
    <ToastProvider>
      <ExportActions apiBase="https://api.example.test" />
    </ToastProvider>,
  );
}

function mockSuccessResponse(filename = "usage.json", content = "{}") {
  return {
    ok: true,
    status: 200,
    blob: async () => new Blob([content], { type: "application/json" }),
    headers: {
      get: (name: string) =>
        name.toLowerCase() === "content-disposition"
          ? `attachment; filename="${filename}"`
          : null,
    },
  } as Response;
}

beforeEach(() => {
  globalThis.fetch = jest.fn();
  clickSpy = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation();
  URL.createObjectURL = jest.fn(() => "blob:usage-export");
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  clickSpy.mockRestore();
  URL.createObjectURL = originalCreateObjectURL;
  URL.revokeObjectURL = originalRevokeObjectURL;
});

describe("ExportActions", () => {
  it("downloads the selected export, uses the response filename, and shows a toast", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      mockSuccessResponse("usage.csv"),
    );

    renderExportActions();

    fireEvent.click(screen.getByRole("button", { name: "Download CSV" }));

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining("https://api.example.test/api/v1/usage/export.csv"),
      );
      expect(clickSpy).toHaveBeenCalled();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:usage-export");
    });
    expect(await screen.findByText("CSV export downloaded.")).toBeInTheDocument();
  });

  it("disables both download buttons while a request is pending", async () => {
    let resolveResponse: (response: Response) => void = () => {};
    (globalThis.fetch as jest.Mock).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveResponse = resolve;
      }),
    );

    renderExportActions();

    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));

    expect(screen.getByRole("button", { name: /downloading json/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();
    expect(screen.getByText("Preparing JSON export...")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Preparing JSON export");

    resolveResponse(mockSuccessResponse());

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Download JSON" })).toBeEnabled();
    });
  });

  it("shows backend errors to the operator", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "export service unavailable",
    } as Response);

    renderExportActions();

    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "export service unavailable",
    );
  });

  it("still downloads an empty export response", async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
      mockSuccessResponse("usage-empty.json", ""),
    );

    renderExportActions();

    fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));

    await waitFor(() => {
      expect(URL.createObjectURL).toHaveBeenCalled();
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("date range", () => {
    it("renders start and end date inputs defaulting to current month", () => {
      renderExportActions();

      const startInput = screen.getByLabelText("Start date") as HTMLInputElement;
      const endInput = screen.getByLabelText("End date") as HTMLInputElement;

      expect(startInput).toBeInTheDocument();
      expect(endInput).toBeInTheDocument();
      expect(startInput.value).toBe(toISODate(getFirstOfMonth()));
      expect(endInput.value).toBe(toISODate(new Date()));
    });

    it("passes startDate and endDate as query parameters", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce(
        mockSuccessResponse("usage.json"),
      );

      renderExportActions();

      fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));

      await waitFor(() => {
        const calledUrl = (globalThis.fetch as jest.Mock).mock.calls[0][0] as string;
        expect(calledUrl).toContain("startDate=");
        expect(calledUrl).toContain("endDate=");
      });
    });

    it("shows an error when end date precedes start date", async () => {
      renderExportActions();

      const startInput = screen.getByLabelText("Start date") as HTMLInputElement;
      const endInput = screen.getByLabelText("End date") as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: "2025-12-01" } });
      fireEvent.change(endInput, { target: { value: "2025-01-01" } });

      expect(
        screen.getByText("End date must not precede start date."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Download JSON" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Download CSV" })).toBeDisabled();
    });

    it("clears the date range error when dates become valid again", () => {
      renderExportActions();

      const startInput = screen.getByLabelText("Start date") as HTMLInputElement;
      const endInput = screen.getByLabelText("End date") as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: "2025-12-01" } });
      fireEvent.change(endInput, { target: { value: "2025-01-01" } });
      expect(screen.getByRole("alert")).toBeInTheDocument();

      fireEvent.change(endInput, { target: { value: "2025-12-31" } });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Download JSON" })).toBeEnabled();
    });

    it("'Last 7 days' preset sets correct date range", async () => {
      const user = userEvent.setup();
      renderExportActions();

      await user.click(screen.getByRole("button", { name: "Last 7 days" }));

      const startInput = screen.getByLabelText("Start date") as HTMLInputElement;
      const endInput = screen.getByLabelText("End date") as HTMLInputElement;

      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - 7);

      expect(startInput.value).toBe(toISODate(expectedStart));
      expect(endInput.value).toBe(toISODate(new Date()));
    });

    it("'Last 30 days' preset sets correct date range", async () => {
      const user = userEvent.setup();
      renderExportActions();

      await user.click(screen.getByRole("button", { name: "Last 30 days" }));

      const startInput = screen.getByLabelText("Start date") as HTMLInputElement;
      const endInput = screen.getByLabelText("End date") as HTMLInputElement;

      const expectedStart = new Date();
      expectedStart.setDate(expectedStart.getDate() - 30);

      expect(startInput.value).toBe(toISODate(expectedStart));
      expect(endInput.value).toBe(toISODate(new Date()));
    });

    it("'This month' preset resets to current month boundaries", async () => {
      const user = userEvent.setup();
      renderExportActions();

      const startInput = screen.getByLabelText("Start date") as HTMLInputElement;
      const endInput = screen.getByLabelText("End date") as HTMLInputElement;

      fireEvent.change(startInput, { target: { value: "2020-01-01" } });
      fireEvent.change(endInput, { target: { value: "2020-06-15" } });

      await user.click(screen.getByRole("button", { name: "This month" }));

      expect(startInput.value).toBe(toISODate(getFirstOfMonth()));
      expect(endInput.value).toBe(toISODate(new Date()));
    });

    it("falls back to default filename when no date range is provided in disposition", async () => {
      (globalThis.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        blob: async () => new Blob([""], { type: "application/json" }),
        headers: { get: () => null },
      } as unknown as Response);

      renderExportActions();

      fireEvent.click(screen.getByRole("button", { name: "Download JSON" }));

      await waitFor(() => {
        expect(clickSpy).toHaveBeenCalled();
        const link = clickSpy.mock.instances[0] as HTMLAnchorElement;
        expect(link).toBeTruthy();
        expect(link.download).toMatch(/usage-export_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}\.json/);
      });
    });
  });
});

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getFirstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}
