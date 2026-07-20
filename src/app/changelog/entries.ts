export type ChangelogEntry = {
  version: string;
  date: string;
  notes: string[];
};

export const getEntries = (): ChangelogEntry[] => [
  {
    version: "v1.2.0",
    date: "2026-06-23",
    notes: [
      "Added usage exports in JSON and CSV formats",
      "Improved pagination performance for large datasets",
      "Fixed timezone handling in event timestamps",
    ],
  },
  {
    version: "v1.1.0",
    date: "2026-05-15",
    notes: [
      "Added webhook management interface",
      "Implemented API key rotation",
      "Enhanced error messages in usage metering",
    ],
  },
  {
    version: "v1.0.0",
    date: "2026-04-01",
    notes: [
      "Initial release of AgentPay frontend",
      "Complete usage tracking dashboard",
      "Service and agent management",
      "Admin controls for system pause/unpause",
    ],
  },
];
