import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { useApiMutation } from "../useApiMutation";

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

type Payload = { id: string };
type Vars = { label: string };

function Probe({
  mutationFn,
}: {
  mutationFn: (
    variables: Vars,
    options: { signal: AbortSignal },
  ) => Promise<Payload>;
}) {
  const { mutate, status, error, reset } = useApiMutation(mutationFn);

  return (
    <div>
      <output data-testid="status">{status}</output>
      <output data-testid="error">{error ?? ""}</output>
      <button
        data-testid="mutate-btn"
        type="button"
        onClick={() => {
          void mutate({ label: "ci" }).catch(() => {});
        }}
      >
        Mutate
      </button>
      <button data-testid="reset-btn" type="button" onClick={reset}>
        Reset
      </button>
    </div>
  );
}

describe("useApiMutation", () => {
  it("starts idle and transitions to success with mutate", async () => {
    const request = createDeferred<Payload>();
    const mutationFn = jest.fn(() => request.promise);

    render(<Probe mutationFn={mutationFn} />);

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("error")).toHaveTextContent("");

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("pending");
    expect(mutationFn).toHaveBeenCalledWith(
      { label: "ci" },
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );

    await act(async () => {
      request.resolve({ id: "1" });
      await request.promise;
    });

    expect(screen.getByTestId("status")).toHaveTextContent("success");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("transitions to error when the mutation rejects", async () => {
    const mutationFn = jest.fn(() =>
      Promise.reject(new Error("backend unavailable")),
    );

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
      expect(screen.getByTestId("error")).toHaveTextContent(
        "backend unavailable",
      );
    });
  });

  it("falls back to a generic error message for non-Error rejections", async () => {
    const mutationFn = jest.fn(() => Promise.reject({}));

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
      expect(screen.getByTestId("error")).toHaveTextContent("failed to mutate");
    });
  });

  it("reset returns to idle and clears error", async () => {
    const mutationFn = jest.fn(() => Promise.reject(new Error("boom")));

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
    });

    act(() => {
      screen.getByTestId("reset-btn").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("reset aborts an in-flight mutation without applying late success", async () => {
    const request = createDeferred<Payload>();
    let signal: AbortSignal | undefined;
    const mutationFn = jest.fn((_vars: Vars, opts: { signal: AbortSignal }) => {
      signal = opts.signal;
      return request.promise;
    });

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("pending");
    expect(signal?.aborted).toBe(false);

    act(() => {
      screen.getByTestId("reset-btn").click();
    });

    expect(signal?.aborted).toBe(true);
    expect(screen.getByTestId("status")).toHaveTextContent("idle");

    await act(async () => {
      request.resolve({ id: "late" });
      await request.promise.catch(() => {});
    });

    expect(screen.getByTestId("status")).toHaveTextContent("idle");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("a newer mutate aborts the previous request and ignores its result", async () => {
    const first = createDeferred<Payload>();
    const second = createDeferred<Payload>();
    let firstSignal: AbortSignal | undefined;
    let call = 0;

    const mutationFn = jest.fn((_vars: Vars, opts: { signal: AbortSignal }) => {
      call += 1;
      if (call === 1) {
        firstSignal = opts.signal;
        return first.promise;
      }
      return second.promise;
    });

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });
    expect(screen.getByTestId("status")).toHaveTextContent("pending");

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    expect(mutationFn).toHaveBeenCalledTimes(2);
    expect(firstSignal?.aborted).toBe(true);
    expect(screen.getByTestId("status")).toHaveTextContent("pending");

    await act(async () => {
      first.resolve({ id: "stale" });
      await first.promise;
    });

    expect(screen.getByTestId("status")).toHaveTextContent("pending");

    await act(async () => {
      second.resolve({ id: "fresh" });
      await second.promise;
    });

    expect(screen.getByTestId("status")).toHaveTextContent("success");
  });

  it("aborts in-flight mutations on unmount without updating state", async () => {
    const request = createDeferred<Payload>();
    let signal: AbortSignal | undefined;
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const mutationFn = jest.fn((_vars: Vars, opts: { signal: AbortSignal }) => {
      signal = opts.signal;
      return request.promise;
    });

    const { unmount } = render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);

    await act(async () => {
      request.resolve({ id: "late" });
      await request.promise;
    });

    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("does not treat AbortError as a mutation error state", async () => {
    const mutationFn = jest.fn(
      (_vars: Vars, opts: { signal: AbortSignal }) =>
        new Promise<Payload>((_resolve, reject) => {
          opts.signal.addEventListener("abort", () => {
            const err = new Error("aborted");
            err.name = "AbortError";
            reject(err);
          });
        }),
    );

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("pending");

    act(() => {
      screen.getByTestId("reset-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("idle");
      expect(screen.getByTestId("error")).toHaveTextContent("");
    });
  });

  it("clears a previous error when a new mutate starts", async () => {
    const mutationFn = jest
      .fn()
      .mockRejectedValueOnce(new Error("first failure"))
      .mockImplementationOnce(
        () => new Promise<Payload>(() => {}),
      );

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("first failure");
    });

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    expect(screen.getByTestId("status")).toHaveTextContent("pending");
    expect(screen.getByTestId("error")).toHaveTextContent("");
  });

  it("returns the resolved data from mutate", async () => {
    const mutationFn = jest.fn(async () => ({ id: "created" }));
    let result: Payload | undefined;

    function ReturnProbe() {
      const { mutate, status } = useApiMutation(mutationFn);
      return (
        <div>
          <output data-testid="status">{status}</output>
          <button
            data-testid="mutate-btn"
            type="button"
            onClick={() => {
              void mutate({ label: "x" }).then((data) => {
                result = data;
              });
            }}
          >
            Mutate
          </button>
        </div>
      );
    }

    render(<ReturnProbe />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("success");
    });

    expect(result).toEqual({ id: "created" });
  });

  it("rethrows the rejection from mutate after setting error state", async () => {
    const mutationFn = jest.fn(() => Promise.reject(new Error("nope")));
    let caught: Error | undefined;

    function ThrowProbe() {
      const { mutate, status, error } = useApiMutation(mutationFn);
      return (
        <div>
          <output data-testid="status">{status}</output>
          <output data-testid="error">{error ?? ""}</output>
          <button
            data-testid="mutate-btn"
            type="button"
            onClick={() => {
              void mutate({ label: "x" }).catch((err: Error) => {
                caught = err;
              });
            }}
          >
            Mutate
          </button>
        </div>
      );
    }

    render(<ThrowProbe />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
      expect(caught?.message).toBe("nope");
    });
  });

  it("falls back to a generic error message for Error with an empty message", async () => {
    const mutationFn = jest.fn(() => Promise.reject(new Error("")));

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("error");
      expect(screen.getByTestId("error")).toHaveTextContent("failed to mutate");
    });
  });

  it("ignores a late rejection from a superseded mutation", async () => {
    const first = createDeferred<Payload>();
    const second = createDeferred<Payload>();
    let call = 0;

    const mutationFn = jest.fn(() => {
      call += 1;
      return call === 1 ? first.promise : second.promise;
    });

    render(<Probe mutationFn={mutationFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });
    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await act(async () => {
      first.reject(new Error("stale failure"));
      await first.promise.catch(() => {});
    });

    expect(screen.getByTestId("status")).toHaveTextContent("pending");
    expect(screen.getByTestId("error")).toHaveTextContent("");

    await act(async () => {
      second.resolve({ id: "fresh" });
      await second.promise;
    });

    expect(screen.getByTestId("status")).toHaveTextContent("success");
  });

  it("uses the latest mutationFn when mutate is called", async () => {
    const firstFn = jest.fn(async () => ({ id: "first" }));
    const secondFn = jest.fn(async () => ({ id: "second" }));

    function SwapProbe({
      fn,
    }: {
      fn: (
        variables: Vars,
        options: { signal: AbortSignal },
      ) => Promise<Payload>;
    }) {
      const { mutate, status } = useApiMutation(fn);
      return (
        <div>
          <output data-testid="status">{status}</output>
          <button
            data-testid="mutate-btn"
            type="button"
            onClick={() => {
              void mutate({ label: "swap" }).catch(() => {});
            }}
          >
            Mutate
          </button>
        </div>
      );
    }

    const { rerender } = render(<SwapProbe fn={firstFn} />);
    rerender(<SwapProbe fn={secondFn} />);

    act(() => {
      screen.getByTestId("mutate-btn").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("success");
    });

    expect(firstFn).not.toHaveBeenCalled();
    expect(secondFn).toHaveBeenCalledTimes(1);
  });
});
