import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

describe("Footer", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-06-24T00:00:00Z"));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it("renders the footer landmark and tagline", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
    
    expect(screen.getByText(/machine-to-machine payments/i)).toBeInTheDocument();
  });

  it("renders the navigation landmark with internal links", () => {
    render(<Footer />);
    
    const nav = screen.getByRole("navigation", { name: "Footer" });
    expect(nav).toBeInTheDocument();

    const expectedLinks = [
      { name: "About", href: "/about" },
      { name: "Docs", href: "/docs" },
      { name: "Changelog", href: "/changelog" },
      { name: "Stats", href: "/stats" },
    ];

    for (const link of expectedLinks) {
      const el = screen.getByRole("link", { name: link.name });
      expect(el).toBeInTheDocument();
      expect(el).toHaveAttribute("href", link.href);
      expect(el).not.toHaveAttribute("target");
      expect(el).not.toHaveAttribute("rel");
    }
  });

  it("validates each internal link target resolves to an existing route under src/app", () => {
    render(<Footer />);
    const validRoutes = new Set(["/about", "/docs", "/changelog", "/stats"]);

    const internalLinks = screen.getAllByRole("link").filter((link) => {
      const href = link.getAttribute("href");
      return href?.startsWith("/") && !href.startsWith("http");
    });

    expect(internalLinks.length).toBeGreaterThan(0);
    for (const link of internalLinks) {
      expect(validRoutes).toContain(link.getAttribute("href"));
    }
  });

  it("renders the external Discord link safely", () => {
    render(<Footer />);
    const discordLink = screen.getByRole("link", { name: "Discord" });
    
    expect(discordLink).toBeInTheDocument();
    expect(discordLink).toHaveAttribute("href", "https://discord.gg/eXvRKkgcv");
    
    // Safe external links require target="_blank" and rel="noopener noreferrer"
    expect(discordLink).toHaveAttribute("target", "_blank");
    expect(discordLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the dynamic copyright year", () => {
    render(<Footer />);
    expect(screen.getByText(/© 2026 AgentPay/i)).toBeInTheDocument();
  });
});
