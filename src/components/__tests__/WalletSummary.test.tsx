import { render, screen } from "@testing-library/react";
import { WalletSummary } from "../WalletSummary";

const ADDRESS = "GABCDEFGH1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ123456";

describe("WalletSummary", () => {
  it("renders a truncated version of the address with the full address in the title", () => {
    render(<WalletSummary address={ADDRESS} />);
    const el = screen.getByTitle(ADDRESS);
    expect(el).toBeInTheDocument();
    expect(el.textContent).not.toBe(ADDRESS);
    expect(el.textContent).toContain("…");
  });

  it("renders the balance when provided", () => {
    render(<WalletSummary address={ADDRESS} balance="1,250.00 USDC" />);
    expect(screen.getByText("1,250.00 USDC")).toBeInTheDocument();
  });

  it("renders a fallback when balance is omitted", () => {
    render(<WalletSummary address={ADDRESS} />);
    expect(screen.getByText("Balance unavailable")).toBeInTheDocument();
  });

  it("renders a copy button for the address", () => {
    render(<WalletSummary address={ADDRESS} />);
    expect(screen.getByRole("button", { name: "Copy address" })).toBeInTheDocument();
  });
});
