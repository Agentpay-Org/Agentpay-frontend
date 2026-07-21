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
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Close on route change.
    setMenuOpen(false);
  }, [pathname, setMenuOpen]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen, setMenuOpen]);

  useEffect(() => {
    if (menuOpen) {
      const first = panelRef.current!.querySelector<HTMLElement>(
        "a[role='menuitem'], a, [role='menuitem']"
      );
      if (first) {
        first.focus();
      }
      return;
    }
    toggleRef.current!.focus();
  }, [menuOpen]);

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
          ref={panelRef}
          role="region"
          aria-label="Mobile navigation"
          className="mt-2 rounded-md border border-zinc-200 bg-white shadow-md dark:border-zinc-700 dark:bg-zinc-900"
        >
          <ul className="p-1" role="menu">
            {primary.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href} role="none">
                  <Link
                    href={l.href}
                    role="menuitem"
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

            <li className="px-4 pb-1 pt-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              More
            </li>

            {secondary.map((l) => {
              const active = isActive(pathname, l.href);
              return (
                <li key={l.href} role="none">
                  <Link
                    href={l.href}
                    role="menuitem"
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

  // Close desktop dropdown on route change.
  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect
    setMoreOpen(false);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
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

          {/* More menu — secondary links (desktop) */}
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

