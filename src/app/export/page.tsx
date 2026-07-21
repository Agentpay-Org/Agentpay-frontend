import { resolveApiBase } from "@/lib/resolveApiBase";
import { ExportActions } from "./ExportActions";

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
      <ExportActions apiBase={API_BASE} />
    </main>
  );
}
