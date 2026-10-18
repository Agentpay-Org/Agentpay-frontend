/**
 * Public deployment coordinates for the live AgentPay stack.
 *
 * Every value can be overridden at build time through a NEXT_PUBLIC_* env var;
 * the defaults point at the shared testnet deployment.
 */
export const DEFAULT_BACKEND_URL = "https://agentpay-backend-red.vercel.app";
export const DEFAULT_CONTRACT_ID =
  "CAWQI63RISS2AXF2YSH77RQGUMVMXIAJUIDBW4DTVSTYU2L5TLCAMXNU";

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const BACKEND_URL = trimSlash(
  process.env.NEXT_PUBLIC_AGENTPAY_API_BASE?.trim() || DEFAULT_BACKEND_URL,
);
export const CONTRACT_ID =
  process.env.NEXT_PUBLIC_AGENTPAY_CONTRACT_ID?.trim() || DEFAULT_CONTRACT_ID;
export const STELLAR_NETWORK =
  process.env.NEXT_PUBLIC_AGENTPAY_NETWORK?.trim() || "testnet";

export const CONTRACT_EXPLORER_URL = `https://stellar.expert/explorer/${STELLAR_NETWORK}/contract/${CONTRACT_ID}`;
export const API_DOCS_URL = `${BACKEND_URL}/docs`;
export const OPENAPI_URL = `${BACKEND_URL}/api/v1/openapi.json`;
export const HEALTH_URL = `${BACKEND_URL}/health`;

export const GITHUB_ORG_URL = "https://github.com/Agentpay-Org";
export const REPOS = {
  frontend: `${GITHUB_ORG_URL}/Agentpay-frontend`,
  backend: `${GITHUB_ORG_URL}/Agentpay-backend`,
  contracts: `${GITHUB_ORG_URL}/Agentpay-contracts`,
} as const;

/** Shortens a long identifier for display: CAWQ…MXNU. */
export function shortId(id: string, head = 6, tail = 6): string {
  return id.length <= head + tail + 1 ? id : `${id.slice(0, head)}…${id.slice(-tail)}`;
}
