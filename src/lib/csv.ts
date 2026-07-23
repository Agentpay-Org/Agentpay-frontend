export type UsageCsvRow = {
  agent: string;
  serviceId: string;
  total: number;
};

const USAGE_CSV_HEADERS = ["agent", "serviceId", "total"] as const;

function escapeCsvValue(value: string | number): string {
  const text = String(value);
  if (!/[",\r\n]/.test(text)) {
    return text;
  }
  return `"${text.replace(/"/g, '""')}"`;
}

export function usageRowsToCsv(rows: UsageCsvRow[]): string {
  const lines = [USAGE_CSV_HEADERS.join(",")];
  rows.forEach((row) => {
    lines.push(
      [row.agent, row.serviceId, row.total].map((value) => escapeCsvValue(value)).join(","),
    );
  });
  return lines.join("\n");
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}