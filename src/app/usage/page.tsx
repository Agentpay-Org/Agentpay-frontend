"use client";

import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";
import { PageShell } from "@/components/PageShell";
import { TextField } from "@/components/TextField";
import type { ApiError } from "@/lib/apiClient";
import { apiGet, apiPost } from "@/lib/apiClient";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { parsePositiveInt } from "@/lib/validateNumber";
import { validateIdentifier } from "@/lib/validateId";

type PresetKey = "24h" | "7d" | "30d" | "custom";

function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function hoursAgo(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() - hours);
  return d;
}

const PRESET_RANGES: Record<Exclude<PresetKey, "custom">, { start: () => Date; end: () => Date; label: string }> = {
  "24h": { start: () => hoursAgo(24), end: () => new Date(), label: "Last 24 hours" },
  "7d": { start: () => daysAgo(7), end: () => new Date(), label: "Last 7 days" },
  "30d": { start: () => daysAgo(30), end: () => new Date(), label: "Last 30 days" },
};

type QueryResult = {
  agent: string;
  serviceId: string;
  total: number;
};

type UsageStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; total?: number }
  | { kind: "error"; message: string; requestId?: string };

type QueryStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; result: QueryResult | null }
  | { kind: "error"; message: string; requestId?: string };

function describeError(error: unknown): {
  message: string;
  requestId?: string;
} {
  const apiError = error as Partial<ApiError> | null | undefined;
  return {
    message:
      typeof apiError?.message === "string" && apiError.message.length > 0
        ? apiError.message
        : error instanceof Error
          ? error.message
          : "request failed",
    requestId:
      typeof apiError?.requestId === "string" && apiError.requestId.length > 0
        ? apiError.requestId
        : undefined,
  };
}

