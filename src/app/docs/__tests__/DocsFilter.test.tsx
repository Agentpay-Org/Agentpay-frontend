import { act, fireEvent, render, screen } from "@testing-library/react";
import { DocsFilter } from "../DocsFilter";
import { getSections } from "../endpoints";

// Real endpoint data so filtering assertions track the actual docs content
// rather than a hand-rolled fixture that could drift from endpoints.ts.
const sections = getSections("https://api.example.com");

function getSearchInput() {
  return screen.getByRole("searchbox", { name: /filter endpoints/i }) as HTMLInputElement;
}

function getLiveRegion(container: HTMLElement) {
  return container.querySelector('[aria-live="polite"]') as HTMLElement;
}

function typeAndSettle(input: HTMLElement, value: string) {
  fireEvent.change(input, { target: { value } });
  act(() => {
    jest.advanceTimersByTime(300);
  });
}

describe("DocsFilter", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders every endpoint with an empty, unannounced live region", () => {
    const { container } = render(<DocsFilter sections={sections} />);

    for (const section of sections) {
      expect(screen.getByText(section.h)).toBeInTheDocument();
      expect(screen.getByText(section.p)).toBeInTheDocument();
    }

    const liveRegion = getLiveRegion(container);
    expect(liveRegion).toHaveAttribute("aria-atomic", "true");
    expect(liveRegion).toHaveTextContent("");
  });

  it("does not filter until the debounce window elapses", () => {
    render(<DocsFilter sections={sections} />);
    const input = getSearchInput();

    fireEvent.change(input, { target: { value: "settle" } });

    // Debounce hasn't fired yet, so the full list is still showing.
    expect(screen.getByText("POST /api/v1/usage")).toBeInTheDocument();
    expect(screen.getByText("POST /api/v1/settle")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(screen.getByText("POST /api/v1/usage")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText("POST /api/v1/usage")).not.toBeInTheDocument();
    expect(screen.getByText("POST /api/v1/settle")).toBeInTheDocument();
  });

  it("matches on the endpoint heading", () => {
    const { container } = render(<DocsFilter sections={sections} />);
    const input = getSearchInput();

    // "/api/v1/settle" only appears in the POST /api/v1/settle heading, not
    // in any section's prose.
    typeAndSettle(input, "/api/v1/settle");

    expect(screen.getByText("POST /api/v1/settle")).toBeInTheDocument();
    expect(screen.queryByText("POST /api/v1/usage")).not.toBeInTheDocument();
    expect(screen.queryByText("POST /api/v1/services")).not.toBeInTheDocument();
    expect(getLiveRegion(container)).toHaveTextContent('1 result for "/api/v1/settle"');
  });

  it("matches on section prose, case-insensitively", () => {
    const { container } = render(<DocsFilter sections={sections} />);
    const input = getSearchInput();

    // "Idempotent" only appears in the POST /api/v1/services description,
    // not in any heading.
    typeAndSettle(input, "idempotent");

    expect(screen.getByText("POST /api/v1/services")).toBeInTheDocument();
    expect(
      screen.getByText(/Register a service with priceStroops\/request\. Idempotent\./)
    ).toBeInTheDocument();
    expect(screen.queryByText("POST /api/v1/usage")).not.toBeInTheDocument();
    expect(getLiveRegion(container)).toHaveTextContent('1 result for "idempotent"');
  });

  it("announces a pluralized count for multiple matches", () => {
    const { container } = render(<DocsFilter sections={sections} />);
    const input = getSearchInput();

    // "usage" appears in both the POST and GET usage endpoints.
    typeAndSettle(input, "usage");

    expect(screen.getByText("POST /api/v1/usage")).toBeInTheDocument();
    expect(screen.getByText("GET /api/v1/usage/:agent/:serviceId")).toBeInTheDocument();
    expect(screen.queryByText("POST /api/v1/admin/{pause,unpause}")).not.toBeInTheDocument();
    expect(getLiveRegion(container)).toHaveTextContent('2 results for "usage"');
  });

  it("shows the no-results state and announces zero matches", () => {
    const { container } = render(<DocsFilter sections={sections} />);
    const input = getSearchInput();

    typeAndSettle(input, "zzz-nonexistent-endpoint");

    expect(screen.getByText("No matching endpoints")).toBeInTheDocument();
    expect(screen.getByText("Try a different search term.")).toBeInTheDocument();
    for (const section of sections) {
      expect(screen.queryByText(section.h)).not.toBeInTheDocument();
    }
    expect(getLiveRegion(container)).toHaveTextContent(
      'No matches for "zzz-nonexistent-endpoint"'
    );
  });

  it("restores the full list and clears the announcement via the clear action", () => {
    const { container } = render(<DocsFilter sections={sections} />);
    const input = getSearchInput();

    typeAndSettle(input, "zzz-nonexistent-endpoint");
    expect(screen.getByText("No matching endpoints")).toBeInTheDocument();

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    fireEvent.click(clearButton);
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(screen.queryByText("No matching endpoints")).not.toBeInTheDocument();
    for (const section of sections) {
      expect(screen.getByText(section.h)).toBeInTheDocument();
    }
    expect(input.value).toBe("");
    expect(getLiveRegion(container)).toHaveTextContent("");
  });
});
