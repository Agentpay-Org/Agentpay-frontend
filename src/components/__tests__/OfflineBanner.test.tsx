import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfflineBanner } from "../OfflineBanner";

const mockUseOnlineStatus = jest.fn();

jest.mock("@/lib/useOnlineStatus", () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

describe("OfflineBanner", () => {
  beforeEach(() => {
    mockUseOnlineStatus.mockReset();
  });

  it("renders nothing while online", () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: true });
    const { container } = render(<OfflineBanner />);
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("announces an alert with the offline message when offline", () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: false });
    render(<OfflineBanner />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/you are offline/i);
  });

  it("hides the banner after it is dismissed", async () => {
    mockUseOnlineStatus.mockReturnValue({ isOnline: false });
    render(<OfflineBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /dismiss offline notification/i }),
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
