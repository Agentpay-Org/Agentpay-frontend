import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Header } from "../Header";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

import { usePathname } from "next/navigation";
const mockPathname = usePathname as jest.Mock;

function getMobileToggle() {
  return screen.getByRole("button", { name: /menu/i });
}

describe("Header", () => {
  beforeEach(() => mockPathname.mockReturnValue("/"));

  it("renders a named navigation landmark", () => {
    render(<Header />);
    expect(
      screen.getByRole("navigation", { name: /main navigation/i }),
    ).toBeInTheDocument();
  });

  it("renders all primary links", () => {
    render(<Header />);
    for (const label of ["Home", "Services", "Agents", "Usage", "Search"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active primary route with aria-current", () => {
    mockPathname.mockReturnValue("/services");
    render(<Header />);
    expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks a deep child route on the parent primary link", () => {
    mockPathname.mockReturnValue("/services/abc/edit");
    render(<Header />);
    expect(screen.getByRole("link", { name: "Services" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks exactly one link as active for the root route", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);

    // Exactly one link has aria-current="page". The mobile menu panel is only
    // rendered while open, so at rest only the desktop "Home" link is active.
    const activeLinks = screen
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "page");
    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0]).toHaveTextContent("Home");
  });

  it("marks zero links as active for an unknown route", () => {
    mockPathname.mockReturnValue("/unknown-route-123");
    render(<Header />);

    const activeLinks = Array.from(
      document.querySelectorAll('[aria-current="page"]'),
    );
    expect(activeLinks.length).toBe(0);
  });

  it("validates exactly one primary/secondary logical link is marked current per route", () => {
    mockPathname.mockReturnValue("/services");
    render(<Header />);

    // Open the secondary menu to expose secondary links
    fireEvent.click(screen.getByRole("button", { name: /more/i }));

    // With the mobile panel closed, the only current link is the desktop
    // "Services" primary link; the opened "More" menu holds secondary links,
    // none of which match /services.
    const activeLinks = screen
      .getAllByRole("link", { hidden: true })
      .filter((link) => link.getAttribute("aria-current") === "page");

    expect(activeLinks.length).toBe(1);
    expect(activeLinks[0]).toHaveTextContent("Services");
  });

  it("shows More button that opens secondary menu", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    const moreBtn = screen.getByRole("button", { name: /more/i });
    expect(moreBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(moreBtn);
    expect(moreBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("renders all secondary links inside the menu", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    for (const label of [
      "API Keys",
      "Webhooks",
      "Events",
      "Stats",
      "Settings",
      "Docs",
      "Admin",
    ]) {
      expect(screen.getByRole("menuitem", { name: label })).toBeInTheDocument();
    }
  });

  it("marks the active secondary route with aria-current", () => {
    mockPathname.mockReturnValue("/api-keys");
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByRole("menuitem", { name: "API Keys" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("closes the menu when a secondary link is clicked", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /more/i }));
    const webhooksLink = screen.getByRole("menuitem", { name: "Webhooks" });
    webhooksLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(webhooksLink);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu when focus leaves the secondary menu", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: /more/i }));

    fireEvent.blur(screen.getByRole("menu"), {
      relatedTarget: document.body,
    });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("mobile menu toggle has aria-expanded and aria-controls", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);

    const toggle = getMobileToggle();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls");
  });

  it("mobile menu opens and closes on toggle", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = getMobileToggle();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: /mobile navigation/i }),
    ).toBeInTheDocument();

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: /mobile navigation/i }),
    ).not.toBeInTheDocument();
  });

  it("mobile menu closes on Escape and returns focus to toggle", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = getMobileToggle();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.activeElement).toBe(toggle);
  });

  it("mobile menu auto-closes on route change", () => {
    mockPathname.mockReturnValue("/");
    const { rerender } = render(<Header />);

    const toggle = getMobileToggle();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    mockPathname.mockReturnValue("/services");
    rerender(<Header />);

    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("region", { name: /mobile navigation/i }),
    ).not.toBeInTheDocument();
  });

  it("preserves focus-visible ring classes on links", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink.className).toContain("focus-visible:outline");
  });

  it("keeps mobile links in the natural Tab order", async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = getMobileToggle();
    toggle.focus();
    await user.keyboard("{Enter}");

    const region = screen.getByRole("region", { name: /mobile navigation/i });
    const links = within(region).getAllByRole("link");
    expect(links).toHaveLength(12);

    await user.tab();
    expect(links[0]).toHaveFocus();
  });

  it("mobile menu closes when clicking a primary link", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);

    const toggle = getMobileToggle();
    fireEvent.click(toggle);

    // Click a mobile menu link
    const region = screen.getByRole("region", { name: /mobile navigation/i });
    const homeLink = within(region).getByRole("link", { name: "Home" });
    homeLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(homeLink);

    // Menu should close
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("marks and closes an active mobile secondary link", () => {
    mockPathname.mockReturnValue("/api-keys");
    render(<Header />);

    const toggle = getMobileToggle();
    fireEvent.click(toggle);
    const region = screen.getByRole("region", { name: /mobile navigation/i });
    const apiKeysLink = within(region).getByRole("link", { name: "API Keys" });
    expect(apiKeysLink).toHaveAttribute("aria-current", "page");
    apiKeysLink.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });

    fireEvent.click(apiKeysLink);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("desktop More menu does not close when focusing within the menu", () => {
    mockPathname.mockReturnValue("/");
    render(<Header />);

    // Open desktop More menu
    const moreBtn = screen.getByRole("button", { name: /more/i });
    fireEvent.click(moreBtn);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    // Get menu element
    const menu = screen.getByRole("menu");
    const firstMenuItem = screen.getByRole("menuitem", { name: "API Keys" });

    // Blur with relatedTarget still inside the menu
    fireEvent.blur(menu, {
      relatedTarget: firstMenuItem,
    });

    // Menu should stay open
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("keeps the wide-viewport navigation inline and the toggle mobile-only", () => {
    render(<Header />);

    const desktopLinks = screen
      .getByRole("link", { name: "Home" })
      .closest("ul");
    expect(desktopLinks).toHaveClass("hidden", "md:flex");
    expect(getMobileToggle().parentElement).toHaveClass("md:hidden");
  });

  // --------------------------------------------------------------------
  // Route-change announcements
  //
  // A Next.js App Router navigation swaps content without a full document
  // reload, so nothing tells a screen reader user a new page loaded unless
  // the app says so explicitly. These tests cover the visually-hidden
  // live region that announces each client-side transition.
  // --------------------------------------------------------------------
  describe("route change announcements", () => {
    it("renders a polite status live region", () => {
      render(<Header />);
      const region = screen.getByRole("status", { hidden: true });
      expect(region).toHaveAttribute("aria-live", "polite");
      expect(region).toHaveClass("sr-only");
    });

    it("does not announce anything on initial mount", () => {
      mockPathname.mockReturnValue("/");
      render(<Header />);
      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "",
      );
    });

    it("announces the destination's primary-link label on a client-side route change", () => {
      mockPathname.mockReturnValue("/");
      const { rerender } = render(<Header />);

      mockPathname.mockReturnValue("/services");
      rerender(<Header />);

      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "Navigated to Services",
      );
    });

    it("announces the destination's secondary-link label on a client-side route change", () => {
      mockPathname.mockReturnValue("/");
      const { rerender } = render(<Header />);

      mockPathname.mockReturnValue("/webhooks");
      rerender(<Header />);

      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "Navigated to Webhooks",
      );
    });

    it("announces the parent link's label for a nested child route", () => {
      mockPathname.mockReturnValue("/");
      const { rerender } = render(<Header />);

      mockPathname.mockReturnValue("/services/abc-123/edit");
      rerender(<Header />);

      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "Navigated to Services",
      );
    });

    it("falls back to the raw pathname for a route with no matching nav entry", () => {
      mockPathname.mockReturnValue("/");
      const { rerender } = render(<Header />);

      mockPathname.mockReturnValue("/this-route-is-unknown");
      rerender(<Header />);

      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "Navigated to /this-route-is-unknown",
      );
    });

    it("announces every transition in a multi-step navigation, not just the first", () => {
      mockPathname.mockReturnValue("/");
      const { rerender } = render(<Header />);

      mockPathname.mockReturnValue("/agents");
      rerender(<Header />);
      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "Navigated to Agents",
      );

      mockPathname.mockReturnValue("/usage");
      rerender(<Header />);
      expect(screen.getByRole("status", { hidden: true })).toHaveTextContent(
        "Navigated to Usage",
      );
    });
  });
});
