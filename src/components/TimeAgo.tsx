"use client";

import { useEffect, useState } from "react";

const UNITS: { ms: number; label: string }[] = [
  { ms: 86_400_000, label: "d" },
  { ms: 3_600_000, label: "h" },
  { ms: 60_000, label: "m" },
  { ms: 1_000, label: "s" },
];

function format(deltaMs: number): string {
  if (deltaMs < 0) return "just now";
  for (const u of UNITS) {
    if (deltaMs >= u.ms) return `${Math.floor(deltaMs / u.ms)}${u.label} ago`;
  }
  return "just now";
}

/**
 * Renders a `<time>` element with a relative human-readable date string
 * (e.g. "just now", "3h ago"). A 30-second interval tick keeps the displayed
 * text fresh; the interval is cleaned up on unmount.
 */
export function TimeAgo({ ts, title }: { ts: number; title?: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  const iso = new Date(ts).toISOString();
  return (
    <time dateTime={iso} title={title ?? iso}>
      {format(now - ts)}
    </time>
  );
}
