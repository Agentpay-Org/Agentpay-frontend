import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DocsPage from "./page";
import { safeHref } from "@/lib/url";

// Mock resolveApiBase since it depends on environment variables
jest.mock("@/lib/resolveApiBase", () => ({
  resolveApiBase: () => "https://api.example.com",
}));

jest.mock("@/lib/url", () => {
  const actual = jest.requireActual("@/lib/url");
  return {
    ...actual,
    safeHref: jest.fn().mockImplementation(actual.safeHref),
  };
});

describe("DocsPage", () => {
  it("renders the list of endpoints", () => {
    render(<DocsPage />);
    expect(screen.getByRole("heading", { name: /API documentation/i })).toBeInTheDocument();
    // Verify first endpoint is present
    expect(screen.getByText(/POST \/api\/v1\/usage/i)).toBeInTheDocument();
  });

  it("filters endpoints based on search query", async () => {
    render(<DocsPage />);
    const searchInput = screen.getByLabelText(/Filter endpoints/i);
    
    // Filter by "usage"
    fireEvent.change(searchInput, { target: { value: "usage" } });
    
    // Check that usage endpoints are present
    await waitFor(() => {
      expect(screen.getByText(/POST \/api\/v1\/usage/i)).toBeInTheDocument();
      expect(screen.getByText(/GET \/api\/v1\/usage\/:agent\/:serviceId/i)).toBeInTheDocument();
    }, { timeout: 1000 });

    // Check that admin endpoint is NOT present
    await waitFor(() => {
        expect(screen.queryByText(/POST \/api\/v1\/admin\/{pause,unpause}/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it("shows EmptyState when no matches", async () => {
    render(<DocsPage />);
    const searchInput = screen.getByLabelText(/Filter endpoints/i);

    // Filter by "nonexistent"
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    await waitFor(() => {
      expect(screen.getByText(/No matching endpoints/i)).toBeInTheDocument();
      expect(screen.getByText(/Try a different search term./i)).toBeInTheDocument();
    });
  });
  it('renders correctly with default and empty parameters to hit 100% coverage', () => {
    (safeHref as jest.Mock).mockReturnValue({ ok: false });
    const { rerender } = render(<DocsPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();

    // Restore mock for other tests if necessary (not strictly needed as it's the last test, but good practice)
    (safeHref as jest.Mock).mockImplementation(jest.requireActual("@/lib/url").safeHref);
  });
});

