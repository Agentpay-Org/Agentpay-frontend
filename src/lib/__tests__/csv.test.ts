import { usageRowsToCsv } from "../csv";

describe("usageRowsToCsv", () => {
  it("returns only the header row when the current table is empty", () => {
    expect(usageRowsToCsv([])).toBe("agent,serviceId,total");
  });

  it("escapes commas, quotes, and newlines safely", () => {
    expect(
      usageRowsToCsv([
        {
          agent: 'agent,"quoted"',
          serviceId: "svc\nalpha",
          total: 12,
        },
      ]),
    ).toBe('agent,serviceId,total\n"agent,""quoted""","svc\nalpha",12');
  });
});