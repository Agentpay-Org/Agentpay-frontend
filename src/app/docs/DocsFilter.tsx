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

  const filteredSections = sections.filter(
    (s) =>
      s.h.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      s.p.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const announcement = useMemo(() => {
    if (!debouncedQuery) return "";
    const count = filteredSections.length;
    return count === 0
      ? `No matches for "${debouncedQuery}"`
      : `${count} result${count === 1 ? "" : "s"} for "${debouncedQuery}"`;
  }, [debouncedQuery, filteredSections.length]);

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
