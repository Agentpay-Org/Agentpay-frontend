import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import UsagePage from "./page";
import { apiGet, apiPost } from "@/lib/apiClient";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPost: jest.fn(),
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

describe("UsagePage", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-23T10:00:00.000Z"));
    apiGetMock.mockReset();
    apiPostMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
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
      expect(screen.getByText(/New total: 42/)).toBeInTheDocument();
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
      expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
    });
    expect(apiGetMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/usage/a/s"),
    );
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
      expect(screen.getByText(/^Recorded\.$/)).toBeInTheDocument();
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
    expect(screen.getByText(/Querying…/i)).toBeInTheDocument();

    // Resolve first query
    resolveQuery!({
      agent: "a",
      serviceId: "s",
      total: 10,
    });

    await waitFor(() => {
      expect(screen.getByText("10")).toBeInTheDocument();
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
    expect(screen.queryByText("10")).not.toBeInTheDocument();
    expect(screen.getByText(/Querying…/i)).toBeInTheDocument();

    resolveQuery2!({
      agent: "b",
      serviceId: "s",
      total: 20,
    });

    await waitFor(() => {
      expect(screen.getByText("20")).toBeInTheDocument();
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
      expect(screen.getByText("10")).toBeInTheDocument();
    });

    // Now error
    apiGetMock.mockRejectedValueOnce({ message: "Not found" });

    fireEvent.click(screen.getByRole("button", { name: /Query/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/Not found/i);
    });
    // The previous success result should be gone
    expect(screen.queryByText("10")).not.toBeInTheDocument();
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
      expect(screen.getByText("0")).toBeInTheDocument();
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
  expect(screen.getByText(/Recording…/i)).toBeInTheDocument();

  // Try submitting again
  fireEvent.submit(form);

  // Resolve the promise
  resolveRecord!({
    total: 5,
  });

  await waitFor(() => {
    expect(screen.getByText(/New total: 5/i)).toBeInTheDocument();
  });

  // fetch should only have been called once despite the second submit
  expect(apiPostMock).toHaveBeenCalledTimes(1);
  expect(recordButton).not.toBeDisabled();
});

it("does not display success or error feedback while recording is in progress", () => {
  apiPostMock.mockImplementationOnce(
    () => new Promise(() => {})
  );

  render(<UsagePage />);

  fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[0], {
    target: { value: "agent" },
  });

  fireEvent.change(screen.getAllByLabelText(/^Service ID$/i)[0], {
    target: { value: "service" },
  });

  fireEvent.change(screen.getByLabelText(/^Requests$/i), {
    target: { value: "5" },
  });

  fireEvent.click(
    screen.getByRole("button", { name: /Record/i })
  );

  expect(screen.getByText(/Recording…/i)).toBeInTheDocument();

  expect(
    screen.queryByText(/Recorded/i)
  ).not.toBeInTheDocument();

  expect(
    screen.queryByText(/Recording failed/i)
  ).not.toBeInTheDocument();
});

