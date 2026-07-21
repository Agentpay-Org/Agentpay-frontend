import { PageShell } from "@/components/PageShell";
import { messages } from "@/lib/messages";
import { resolveApiBase } from "@/lib/resolveApiBase";
import { safeHref } from "@/lib/url";
import { getSections } from "./endpoints";
import { DocsFilter } from "./DocsFilter";

export const metadata = { title: "Docs — AgentPay" };

export default function DocsPage() {
  const baseUrl = resolveApiBase();
  const sections = getSections(baseUrl);

  const openApiLink = safeHref("/api/v1/openapi.json");
  const referenceLink = safeHref(
    "https://github.com/Agentpay-Org/Agentpay-frontend/blob/main/docs/api-integration.md",
  );

  return (
    <PageShell maxWidth="3xl" gap="6">
      <h1 className="text-3xl font-semibold tracking-tight">{messages.docs.heading}</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {messages.docs.introCompanionPrefix}
        {openApiLink.ok ? (
          <a className="underline" href={openApiLink.href}>
            {messages.docs.introOpenApi}
          </a>
        ) : (
          messages.docs.introOpenApi
        )}
        {messages.docs.introCompanionSuffix}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {messages.docs.referencePrefix}
        {referenceLink.ok ? (
          <a
            className="underline"
            href={referenceLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {messages.docs.referenceLink}
          </a>
        ) : (
          messages.docs.referenceLink
        )}
        {messages.docs.referenceSuffix}
      </p>
      <DocsFilter sections={sections} />
    </PageShell>
  );
}
