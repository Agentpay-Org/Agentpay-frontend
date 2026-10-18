import {
  API_DOCS_URL,
  BACKEND_URL,
  CONTRACT_EXPLORER_URL,
  CONTRACT_ID,
  HEALTH_URL,
  STELLAR_NETWORK,
  shortId,
} from "@/lib/deployment";

const rowClass =
  "flex flex-col gap-1 border-b border-zinc-200/70 py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800";
const labelClass = "text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400";
const linkClass =
  "font-mono text-sm text-indigo-600 underline-offset-4 hover:underline break-all dark:text-indigo-400";

/** Live deployment coordinates: network, contract and backend endpoints. */
export function DeploymentCard({ title = "Live deployment" }: { title?: string }) {
  return (
    <section
      aria-label={title}
      className="rounded-2xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <dl>
        <div className={rowClass}>
          <dt className={labelClass}>Network</dt>
          <dd className="text-sm">Stellar {STELLAR_NETWORK}</dd>
        </div>
        <div className={rowClass}>
          <dt className={labelClass}>Escrow contract</dt>
          <dd>
            <a className={linkClass} href={CONTRACT_EXPLORER_URL} target="_blank" rel="noopener noreferrer" title={CONTRACT_ID}>
              {shortId(CONTRACT_ID, 8, 8)}
            </a>
          </dd>
        </div>
        <div className={rowClass}>
          <dt className={labelClass}>Backend API</dt>
          <dd>
            <a className={linkClass} href={BACKEND_URL} target="_blank" rel="noopener noreferrer">
              {BACKEND_URL.replace(/^https?:\/\//, "")}
            </a>
          </dd>
        </div>
        <div className={rowClass}>
          <dt className={labelClass}>API reference</dt>
          <dd className="flex gap-4">
            <a className={linkClass} href={API_DOCS_URL} target="_blank" rel="noopener noreferrer">
              /docs
            </a>
            <a className={linkClass} href={HEALTH_URL} target="_blank" rel="noopener noreferrer">
              /health
            </a>
          </dd>
        </div>
      </dl>
    </section>
  );
}
