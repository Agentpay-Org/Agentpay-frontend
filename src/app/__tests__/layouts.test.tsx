import { render, screen } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import type { Metadata } from "next";
import { pageTitles } from "../pageTitles";

import AdminLayout, { metadata as adminMetadata } from "../admin/layout";
import AgentsLayout, { metadata as agentsMetadata } from "../agents/layout";
import ApiKeysLayout, { metadata as apiKeysMetadata } from "../api-keys/layout";
import EventsLayout, { metadata as eventsMetadata } from "../events/layout";
import SearchLayout, { metadata as searchMetadata } from "../search/layout";
import ServicesLayout, { metadata as servicesMetadata } from "../services/layout";
import StatsLayout, { metadata as statsMetadata } from "../stats/layout";
import UsageLayout, { metadata as usageMetadata } from "../usage/layout";
import WebhooksLayout, { metadata as webhooksMetadata } from "../webhooks/layout";

type LayoutComponent = ComponentType<{ children: ReactNode }>;

type LayoutCase = {
  name: string;
  Layout: LayoutComponent;
  metadata: Metadata;
  expectedTitle: string;
};

// Add one row per route-segment layout to extend coverage to new segments.
const layoutCases: LayoutCase[] = [
  { name: "admin", Layout: AdminLayout, metadata: adminMetadata, expectedTitle: pageTitles.admin },
  { name: "agents", Layout: AgentsLayout, metadata: agentsMetadata, expectedTitle: pageTitles.agents },
  { name: "api-keys", Layout: ApiKeysLayout, metadata: apiKeysMetadata, expectedTitle: pageTitles.apiKeys },
  { name: "events", Layout: EventsLayout, metadata: eventsMetadata, expectedTitle: pageTitles.events },
  { name: "search", Layout: SearchLayout, metadata: searchMetadata, expectedTitle: pageTitles.search },
  { name: "services", Layout: ServicesLayout, metadata: servicesMetadata, expectedTitle: pageTitles.services },
  { name: "stats", Layout: StatsLayout, metadata: statsMetadata, expectedTitle: pageTitles.stats },
  { name: "usage", Layout: UsageLayout, metadata: usageMetadata, expectedTitle: pageTitles.usage },
  { name: "webhooks", Layout: WebhooksLayout, metadata: webhooksMetadata, expectedTitle: pageTitles.webhooks },
];

describe.each(layoutCases)("$name layout", ({ Layout, metadata, expectedTitle }) => {
  it("renders its children", () => {
    render(
      <Layout>
        <p>segment content</p>
      </Layout>
    );

    expect(screen.getByText("segment content")).toBeInTheDocument();
  });

  it("exports metadata whose title matches pageTitles", () => {
    expect(metadata.title).toBe(expectedTitle);
  });
});
