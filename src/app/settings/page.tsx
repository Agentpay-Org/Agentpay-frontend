import { ThemeToggle } from "@/components/ThemeToggle";
import { PageShell } from "@/components/PageShell";
import { messages } from "@/lib/messages";
import { resolveApiBase } from "@/lib/resolveApiBase";
import { KeyValueGrid } from "@/components/KeyValueGrid";
import { CopyButton } from "@/components/CopyButton";

export const metadata = { title: "Settings — AgentPay" };

export default function SettingsPage() {
  const apiBase = resolveApiBase();

  return (
    <PageShell maxWidth="2xl" gap="8">
      <h1 className="text-3xl font-semibold tracking-tight">{messages.settings.heading}</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{messages.settings.appearance.heading}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {messages.settings.appearance.description}
        </p>
        <ThemeToggle />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{messages.settings.connection.heading}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {messages.settings.connection.description}
        </p>
        <div className="mt-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <KeyValueGrid
            rows={[
              {
                label: messages.settings.connection.label,
                value: (
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">{apiBase}</span>
                    <CopyButton value={apiBase} label="Copy" />
                  </div>
                ),
              },
            ]}
          />
        </div>
      </section>
    </PageShell>
  );
}
