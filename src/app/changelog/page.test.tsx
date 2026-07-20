import { render, screen } from "@testing-library/react";
import ChangelogPage from "./page";
import { getEntries, type ChangelogEntry } from "./entries";

jest.mock("./entries", () => ({
  getEntries: jest.fn(),
  ChangelogEntry: undefined,
}));

const mockGetEntries = getEntries as jest.MockedFunction<typeof getEntries>;

describe("ChangelogPage", () => {
  beforeEach(() => {
    mockGetEntries.mockReset();
  });

  it("renders changelog entries sorted by date descending", () => {
    const unsortedEntries: ChangelogEntry[] = [
      {
        version: "v1.0.0",
        date: "2026-01-01",
        notes: ["First release"],
      },
      {
        version: "v1.2.0",
        date: "2026-03-01",
        notes: ["Latest features"],
      },
      {
        version: "v1.1.0",
        date: "2026-02-01",
        notes: ["Bug fixes"],
      },
    ];
    mockGetEntries.mockReturnValue(unsortedEntries);

    render(<ChangelogPage />);

    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]).toHaveTextContent("v1.2.0");
    expect(headings[1]).toHaveTextContent("v1.1.0");
    expect(headings[2]).toHaveTextContent("v1.0.0");
  });

  it("renders all notes for each entry", () => {
    mockGetEntries.mockReturnValue([
      {
        version: "v1.2.0",
        date: "2026-06-23",
        notes: ["Added usage exports", "Improved pagination"],
      },
    ]);

    render(<ChangelogPage />);

    expect(screen.getByText("Added usage exports")).toBeInTheDocument();
    expect(screen.getByText("Improved pagination")).toBeInTheDocument();
  });

  it("displays version and date correctly", () => {
    mockGetEntries.mockReturnValue([
      {
        version: "v1.2.0",
        date: "2026-06-23",
        notes: ["Test note"],
      },
    ]);

    render(<ChangelogPage />);

    expect(screen.getByRole("heading", { name: /v1.2.0/i })).toBeInTheDocument();
    expect(screen.getByText(/2026-06-23/i)).toBeInTheDocument();
  });

  it("renders an empty state when no changelog entries exist", () => {
    mockGetEntries.mockReturnValue([]);

    render(<ChangelogPage />);

    expect(screen.getByText("No changelog entries yet")).toBeInTheDocument();
    expect(
      screen.getByText("Release notes will appear here once updates are published."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("maintains consistent ordering regardless of input order", () => {
    const entries1: ChangelogEntry[] = [
      { version: "v1.0.0", date: "2026-01-01", notes: ["A"] },
      { version: "v2.0.0", date: "2026-02-01", notes: ["B"] },
    ];
    const entries2: ChangelogEntry[] = [
      { version: "v2.0.0", date: "2026-02-01", notes: ["B"] },
      { version: "v1.0.0", date: "2026-01-01", notes: ["A"] },
    ];

    mockGetEntries.mockReturnValue(entries1);
    const { unmount } = render(<ChangelogPage />);
    let headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]).toHaveTextContent("v2.0.0");

    unmount();

    mockGetEntries.mockReturnValue(entries2);
    render(<ChangelogPage />);
    headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings[0]).toHaveTextContent("v2.0.0");
  });

  it("handles entries with the same date", () => {
    mockGetEntries.mockReturnValue([
      { version: "v1.0.0", date: "2026-01-01", notes: ["A"] },
      { version: "v1.0.1", date: "2026-01-01", notes: ["B"] },
    ]);

    render(<ChangelogPage />);

    // Should render both entries without errors
    expect(screen.getByRole("heading", { name: /v1.0.0/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /v1.0.1/i })).toBeInTheDocument();
  });

  it("renders correct semantic structure with main and lists", () => {
    mockGetEntries.mockReturnValue([
      {
        version: "v1.0.0",
        date: "2026-01-01",
        notes: ["Note 1", "Note 2"],
      },
    ]);

    render(<ChangelogPage />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabIndex", "-1");

    const lists = screen.getAllByRole("list");
    expect(lists).toHaveLength(2); // One ordered list for entries, one unordered for notes
  });

  it("validates entry shape with version, date, and notes", () => {
    const validEntry: ChangelogEntry = {
      version: "v1.0.0",
      date: "2026-01-01",
      notes: ["Test"],
    };
    mockGetEntries.mockReturnValue([validEntry]);

    render(<ChangelogPage />);

    expect(screen.getByRole("heading", { name: /v1.0.0/i })).toBeInTheDocument();
    expect(screen.getByText(/2026-01-01/i)).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
  });
});

