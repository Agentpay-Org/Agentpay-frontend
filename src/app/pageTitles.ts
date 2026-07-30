export const pageTitles = {
  services: "Services",
  serviceNew: "New service",
  usage: "Usage metering",
  agents: "Agents",
  admin: "Admin",
  stats: "Stats",
  events: "Event log",
  webhooks: "Webhooks",
  reports: "Reports",
  apiKeys: "API keys",
  search: "Search",
} as const;

export const serviceTitle = (serviceId: string) => `Service ${serviceId}`;
export const serviceEditTitle = (serviceId: string) => `Edit service ${serviceId}`;
export const serviceAgentsTitle = (serviceId: string) =>
  `Top agents ${serviceId}`;
export const agentTitle = (agent: string) => `Agent ${agent}`;
