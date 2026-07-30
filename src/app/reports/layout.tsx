import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageTitles } from "../pageTitles";

export const metadata: Metadata = {
  title: pageTitles.reports,
};

export default function ReportsLayout({ children }: { children: ReactNode }) {
  return children;
}
