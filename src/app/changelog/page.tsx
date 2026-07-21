import { EmptyState } from "@/components/EmptyState";
import { getEntries, type ChangelogEntry } from "./entries";

export const metadata = {
  title: "Changelog — AgentPay",
};

export default function ChangelogPage() {
  const allEntries = getEntries();
  
  // Sort by date descending (newest first) to prevent ordering drift
  const entries = [...allEntries].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateB - dateA;
  });

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Changelog</h1>
      {entries.length === 0 ? (
        <EmptyState
          title="No changelog entries yet"
          description="Release notes will appear here once updates are published."
        />
      ) : (
        <ol className="flex flex-col gap-6">
          {entries.map((e: ChangelogEntry) => (
            <li key={e.version} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-semibold">
                {e.version} <span className="text-sm text-zinc-500">— {e.date}</span>
              </h2>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
                {e.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  );
}
