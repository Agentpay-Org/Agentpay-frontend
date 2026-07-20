"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { useDebounce } from "@/lib/useDebounce";
import { PageShell } from "@/components/PageShell";
import { SearchBar } from "@/components/SearchBar";

type Service = { serviceId: string; priceStroops: number };

export default function SearchPage() {
  const [q, setQ] = useState("");
  const debounced = useDebounce(q, 250);
  const [items, setItems] = useState<Service[] | null>(null);
  const visibleItems = debounced ? items : null;

  useEffect(() => {
    if (!debounced) return;
    let cancelled = false;
    apiGet<{ services: Service[] }>(
      `/api/v1/services?q=${encodeURIComponent(debounced)}&limit=50`
    )
      .then((b) => { if (!cancelled) setItems(b.services); })
      .catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [debounced]);

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Search</h1>
      <SearchBar value={q} onChange={setQ} placeholder="Search services…" />
      {visibleItems && visibleItems.length === 0 && (
        <p className="text-sm text-zinc-500">No matches.</p>
      )}
      {visibleItems && visibleItems.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {visibleItems.map((s) => (
            <li key={s.serviceId} className="py-3 font-mono text-sm">
              <a href={`/services/${encodeURIComponent(s.serviceId)}`} className="hover:underline">
                {s.serviceId}
              </a>{" "}
              <span className="text-zinc-500">— {s.priceStroops} stroops</span>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