export default function UsagePage() {
  const [agent, setAgent] = useState("");
  const [agentError, setAgentError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [serviceIdError, setServiceIdError] = useState<string | null>(null);
  const [requests, setRequests] = useState("");
  const [requestsError, setRequestsError] = useState<string | null>(null);
  const [status, setStatus] = useState<UsageStatus>({ kind: "idle" });
  const [queryAgent, setQueryAgent] = useState("");
  const [queryAgentError, setQueryAgentError] = useState<string | null>(null);
  const [queryService, setQueryService] = useState("");
  const [queryServiceError, setQueryServiceError] = useState<string | null>(
    null,
  );
  const [queryResult, setQueryResult] = useState<QueryStatus>({ kind: "idle" });
  const [activePreset, setActivePreset] = useState<PresetKey>("custom");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const isRecording = status.kind === "loading";
  const isQuerying = queryResult.kind === "loading";

  const dateRangeAnnouncement = useMemo(() => {
    if (activePreset === "custom") {
      if (!startDate && !endDate) return "Showing all usage data (no date filter).";
      if (startDate && endDate) return `Showing usage from ${startDate} to ${endDate}.`;
      if (startDate) return `Showing usage from ${startDate} onwards.`;
      return `Showing usage up to ${endDate}.`;
    }
    return `Showing ${PRESET_RANGES[activePreset].label}.`;
  }, [activePreset, startDate, endDate]);

  const applyPreset = (key: PresetKey) => {
    setActivePreset(key);
    if (key === "custom") {
      setStartDate("");
      setEndDate("");
    } else {
      const range = PRESET_RANGES[key];
      setStartDate(toISODate(range.start()));
      setEndDate(toISODate(range.end()));
    }
  };

  const onRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRecording) return;
    setAgentError(null);
    setServiceIdError(null);
    setRequestsError(null);
    const parsedAgent = validateIdentifier(agent, "Agent");
    const parsedServiceId = validateIdentifier(serviceId, "Service ID");
    if (!parsedAgent.ok || !parsedServiceId.ok) {
      if (!parsedAgent.ok) setAgentError(parsedAgent.message);
      if (!parsedServiceId.ok) setServiceIdError(parsedServiceId.message);
      return;
    }
    const parsed = parsePositiveInt(requests);
    if (!parsed.ok) {
      // Surface the validation message through the field error.
      setRequestsError(parsed.message);
      return;
    }

    setStatus({ kind: "loading" });
    try {
      const body = await apiPost<{ total: number }>("/api/v1/usage", {
        agent: parsedAgent.value,
        serviceId: parsedServiceId.value,
        requests: parsed.value,
      });
      setStatus({ kind: "ok", total: body?.total });
    } catch (error) {
      const { message, requestId } = describeError(error);
      setStatus({ kind: "error", message, requestId });
    }
  };

  const onQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isQuerying) return;
    setQueryAgentError(null);
    setQueryServiceError(null);
    const parsedAgent = validateIdentifier(queryAgent, "Agent");
    const parsedServiceId = validateIdentifier(queryService, "Service ID");
    if (!parsedAgent.ok || !parsedServiceId.ok) {
      if (!parsedAgent.ok) setQueryAgentError(parsedAgent.message);
      if (!parsedServiceId.ok) setQueryServiceError(parsedServiceId.message);
      return;
    }
    setQueryResult({ kind: "loading" });

    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const qs = params.toString();
      const result = await apiGet<QueryResult>(
        `/api/v1/usage/${encodeURIComponent(parsedAgent.value)}/${encodeURIComponent(
          parsedServiceId.value,
        )}${qs ? `?${qs}` : ""}`,
      );
      setQueryResult({ kind: "ok", result: result ?? null });
    } catch (error) {
      const { message, requestId } = describeError(error);
      setQueryResult({ kind: "error", message, requestId });
    }
  };

  return (
    <PageShell maxWidth="2xl" gap="12" className="min-h-screen">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Usage metering
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Record per-request usage for an agent and query the running total.
        </p>
      </header>

      <section aria-labelledby="record-heading" className="flex flex-col gap-4">
        <h2 id="record-heading" className="text-xl font-medium">
          Record usage
        </h2>
        <form onSubmit={onRecord} className="flex flex-col gap-3">
          <TextField
            label="Agent"
            required
            name="agent"
            value={agent}
            onChange={(e) => {
              setAgent(e.target.value);
              setAgentError(null);
            }}
            error={agentError ?? undefined}
          />
          <TextField
            label="Service ID"
            required
            name="serviceId"
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setServiceIdError(null);
            }}
            error={serviceIdError ?? undefined}
          />
          <TextField
            label="Requests"
            inputMode="numeric"
            required
            value={requests}
            onChange={(e) => {
              setRequests(e.target.value);
              setRequestsError(null);
              if (status.kind === "error") {
                setStatus({ kind: "idle" });
              }
            }}
            error={requestsError ?? undefined}
          />

          <button
            type="submit"
            disabled={isRecording}
            className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isRecording ? <Spinner label="Recording…" /> : "Record"}
          </button>
        </form>
        {status.kind === "ok" && (
          <p
            role="status"
            className="text-sm text-emerald-700 dark:text-emerald-400"
          >
            {typeof status.total === "number"
              ? `Recorded. New total: ${status.total}.`
              : "Recorded."}
          </p>
        )}
        {status.kind === "error" && (
          <ErrorMessage
            title="Recording failed"
            detail={status.message}
            requestId={status.requestId}
          />
        )}
      </section>

      <section aria-labelledby="query-heading" className="flex flex-col gap-4">
        <h2 id="query-heading" className="text-xl font-medium">
          Query usage
        </h2>
        <div className="flex flex-col gap-3">
          <fieldset className="flex flex-col gap-2">
            <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Date range
            </legend>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Date range presets">
              {(Object.keys(PRESET_RANGES) as Array<Exclude<PresetKey, "custom">>).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={activePreset === key}
                  onClick={() => applyPreset(key)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  {PRESET_RANGES[key].label}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={activePreset === "custom"}
                onClick={() => applyPreset("custom")}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                Custom
              </button>
            </div>
            {activePreset === "custom" && (
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
              </div>
            )}
          </fieldset>
          <p role="status" aria-live="polite" className="text-xs text-zinc-500 dark:text-zinc-400">
            {dateRangeAnnouncement}
          </p>
        </div>
        <form onSubmit={onQuery} className="flex flex-col gap-3">
          <TextField
            label="Agent"
            required
            name="queryAgent"
            value={queryAgent}
            onChange={(e) => {
              setQueryAgent(e.target.value);
              setQueryAgentError(null);
            }}
            error={queryAgentError ?? undefined}
          />
          <TextField
            label="Service ID"
            required
            name="queryServiceId"
            value={queryService}
            onChange={(e) => {
              setQueryService(e.target.value);
              setQueryServiceError(null);
            }}
            error={queryServiceError ?? undefined}
          />
          <button
            type="submit"
            disabled={isQuerying}
            className="self-start rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:border-zinc-700"
          >
            {isQuerying ? <Spinner label="Querying…" /> : "Query"}
          </button>
        </form>
        {queryResult.kind === "ok" && queryResult.result && (
          <p role="status" className="text-sm">
            {queryResult.result.agent} / {queryResult.result.serviceId}:{" "}
            <strong>{queryResult.result.total}</strong> request(s).
          </p>
        )}
        {queryResult.kind === "error" && (
          <ErrorMessage
            title="Query failed"
            detail={queryResult.message}
            requestId={queryResult.requestId}
          />
        )}
      </section>
    </PageShell>
  );
}
