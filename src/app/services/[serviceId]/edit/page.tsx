"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/ToastProvider";
import { apiGet, apiPatch } from "@/lib/apiClient";

type Service = { serviceId: string; priceStroops: number };

/**
 * Returns true only after the original prefill value is known and the operator
 * has changed the visible price field.
 */
export function isDirtyPrice(currentPrice: string, initialPrice: string | null) {
  return initialPrice !== null && currentPrice !== initialPrice;
}

export default function EditServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [initialPrice, setInitialPrice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dirty = isDirtyPrice(price, initialPrice);
  const serviceHref = `/services/${encodeURIComponent(serviceId)}`;

  useEffect(() => {
    let active = true;
    setError(null);
    setPrefillLoading(true);

    apiGet<Service>(`/api/v1/services/${encodeURIComponent(serviceId)}`)
      .then((service) => {
        if (!active) return;
        const nextPrice = String(service.priceStroops);
        setPrice(nextPrice);
        setInitialPrice(nextPrice);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setPrefillLoading(false);
      });

    return () => {
      active = false;
    };
  }, [serviceId]);

  useEffect(() => {
    if (!dirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const onBackClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!dirty) return;
    if (!window.confirm("Discard unsaved price changes?")) {
      event.preventDefault();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = Number(price);
    if (!Number.isInteger(n) || n < 0) {
      setError("Price must be a non-negative integer.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch(
        `/api/v1/services/${encodeURIComponent(serviceId)}/price`,
        { priceStroops: n }
      );
      setInitialPrice(String(n));
      toast.push("Service price saved.", "info");
      router.push(serviceHref);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col gap-6 p-8 focus:outline-none"
    >
      <Link
        href={serviceHref}
        onClick={onBackClick}
        className="self-start text-sm text-zinc-500 hover:underline"
      >
        Back to service
      </Link>
      <h1 className="text-3xl font-semibold tracking-tight">Edit price</h1>
      <p className="font-mono text-sm text-zinc-500">{serviceId}</p>
      {prefillLoading && <Spinner label="Loading service price" />}
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span>Price (stroops / request)</span>
          <input
            required
            inputMode="numeric"
            value={price}
            disabled={prefillLoading || saving}
            onChange={(e) => setPrice(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <button
          type="submit"
          disabled={prefillLoading || saving}
          className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
