"use client";

import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/ToastProvider";
import { useState, useMemo } from "react";
import { mapApiError } from "@/lib/mapApiError";

type ExportFormat = "json" | "csv";

type Props = {
  apiBase: string;
};

const buttonBase =
  "rounded-full px-5 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500";

function filenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (!match) return fallback;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return fallback;
  }
}

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getFirstOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function getDaysAgo(days: number): Date {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return now;
}

function buildDateRangeFilename(
  format: ExportFormat,
  startDate: string,
  endDate: string,
): string {
  if (!startDate || !endDate) return `usage-export.${format}`;
  return `usage-export_${startDate}_to_${endDate}.${format}`;
}

export function ExportActions({ apiBase }: Props) {
  const [downloading, setDownloading] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const [startDate, setStartDate] = useState(() => toISODate(getFirstOfMonth()));
  const [endDate, setEndDate] = useState(() => toISODate(new Date()));

  const dateRangeError = useMemo(() => {
    if (!startDate || !endDate) return null;
    if (endDate < startDate) return "End date must not precede start date.";
    return null;
  }, [startDate, endDate]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = getDaysAgo(days);
    setStartDate(toISODate(start));
    setEndDate(toISODate(end));
  };

  const applyCurrentMonth = () => {
    setStartDate(toISODate(getFirstOfMonth()));
    setEndDate(toISODate(new Date()));
  };

  const startDownload = async (format: ExportFormat) => {
    setError(null);
    setDownloading(format);

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const url = `${apiBase}/api/v1/usage/export.${format}${qs ? `?${qs}` : ""}`;

      const response = await fetch(url);
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(body || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filenameFromDisposition(
        response.headers.get("content-disposition"),
        buildDateRangeFilename(format, startDate, endDate),
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
      toast.push(`${format.toUpperCase()} export downloaded.`, "info");
    } catch (err) {
      setError(mapApiError(err, "Export failed").message);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Date range
        </legend>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">Start</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              aria-label="Start date"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-zinc-500">End</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              aria-label="End date"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={applyCurrentMonth}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              This month
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Last 7 days
            </button>
            <button
              type="button"
              onClick={() => applyPreset(30)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Last 30 days
            </button>
          </div>
        </div>
        {dateRangeError && (
          <p role="alert" className="text-xs text-rose-600">
            {dateRangeError}
          </p>
        )}
      </fieldset>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={downloading !== null || dateRangeError !== null}
          aria-busy={downloading === "json" || undefined}
          onClick={() => startDownload("json")}
          className={`${buttonBase} bg-black text-white`}
        >
          {downloading === "json" ? "Downloading JSON..." : "Download JSON"}
        </button>
        <button
          type="button"
          disabled={downloading !== null || dateRangeError !== null}
          aria-busy={downloading === "csv" || undefined}
          onClick={() => startDownload("csv")}
          className={`${buttonBase} border border-zinc-300 dark:border-zinc-700`}
        >
          {downloading === "csv" ? "Downloading CSV..." : "Download CSV"}
        </button>
      </div>
      {downloading && (
        <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <Spinner label={`Preparing ${downloading.toUpperCase()} export`} />
          <span>Preparing {downloading.toUpperCase()} export...</span>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
