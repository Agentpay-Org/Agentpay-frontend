import { CopyButton } from "./CopyButton";
import { truncateMiddle } from "@/lib/format";

export type WalletSummaryProps = {
  /** Full Stellar wallet address (public, not a secret). */
  address: string;
  /** Pre-formatted balance string, e.g. "1,250.00 USDC". Omit while unknown. */
  balance?: string;
};

/**
 * Presentational summary of a Stellar wallet: a truncated, copyable
 * address and an optional pre-formatted balance.
 *
 * Callers own fetching/formatting; this component only renders. Never pass
 * a secret key here — `address` is displayed and copied verbatim.
 */
export function WalletSummary({ address, balance }: WalletSummaryProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <span
          className="font-mono text-sm"
          title={address}
          aria-label={address}
        >
          {truncateMiddle(address)}
        </span>
        <CopyButton value={address} label="Copy address" />
      </div>
      <span className="text-sm text-zinc-500 dark:text-zinc-400">
        {balance ?? "Balance unavailable"}
      </span>
    </div>
  );
}
