import { resolveApiBase } from "@/lib/resolveApiBase";
import { PageShell } from "@/components/PageShell";

const API_BASE = resolveApiBase();

export const metadata = { title: "Export" };

export default function ExportPage() {
  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Export usage</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Download a snapshot of the current (agent, serviceId, total) tuples.
        Calls the backend export endpoints directly; the browser downloads the
        file via Content-Disposition.
      </p>
      <div className="flex flex-wrap gap-3">
        <a
          href={`${API_BASE}/api/v1/usage/export.json`}
          className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          Download JSON
        </a>
        <a
          href={`${API_BASE}/api/v1/usage/export.csv`}
          className="rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
        >
          Download CSV
        </a>
      </div>
    </PageShell>
  );
}
