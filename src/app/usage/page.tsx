"use client";

import { Spinner } from "@/components/Spinner";
import { PageShell } from "@/components/PageShell";
import { TextField } from "@/components/TextField";
import type { ApiError } from "@/lib/apiClient";
import { apiGet, apiPost } from "@/lib/apiClient";
import type { FormEvent } from "react";
import { useState } from "react";
import { parsePositiveInt } from "@/lib/validateNumber";
import { validateIdentifier } from "@/lib/validateId";`nimport { downloadCsv, usageRowsToCsv } from "@/lib/csv";

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

function formatAlert(message: string, requestId?: string): string {
  return requestId ? `${message} (request id: ${requestId})` : message;
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
  const isRecording = status.kind === "loading";
  const isQuerying = queryResult.kind === "loading";
  const usageRows = queryResult.kind === "ok" && queryResult.result ? [queryResult.result] : [];
  const canExportUsage = usageRows.length > 0;

  const onExportUsageCsv = () => {
    if (!canExportUsage) {
      return;
    }
    downloadCsv("agentpay-usage.csv", usageRowsToCsv(usageRows));
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
      const result = await apiGet<QueryResult>(
        `/api/v1/usage/${encodeURIComponent(parsedAgent.value)}/${encodeURIComponent(
          parsedServiceId.value,
        )}`,
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
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {formatAlert(status.message, status.requestId)}
          </p>
        )}
      </section>

      <section aria-labelledby="query-heading" className="flex flex-col gap-4">
        <h2 id="query-heading" className="text-xl font-medium">
          Query usage
        </h2>
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
        {queryResult.kind === "ok" && (
          <div className="flex flex-col gap-3">
            {queryResult.result ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p role="status" className="text-sm">
                    {queryResult.result.agent} / {queryResult.result.serviceId}:{" "}
                    <strong>{queryResult.result.total}</strong> request(s).
                  </p>
                  <button
                    type="button"
                    onClick={onExportUsageCsv}
                    disabled={!canExportUsage}
                    className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:border-zinc-700"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <table className="min-w-full text-left text-sm" aria-label="Usage results">
                    <thead className="bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <tr>
                        <th scope="col" className="px-4 py-2 font-medium">Agent</th>
                        <th scope="col" className="px-4 py-2 font-medium">Service ID</th>
                        <th scope="col" className="px-4 py-2 font-medium">Requests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usageRows.map((row) => (
                        <tr key={`${row.agent}:${row.serviceId}`}>
                          <td className="px-4 py-2">{row.agent}</td>
                          <td className="px-4 py-2">{row.serviceId}</td>
                          <td className="px-4 py-2">{row.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
                  No usage rows match the current query.
                </p>
                <button
                  type="button"
                  onClick={onExportUsageCsv}
                  disabled
                  className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium opacity-50 dark:border-zinc-700"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
        )}
        {queryResult.kind === "error" && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {formatAlert(queryResult.message, queryResult.requestId)}
          </p>
        )}
      </section>
    </PageShell>
  );
}
