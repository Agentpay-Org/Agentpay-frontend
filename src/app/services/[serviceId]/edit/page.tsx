"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPatch } from "@/lib/apiClient";
import { mapApiError } from "@/lib/mapApiError";
import { PageShell } from "@/components/PageShell";
import { TextField } from "@/components/TextField";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/components/ToastProvider";
import { parseNonNegativeInt } from "@/lib/validateNumber";

type Service = { serviceId: string; priceStroops: number };

export default function EditServicePage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = use(params);
  const router = useRouter();
  const toast = useToast();
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(true);
  const [prefillError, setPrefillError] = useState<string | null>(null);
  const [originalPrice, setOriginalPrice] = useState<string | null>(null);

  /**
   * Whether the price field differs from the originally-fetched value.
   * Derived during render (not stored in state) so it stays in sync without a
   * setState-in-effect. Used by the unsaved-changes guard.
   */
  const dirty = originalPrice !== null && price !== originalPrice;

  useEffect(() => {
    const load = async () => {
      setPrefillLoading(true);
      setPrefillError(null);
      try {
        const s = await apiGet<Service>(
          `/api/v1/services/${encodeURIComponent(serviceId)}`,
        );
        const prefilled = String(s.priceStroops);
        setPrice(prefilled);
        setOriginalPrice(prefilled);
      } catch (e) {
        setPrefillError(mapApiError(e).message);
      } finally {
        setPrefillLoading(false);
      }
    };
    void load();
  }, [serviceId]);

  /*
   * beforeunload guard: registers a `beforeunload` event on the window
   * whenever the form is dirty so the browser prompts the operator before
   * closing or navigating away.
   */
  useEffect(() => {
    if (!dirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (dirty && !window.confirm("You have unsaved changes. Are you sure you want to leave?")) {
      e.preventDefault();
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = parseNonNegativeInt(price);
    if (!parsed.ok) {
      setError(parsed.message);
      return;
    }

    setSaving(true);
    try {
      await apiPatch(
        `/api/v1/services/${encodeURIComponent(serviceId)}/price`,
        { priceStroops: parsed.value }
      );
      setOriginalPrice(price);
      toast.push("Price updated.", "info");
      router.push(`/services/${encodeURIComponent(serviceId)}`);
    } catch (err) {
      setError(mapApiError(err).message);
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
        href={`/services/${encodeURIComponent(serviceId)}`}
        onClick={handleBack}
        className="text-sm text-zinc-500 hover:underline"
      >
        ← Back to service
      </Link>

      <h1 className="text-3xl font-semibold tracking-tight">Edit price</h1>
      <p className="font-mono text-sm text-zinc-500">{serviceId}</p>

      {prefillLoading && <Spinner label="Loading service details" />}

      {prefillError && (
        <p role="alert" className="text-sm text-rose-600">
          {prefillError}
        </p>
      )}

      {!prefillLoading && !prefillError && (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <TextField
            label="Price (stroops / request)"
            inputMode="numeric"
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            error={error}
            description="Accepted range: 0 – 9,007,199,254,740,991 stroops"
          />
          <button
            type="submit"
            disabled={saving}
            className="self-start rounded-full bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </form>
      )}
    </main>
  );
}
