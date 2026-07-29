"use client";

import { useApi } from "@/lib/useApi";
import { PageShell } from "@/components/PageShell";
import { Spinner } from "@/components/Spinner";
import { ErrorMessage } from "@/components/ErrorMessage";
import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";

type HelpTopic = { id: string; title: string; content: string };

export default function HelpPage() {
  const state = useApi<{ topics: HelpTopic[] }>("/api/v1/help");

  return (
    <PageShell>
      <PageHeading title="Help" />
      {state.status === "loading" && (
        <div className="flex justify-center py-10" data-testid="help-loading">
          <Spinner label="Loading help topics" />
        </div>
      )}
      {state.status === "error" && (
        <div data-testid="help-error">
          <ErrorMessage title="Failed to load help topics" detail={state.error} />
        </div>
      )}
      {state.status === "ok" && state.data.topics.length === 0 && (
        <div data-testid="help-empty">
          <EmptyState
            title="No help topics found."
            description="Check back later for new guides and tutorials."
          />
        </div>
      )}
      {state.status === "ok" && state.data.topics.length > 0 && (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800" data-testid="help-success">
          {state.data.topics.map((topic) => (
            <li key={topic.id} className="py-4">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">{topic.title}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{topic.content}</p>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
