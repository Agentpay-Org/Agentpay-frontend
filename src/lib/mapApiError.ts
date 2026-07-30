import type { ApiError } from "./apiClient";

export type MappedApiError = {
  message: string;
  requestId?: string;
};

/**
 * Translate an unknown error (caught from a promise rejection) into a
 * user-facing message and optional requestId.
 *
 * Strategy:
 * 1. If the error has the {@link ApiError} shape (from the shared API client's
 *    `createHttpError`), its `.message` and `.requestId` are used verbatim.
 * 2. Otherwise, if it is an `Error` instance with a non-empty message, that
 *    message is used.
 * 3. Otherwise the `fallback` string is returned.
 *
 * @param error  - The `unknown` value caught from the rejected promise.
 * @param fallback - Default message when no structured error is present.
 *                   Defaults to `"request failed"`.
 */
export function mapApiError(
  error: unknown,
  fallback = "request failed",
): MappedApiError {
  const apiError = error as Partial<ApiError> | null | undefined;

  const requestId =
    typeof apiError?.requestId === "string" && apiError.requestId.length > 0
      ? apiError.requestId
      : undefined;

  const message =
    typeof apiError?.message === "string" && apiError.message.length > 0
      ? apiError.message
      : error instanceof Error && error.message.length > 0
        ? error.message
        : fallback;

  return { message, requestId };
}
