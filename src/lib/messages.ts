/**
 * Centralized, typed catalog of user-facing strings.
 *
 * This is the single source of truth for English UI copy. It mirrors the style
 * of {@link ../app/pageTitles.ts} (a flat, `as const` object) and is the first,
 * non-breaking step toward internationalization (i18n): components import the
 * strings they render instead of hard-coding them inline.
 *
 * Framework-agnostic by design — no i18n library is wired up yet. A future
 * adoption of `next-intl` / `next-i18next` can wrap this object (e.g. by keying
 * a per-locale catalog off the same namespaced shape) without touching the
 * call sites that already consume `messages`.
 *
 * Conventions:
 * - Group strings by surface (component or page) into namespaces.
 * - Keep keys descriptive and stable; renaming a key is a breaking change for
 *   every consumer, so treat them like an API.
 * - Do NOT change rendered copy when migrating a surface — only relocate it.
 */
export const messages = {
  footer: {
    text: "AgentPay — machine-to-machine payments on Stellar. Pay per request.",
  },
  home: {
    heading: "AgentPay",
    description:
      "Machine-to-machine payment protocol on Stellar. Pay-per-request billing for AI agents and APIs.",
    quickLinksLabel: "Quick links",
    links: {
      services: "Manage services",
      stats: "View stats",
      usage: "Record usage",
      agents: "Agents",
      docs: "Docs",
      stellar: "Stellar",
    },
  },
  about: {
    heading: "About AgentPay",
    intro:
      "AgentPay is a pay-per-request payment protocol for autonomous AI agents and APIs, settled on Stellar via Soroban. Agents accrue usage against registered services off-chain; a settlement worker drains the usage counters and mirrors them on-chain.",
    surfacesIntro:
      "This dashboard exposes every read and write surface the backend provides: service registry, usage metering, billing quotes, audit log, webhooks, API keys, and admin pause/unpause. Use the links below to jump directly to each surface.",
    navLabel: "Dashboard surfaces",
  },
  docs: {
    heading: "API documentation",
    introCompanionPrefix: "Companion to ",
    introOpenApi: "GET /api/v1/openapi.json",
    introCompanionSuffix: " — short prose for the most common endpoints.",
    referencePrefix: "For the complete request/response contract of every endpoint the dashboard calls, see the ",
    referenceLink: "dashboard API integration reference",
    referenceSuffix: ".",
  },
  settings: {
    heading: "Settings",
    appearance: {
      heading: "Appearance",
      description: "Choose a colour scheme. System follows your OS preference.",
    },
    connection: {
      heading: "Connection",
      description: "Resolved API base URL of the AgentPay backend.",
      label: "API Base URL",
    },
  },
} as const;

/**
 * Structural type of the message catalog. Useful for typing a future
 * per-locale catalog so every locale must provide the same keys.
 */
export type Messages = typeof messages;
