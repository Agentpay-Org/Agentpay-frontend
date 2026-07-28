"use client";

import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CurlBlock } from "@/components/CurlBlock";
import { EmptyState } from "@/components/EmptyState";
import { useDebounce } from "@/lib/useDebounce";
import { type ApiSection } from "./endpoints";

export function DocsFilter({ sections }: { sections: ApiSection[] }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Memoized so typing before the debounce settles (which re-renders this
  // component on every keystroke via `query`) doesn't re-filter `sections`
  // until the value actually driving the filter — `debouncedQuery` — changes.
  const filteredSections = useMemo(
    () =>
      sections.filter(
        (s) =>
          s.h.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
          s.p.toLowerCase().includes(debouncedQuery.toLowerCase())
      ),
    [sections, debouncedQuery]
  );

  const announcement = useMemo(() => {
    if (sections.length === 0 || !debouncedQuery) return "";
    const count = filteredSections.length;
    return count === 0
      ? `No matches for "${debouncedQuery}"`
      : `${count} result${count === 1 ? "" : "s"} for "${debouncedQuery}"`;
  }, [sections.length, debouncedQuery, filteredSections.length]);

  // Distinct from "no results for this search": no endpoints were passed in
  // at all, which is a content/configuration gap rather than something a
  // different search term can fix, so searching isn't offered as a way out.
  if (sections.length === 0) {
    return (
      <EmptyState
        title="No endpoints documented yet"
        description="Check back soon, or see the API reference linked above."
      />
    );
  }

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <SearchBar
        value={query}
        onChange={setQuery}
        label="Filter endpoints"
        placeholder="Filter by path or description..."
        clearable
      />
      {filteredSections.length > 0 ? (
        <dl className="space-y-4">
          {filteredSections.map((s) => (
            <div key={s.h}>
              <dt className="font-mono text-sm font-medium">{s.h}</dt>
              <dd className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">{s.p}</dd>
              <CurlBlock command={s.curl} />
            </div>
          ))}
        </dl>
      ) : (
        <EmptyState title="No matching endpoints" description="Try a different search term." />
      )}
    </>
  );
}
