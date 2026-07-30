"use client";

import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";
import { PageShell } from "@/components/PageShell";
import { TextField } from "@/components/TextField";
import { apiGet, apiPost } from "@/lib/apiClient";
import { mapApiError } from "@/lib/mapApiError";
import type { FormEvent } from "react";
import { useCallback, useMemo, useState } from "react";
import { parsePositiveInt } from "@/lib/validateNumber";
import { validateIdentifier } from "@/lib/validateId";
import { useUsageAnnouncement } from "./useUsageAnnouncement";
import {
  PresetKey,
  PRESET_RANGES,
  toISODate,
  buildDateRangeAnnouncement,
} from "./dateRange";
import { UsageDateRangeFilters } from "./UsageDateRangeFilters";
import {
  type UsageRow,
  UsageQueryRows,
  deriveUsageRows,
} from "./UsageQueryRows";

type QueryResult = UsageRow;

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

  // Derived range description: recomputed only when the range itself changes.
  const dateRangeAnnouncement = useMemo(
    () => buildDateRangeAnnouncement(activePreset, startDate, endDate),
    [activePreset, startDate, endDate],
  );

  const queryAnnouncement = useUsageAnnouncement(queryResult);

  const queryRows = useMemo(
    () => deriveUsageRows(queryResult.kind === "ok" ? queryResult.result : null),
    [queryResult],
  );

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

  const onStartDateChange = useCallback((value: string) => {
    setStartDate(value);
  }, []);

  const onEndDateChange = useCallback((value: string) => {
    setEndDate(value);
  }, []);

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
      const { message, requestId } = mapApiError(error);
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
      const { message, requestId } = mapApiError(error);
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

      {/*
       * Debounced usage announcements for assistive tech. The region is mounted
       * empty (so screen readers register it before the first change) and only
       * subsequent meaningful total/empty changes are announced. Deliberately
       * not role="status": the query result and date-range hint already own that
       * role, and a third one would make the page's status ambiguous.
       */}
      <span
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        data-testid="usage-announcer"
      >
        {queryAnnouncement}
      </span>

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
        <UsageDateRangeFilters
          activePreset={activePreset}
          startDate={startDate}
          endDate={endDate}
          announcement={dateRangeAnnouncement}
          onPresetChange={applyPreset}
          onStartDateChange={onStartDateChange}
          onEndDateChange={onEndDateChange}
        />
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
        <UsageQueryRows rows={queryRows} />
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
