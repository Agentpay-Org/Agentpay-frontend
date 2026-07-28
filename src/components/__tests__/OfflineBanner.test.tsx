import { act, fireEvent, render, screen } from "@testing-library/react";
import { OfflineBanner } from "../OfflineBanner";

function setOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("OfflineBanner", () => {
  beforeEach(() => setOnline(true));

  it("renders nothing while online", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders the alert banner when offline", () => {
    setOnline(false);
    render(<OfflineBanner />);

    const banner = screen.getByRole("alert");
    expect(banner).toHaveTextContent(
      "You are offline. Some features may be unavailable.",
    );
  });

  it("reacts to the offline event while mounted", () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("reacts to the online event while mounted", () => {
    setOnline(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("has an accessible dismiss button that removes the banner", () => {
    setOnline(false);
    render(<OfflineBanner />);

    const dismiss = screen.getByRole("button", {
      name: "Dismiss offline notification",
    });
    fireEvent.click(dismiss);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays dismissed even if connectivity flips back to offline again", () => {
    // Documents the component's actual current behavior: `dismissed` has
    // no reset path tied to the online/offline transition, only unmount —
    // so once dismissed, the banner does not reappear for a later drop
    // while the component stays mounted.
    setOnline(false);
    render(<OfflineBanner />);
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss offline notification" }),
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    act(() => {
      setOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    act(() => {
      setOnline(false);
      window.dispatchEvent(new Event("offline"));
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders a decorative icon hidden from assistive tech", () => {
    setOnline(false);
    render(<OfflineBanner />);

    const banner = screen.getByRole("alert");
    const svg = banner.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });
});