describe("Date range presets", () => {
    it("renders the date range preset selector with all options", () => {
      render(<UsagePage />);
      expect(screen.getByText("Date range")).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Last 24 hours/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Last 7 days/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /Last 30 days/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("radio", { name: /^Custom$/i }),
      ).toBeInTheDocument();
    });

    it("defaults to Custom with no date filter announcement", () => {
      render(<UsagePage />);
      const customRadio = screen.getByRole("radio", { name: /^Custom$/i });
      expect(customRadio).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByText("Showing all usage data (no date filter)."),
      ).toBeInTheDocument();
    });

    it("applies Last 24 hours preset and announces the range label", () => {
      render(<UsagePage />);
      const radio = screen.getByRole("radio", { name: /Last 24 hours/i });
      fireEvent.click(radio);

      expect(radio).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("radio", { name: /^Custom$/i }),
      ).toHaveAttribute("aria-checked", "false");
      expect(
        screen.getByText("Showing Last 24 hours."),
      ).toBeInTheDocument();
    });

    it("applies Last 7 days preset and announces the range label", () => {
      render(<UsagePage />);
      const radio = screen.getByRole("radio", { name: /Last 7 days/i });
      fireEvent.click(radio);

      expect(radio).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByText("Showing Last 7 days."),
      ).toBeInTheDocument();
    });

    it("applies Last 30 days preset and announces the range label", () => {
      render(<UsagePage />);
      const radio = screen.getByRole("radio", { name: /Last 30 days/i });
      fireEvent.click(radio);

      expect(radio).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByText("Showing Last 30 days."),
      ).toBeInTheDocument();
    });

    it("sets correct ISO dates when Last 24 hours preset is active", () => {
      render(<UsagePage />);
      fireEvent.click(screen.getByRole("radio", { name: /Last 24 hours/i }));

      // Query with preset should include startDate and endDate
      apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 1 });

      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );
      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });
      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      const expectedStart = toISODate(hoursAgo(24));
      const expectedEnd = toISODate(new Date());
      expect(calledUrl).toContain(`startDate=${expectedStart}`);
      expect(calledUrl).toContain(`endDate=${expectedEnd}`);
    });

    it("sets correct ISO dates when Last 7 days preset is active", () => {
      render(<UsagePage />);
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));

      apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 1 });

      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );
      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });
      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      const expectedStart = toISODate(daysAgo(7));
      const expectedEnd = toISODate(new Date());
      expect(calledUrl).toContain(`startDate=${expectedStart}`);
      expect(calledUrl).toContain(`endDate=${expectedEnd}`);
    });

    it("sets correct ISO dates when Last 30 days preset is active", () => {
      render(<UsagePage />);
      fireEvent.click(screen.getByRole("radio", { name: /Last 30 days/i }));

      apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 1 });

      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );
      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });
      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      const expectedStart = toISODate(daysAgo(30));
      const expectedEnd = toISODate(new Date());
      expect(calledUrl).toContain(`startDate=${expectedStart}`);
      expect(calledUrl).toContain(`endDate=${expectedEnd}`);
    });

    it("hides custom date inputs when a preset is selected", () => {
      render(<UsagePage />);
      // Custom inputs should be visible by default
      expect(screen.getByLabelText("Start date")).toBeInTheDocument();
      expect(screen.getByLabelText("End date")).toBeInTheDocument();

      // Select a preset
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));

      // Custom inputs should be hidden
      expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("End date")).not.toBeInTheDocument();
    });

    it("shows custom date inputs when Custom is selected", () => {
      render(<UsagePage />);
      // First select a preset to hide them
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));
      expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();

      // Now select Custom
      fireEvent.click(screen.getByRole("radio", { name: /^Custom$/i }));

      expect(screen.getByLabelText("Start date")).toBeInTheDocument();
      expect(screen.getByLabelText("End date")).toBeInTheDocument();
    });

    it("clears dates when switching to Custom preset", () => {
      render(<UsagePage />);
      // Select a preset first
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));

      // Switch to Custom
      fireEvent.click(screen.getByRole("radio", { name: /^Custom$/i }));

      expect(
        screen.getByText("Showing all usage data (no date filter)."),
      ).toBeInTheDocument();
    });

    it("sends startDate and endDate query params when preset is active", async () => {
      apiGetMock.mockResolvedValueOnce({
        agent: "a",
        serviceId: "s",
        total: 5,
      });

      render(<UsagePage />);
      // Select Last 7 days
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));

      // Fill in query fields
      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );

      // Submit query
      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      await waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });

      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("startDate=");
      expect(calledUrl).toContain("endDate=");
    });

    it("does not send date params when Custom with no dates", async () => {
      apiGetMock.mockResolvedValueOnce({
        agent: "a",
        serviceId: "s",
        total: 5,
      });

      render(<UsagePage />);
      // Custom is default, no dates set

      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );

      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      await waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });

      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain("startDate");
      expect(calledUrl).not.toContain("endDate");
    });

    it("sends date params when custom dates are entered manually", async () => {
      apiGetMock.mockResolvedValueOnce({
        agent: "a",
        serviceId: "s",
        total: 5,
      });

      render(<UsagePage />);
      // Custom is default, enter dates manually
      fireEvent.change(screen.getByLabelText("Start date"), {
        target: { value: "2026-07-01" },
      });
      fireEvent.change(screen.getByLabelText("End date"), {
        target: { value: "2026-07-15" },
      });

      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );

      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      await waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });

      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      expect(calledUrl).toContain("startDate=2026-07-01");
      expect(calledUrl).toContain("endDate=2026-07-15");
    });

    it("switches from preset to custom and back to preset", () => {
      render(<UsagePage />);

      // Start on Custom (default)
      expect(
        screen.getByRole("radio", { name: /^Custom$/i }),
      ).toHaveAttribute("aria-checked", "true");

      // Switch to 7d preset
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));
      expect(
        screen.getByRole("radio", { name: /Last 7 days/i }),
      ).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Showing Last 7 days.")).toBeInTheDocument();

      // Switch to Custom
      fireEvent.click(screen.getByRole("radio", { name: /^Custom$/i }));
      expect(
        screen.getByRole("radio", { name: /^Custom$/i }),
      ).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByText("Showing all usage data (no date filter)."),
      ).toBeInTheDocument();

      // Switch to 30d preset
      fireEvent.click(screen.getByRole("radio", { name: /Last 30 days/i }));
      expect(
        screen.getByRole("radio", { name: /Last 30 days/i }),
      ).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("Showing Last 30 days.")).toBeInTheDocument();
    });

    it("announces date range change for assistive technology", () => {
      render(<UsagePage />);
      const liveRegion = screen.getByText(
        "Showing all usage data (no date filter).",
      );
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("role", "status");

      // Change to a preset
      fireEvent.click(screen.getByRole("radio", { name: /Last 24 hours/i }));

      expect(liveRegion).toHaveTextContent("Showing Last 24 hours.");
    });

    it("does not include date params when switching from preset to custom", async () => {
      apiGetMock.mockResolvedValueOnce({
        agent: "a",
        serviceId: "s",
        total: 5,
      });

      render(<UsagePage />);
      // Select a preset
      fireEvent.click(screen.getByRole("radio", { name: /Last 7 days/i }));
      // Switch to custom
      fireEvent.click(screen.getByRole("radio", { name: /^Custom$/i }));

      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );

      fireEvent.click(screen.getByRole("button", { name: /Query/i }));

      await waitFor(() => {
        expect(apiGetMock).toHaveBeenCalledTimes(1);
      });

      const calledUrl = apiGetMock.mock.calls[0][0] as string;
      expect(calledUrl).not.toContain("startDate");
      expect(calledUrl).not.toContain("endDate");
    });

    it("announces custom date range when dates are set manually", () => {
      render(<UsagePage />);
      const liveRegion = screen.getByText(
        "Showing all usage data (no date filter).",
      );

      fireEvent.change(screen.getByLabelText("Start date"), {
        target: { value: "2026-07-01" },
      });
      expect(liveRegion).toHaveTextContent(
        "Showing usage from 2026-07-01 onwards.",
      );

      fireEvent.change(screen.getByLabelText("End date"), {
        target: { value: "2026-07-15" },
      });
      expect(liveRegion).toHaveTextContent(
        "Showing usage from 2026-07-01 to 2026-07-15.",
      );

      // Clear start date, keep end date
      fireEvent.change(screen.getByLabelText("Start date"), {
        target: { value: "" },
      });
      expect(liveRegion).toHaveTextContent("Showing usage up to 2026-07-15.");
    });
  });

  describe("Polite live-region announcements", () => {
    function runQuery() {
      fireEvent.change(screen.getAllByLabelText(/^Agent$/i)[1], {
        target: { value: "a" },
      });
      fireEvent.change(
        screen.getByLabelText(/^Service ID$/i, {
          selector: 'input[name="queryServiceId"]',
        }),
        { target: { value: "s" } },
      );
      fireEvent.click(screen.getByRole("button", { name: /Query/i }));
    }

    function settle() {
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    it("mounts an empty polite live region so later changes are announced", () => {
      render(<UsagePage />);

      const announcer = screen.getByTestId("usage-announcer");
      expect(announcer).toHaveAttribute("aria-live", "polite");
      expect(announcer).toHaveAttribute("aria-atomic", "true");
      expect(announcer).toHaveClass("sr-only");
      expect(announcer).toBeEmptyDOMElement();

      settle();
      expect(screen.getByTestId("usage-announcer")).toBeEmptyDOMElement();
    });

    it("does not announce the first query result (baseline)", async () => {
      apiGetMock.mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 });
      render(<UsagePage />);
      runQuery();

      await waitFor(() => {
        expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
      });
      settle();
      expect(screen.getByTestId("usage-announcer")).toBeEmptyDOMElement();
    });

    it("announces the total when a later query changes it", async () => {
      apiGetMock
        .mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 })
        .mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 30 });
      render(<UsagePage />);

      runQuery();
      await waitFor(() => {
        expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
      });
      settle();

      runQuery();
      await waitFor(() => {
        expect(screen.getByText("30", { selector: "strong" })).toBeInTheDocument();
      });
      settle();

      expect(screen.getByTestId("usage-announcer")).toHaveTextContent(
        "Usage total: 30 requests",
      );
    });

    it("announces zero results when a query returns no payload", async () => {
      apiGetMock
        .mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 })
        .mockResolvedValueOnce(null as never);
      render(<UsagePage />);

      runQuery();
      await waitFor(() => {
        expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
      });
      settle();

      runQuery();
      await waitFor(() => {
        expect(screen.getByTestId("usage-announcer")).toHaveTextContent(
          "No usage data found",
        );
      });
      expect(
        screen.queryByText("12", { selector: "strong" }),
      ).not.toBeInTheDocument();
    });

    it("keeps the live region silent when a query fails", async () => {
      apiGetMock
        .mockResolvedValueOnce({ agent: "a", serviceId: "s", total: 12 })
        .mockRejectedValueOnce(new Error("query blew up"));
      render(<UsagePage />);

      runQuery();
      await waitFor(() => {
        expect(screen.getByText("12", { selector: "strong" })).toBeInTheDocument();
      });
      settle();

      runQuery();
      // ErrorMessage's role="alert" already announces the failure.
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Query failed");
      });
      settle();

      expect(screen.getByTestId("usage-announcer")).toBeEmptyDOMElement();
    });
  });
});
