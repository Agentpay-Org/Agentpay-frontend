import { act, render } from "@testing-library/react";
import { useOnlineStatus } from "../useOnlineStatus";

function Probe({ onChange }: { onChange: (v: { isOnline: boolean }) => void }) {
  const status = useOnlineStatus();
  onChange(status);
  return null;
}

describe("useOnlineStatus", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: true,
    });
  });

  it("returns online when navigator.onLine is true", () => {
    const cb = jest.fn();
    render(<Probe onChange={cb} />);
    expect(cb).toHaveBeenLastCalledWith({ isOnline: true });
  });

  it("returns offline when navigator.onLine is false", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });
    const cb = jest.fn();
    render(<Probe onChange={cb} />);
    expect(cb).toHaveBeenLastCalledWith({ isOnline: false });
  });

  it("reacts to the offline event", () => {
    const cb = jest.fn();
    render(<Probe onChange={cb} />);
    cb.mockClear();

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: false,
      });
      window.dispatchEvent(new Event("offline"));
    });

    expect(cb).toHaveBeenLastCalledWith({ isOnline: false });
  });

  it("reacts to the online event", () => {
    Object.defineProperty(navigator, "onLine", {
      configurable: true,
      value: false,
    });

    const cb = jest.fn();
    render(<Probe onChange={cb} />);
    expect(cb).toHaveBeenLastCalledWith({ isOnline: false });
    cb.mockClear();

    act(() => {
      Object.defineProperty(navigator, "onLine", {
        configurable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));
    });

    expect(cb).toHaveBeenLastCalledWith({ isOnline: true });
  });

  it("cleans up event listeners on unmount", () => {
    const addSpy = jest.spyOn(window, "addEventListener");
    const removeSpy = jest.spyOn(window, "removeEventListener");

    const cb = jest.fn();
    const { unmount } = render(<Probe onChange={cb} />);

    expect(addSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(addSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("offline", expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });
});
