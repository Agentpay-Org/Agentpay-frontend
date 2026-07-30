"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { mapApiError } from "./mapApiError";

export type MutationStatus = "idle" | "pending" | "success" | "error";

export type UseApiMutationResult<TData, TVariables> = {
  mutate: (variables: TVariables) => Promise<TData>;
  status: MutationStatus;
  error: string | null;
  reset: () => void;
};

/**
 * Run a write mutation (POST / DELETE / PATCH) with pending, error, and success
 * state — the mutation counterpart to `useApi`.
 *
 * Pass an async `mutationFn` that receives the call variables and an AbortSignal.
 * In-flight requests are aborted when the component unmounts or when a newer
 * `mutate` call supersedes them; late responses are ignored.
 *
 * @example
 * const { mutate, status, error, reset } = useApiMutation(
 *   (body: { label: string }, { signal }) =>
 *     apiPost<{ key: string }>("/api/v1/api-keys", body, { signal }),
 * );
 *
 * await mutate({ label: "ci" });
 */
export function useApiMutation<TData, TVariables = void>(
  mutationFn: (
    variables: TVariables,
    options: { signal: AbortSignal },
  ) => Promise<TData>,
): UseApiMutationResult<TData, TVariables> {
  const [status, setStatus] = useState<MutationStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const mutationFnRef = useRef(mutationFn);
  useEffect(() => {
    mutationFnRef.current = mutationFn;
  }, [mutationFn]);

  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generationRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    generationRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;
    setStatus("idle");
    setError(null);
  }, []);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    controllerRef.current?.abort();

    const controller = new AbortController();
    controllerRef.current = controller;
    const generation = ++generationRef.current;

    if (mountedRef.current) {
      setStatus("pending");
      setError(null);
    }

    try {
      const data = await mutationFnRef.current(variables, {
        signal: controller.signal,
      });

      if (generation !== generationRef.current || !mountedRef.current) {
        return data;
      }

      setStatus("success");
      setError(null);
      return data;
    } catch (err) {
      const aborted =
        controller.signal.aborted ||
        (err instanceof Error && err.name === "AbortError");

      if (aborted || generation !== generationRef.current || !mountedRef.current) {
        throw err;
      }

      const message = mapApiError(err, "failed to mutate").message;
      const normalized = err instanceof Error ? err : new Error(message);

      setStatus("error");
      setError(message);
      throw normalized;
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null;
      }
    }
  }, []);

  return { mutate, status, error, reset };
}
