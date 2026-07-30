"use client";

import { memo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

export type Report = {
  id: string;
  title: string;
  generatedAt: string;
};

type ReportsResponse = { reports?: Report[] };

function ReportRowInner({ report }: { report: Report }) {
  return (
    <li className="flex items-center justify-between py-3 text-sm">
      <span>{report.title}</span>
      <span className="text-zinc-500 dark:text-zinc-400">{report.generatedAt}</span>
    </li>
  );
}

/**
 * Memoized so re-renders of the surrounding list don't re-render every
 * report row.
 */
export const ReportRow = memo(ReportRowInner);

export default function ReportsPage() {
  const state = useApi<ReportsResponse>("/api/v1/reports");
  const reports = state.status === "ok" ? (state.data.reports ?? []) : null;

  const announcement =
    state.status === "loading"
      ? "Loading reports."
      : state.status === "error"
        ? `Failed to load reports: ${state.error}`
        : reports && reports.length === 0
          ? "No reports to show."
          : reports
            ? `Loaded ${reports.length} report${reports.length === 1 ? "" : "s"}.`
            : "";

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
      {/* Announces loading/error/empty/loaded transitions to screen readers
          without duplicating the visible content below. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {state.status === "loading" && (
        <div className="flex justify-center py-10">
          <Spinner label="Loading reports" />
        </div>
      )}
      {state.status === "error" && (
        <ErrorMessage
          title="Failed to load reports"
          detail={state.error}
          onRetry={state.retry}
        />
      )}
      {reports && reports.length === 0 && (
        <EmptyState
          title="No reports yet."
          description="Generated reports will appear here."
        />
      )}
      {reports && reports.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {reports.map((r) => (
            <ReportRow key={r.id} report={r} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
