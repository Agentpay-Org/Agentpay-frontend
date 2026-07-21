import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import UsagePage from "./page";
import { apiGet, apiPost } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

describe("UsagePage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPostMock.mockReset();
  });

  it("renders both Record and Query landmarks", () => {
    render(<UsagePage />);
    expect(
      screen.getByRole("heading", { name: /Usage metering/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Record usage/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Query usage/i }),
    ).toBeInTheDocument();
  });

  it("POSTs through the shared apiClient and shows the new total on success", async () => {
    apiPostMock.mockResolvedValueOnce({ total: 42 });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: " agent-1 " },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: " svc.alpha:prod " },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/New total: 42/);
    });
    expect(apiPostMock).toHaveBeenCalledWith("/api/v1/usage", {
      agent: "agent-1",
      serviceId: "svc.alpha:prod",
      requests: 42,
    });
  });

  it("blocks record submit for empty, whitespace, or malformed identifiers", async () => {
    render(<UsagePage />);
    const agentInput = screen.getAllByLabelText(/^Agent$/i)[0];
    const serviceInput = screen.getAllByLabelText(/^Service ID$/i)[0];

    fireEvent.change(agentInput, { target: { value: "   " } });
    fireEvent.change(serviceInput, { target: { value: "svc/one" } });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.submit(screen.getByLabelText(/^Requests$/i).closest("form")!);

    await waitFor(() => {
      expect(agentInput).toHaveAttribute("aria-invalid", "true");
      expect(serviceInput).toHaveAttribute("aria-invalid", "true");
    });
    expect(screen.getByText("Agent is required.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Service ID can only use letters, numbers, dots, underscores, hyphens, and colons.",
      ),
    ).toBeInTheDocument();
    expect(agentInput.getAttribute("aria-describedby")).toBeTruthy();
    expect(serviceInput.getAttribute("aria-describedby")).toBeTruthy();
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("clears record identifier field errors after editing", async () => {
    render(<UsagePage />);
    const agentInput = screen.getAllByLabelText(/^Agent$/i)[0];

    fireEvent.change(agentInput, { target: { value: "agent one" } });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "svc-1" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.submit(screen.getByLabelText(/^Requests$/i).closest("form")!);

    expect(
      await screen.findByText(
        "Agent can only use letters, numbers, dots, underscores, hyphens, and colons.",
      ),
    ).toBeInTheDocument();

    fireEvent.change(agentInput, { target: { value: "agent-one" } });
    expect(
      screen.queryByText(
        "Agent can only use letters, numbers, dots, underscores, hyphens, and colons.",
      ),
    ).not.toBeInTheDocument();
    expect(agentInput).toHaveAttribute("aria-invalid", "false");
  });

  it("surfaces a backend invalid_request as a role=alert", async () => {
    apiPostMock.mockRejectedValueOnce({
      error: "invalid_request",
      message: "boom",
      requestId: "req-7",
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("boom");
      expect(screen.getByRole("alert")).toHaveTextContent("req-7");
    });
  });

  it("does not POST when requests parses to a non-integer", async () => {
    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    const requestsInput = screen.getByLabelText(/^Requests$/i);
    fireEvent.change(requestsInput, { target: { value: "1.5" } });
    const form = requestsInput.closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        /requests must be a positive integer/,
      );
    });
    expect(apiPostMock).not.toHaveBeenCalled();
  });

  it("uses apiGet for query usage and renders the result", async () => {
    apiGetMock.mockResolvedValueOnce({
      agent: "a",
      serviceId: "s",
      total: 12,
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: " a " },
    });
    fireEvent.change(
      screen.getByLabelText(/^Service ID$/i, {
        selector: 'input[name="queryServiceId"]',
      }),
      {
        target: { value: " s " },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /a \/ s: 12 request\(s\)\./i,
      );
    });
    expect(apiGetMock).toHaveBeenCalledWith("/api/v1/usage/a/s");
  });

  it("blocks query submit for too-long identifiers", async () => {
    render(<UsagePage />);
    const queryAgentInput = screen.getAllByLabelText(/^Agent$/i)[1];
    const queryServiceInput = screen.getAllByLabelText(/^Service ID$/i)[1];

    fireEvent.change(queryAgentInput, { target: { value: "agent-ok" } });
    fireEvent.change(queryServiceInput, { target: { value: "s".repeat(129) } });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(queryServiceInput).toHaveAttribute("aria-invalid", "true");
    });
    expect(
      screen.getByText("Service ID must be 128 characters or fewer."),
    ).toBeInTheDocument();
    expect(apiGetMock).not.toHaveBeenCalled();
  });

  it("shows a request id when the query request fails", async () => {
    apiGetMock.mockRejectedValueOnce({
      error: "invalid_request",
      message: "query boom",
      requestId: "query-9",
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "a" },
    });
    fireEvent.change(
      screen.getByLabelText(/^Service ID$/i, {
        selector: 'input[name="queryServiceId"]',
      }),
      {
        target: { value: "s" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("query boom");
      expect(screen.getByRole("alert")).toHaveTextContent("query-9");
    });
  });

  it("treats a 204/no-body record response as a successful record", async () => {
    apiPostMock.mockResolvedValueOnce(undefined as never);

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/^Recorded\.$/);
    });
  });

  it("surfaces a network rejection message through the alert", async () => {
    apiPostMock.mockRejectedValueOnce(new Error("network down"));

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Record/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("network down");
    });
  });

  it("shows busy state and disables submit while querying, and clears prior result", async () => {
    let resolveQuery: (value: unknown) => void;
    apiGetMock.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveQuery = resolve;
      });
    });

    render(<UsagePage />);

    // First query
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[1], {
      target: { value: "s" },
    });

    const queryButton = screen.getByRole("button", { name: /Query/i });
    fireEvent.click(queryButton);

    // Verify busy state
    expect(queryButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/Querying…/i);

    // Resolve first query
    resolveQuery!({
      agent: "a",
      serviceId: "s",
      total: 10,
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /a \/ s: 10 request\(s\)/i,
      );
    });

    // Start second query
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "b" },
    });

    // Create new promise for second query
    let resolveQuery2: (value: unknown) => void;
    apiGetMock.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveQuery2 = resolve;
      });
    });

    fireEvent.click(queryButton);

    // Prior result should be cleared immediately
    expect(screen.queryByText(/10 request\(s\)/i)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(/Querying…/i);

    resolveQuery2!({
      agent: "b",
      serviceId: "s",
      total: 20,
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /b \/ s: 20 request\(s\)/i,
      );
    });
  });

  it("shows query error after a prior success", async () => {
    render(<UsagePage />);

    apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 10 });

    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[1], {
      target: { value: "s" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /a \/ s: 10 request\(s\)/i,
      );
    });

    // Now error
    apiGetMock.mockRejectedValueOnce({ message: "Not found" });

    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Not found/i);
    });
    // The previous success result should be gone
    expect(screen.queryByText(/10 request\(s\)/i)).not.toBeInTheDocument();
  });

  it("handles an empty/zero total", async () => {
    apiGetMock.mockResolvedValueOnce({
      agent: "zero",
      serviceId: "s",
      total: 0,
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
      target: { value: "zero" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[1], {
      target: { value: "s" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(
        /zero \/ s: 0 request\(s\)/i,
      );
    });
  });

  it("shows busy state and blocks double-submit while recording", async () => {
    let resolveRecord: (value: unknown) => void;
    apiPostMock.mockImplementationOnce(() => {
      return new Promise((resolve) => {
        resolveRecord = resolve;
      });
    });

    render(<UsagePage />);
    fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
      target: { value: "a" },
    });
    fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
      target: { value: "s" },
    });
    fireEvent.change(screen.getByLabelText(/^Requests$/i), {
      target: { value: "5" },
    });

    const recordButton = screen.getByRole("button", { name: /Record/i });

    // Using submit to verify the onRecord handler prevents multiple calls
    const form = screen.getByLabelText(/^Requests$/i).closest("form")!;
    fireEvent.submit(form);

    // Button should be disabled and show busy text
    expect(recordButton).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(/Recording…/i);

    // Try submitting again
    fireEvent.submit(form);

    // Resolve the promise
    resolveRecord!({
      total: 5,
    });

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent(/New total: 5/i);
    });

    // fetch should only have been called once despite the second submit
    expect(apiPostMock).toHaveBeenCalledTimes(1);
    expect(recordButton).not.toBeDisabled();
  });
});
