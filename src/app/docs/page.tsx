import Link from "next/link";
import { PageShell } from "@/components/PageShell";
import { messages } from "@/lib/messages";
import { resolveApiBase } from "@/lib/resolveApiBase";
import { safeHref } from "@/lib/url";
import { getSections } from "./endpoints";
import { DocsFilter } from "./DocsFilter";
import { DeploymentCard } from "@/components/marketing/DeploymentCard";
import {
  API_DOCS_URL,
  BACKEND_URL,
  CONTRACT_EXPLORER_URL,
  CONTRACT_ID,
  OPENAPI_URL,
  REPOS,
} from "@/lib/deployment";

const h2 = "mt-4 text-xl font-semibold tracking-tight";
const p = "text-sm leading-7 text-zinc-600 dark:text-zinc-400";
const a = "font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400";
const code = "rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs dark:bg-zinc-800";

export const metadata = { title: "Docs" };

export default function DocsPage() {
  const baseUrl = resolveApiBase();
  const sections = getSections(baseUrl);

  const openApiLink = safeHref(OPENAPI_URL);
  const referenceLink = safeHref(
    "https://github.com/Agentpay-Org/Agentpay-frontend/blob/main/docs/api-integration.md",
  );
  const useApiReferenceLink = safeHref(
    "https://github.com/Agentpay-Org/Agentpay-frontend/blob/main/docs/use-api.md",
  );

  return (
    <PageShell maxWidth="3xl" gap="6">
      <h1 className="text-3xl font-semibold tracking-tight">{messages.docs.heading}</h1>
      <nav aria-label="On this page" className="flex flex-wrap gap-2 text-sm">
        {[
          ["#overview", "Overview"],
          ["#architecture", "Architecture"],
          ["#how-to-use", "How to use"],
          ["#deployments", "Deployments"],
          ["#endpoints", "Endpoints"],
        ].map(([href, label]) => (
          <a key={href} href={href} className="rounded-full border border-zinc-200 px-3 py-1 hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800">
            {label}
          </a>
        ))}
      </nav>

      <section id="overview" aria-labelledby="overview-h" className="flex flex-col gap-3">
        <h2 id="overview-h" className={h2}>Product overview</h2>
        <p className={p}>
          AgentPay is a pay-per-request payment protocol for autonomous AI agents and APIs.
          Providers register services with a per-request price in stroops; agents call those
          services and every call is metered. Outstanding usage is billed and settled on Stellar
          through a Soroban escrow contract, giving both sides an auditable, low-fee settlement layer.
        </p>
      </section>

      <section id="architecture" aria-labelledby="arch-h" className="flex flex-col gap-3">
        <h2 id="arch-h" className={h2}>Architecture</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="font-semibold">Dashboard</p>
            <p className={p}>This Next.js app. Manages services, API keys, webhooks and shows usage, events and stats.</p>
          </li>
          <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="font-semibold">Backend API</p>
            <p className={p}>Express gateway for metering, billing quotes, audit log, webhooks and settlement orchestration.</p>
          </li>
          <li className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="font-semibold">Escrow contract</p>
            <p className={p}>Soroban contract on Stellar that records usage, applies pricing tiers and settles balances.</p>
          </li>
        </ol>
        <p className={p}>
          Flow: agent → backend usage endpoint <code className={code}>/api/v1/usage</code> → usage counters →
          billing quote → settlement mirrored on-chain in the escrow contract.
        </p>
      </section>

      <section id="how-to-use" aria-labelledby="howto-h" className="flex flex-col gap-3">
        <h2 id="howto-h" className={h2}>How to use</h2>
        <ol className="list-decimal space-y-2 pl-5 text-sm leading-7 text-zinc-600 dark:text-zinc-400">
          <li>Register a service by posting to <code className={code}>/api/v1/services {"{"}&quot;serviceId&quot;:&quot;infer&quot;,&quot;priceStroops&quot;:100{"}"}</code></li>
          <li>Record usage for an agent by posting to <code className={code}>/api/v1/usage {"{"}&quot;agent&quot;:&quot;G…&quot;,&quot;serviceId&quot;:&quot;infer&quot;,&quot;requests&quot;:3{"}"}</code></li>
          <li>Inspect usage and billing from the <Link className={a} href="/usage">Usage</Link>, <Link className={a} href="/agents">Agents</Link> and <Link className={a} href="/stats">Stats</Link> pages.</li>
          <li>Subscribe to events with <Link className={a} href="/webhooks">Webhooks</Link> and issue credentials under <Link className={a} href="/api-keys">API Keys</Link>.</li>
        </ol>
        <p className={p}>
          Full interactive reference: <a className={a} href={API_DOCS_URL} target="_blank" rel="noopener noreferrer">{API_DOCS_URL}</a>.
          Backend base URL: <code className={code}>{BACKEND_URL}</code>.
        </p>
      </section>

      <section id="deployments" aria-labelledby="deploy-h" className="flex flex-col gap-3">
        <h2 id="deploy-h" className={h2}>Deployments</h2>
        <DeploymentCard title="Stellar testnet" />
        <p className={p}>
          Escrow contract ID <code className={code}>{CONTRACT_ID}</code> —{" "}
          <a className={a} href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer">view on stellar.expert</a>.
          Source: <a className={a} href={REPOS.contracts} target="_blank" rel="noopener noreferrer">contracts</a>,{" "}
          <a className={a} href={REPOS.backend} target="_blank" rel="noopener noreferrer">backend</a>,{" "}
          <a className={a} href={REPOS.frontend} target="_blank" rel="noopener noreferrer">frontend</a>.
        </p>
      </section>

      <h2 id="endpoints" className={h2}>Endpoints</h2>
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
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        For the hook contract itself, see the{" "}
        {useApiReferenceLink.ok ? (
          <a
            className="underline"
            href={useApiReferenceLink.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            useApi FetchState reference
          </a>
        ) : (
          "useApi FetchState reference"
        )}
        .
      </p>
      <DocsFilter sections={sections} />
    </PageShell>
  );
}
