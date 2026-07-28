"use client";

import { useState } from "react";
import { useDebounce } from "@/lib/useDebounce";

type Props = {
  page: number;
  pageCount: number;
  onChange: (next: number) => void;
};

const ANNOUNCEMENT_DEBOUNCE_MS = 300;

export function Pagination({ page, pageCount, onChange }: Props) {
  // Debounce the announced page so rapid successive changes (e.g. fast
  // repeat clicks) collapse into a single announcement for the page the
  // user settles on, instead of queuing one per intermediate change.
  const debouncedPage = useDebounce(page, ANNOUNCEMENT_DEBOUNCE_MS);
  const [previousAnnouncedPage, setPreviousAnnouncedPage] = useState(debouncedPage);
  const [announcement, setAnnouncement] = useState("");

  // Keep the first committed live region empty, then update it in the same
  // commit as each later debounced page change.
  if (debouncedPage !== previousAnnouncedPage) {
    setPreviousAnnouncedPage(debouncedPage);
    setAnnouncement(pageCount > 1 ? `Page ${debouncedPage} of ${pageCount}` : "");
  }

  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2 text-sm">
      <button
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
      >
        Previous
      </button>
      <span>
        Page {page} of {pageCount}
      </span>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="rounded border border-zinc-300 px-3 py-1 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
      >
        Next
      </button>
    </nav>
  );
}
