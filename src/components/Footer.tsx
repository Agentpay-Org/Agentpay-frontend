import Link from "next/link";
import { API_DOCS_URL, CONTRACT_EXPLORER_URL, GITHUB_ORG_URL } from "@/lib/deployment";

/**
 * Site-wide footer component.
 * Renders the primary tagline, a dynamic copyright year, and a semantic <nav> 
 * linking to secondary internal routes (About, Docs, Changelog, Stats) and the external Discord community.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
      <div className="mx-auto space-y-4 px-4">
        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-6">
          <Link href="/about" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            About
          </Link>
          <Link href="/docs" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            Docs
          </Link>
          <Link href="/changelog" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            Changelog
          </Link>
          <Link href="/stats" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            Stats
          </Link>
          <a href={API_DOCS_URL} target="_blank" rel="noopener noreferrer" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            API reference
          </a>
          <a href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            Contract
          </a>
          <a href={GITHUB_ORG_URL} target="_blank" rel="noopener noreferrer" className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded">
            GitHub
          </a>
          <a
            href="https://discord.gg/eXvRKkgcv"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline focus:outline-none focus:ring-2 focus:ring-zinc-500 rounded"
          >
            Discord
          </a>
        </nav>
        <p>
          AgentPay — machine-to-machine payments on Stellar. Pay per request.
        </p>
        <p>
          &copy; {currentYear} AgentPay.
        </p>
      </div>
    </footer>
  );
}

