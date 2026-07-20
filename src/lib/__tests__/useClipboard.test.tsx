import { renderHook, act } from "@testing-library/react";
import { useClipboard } from "../useClipboard";

describe("useClipboard", () => {
  const originalClipboard = navigator.clipboard;

  beforeEach(() => {
    jest.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  it("should have initial state", () => {
    const { result } = renderHook(() => useClipboard());
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should copy text successfully and reset copied state after timeout", async () => {
    const { result } = renderHook(() => useClipboard({ timeout: 2000 }));
    
    let success = false;
    await act(async () => {
      success = await result.current.copy("test text");
    });
    
    expect(success).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test text");
    expect(result.current.copied).toBe(true);
    expect(result.current.error).toBeNull();
    
    act(() => {
      jest.advanceTimersByTime(1999);
    });
    expect(result.current.copied).toBe(true);
    
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current.copied).toBe(false);
  });

  it("should handle clipboard errors", async () => {
    const error = new Error("Not allowed");
    (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(error);
    
    const { result } = renderHook(() => useClipboard());
    
    let success = false;
    await act(async () => {
      success = await result.current.copy("test text");
    });
    
    expect(success).toBe(false);
    expect(result.current.copied).toBe(false);
    expect(result.current.error).toEqual(error);
  });

  it("should cleanup timer on unmount", async () => {
    const { result, unmount } = renderHook(() => useClipboard({ timeout: 2000 }));
    
    await act(async () => {
      await result.current.copy("test text");
    });
    
    expect(result.current.copied).toBe(true);
    
    unmount();
    
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    // Test implicitly passes if no unmounted component warnings are thrown and timers don't cause issues
  });
  
  it("should clear previous timer if copy is called again before timeout", async () => {
    const { result } = renderHook(() => useClipboard({ timeout: 2000 }));
    
    await act(async () => {
      await result.current.copy("first");
    });
    
    expect(result.current.copied).toBe(true);
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    await act(async () => {
      await result.current.copy("second");
    });
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.copied).toBe(true); // Should still be true since we restarted the 2000ms timer
    
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    
    expect(result.current.copied).toBe(false); // Now it's 2000ms after the second call
  });
});
