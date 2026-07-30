import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import { Activity, AppEvent } from "./Activity";
import * as formatModule from "@/lib/format";
import userEvent from "@testing-library/user-event";

describe("Activity Component Memoization", () => {
  it("does not re-render when props are stable", async () => {
    const stringifySpy = jest.spyOn(formatModule, "safeStringify");
    const user = userEvent.setup();
    
    const mockEvent: AppEvent = {
      id: "1",
      ts: 1234567890,
      type: "test.event",
      payload: { foo: "bar" },
    };

    function Wrapper() {
      const [count, setCount] = useState(0);
      return (
        <div>
          <button onClick={() => setCount(c => c + 1)}>Increment</button>
          <p>Count: {count}</p>
          <Activity event={mockEvent} />
        </div>
      );
    }

    render(<Wrapper />);
    
    // Initial render
    expect(stringifySpy).toHaveBeenCalledTimes(1);
    
    // Trigger re-render of parent
    await user.click(screen.getByText("Increment"));
    
    expect(screen.getByText("Count: 1")).toBeInTheDocument();
    
    // If Activity is memoized, safeStringify should not be called again
    expect(stringifySpy).toHaveBeenCalledTimes(1);

    stringifySpy.mockRestore();
  });
});
