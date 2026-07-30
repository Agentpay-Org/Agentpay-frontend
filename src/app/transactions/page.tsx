"use client";

import { memo } from "react";
import { EmptyState } from "@/components/EmptyState";
import { ErrorMessage } from "@/components/ErrorMessage";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

export type Transaction = {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
};

type TransactionsResponse = { transactions?: Transaction[] };

function TransactionRowInner({ transaction }: { transaction: Transaction }) {
  return (
    <li className="flex items-center justify-between py-3 text-sm">
      <span className="font-mono" title={transaction.id}>
        {transaction.id}
      </span>
      <span className="text-zinc-500 dark:text-zinc-400">{transaction.status}</span>
      <span>{transaction.amount}</span>
    </li>
  );
}

/**
 * Memoized so re-renders of the surrounding list (e.g. a sibling row's
 * state changing) don't re-render every other row.
 */
export const TransactionRow = memo(TransactionRowInner);

export default function TransactionsPage() {
  const state = useApi<TransactionsResponse>("/api/v1/transactions");
  const transactions = state.status === "ok" ? (state.data.transactions ?? []) : null;

  const announcement =
    state.status === "loading"
      ? "Loading transactions."
      : state.status === "error"
        ? `Failed to load transactions: ${state.error}`
        : transactions && transactions.length === 0
          ? "No transactions to show."
          : transactions
            ? `Loaded ${transactions.length} transaction${transactions.length === 1 ? "" : "s"}.`
            : "";

  return (
    <PageShell>
      <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
      {/* Announces loading/error/empty/loaded transitions to screen readers
          without duplicating the visible content below. */}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
      {state.status === "loading" && (
        <div className="flex justify-center py-10">
          <Spinner label="Loading transactions" />
        </div>
      )}
      {state.status === "error" && (
        <ErrorMessage
          title="Failed to load transactions"
          detail={state.error}
          onRetry={state.retry}
        />
      )}
      {transactions && transactions.length === 0 && (
        <EmptyState
          title="No transactions yet."
          description="Transactions will appear here once agents start making payments."
        />
      )}
      {transactions && transactions.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {transactions.map((t) => (
            <TransactionRow key={t.id} transaction={t} />
          ))}
        </ul>
      )}
    </PageShell>
  );
}
