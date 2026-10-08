export interface RoadmapItem {
  title: string;
  description: string;
  tag?: string;
  status: "in-progress" | "planned" | "exploring";
}

export interface RoadmapPhase {
  phase: string;
  timeline: string;
  theme: string;
  badge: string;
  status: "active" | "upcoming";
  items: RoadmapItem[];
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    timeline: "Weeks 1–4",
    theme: "Operational Automation & v1.0 Polish",
    badge: "In Progress",
    status: "active",
    items: [
      {
        title: "Automated Upstream Synchronization Schedules",
        description:
          "Configure automated background cron triggers via Supabase Edge Workers to keep public product cycles, EOL milestones, and CVE records continuously fresh without manual admin intervention.",
        tag: "Data Automation",
        status: "in-progress",
      },
      {
        title: "Public Read-Only JSON API (/api/v1/products)",
        description:
          "Provide lightweight, unauthenticated REST API endpoints for software developers and platform engineers to query lifecycle status directly via curl or CI/CD pipelines.",
        tag: "Developer API",
        status: "in-progress",
      },
      {
        title: "CycloneDX VEX & Advanced Risk Exports",
        description:
          "Extend fleet risk export capabilities beyond basic CSV to include industry-standard CycloneDX VEX (Vulnerability Exploitability eXchange) and executive PDF audit briefs.",
        tag: "Risk & Compliance",
        status: "planned",
      },
      {
        title: "Release Notes & Interactive Roadmap Modals",
        description:
          "In-app governance modals surfacing platform version milestones and transparent architectural direction.",
        tag: "User Experience",
        status: "in-progress",
      },
    ],
  },
  {
    phase: "Phase 2",
    timeline: "Months 2–3",
    theme: "Ecosystem & Enterprise Collaboration",
    badge: "Upcoming",
    status: "upcoming",
    items: [
      {
        title: "Software Bill of Materials (SBOM) Drag & Drop",
        description:
          "Enable security teams to upload CycloneDX or SPDX 2.3 JSON/XML SBOM files into the Risk Dashboard to instantly cross-reference entire component inventories against EOL databases.",
        tag: "Cybersecurity",
        status: "planned",
      },
      {
        title: "Persistent Multi-Fleet Inventories",
        description:
          "Allow authenticated engineering teams to maintain multiple named environments (e.g., 'AWS Production EKS', 'On-Premises VMware', 'Core Banking Nodes') in PostgreSQL.",
        tag: "Fleet Management",
        status: "planned",
      },
      {
        title: "Proactive EOL Alerts (Slack, Teams, Email)",
        description:
          "Configurable threshold alerts notifying platform owners 180, 90, and 30 days before any software component in their fleet reaches end of life.",
        tag: "Alerts & Webhooks",
        status: "planned",
      },
      {
        title: "Side-by-Side Vendor Support Matrices",
        description:
          "Direct comparative analysis of lifecycle support terms across vendors (e.g., Oracle JDK vs. Eclipse Temurin vs. Amazon Corretto vs. Azul Zulu).",
        tag: "Marketplace Intel",
        status: "planned",
      },
    ],
  },
  {
    phase: "Phase 3",
    timeline: "Months 4–6",
    theme: "Advanced Intelligence & Enterprise Connectors",
    badge: "Future Vision",
    status: "upcoming",
    items: [
      {
        title: "Predictive EOL Cadence Engine",
        description:
          "Statistical modeling engine estimating anticipated EOL dates and support cutoff windows for newly released software cycles where vendors have not yet published official end dates.",
        tag: "Predictive AI",
        status: "exploring",
      },
      {
        title: "Official CI/CD Quality Gate (GitHub Action & GitLab Plugin)",
        description:
          "Deploy an official GitHub Action (`endoflife-checker-action`) that checks pull requests and container base images, failing builds or warning engineers if approaching EOL packages are introduced.",
        tag: "DevSecOps",
        status: "planned",
      },
      {
        title: "ECMA-428 CLE Compliance Validator",
        description:
          "Interactive compliance checker auditing vendor lifecycle metadata against the ECMA-428 Common Lifecycle Enumeration standard.",
        tag: "Standards & Governance",
        status: "planned",
      },
      {
        title: "Bi-directional ITSM / CMDB Synchronization",
        description:
          "Enterprise connectors to automatically ingest server asset inventories directly from ServiceNow and Jira Assets CMDB.",
        tag: "Enterprise Integrations",
        status: "exploring",
      },
    ],
  },
];
