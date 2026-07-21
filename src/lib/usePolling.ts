"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import { apiGet } from "./apiClient";

export type PollingStatus = "loading" | "error" | "ok";

export type PollingState<T> = {
  status: PollingStatus;
  data: T | null;
  error: string | null;
  lastUpdated: Date | null;
  paused: boolean;
  pause: () => void;
  resume: () => void;
  refresh: () => Promise<void>;
};

type StoredState<T> = Omit<PollingState<T>, "pause" | "resume" | "refresh">;

type Action<T> =
  | { type: "loading" }
  | { type: "success"; data: T; lastUpdated: Date }
  | { type: "error"; error: string }
  | { type: "pause" }
  | { type: "resume" };

export type UsePollingOptions = {
  /** Start without the initial fetch. Call `resume` to fetch immediately. */
  initialPaused?: boolean;
};

function errorMessage(error: unknown) {
  return error instanceof Error && error.message.length > 0
    ? error.message
    : "failed to load";
}

function reducer<T>(state: StoredState<T>, action: Action<T>): StoredState<T> {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        status: state.data === null ? "loading" : state.status,
      };
    case "success":
      return {
        ...state,
        status: "ok",
        data: action.data,
        error: null,
        lastUpdated: action.lastUpdated,
      };
    case "error":
      return {
        ...state,
        status: "error",
        error: action.error,
      };
    case "pause":
      return { ...state, paused: true };
    case "resume":
      return { ...state, paused: false };
  }
}

/**
 * Poll a backend API path with the shared `apiGet` client.
 *
 * @example
 * const stats = usePolling<Stats>("/api/v1/stats", 5000);
 * if (stats.status === "error") return <p role="alert">{stats.error}</p>;
 * return <StatsGrid stats={stats.data} />;
 */
export function usePolling<T>(
  path: string | null,
  intervalMs: number,
  options: UsePollingOptions = {}
): PollingState<T> {
  const [state, dispatch] = useReducer(reducer<T>, {
    status: "loading",
    data: null,
    error: null,
    lastUpdated: null,
    paused: options.initialPaused ?? false,
  });
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const refresh = useCallback(() => {
    if (path === null) return Promise.resolve();

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "loading" });

    return apiGet<T>(path, { signal: controller.signal })
      .then((data) => {
        if (mountedRef.current && requestId === requestIdRef.current) {
          dispatch({ type: "success", data, lastUpdated: new Date() });
        }
      })
      .catch((error) => {
        if (mountedRef.current && requestId === requestIdRef.current) {
          dispatch({ type: "error", error: errorMessage(error) });
        }
      })
      .finally(() => {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      });
  }, [path]);

  useEffect(() => {
    if (path === null || state.paused) return;

    refresh();
    const timer = setInterval(() => {
      refresh();
    }, intervalMs);

    return () => {
      requestIdRef.current += 1;
      abortRef.current?.abort();
      abortRef.current = null;
      clearInterval(timer);
    };
  }, [intervalMs, path, refresh, state.paused]);

  const pause = useCallback(() => dispatch({ type: "pause" }), []);
  const resume = useCallback(() => dispatch({ type: "resume" }), []);

  return {
    ...state,
    pause,
    resume,
    refresh,
  };
}
