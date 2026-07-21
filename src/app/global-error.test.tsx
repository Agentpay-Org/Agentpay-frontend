import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import GlobalError from "./global-error";

function makeError(
  message: string,
  digest?: string
): Error & { digest?: string } {
  const err = new Error(message) as Error & { digest?: string };
  if (digest !== undefined) err.digest = digest;
  return err;
}

beforeEach(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("GlobalError — rendering", () => {
  it("renders html, body and structure", () => {
    // Inspect React elements directly to verify presence of html/body tags
    const originalUseEffect = React.useEffect;
    // @ts-expect-error - temporary mock of react hook
    React.useEffect = jest.fn();

    try {
      const element = GlobalError({ error: makeError("boom"), reset: () => {} });
      expect(element.type).toBe("html");
      expect(element.props.lang).toBe("en");
      
      const children = element.props.children;
      expect(children[0].type).toBe("head");
      expect(children[1].type).toBe("body");
    } finally {
      React.useEffect = originalUseEffect;
    }

    render(<GlobalError error={makeError("boom")} reset={() => {}} />);
    expect(
      screen.getByRole("heading", { name: /something went wrong/i })
    ).toBeInTheDocument();
  });

  it("renders the error message when one is provided", () => {
    render(
      <GlobalError error={makeError("Database failure")} reset={() => {}} />
    );
    expect(screen.getByText("Database failure")).toBeInTheDocument();
  });

  it("renders fallback copy when error.message is empty", () => {
    render(<GlobalError error={makeError("")} reset={() => {}} />);
    expect(
      screen.getByText(/an unexpected error occurred/i)
    ).toBeInTheDocument();
  });

  it("renders a Try again button", () => {
    render(<GlobalError error={makeError("oops")} reset={() => {}} />);
    expect(
      screen.getByRole("button", { name: /try again/i })
    ).toBeInTheDocument();
  });

  it("wraps error message in a role=alert assertive region", () => {
    render(<GlobalError error={makeError("oops")} reset={() => {}} />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("oops");
  });

  it("renders the main landmark with id=main-content", () => {
    const { container } = render(
      <GlobalError error={makeError("oops")} reset={() => {}} />
    );
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute("id", "main-content");
    expect(main).toHaveAttribute("tabIndex", "-1");
  });
});

describe("GlobalError — reset interaction", () => {
  it("calls reset once when Try again is clicked", () => {
    const reset = jest.fn();
    render(<GlobalError error={makeError("oops")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("calls reset again on each subsequent click", () => {
    const reset = jest.fn();
    render(<GlobalError error={makeError("oops")} reset={reset} />);
    const btn = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(reset).toHaveBeenCalledTimes(3);
  });
});

describe("GlobalError — production safety", () => {
  it("does not render the error stack trace", () => {
    const err = makeError("bad thing");
    err.stack = "Error: bad thing\n    at RootLayout (layout.tsx:10:5)";
    const { container } = render(
      <GlobalError error={err} reset={() => {}} />
    );
    expect(container.textContent).not.toContain(err.stack);
    expect(container.textContent).not.toMatch(/at RootLayout/);
  });

  it("only renders error.message, never error.stack", () => {
    const err = makeError("Fatal layout crash");
    err.stack = "Error: Fatal layout crash\n    at bad stack trace";
    const { container } = render(
      <GlobalError error={err} reset={() => {}} />
    );
    expect(container.textContent).toContain("Fatal layout crash");
    expect(container.textContent).not.toContain("bad stack trace");
  });
});

describe("GlobalError — error logging", () => {
  it("logs the error via console.error on mount", () => {
    const err = makeError("logged error");
    render(<GlobalError error={err} reset={() => {}} />);
    expect(console.error).toHaveBeenCalledWith(
      "Global error boundary caught:",
      err
    );
  });

  it("logs the error digest when present and renders it in the DOM", () => {
    const err = makeError("crash", "err-digest-456");
    render(<GlobalError error={err} reset={() => {}} />);
    expect(console.error).toHaveBeenCalledWith("Error digest:", "err-digest-456");
    expect(screen.getByText(/Error ID: err-digest-456/i)).toBeInTheDocument();
  });

  it("does not log digest when digest is absent", () => {
    const err = makeError("crash");
    render(<GlobalError error={err} reset={() => {}} />);
    expect(console.error).not.toHaveBeenCalledWith(
      expect.stringMatching(/digest/),
      expect.anything()
    );
    expect(screen.queryByText(/Error ID:/i)).not.toBeInTheDocument();
  });
});
