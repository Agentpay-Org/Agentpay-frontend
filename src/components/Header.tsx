"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/agents", label: "Agents" },
  { href: "/usage", label: "Usage" },
  { href: "/search", label: "Search" },
];

const secondaryLinks = [
  { href: "/api-keys", label: "API Keys" },
  { href: "/webhooks", label: "Webhooks" },
  { href: "/events", label: "Events" },
  { href: "/stats", label: "Stats" },
  { href: "/settings", label: "Settings" },
  { href: "/docs", label: "Docs" },
  { href: "/admin", label: "Admin" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

const allLinks = [...primaryLinks, ...secondaryLinks];

/**
 * Resolve a human-readable label for `pathname`, mirroring {@link isActive}'s
 * matching rules: an exact `href` match wins outright; otherwise the
 * longest (most specific) prefix match wins, so a nested route like
 * `/services/abc/edit` resolves to "Services" rather than any shorter
 * ancestor. Returns `null` for a route that matches nothing in the nav —
 * callers fall back to the raw pathname in that case.
 */
function findLinkLabel(pathname: string): string | null {
  const exact = allLinks.find((l) => l.href === pathname);
  if (exact) return exact.label;

  const prefixMatches = allLinks.filter(
    (l) => l.href !== "/" && pathname.startsWith(l.href + "/"),
  );
  if (prefixMatches.length === 0) return null;
  return prefixMatches.reduce((longest, l) =>
    l.href.length > longest.href.length ? l : longest,
  ).label;
}

const linkClass =
  "rounded px-2 py-1 text-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800";
const activeLinkClass = "font-semibold text-blue-600 dark:text-blue-400";

function MobileNav({
  pathname,
  primary,
  secondary,
  menuOpen,
  setMenuOpen,
}: {
  pathname: string;
  primary: typeof primaryLinks;
  secondary: typeof secondaryLinks;
  menuOpen: boolean;
  setMenuOpen: (next: boolean | ((prev: boolean) => boolean)) => void;
}) {
  const toggleId = useId();
  const panelId = `${toggleId}-panel`;
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
        toggleRef.current!.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, setMenuOpen]);

  return (
    <div className="md:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-expanded={menuOpen}
        aria-controls={panelId}
        onClick={() => setMenuOpen((o) => !o)}
        className={`${linkClass} flex items-center gap-2`}
      >
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M3 5h14v2H3V5zm0 6h14v2H3v-2zm0 6h14v2H3v-2z" />
        </svg>
        Menu
      </button>

      {menuOpen && (
        <div
          id={panelId}
          role="region"
          aria-label="Mobile navigation"
          className="mt-2 rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900"
        >
          <ul className="p-1">
            {primary.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`block w-full px-4 py-2 text-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800 ${
                      active ? activeLinkClass : ""
                    }`}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}

            {secondary.length > 0 && (
              <>
                <li className="px-4 pb-1 pt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  More
                </li>

                {secondary.map((l) => {
                  const active = isActive(pathname, l.href);
                  return (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setMenuOpen(false)}
                        className={`block w-full px-4 py-2 text-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800 ${
                          active ? activeLinkClass : ""
                        }`}
                      >
                        {l.label}
                      </Link>
                    </li>
                  );
                })}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [routeAnnouncement, setRouteAnnouncement] = useState("");
  const isFirstRender = useRef(true);

  // Close desktop dropdown on route change.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMoreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  // Announce client-side route changes to assistive tech. A Next.js App
  // Router navigation swaps page content without a full document reload,
  // so — unlike a traditional multi-page site — nothing tells a screen
  // reader user a new page loaded unless something explicitly says so.
  // Skips the very first render (the initial page load) since the browser
  // already handles that announcement via the document title; only
  // *subsequent* client-side transitions need this.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const label = findLinkLabel(pathname);
    setRouteAnnouncement(`Navigated to ${label ?? pathname}`);
  }, [pathname]);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div role="status" aria-live="polite" className="sr-only">
        {routeAnnouncement}
      </div>
      <nav
        aria-label="Main navigation"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 p-4"
      >
        <Link
          href="/"
          className="text-lg font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          AgentPay
        </Link>

        {/* Desktop links — always visible on md+ */}
        <ul className="hidden flex-wrap gap-1 text-sm md:flex">
          {primaryLinks.map((l) => {
            const active = isActive(pathname, l.href);
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  className={`${linkClass} ${active ? activeLinkClass : ""}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}

          {/* More menu — secondary links (desktop). Omitted entirely when
              there are no secondary links: a disclosure button that opens
              onto an empty menu is a dead-end for keyboard and screen
              reader users, so there is nothing better to show than not
              rendering the affordance at all. */}
          {secondaryLinks.length > 0 && (
            <li className="relative">
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((o) => !o)}
                className={`${linkClass} flex items-center gap-1`}
              >
                More
                <svg
                  aria-hidden
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="currentColor"
                >
                  <path d="M6 8L1 3h10z" />
                </svg>
              </button>
              {moreOpen && (
                <ul
                  role="menu"
                  className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-md border border-zinc-200 bg-white py-1 shadow-md dark:border-zinc-700 dark:bg-zinc-900"
                  onBlur={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setMoreOpen(false);
                    }
                  }}
                >
                  {secondaryLinks.map((l) => {
                    const active = isActive(pathname, l.href);
                    return (
                      <li key={l.href} role="none">
                        <Link
                          href={l.href}
                          role="menuitem"
                          aria-current={active ? "page" : undefined}
                          onClick={() => setMoreOpen(false)}
                          className={`block px-4 py-2 text-sm hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:hover:bg-zinc-800 ${
                            active ? activeLinkClass : ""
                          }`}
                        >
                          {l.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          )}
        </ul>

        {/* Mobile disclosure menu — toggle below md */}
        <MobileNav
          pathname={pathname}
          primary={primaryLinks}
          secondary={secondaryLinks}
          menuOpen={mobileOpen}
          setMenuOpen={setMobileOpen}
        />
      </nav>
    </header>
  );
}
