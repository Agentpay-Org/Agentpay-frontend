import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageTitles } from "../pageTitles";

export const metadata: Metadata = {
  title: pageTitles.transactions,
};

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return children;
}
