import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { apiPost } from "@/lib/apiClient";
import NewServicePage from "./page";

// Mock the API client
jest.mock("@/lib/apiClient", () => ({
  apiPost: jest.fn(),
}));

// Mock the Next.js router
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

const apiPostMock = apiPost as jest.MockedFunction<typeof apiPost>;

describe("NewServicePage", () => {
  beforeEach(() => {
    apiPostMock.mockReset();
    mockPush.mockReset();
  });

  it("renders the form components successfully", () => {
    render(<NewServicePage />);

    expect(screen.getByRole("heading", { name: /new service/i })).toBeInTheDocument();
    expect(screen.getByLabelText("Service ID")).toBeInTheDocument();
    expect(screen.getByLabelText("Price (stroops / request)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /register service/i })).toBeInTheDocument();
  });

  it("marks Service ID as required and limits its length", () => {
    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    expect(serviceIdInput).toBeRequired();
    expect(serviceIdInput).toHaveAttribute("maxLength", "128");
  });

  it("marks Price as required and numeric", () => {
    render(<NewServicePage />);

    const priceInput = screen.getByLabelText("Price (stroops / request)");
    expect(priceInput).toBeRequired();
    expect(priceInput).toHaveAttribute("inputMode", "numeric");
  });

  it("shows validation error on negative price", async () => {
    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(serviceIdInput, { target: { value: "test-service" } });
    fireEvent.change(priceInput, { target: { value: "-5" } });

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    expect(apiPostMock).not.toHaveBeenCalled();

    // Verify error attaches to the price field
    expect(priceInput).toHaveAttribute("aria-invalid", "true");
    const descId = priceInput.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();

    const errorElement = document.getElementById(descId!);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent("Price must be a non-negative integer.");

    // The page-level alert should not be displayed
    expect(screen.queryByRole("alert", { name: /Price must be/i })).toBeNull();
  });

  it("shows validation error on decimal price", async () => {
    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(serviceIdInput, { target: { value: "test-service" } });
    fireEvent.change(priceInput, { target: { value: "12.34" } });

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    expect(apiPostMock).not.toHaveBeenCalled();

    // Verify error attaches to the price field
    expect(priceInput).toHaveAttribute("aria-invalid", "true");
    const descId = priceInput.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();

    const errorElement = document.getElementById(descId!);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent("Price must be a non-negative integer.");
  });

  it("shows validation error on empty price", async () => {
    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(serviceIdInput, { target: { value: "test-service" } });
    fireEvent.change(priceInput, { target: { value: "   " } });

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    expect(apiPostMock).not.toHaveBeenCalled();

    // Verify error attaches to the price field
    expect(priceInput).toHaveAttribute("aria-invalid", "true");
    const descId = priceInput.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();

    const errorElement = document.getElementById(descId!);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent("Price must be a non-negative integer.");
  });

  it("submits the form successfully with valid inputs and redirects", async () => {
    apiPostMock.mockResolvedValueOnce({} as never);

    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(serviceIdInput, { target: { value: "test-service" } });
    fireEvent.change(priceInput, { target: { value: "100" } });

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/api/v1/services", {
        serviceId: "test-service",
        priceStroops: 100,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/services");
    });
  });

  it("displays backend error (invalid_request) in a page-level alert", async () => {
    apiPostMock.mockRejectedValueOnce(new Error("invalid_request: Service ID already exists"));

    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(serviceIdInput, { target: { value: "existing-service" } });
    fireEvent.change(priceInput, { target: { value: "50" } });

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/api/v1/services", {
        serviceId: "existing-service",
        priceStroops: 50,
      });
    });

    // Check page-level alert
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveClass("text-rose-600");
    expect(alert).toHaveTextContent("invalid_request: Service ID already exists");
  });

  it("disables the submit button and displays Saving... while submitting", async () => {
    let resolvePost: (value: unknown) => void = () => {};
    const postPromise = new Promise((resolve) => {
      resolvePost = resolve;
    });
    apiPostMock.mockReturnValueOnce(postPromise as never);

    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");
    const submitButton = screen.getByRole("button", { name: /register service/i });

    fireEvent.change(serviceIdInput, { target: { value: "test-service" } });
    fireEvent.change(priceInput, { target: { value: "10" } });

    fireEvent.submit(submitButton);

    // Button should show loading state immediately
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Saving…");

    // Button should have aria-busy while loading
    expect(submitButton).toHaveAttribute("aria-busy", "true");

    // Resolve post request
    resolvePost({});

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/services");
    });

    // aria-busy should be removed after submission
    await waitFor(() => {
      expect(submitButton).not.toHaveAttribute("aria-busy");
    });
  });

  it("shows validation error on non-numeric alphabetic price", async () => {
    render(<NewServicePage />);

    const serviceIdInput = screen.getByLabelText("Service ID");
    const priceInput = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(serviceIdInput, { target: { value: "s" } });
    fireEvent.change(priceInput, { target: { value: "abc" } });

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    expect(apiPostMock).not.toHaveBeenCalled();

    expect(priceInput).toHaveAttribute("aria-invalid", "true");
    const descId = priceInput.getAttribute("aria-describedby");
    expect(descId).toBeTruthy();

    const errorElement = document.getElementById(descId!);
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveTextContent("Price must be a non-negative integer.");
  });

  it("accepts price of zero", async () => {
    apiPostMock.mockResolvedValueOnce({} as never);

    render(<NewServicePage />);

    fireEvent.change(screen.getByLabelText("Service ID"), { target: { value: "free-svc" } });
    fireEvent.change(screen.getByLabelText("Price (stroops / request)"), { target: { value: "0" } });
    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/api/v1/services", {
        serviceId: "free-svc",
        priceStroops: 0,
      });
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/services");
    });
  });

  it("submits with empty serviceId (no client-side guard)", async () => {
    apiPostMock.mockResolvedValueOnce({} as never);

    render(<NewServicePage />);

    fireEvent.change(screen.getByLabelText("Price (stroops / request)"), { target: { value: "50" } });
    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/api/v1/services", {
        serviceId: "",
        priceStroops: 50,
      });
    });
  });

  it("clears previous alert error on successful re-submit", async () => {
    apiPostMock.mockRejectedValueOnce(new Error("First failure"));

    render(<NewServicePage />);

    const sid = screen.getByLabelText("Service ID");
    const prc = screen.getByLabelText("Price (stroops / request)");

    fireEvent.change(sid, { target: { value: "retry-svc" } });
    fireEvent.change(prc, { target: { value: "10" } });
    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    expect(await screen.findByRole("alert")).toHaveTextContent("First failure");

    apiPostMock.mockResolvedValueOnce({} as never);

    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/services");
    });
  });

  it("displays backend 409 conflict error in alert", async () => {
    apiPostMock.mockRejectedValueOnce(new Error("Service ID already exists"));

    render(<NewServicePage />);

    fireEvent.change(screen.getByLabelText("Service ID"), { target: { value: "dup-svc" } });
    fireEvent.change(screen.getByLabelText("Price (stroops / request)"), { target: { value: "20" } });
    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Service ID already exists");
    expect(alert).toHaveClass("text-rose-600");
  });

  it("displays generic network error in alert", async () => {
    apiPostMock.mockRejectedValueOnce(new Error("Network error"));

    render(<NewServicePage />);

    fireEvent.change(screen.getByLabelText("Service ID"), { target: { value: "net-svc" } });
    fireEvent.change(screen.getByLabelText("Price (stroops / request)"), { target: { value: "30" } });
    fireEvent.submit(screen.getByRole("button", { name: /register service/i }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Network error");
  });
});
