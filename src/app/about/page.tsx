import Link from "next/link";
import { messages } from "@/lib/messages";
import { PageShell } from "@/components/PageShell";

export const metadata = { title: "About — AgentPay" };

const surfaces = [
  { label: "Service registry", href: "/services" },
  { label: "Usage metering", href: "/usage" },
  { label: "Billing quotes", href: "/docs" },
  { label: "Audit log", href: "/events" },
  { label: "Webhooks", href: "/webhooks" },
  { label: "API keys", href: "/api-keys" },
  { label: "Admin pause/unpause", href: "/admin" },
];

export default function AboutPage() {
  return (
    <PageShell maxWidth="2xl" gap="4">
      <h1 className="text-3xl font-semibold tracking-tight">
        {messages.about.heading}
      </h1>
      <p className="text-zinc-700 dark:text-zinc-300">
        {messages.about.intro}
      </p>
      <p className="text-zinc-700 dark:text-zinc-300">
        {messages.about.surfacesIntro}
      </p>
      <nav aria-label={messages.about.navLabel}>
        <ul className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          {surfaces.map((surface) => (
            <li key={surface.href}>
              <Link
                href={surface.href}
                className="block rounded-md px-3 py-2 text-blue-700 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:text-blue-300"
              >
                {surface.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </PageShell>
  );
}
