"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/apiClient";
import { PageShell } from "@/components/PageShell";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { parseNonNegativeInt } from "@/lib/validateNumber";

export default function NewServicePage() {
  const router = useRouter();
  const [serviceId, setServiceId] = useState("");
  const [priceStroops, setPriceStroops] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPriceError(null);

    const parsed = parseNonNegativeInt(priceStroops);
    if (!parsed.ok) {
      setPriceError(parsed.message);
      return;
    }

    setLoading(true);
    try {
      await apiPost("/api/v1/services", {
        serviceId,
        priceStroops: parsed.value,
      });
      router.push("/services");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell maxWidth="xl" gap="6">
      <h1 className="text-3xl font-semibold tracking-tight">New service</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <TextField
          label="Service ID"
          required
          maxLength={128}
          value={serviceId}
          onChange={(e) => setServiceId(e.target.value)}
        />

        <TextField
          label="Price (stroops / request)"
          inputMode="numeric"
          required
          value={priceStroops}
          onChange={(e) => setPriceStroops(e.target.value)}
          error={priceError || undefined}
        />

        <Button
          type="submit"
          loading={loading}
          disabled={loading}
          className="self-start"
        >
          {loading ? "Saving…" : "Register service"}
        </Button>

        {error && (
          <p role="alert" className="text-sm text-rose-600">
            {error}
          </p>
        )}
      </form>
    </PageShell>
  );
}

