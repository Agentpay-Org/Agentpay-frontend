import { mapApiError, type MappedApiError } from "../mapApiError";
import type { ApiError } from "../apiClient";
import { ApiTimeoutError, ApiRateLimitedError } from "../apiClient";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an Error that also carries ApiError fields (simulating createHttpError). */
function apiErrorLike(
  overrides: Partial<ApiError> & { message: string },
): Error & Partial<ApiError> {
  const err = new Error(overrides.message);
  return Object.assign(err, overrides);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("mapApiError", () => {
  // -----------------------------------------------------------------------
  // ApiError shape
  // -----------------------------------------------------------------------

  it("extracts message and requestId from an ApiError-shaped object", () => {
    const err = apiErrorLike({
      error: "invalid_request",
      message: "boom",
      requestId: "req-abc-123",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "boom",
      requestId: "req-abc-123",
    });
  });

  it("extracts message from an ApiError shape without requestId", () => {
    const err = apiErrorLike({
      error: "server_error",
      message: "Internal Server Error",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Internal Server Error",
      requestId: undefined,
    });
  });

  it("treats an empty requestId string as absent", () => {
    const err = apiErrorLike({
      error: "gone",
      message: "Gone",
      requestId: "",
    });

    expect(mapApiError(err).requestId).toBeUndefined();
  });

  // -----------------------------------------------------------------------
  // Plain Error
  // -----------------------------------------------------------------------

  it("uses the error message from a plain Error instance", () => {
    const err = new Error("Network failure");

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Network failure",
      requestId: undefined,
    });
  });

  it("falls back when a plain Error has an empty message", () => {
    const err = new Error("");

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("uses the provided fallback when a plain Error has an empty message", () => {
    const err = new Error("");

    expect(mapApiError(err, "default text")).toEqual<MappedApiError>({
      message: "default text",
      requestId: undefined,
    });
  });

  // -----------------------------------------------------------------------
  // Non-Error rejections
  // -----------------------------------------------------------------------

  it("returns the fallback for a non-Error rejection", () => {
    expect(mapApiError({})).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("returns the fallback for a string rejection", () => {
    expect(mapApiError("something broke")).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("returns the fallback for null", () => {
    expect(mapApiError(null)).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("returns the fallback for undefined", () => {
    expect(mapApiError(undefined)).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("returns a custom fallback for non-Error rejections", () => {
    expect(mapApiError("nope", "custom fallback")).toEqual<MappedApiError>({
      message: "custom fallback",
      requestId: undefined,
    });
  });

  // -----------------------------------------------------------------------
  // Timeout errors
  // -----------------------------------------------------------------------

  it("preserves the ApiTimeoutError message verbatim", () => {
    const err = new ApiTimeoutError(5000);

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "request timed out after 5000ms",
      requestId: undefined,
    });
  });

  it("preserves an ApiTimeoutError with additional ApiError fields", () => {
    const err = new ApiTimeoutError(3000);
    Object.assign(err, { requestId: "req-timeout-1" });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "request timed out after 3000ms",
      requestId: "req-timeout-1",
    });
  });

  // -----------------------------------------------------------------------
  // Rate-limited errors
  // -----------------------------------------------------------------------

  it("preserves the ApiRateLimitedError message verbatim", () => {
    const err = new ApiRateLimitedError(30000);

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Rate limited. Retry after 30s",
      requestId: undefined,
    });
  });

  it("preserves an ApiRateLimitedError with additional ApiError fields", () => {
    const err = new ApiRateLimitedError(60000);
    Object.assign(err, {
      requestId: "req-rate-1",
      error: "rate_limited",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Rate limited. Retry after 60s",
      requestId: "req-rate-1",
    });
  });

  // -----------------------------------------------------------------------
  // HTTP status code scenarios (simulated through ApiError shape)
  // -----------------------------------------------------------------------

  it("handles a 400 error with the standard ApiError shape", () => {
    const err = apiErrorLike({
      error: "invalid_request",
      message: "Agent identifier is required",
      requestId: "req-400",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Agent identifier is required",
      requestId: "req-400",
    });
  });

  it("handles a 404 error with the standard ApiError shape", () => {
    const err = apiErrorLike({
      error: "not_found",
      message: "Service not found",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Service not found",
      requestId: undefined,
    });
  });

  it("handles a 500 error with the standard ApiError shape", () => {
    const err = apiErrorLike({
      error: "internal",
      message: "Internal Server Error",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Internal Server Error",
      requestId: undefined,
    });
  });

  it("handles a 503 error with the standard ApiError shape", () => {
    const err = apiErrorLike({
      error: "unavailable",
      message: "Service Unavailable",
    });

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Service Unavailable",
      requestId: undefined,
    });
  });

  // -----------------------------------------------------------------------
  // Network errors (TypeError from fetch)
  // -----------------------------------------------------------------------

  it("handles a network error TypeError", () => {
    const err = new TypeError("Failed to fetch");

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "Failed to fetch",
      requestId: undefined,
    });
  });

  it("handles AbortError", () => {
    const err = new Error("The operation was aborted");
    err.name = "AbortError";

    expect(mapApiError(err)).toEqual<MappedApiError>({
      message: "The operation was aborted",
      requestId: undefined,
    });
  });

  // -----------------------------------------------------------------------
  // Edge cases
  // -----------------------------------------------------------------------

  it("prioritises ApiError.message over Error.message when both are present", () => {
    // createHttpError does Object.assign(err, apiError), so the Error.message
    // and the assigned .message property are the same. But if someone creates
    // an object that has both, the assigned property wins because it's checked
    // first (as a Partial<ApiError>).
    const err = apiErrorLike({
      error: "boom",
      message: "from api error",
      requestId: "req-1",
    });

    expect(mapApiError(err).message).toBe("from api error");
  });

  it("does not mutate the input error", () => {
    const err = apiErrorLike({
      error: "test",
      message: "test message",
      requestId: "req-abc",
    });
    // Capture properties before the call so we can verify no mutation.
    const messageBefore = (err as Error & Partial<ApiError>).message;
    const requestIdBefore = (err as Error & Partial<ApiError>).requestId;
    const errorBefore = (err as Error & Partial<ApiError>).error;

    mapApiError(err);

    expect((err as Error & Partial<ApiError>).message).toBe(messageBefore);
    expect((err as Error & Partial<ApiError>).requestId).toBe(requestIdBefore);
    expect((err as Error & Partial<ApiError>).error).toBe(errorBefore);
  });

  it("handles an ApiError shape where message is null", () => {
    const err = { error: "test", message: null as unknown as string };

    expect(mapApiError(err as unknown as Error)).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("handles an ApiError shape where message is undefined", () => {
    const err = { error: "test", message: undefined as unknown as string };

    expect(mapApiError(err as unknown as Error)).toEqual<MappedApiError>({
      message: "request failed",
      requestId: undefined,
    });
  });

  it("returns the default fallback when no fallback is explicitly passed", () => {
    expect(mapApiError("boom").message).toBe("request failed");
  });
});
