"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/apiClient";
import { AlertError } from "@/components/AlertError";
import { Badge } from "@/components/Badge";
import { CopyButton } from "@/components/CopyButton";
import { KeyValueGrid } from "@/components/KeyValueGrid";
import { PageShell } from "@/components/PageShell";
import { formatStroops } from "@/lib/format";

type Service = { serviceId: string; priceStroops: number };
type Rollup = { serviceId: string; total: number; agents: number };

export default function ServiceDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  const [service, setService] = useState<Service | null>(null);
  const [rollup, setRollup] = useState<Rollup | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<Service>(`/api/v1/services/${encodeURIComponent(serviceId)}`)
      .then((s) => { if (!cancelled) setService(s); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    apiGet<Rollup>(`/api/v1/services/${encodeURIComponent(serviceId)}/usage`)
      .then((r) => { if (!cancelled) setRollup(r); })
      .catch(() => {
        /* rollup is optional */
      });
    return () => { cancelled = true; };
  }, [serviceId]);

  return (
    <PageShell>
      <Link href="/services" className="text-sm text-zinc-500 hover:underline">
        ← Back to services
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight font-mono">
        {serviceId}
      </h1>
      <AlertError message={error} />
      {service && (
        <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
          <KeyValueGrid
            rows={[
              {
                label: "Service ID",
                value: (
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{serviceId}</span>
                    <CopyButton value={serviceId} />
                  </div>
                ),
              },
              {
                label: "Price",
                value: `${formatStroops(service.priceStroops)} (${service.priceStroops} stroops)`,
              },
              {
                label: "Usage",
                value: rollup ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="ok">available</Badge>
                    <span>
                      {rollup.total} / {rollup.agents}
                    </span>
                  </div>
                ) : (
                  <Badge variant="neutral">absent</Badge>
                ),
              },
            ]}
          />
        </div>
      )}
      <div className="flex gap-3">
        <Link
          href={`/services/${encodeURIComponent(serviceId)}/edit`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
        >
          Edit price
        </Link>
        <Link
          href={`/services/${encodeURIComponent(serviceId)}/agents`}
          className="rounded-full border border-zinc-300 px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 dark:border-zinc-700"
        >
          Top agents
        </Link>
      </div>
    </PageShell>
  );
}
