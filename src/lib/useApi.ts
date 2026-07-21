"use client";

import { useEffect, useReducer } from "react";
import { apiGet } from "./apiClient";

type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
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
 * if (state.status === "error") return <p role="alert">{state.error}</p>;
 * return <EventList items={state.data.items} />;
 */
export function useApi<T>(path: string | null): State<T> {
  const [state, dispatch] = useReducer(
    (_state: State<T>, action: State<T>) => action,
    { status: "loading" } as State<T>
  );

  useEffect(() => {
    if (path === null) return;
    const controller = new AbortController();
    let cancelled = false;
    dispatch({ status: "loading" });
    apiGet<T>(path, { signal: controller.signal })
      .then((data) => !cancelled && dispatch({ status: "ok", data }))
      .catch(
        (e) =>
          !cancelled &&
          dispatch({
            status: "error",
            error: (e as Error).message ?? "failed to load",
          })
      );
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [path]);

  return state;
}
