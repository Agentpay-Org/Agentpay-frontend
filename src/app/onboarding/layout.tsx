import type { ReactNode } from "react";
import type { Metadata } from "next";
import { pageTitles } from "../pageTitles";

export const metadata: Metadata = {
  title: pageTitles.onboarding,
};

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return children;
}
