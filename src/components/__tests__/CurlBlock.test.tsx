import { act, fireEvent, render, screen } from "@testing-library/react";
import { CurlBlock } from "../CurlBlock";

function mockClipboard(writeText = jest.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("CurlBlock", () => {
  it("renders the exact command text in a code block", () => {
    const command = "curl -X POST https://api.agentpay.test/v1/services";

    const { container } = render(<CurlBlock command={command} />);

    expect(container.querySelector("pre code")).toHaveTextContent(command);
  });

  it("renders the copy affordance with the curl-specific label", () => {
    mockClipboard();

    render(<CurlBlock command="curl https://api.agentpay.test" />);

    expect(
      screen.getByRole("button", { name: "Copy curl" }),
    ).toBeInTheDocument();
  });

  it("copies the rendered command when the copy button is clicked", async () => {
    const writeText = mockClipboard();
    const command = "curl -H 'Authorization: Bearer test' https://api.agentpay.test";

    render(<CurlBlock command={command} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy curl" }));
    });

    expect(writeText).toHaveBeenCalledWith(command);
    expect(screen.getByRole("button")).toHaveTextContent("Copied");
  });

  it("wraps long commands instead of requiring horizontal scrolling", () => {
    const longCommand = `curl https://api.agentpay.test/${"a".repeat(160)}`;

    const { container } = render(<CurlBlock command={longCommand} />);

    expect(container.querySelector("pre")).toHaveClass(
      "whitespace-pre-wrap",
      "break-words",
    );
    expect(container.querySelector("pre")).not.toHaveClass("overflow-x-auto");
  });
});
