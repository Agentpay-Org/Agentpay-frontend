import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ToastProvider } from "@/components/ToastProvider";
import { apiGet, apiPatch } from "@/lib/apiClient";
import EditServicePage, { isDirtyPrice } from "./page";

jest.mock("@/lib/apiClient", () => ({
  apiGet: jest.fn(),
  apiPatch: jest.fn(),
}));

jest.mock("react", () => {
  const originalReact = jest.requireActual("react");
  return {
    ...originalReact,
    use: (usable: unknown) => {
      const u = usable as { _value?: unknown } | null | undefined;
      if (u && u._value) {
        return u._value;
      }
      return originalReact.use(usable);
    },
  };
});

const pushMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: pushMock,
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

const apiGetMock = apiGet as jest.MockedFunction<typeof apiGet>;
const apiPatchMock = apiPatch as jest.MockedFunction<typeof apiPatch>;

function renderPage(serviceId = "svc-1") {
  const params = Promise.resolve({ serviceId }) as Promise<{
    serviceId: string;
  }> & {
    _value: { serviceId: string };
  };
  params._value = { serviceId };

  return render(
    <ToastProvider>
      <EditServicePage params={params} />
    </ToastProvider>
  );
}

describe("isDirtyPrice", () => {
  it("waits for the initial prefill before marking dirty", () => {
    expect(isDirtyPrice("10", null)).toBe(false);
    expect(isDirtyPrice("10", "10")).toBe(false);
    expect(isDirtyPrice("11", "10")).toBe(true);
  });
});

describe("EditServicePage", () => {
  beforeEach(() => {
    apiGetMock.mockReset();
    apiPatchMock.mockReset();
    pushMock.mockReset();
    jest.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("shows a spinner while the prefill request is in flight", () => {
    apiGetMock.mockReturnValue(new Promise(() => undefined) as never);

    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading service price"
    );
    expect(screen.getByLabelText(/price/i)).toBeDisabled();
  });

  it("prefills the price when the service request succeeds", async () => {
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);

    renderPage();

    const price = screen.getByLabelText(/price/i);
    await waitFor(() => expect(price).toHaveValue("25"));
    expect(price).not.toBeDisabled();
  });

  it("surfaces prefill failures as an alert", async () => {
    apiGetMock.mockRejectedValueOnce(new Error("service unavailable"));

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "service unavailable"
    );
  });

  it("does not warn on the Back link when the price is unchanged", async () => {
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);

    renderPage();

    await screen.findByDisplayValue("25");
    const backLink = screen.getByRole("link", { name: /back to service/i });
    backLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(backLink);

    expect(window.confirm).not.toHaveBeenCalled();
  });

  it("confirms before following the Back link when the price is dirty", async () => {
    (window.confirm as jest.Mock).mockReturnValueOnce(false);
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);

    renderPage();

    fireEvent.change(await screen.findByDisplayValue("25"), {
      target: { value: "30" },
    });
    const clickAllowed = fireEvent.click(
      screen.getByRole("link", { name: /back to service/i })
    );

    expect(window.confirm).toHaveBeenCalledWith(
      "Discard unsaved price changes?"
    );
    expect(clickAllowed).toBe(false);
  });

  it("registers beforeunload only while the price is dirty", async () => {
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);

    renderPage();

    await screen.findByDisplayValue("25");
    const cleanEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(cleanEvent);
    expect(cleanEvent.defaultPrevented).toBe(false);

    fireEvent.change(screen.getByLabelText(/price/i), {
      target: { value: "30" },
    });
    const dirtyEvent = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirtyEvent);
    expect(dirtyEvent.defaultPrevented).toBe(true);
  });

  it("blocks invalid prices before PATCH", async () => {
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);

    renderPage();

    fireEvent.change(await screen.findByDisplayValue("25"), {
      target: { value: "-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Price must be a non-negative integer."
    );
    expect(apiPatchMock).not.toHaveBeenCalled();
  });

  it("surfaces PATCH failures without navigating", async () => {
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);
    apiPatchMock.mockRejectedValueOnce(new Error("patch failed"));

    renderPage();

    fireEvent.change(await screen.findByDisplayValue("25"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("patch failed");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("saves, shows a toast, navigates, and clears dirty state", async () => {
    apiGetMock.mockResolvedValueOnce({
      serviceId: "svc-1",
      priceStroops: 25,
    } as never);
    apiPatchMock.mockResolvedValueOnce(undefined as never);

    renderPage();

    fireEvent.change(await screen.findByDisplayValue("25"), {
      target: { value: "30" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => {
      expect(apiPatchMock).toHaveBeenCalledWith(
        "/api/v1/services/svc-1/price",
        { priceStroops: 30 }
      );
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Service price saved."
    );
    expect(pushMock).toHaveBeenCalledWith("/services/svc-1");

    fireEvent.click(screen.getByRole("link", { name: /back to service/i }));
    expect(window.confirm).not.toHaveBeenCalled();
  });
});
