"use client";

import { useCallback, useEffect, useReducer } from "react";
import { apiGet, ApiTimeoutError } from "./apiClient";

export type ApiErrorKind = "timeout" | "generic";

export type ApiErrorState = {
  status: "error";
  error: string;
  errorKind: ApiErrorKind;
  isTimeout: boolean;
  retry: () => void;
};

export type State<T> =
  | { status: "loading" }
  | ApiErrorState
  | { status: "ok"; data: T };

/**
 * Fetch JSON from the AgentPay backend and react to path changes.
 *
 * Pass `null` to skip fetching while keeping the current state. Responses from
 * stale paths are ignored after unmount or path changes, so consumers do not
 * need to add their own "is mounted" guard around this hook.
 *
 * @example
 * const state = useApi<{ items: AppEvent[] }>("/api/v1/events?limit=100");
 * if (state.status === "loading") return <Spinner label="Loading events" />;
 * if (state.status === "error") {
 *   return (
 *     <div>
 *       <p role="alert">{state.error}</p>
 *       {state.isTimeout && <button onClick={state.retry}>Retry</button>}
 *     </div>
 *   );
 * }
 * return <EventList items={state.data.items} />;
 */
export function useApi<T>(path: string | null): State<T> {
  const [state, dispatch] = useReducer(
    (_state: State<T>, action: State<T>) => action,
    { status: "loading" } as State<T>
  );
  const [reloadToken, bumpReloadToken] = useReducer((s: number) => s + 1, 0);

  const retry = useCallback(() => {
    bumpReloadToken();
  }, []);

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    let cancelled = false;
    dispatch({ status: "loading" });
    apiGet<T>(path, { signal: controller.signal })
      .then((data) => !cancelled && dispatch({ status: "ok", data }))
      .catch((e) => {
        if (cancelled) return;
        const isTimeout =
          e instanceof ApiTimeoutError ||
          (e instanceof Error && e.name === "ApiTimeoutError");
        const errorKind: ApiErrorKind = isTimeout ? "timeout" : "generic";
        const errorMsg = isTimeout
          ? "Request timed out. Please try again."
          : (e as Error).message ?? "failed to load";

        dispatch({
          status: "error",
          error: errorMsg,
          errorKind,
          isTimeout,
          retry,
        });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path, reloadToken, retry]);

  return state;
}

