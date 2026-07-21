"use client";

import { CopyButton } from "./CopyButton";

export function CurlBlock({ command }: { command: string }) {
  return (
    <div className="relative mt-2">
      <pre className="overflow-x-auto rounded border border-zinc-300 bg-zinc-50 p-3 text-xs dark:border-zinc-700 dark:bg-zinc-900">
        <code>{command}</code>
      </pre>
      <div className="absolute right-2 top-2">
        <CopyButton value={command} label="Copy curl" />
      </div>
    </div>
  );
}
