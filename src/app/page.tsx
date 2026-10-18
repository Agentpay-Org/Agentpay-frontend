import Link from "next/link";
import { messages } from "@/lib/messages";
import { DeploymentCard } from "@/components/marketing/DeploymentCard";
import { API_DOCS_URL, CONTRACT_EXPLORER_URL, REPOS } from "@/lib/deployment";

const features = [
  {
    title: "Pay-per-request metering",
    body: "Register a service with a price in stroops and record usage per agent. Every request is counted, capped and auditable.",
    icon: "M4 19h16M7 16V9m5 7V5m5 11v-4",
  },
  {
    title: "On-chain settlement",
    body: "A Soroban escrow contract on Stellar mirrors usage counters and settles balances with tiered pricing and admin controls.",
    icon: "M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3zm0 0v18m8-13.5L4 16.5m0-9l16 9",
  },
  {
    title: "Built for agents",
    body: "API keys, idempotent writes, rate limits and cursor pagination make it safe for autonomous clients to call at machine speed.",
    icon: "M9 3h6v4H9zM5 7h14v10a4 4 0 01-4 4H9a4 4 0 01-4-4V7zm4 6h.01M15 13h.01",
  },
  {
    title: "Observable by default",
    body: "Audit event log, webhooks with signed retries, Prometheus metrics and deep health checks for every subsystem.",
    icon: "M3 12h4l3-8 4 16 3-8h4",
  },
];

const steps = [
  { n: "1", title: "Register a service", body: "POST /api/v1/services with a serviceId and per-request price." },
  { n: "2", title: "Meter agent usage", body: "Agents call your API; record each call with POST /api/v1/usage." },
  { n: "3", title: "Quote and settle", body: "Billing endpoints compute what is owed; settlement drains counters on-chain." },
];

const primaryButton =
  "inline-flex h-11 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500";
const secondaryButton =
  "inline-flex h-11 items-center justify-center rounded-full border border-zinc-300 px-6 text-sm font-semibold transition hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-zinc-700 dark:hover:bg-zinc-800";

export default function Home() {
  return (
    <main id="main-content" tabIndex={-1} className="focus:outline-none">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 h-[32rem] bg-gradient-to-b from-indigo-200/60 via-sky-100/40 to-transparent blur-3xl dark:from-indigo-900/40 dark:via-sky-900/20"
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              Live on Stellar testnet
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {messages.home.heading}:{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-sky-500 bg-clip-text text-transparent">
                payments for AI agents
              </span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              {messages.home.description} Meter every request off-chain, settle on-chain with a
              Soroban escrow contract.
            </p>
            <nav aria-label={messages.home.quickLinksLabel}>
              <ul className="flex flex-wrap gap-3">
                <li>
                  <Link href="/onboarding" className={primaryButton}>
                    Get started
                  </Link>
                </li>
                <li>
                  <Link href="/docs" className={secondaryButton}>
                    {messages.home.links.docs}
                  </Link>
                </li>
                <li>
                  <Link href="/services" className={secondaryButton}>
                    {messages.home.links.services}
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <DeploymentCard />
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="border-t border-zinc-200 bg-zinc-50/60 py-16 dark:border-zinc-800 dark:bg-zinc-950/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="features-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything you need to charge machines
          </h2>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            AgentPay pairs a metering and billing API with a Stellar smart contract, so usage is
            fast to record and trustworthy to settle.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-8 w-8 rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{f.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 id="how-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {steps.map((s) => (
              <li key={s.n} className="relative rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-sky-500 text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Explore */}
      <section aria-labelledby="explore-heading" className="pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-br from-zinc-900 to-indigo-950 p-8 text-white sm:p-12">
            <h2 id="explore-heading" className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Explore the live stack
            </h2>
            <p className="mt-2 max-w-2xl text-zinc-300">
              The dashboard talks to the deployed backend. Browse services, agents and usage, or
              go straight to the API reference and the contract on stellar.expert.
            </p>
            <ul className="mt-8 flex flex-wrap gap-3 text-sm font-semibold">
              <li><Link className="inline-flex h-10 items-center rounded-full bg-white px-5 text-zinc-900 hover:bg-zinc-200" href="/stats">{messages.home.links.stats}</Link></li>
              <li><Link className="inline-flex h-10 items-center rounded-full border border-white/30 px-5 hover:bg-white/10" href="/usage">{messages.home.links.usage}</Link></li>
              <li><Link className="inline-flex h-10 items-center rounded-full border border-white/30 px-5 hover:bg-white/10" href="/agents">{messages.home.links.agents}</Link></li>
              <li><a className="inline-flex h-10 items-center rounded-full border border-white/30 px-5 hover:bg-white/10" href={API_DOCS_URL} target="_blank" rel="noopener noreferrer">API reference</a></li>
              <li><a className="inline-flex h-10 items-center rounded-full border border-white/30 px-5 hover:bg-white/10" href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer">Contract on stellar.expert</a></li>
              <li><a className="inline-flex h-10 items-center rounded-full border border-white/30 px-5 hover:bg-white/10" href={REPOS.frontend} target="_blank" rel="noopener noreferrer">GitHub</a></li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  );
}
