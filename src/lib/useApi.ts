"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import { apiGet, ApiRateLimitedError, ApiTimeoutError } from "./apiClient";
import { mapApiError } from "./mapApiError";

export type ApiErrorKind = "timeout" | "rate_limited" | "generic";

export type ApiErrorState = {
  status: "error";
  error: string;
  errorKind: ApiErrorKind;
  isTimeout: boolean;
  isRateLimited: boolean;
  retryAfterMs: number | null;
  /** Error-state alias of `refetch` for existing callers. */
  retry: () => void;
};

type FetchState<T> =
  | { status: "loading" }
  | ApiErrorState
  | { status: "ok"; data: T };

/**
 * Discriminated fetch status plus a stable `refetch` handle available in every
 * status. Narrowing on `status` continues to work for existing consumers.
 */
export type State<T> = FetchState<T> & { refetch: () => void };

/**
 * Fetch JSON from the AgentPay backend and react to path changes.
 *
 * Pass `null` to skip fetching while keeping the current state. Responses from
 * stale paths are ignored after unmount or path changes, so consumers do not
 * need to add their own "is mounted" guard around this hook.
 *
 * Call `refetch()` to re-run the current path request; any in-flight request is
 * aborted first.
 *
 * @example
 * const state = useApi<{ items: AppEvent[] }>("/api/v1/events?limit=100");
 * if (state.status === "loading") return <Spinner label="Loading events" />;
 * if (state.status === "error") {
 *   return (
 *     <div>
 *       <p role="alert">{state.error}</p>
 *       {state.isTimeout && <button onClick={state.refetch}>Retry</button>}
 *     </div>
 *   );
 * }
 * return <EventList items={state.data.items} />;
 */
export function useApi<T>(path: string | null): State<T> {
  const [state, dispatch] = useReducer(
    (_state: FetchState<T>, action: FetchState<T>) => action,
    { status: "loading" } as FetchState<T>
  );
  const [reloadToken, bumpReloadToken] = useReducer((s: number) => s + 1, 0);

  const refetch = useCallback(() => {
    bumpReloadToken();
  }, []);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const handleOnline = () => {
      if (stateRef.current.status === "error") {
        bumpReloadToken();
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
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
        const isRateLimited =
          e instanceof ApiRateLimitedError ||
          (e instanceof Error && e.name === "ApiRateLimitedError");
        const retryAfterMs =
          isRateLimited && e instanceof ApiRateLimitedError
            ? e.retryAfterMs
            : null;
        const errorKind: ApiErrorKind = isTimeout
          ? "timeout"
          : isRateLimited
            ? "rate_limited"
            : "generic";
        const errorMsg = isTimeout
          ? "Request timed out. Please try again."
          : mapApiError(e, isRateLimited ? "Rate limited" : "failed to load").message;

        dispatch({
          status: "error",
          error: errorMsg,
          errorKind,
          isTimeout,
          isRateLimited,
          retryAfterMs,
          retry: refetch,
        });
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path, reloadToken, refetch]);

  return { ...state, refetch };
}
