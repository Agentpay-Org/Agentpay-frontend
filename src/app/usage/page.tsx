"use client";

import { Spinner } from "@/components/Spinner";
import { TextField } from "@/components/TextField";
import type { ApiError } from "@/lib/apiClient";
import { apiGet, apiPost } from "@/lib/apiClient";
import { validateIdentifier } from "@/lib/validateId";
import type { FormEvent } from "react";
import { useState } from "react";

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

type FieldErrors = Partial<{
  agent: string;
  serviceId: string;
  queryAgent: string;
  queryService: string;
}>;

function describeError(error: unknown): { message: string; requestId?: string } {
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
  const [serviceId, setServiceId] = useState("");
  const [requests, setRequests] = useState("");
  const [status, setStatus] = useState<UsageStatus>({ kind: "idle" });
  const [queryAgent, setQueryAgent] = useState("");
  const [queryService, setQueryService] = useState("");
  const [queryResult, setQueryResult] = useState<QueryStatus>({ kind: "idle" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const isRecording = status.kind === "loading";
  const isQuerying = queryResult.kind === "loading";

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const onRecord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRecording) return;

    const agentResult = validateIdentifier(agent, "Agent");
    const serviceResult = validateIdentifier(serviceId, "Service ID");

    if (!agentResult.ok || !serviceResult.ok) {
      const nextErrors: FieldErrors = {};
      if (!agentResult.ok) nextErrors.agent = agentResult.message;
      if (!serviceResult.ok) nextErrors.serviceId = serviceResult.message;
      setFieldErrors(nextErrors);
      setStatus({ kind: "idle" });
      return;
    }

    const requestsNum = Number(requests);
    if (!Number.isInteger(requestsNum) || requestsNum <= 0) {
      setStatus({ kind: "error", message: "requests must be a positive integer" });
      return;
    }

    setFieldErrors({});
    setStatus({ kind: "loading" });
    try {
      const body = await apiPost<{ total: number }>("/api/v1/usage", {
        agent: agentResult.value,
        serviceId: serviceResult.value,
        requests: requestsNum,
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

    const agentResult = validateIdentifier(queryAgent, "Agent");
    const serviceResult = validateIdentifier(queryService, "Service ID");

    if (!agentResult.ok || !serviceResult.ok) {
      const nextErrors: FieldErrors = {};
      if (!agentResult.ok) nextErrors.queryAgent = agentResult.message;
      if (!serviceResult.ok) nextErrors.queryService = serviceResult.message;
      setFieldErrors(nextErrors);
      setQueryResult({ kind: "idle" });
      return;
    }

    setFieldErrors({});
    setQueryResult({ kind: "loading" });

    try {
      const result = await apiGet<QueryResult>(
        `/api/v1/usage/${encodeURIComponent(agentResult.value)}/${encodeURIComponent(
          serviceResult.value
        )}`
      );
      setQueryResult({ kind: "ok", result: result ?? null });
    } catch (error) {
      const { message, requestId } = describeError(error);
      setQueryResult({ kind: "error", message, requestId });
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-screen max-w-2xl flex-col gap-12 p-8 focus:outline-none"
    >
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Usage metering</h1>
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
            required
            label="Agent"
            name="agent"
            value={agent}
            error={fieldErrors.agent}
            onChange={(e) => {
              setAgent(e.target.value);
              clearFieldError("agent");
            }}
          />
          <TextField
            required
            label="Service ID"
            name="serviceId"
            value={serviceId}
            error={fieldErrors.serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              clearFieldError("serviceId");
            }}
          />
          <label className="flex flex-col gap-1 text-sm">
            <span>Requests</span>
            <input
              required
              type="number"
              min="1"
              name="requests"
              value={requests}
              onChange={(e) => setRequests(e.target.value)}
              className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            disabled={isRecording}
            className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {isRecording ? <Spinner label="Recording" /> : "Record"}
          </button>
        </form>
        {status.kind === "ok" && (
          <p role="status" className="text-sm text-emerald-700 dark:text-emerald-400">
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
            required
            label="Agent"
            name="queryAgent"
            value={queryAgent}
            error={fieldErrors.queryAgent}
            onChange={(e) => {
              setQueryAgent(e.target.value);
              clearFieldError("queryAgent");
            }}
          />
          <TextField
            required
            label="Service ID"
            name="queryServiceId"
            value={queryService}
            error={fieldErrors.queryService}
            onChange={(e) => {
              setQueryService(e.target.value);
              clearFieldError("queryService");
            }}
          />
          <button
            type="submit"
            disabled={isQuerying}
            className="self-start rounded-full border border-zinc-300 px-5 py-2 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 dark:border-zinc-700"
          >
            {isQuerying ? <Spinner label="Querying" /> : "Query"}
          </button>
        </form>
        {queryResult.kind === "ok" && queryResult.result && (
          <p role="status" className="text-sm">
            {queryResult.result.agent} / {queryResult.result.serviceId}:{" "}
            <strong>{queryResult.result.total}</strong> request(s).
          </p>
        )}
        {queryResult.kind === "error" && (
          <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">
            {formatAlert(queryResult.message, queryResult.requestId)}
          </p>
        )}
      </section>
    </main>
  );
}
