export interface ReleaseNote {
  version: string;
  badge?: string;
  releaseDate: string;
  title: string;
  tagline: string;
  highlights: string[];
}

export const RELEASES: ReleaseNote[] = [
  {
    version: "v1.2.0",
    badge: "Enterprise SecOps & Scale",
    releaseDate: "October 2026",
    title: "Enterprise SecOps, SBOM Risk Engine & 4,200+ Products Scale",
    tagline:
      "CycloneDX/SPDX SBOM ingestion, CISA KEV active exploit correlation, PCI-DSS/GRC audit reporting, commercial support bridges, and catalog expansion to 4,228 products.",
    highlights: [
      "Machine-Readable SBOM & Scanner Ingestion: Drag-and-drop parsing for CycloneDX JSON (1.4–1.6), SPDX JSON (2.2–2.3), Trivy, Syft, and CMDB CSVs with instant container and cluster risk evaluation.",
      "Active Threat Correlation & CISA KEV Alerts: Real-time flags for vulnerabilities in the CISA Known Exploited Vulnerabilities catalog (e.g. CVE-2024-4577, CVE-2023-32002) paired with CVSS Critical/High severities.",
      "GRC Compliance Mapping & Audit-Ready Reporting: Built-in regulatory checks for PCI-DSS 4.0 (Req 6.3.3), NIST SP 800-53 (SA-22/SI-2), ISO 27001 (A.8.8), and SOC 2 with printable 1-click executive compliance reports.",
      "Commercial Extended Support & LTS Migration Targets: Enterprise support bridge windows for Ubuntu Pro ESM, Red Hat ELS, Microsoft ESU, AWS EKS, and HeroDevs NES, plus stable LTS upgrade paths.",
      "Operational Exception & Waiver Workflows: Formal Risk Acceptance logging with executive approvers, finite expiration dates, and compensating WAF/network controls, plus copyable Jira and ServiceNow issue templates.",
      "Lightweight CI/CD CLI Gate: Added 'endoflife-check' CLI (npx endoflife-check ./sbom.json) for GitHub Actions / GitLab CI with exit-code enforcement, JSON piping, and automated test coverage across CycloneDX, SPDX, Trivy, and live CISA KEV feeds.",
      "Enterprise Catalog Expansion: Catalog now lists 4,138 products and 11,277 release cycles. About 930 products added in this release are flagged as unverified pending vendor source review; duplicates of existing products were removed and lifecycle statuses recomputed from their dates.",
    ],
  },
  {
    version: "v1.0.0",
    badge: "General Availability",
    releaseDate: "September 21, 2026",
    title: "Official v1.0.0 General Availability (GA) Launch",
    tagline:
      "Full enterprise suite synchronization, runtime risk fleet modeling, 32 verified source authorities, and GA stability.",
    highlights: [
      "Enterprise Suite & Vendor Sync: Added live synchronization modules for Atlassian, Cisco, IBM, OpenText, SAP, ServiceNow, and Splunk catalogs.",
      "Runtime Environment Risk Dashboard: Interactive fleet risk modeling with CSV drag-and-drop import, starter template download, and exportable remediation reports.",
      "Comprehensive Data Provenance: Audited lineage across 32 upstream authorities with 39,600+ verified records, original source URLs, exact timestamps, and confidence scores.",
      "Granular Access Control: Production-grade role-based access control (RBAC) protecting all synchronization pipelines, CSV file imports, and custom lifecycle records.",
      "Refined User Experience: Clarified purpose subtitles across all platform views, bottom-anchored author attribution, and live Postgres catalog telemetry.",
    ],
  },
  {
    version: "v0.9b beta",
    badge: "Cloud Architecture",
    releaseDate: "September 2026",
    title: "Lovable Cloud Integration & Architecture Overhaul",
    tagline:
      "Cloud migration with Supabase PostgreSQL, modernized UI system, and expanded enterprise catalog.",
    highlights: [
      "Supabase Database Architecture: Migrated core storage to managed PostgreSQL with Row Level Security (RLS) policies and optimized RPC query functions.",
      "UI & Navigation Overhaul: Re-engineered layout with TanStack Router, custom responsive sidebar, dark mode support, and shadcn/ui components.",
      "Expanded Lifecycle Index: Scaled tracking to 2,900+ enterprise products, 8,800+ release cycles, and 41 integrated primary data sources.",
      "Authentication & Role Gating: Implemented Google OAuth and email sign-in with administrative role verification.",
    ],
  },
  {
    version: "v0.5",
    badge: "Public Release",
    releaseDate: "August 2026",
    title: "First Public GitHub Release",
    tagline: "Open-source publication of the endoflife platform with automated REST API ingestion.",
    highlights: [
      "GitHub Community Publication: Published the official codebase and repository to GitHub for public collaboration.",
      "Automated REST API Ingestion: Automated data pipelines harvesting software support dates directly from vendor public APIs.",
      "Initial Data Provenance Tracking: Established the foundation for tracking source authorities, licenses, and collection timestamps.",
      "Runtime Fleet CSV Standard: Defined the initial data schema for mapping host environments to lifecycle milestones.",
    ],
  },
  {
    version: "v0.1 beta",
    badge: "Initial Prototype",
    releaseDate: "August 2026",
    title: "Initial Prototype & Foundations",
    tagline: "Project inception with core lifecycle schema, basic product catalog, and taxonomy.",
    highlights: [
      "Core Lifecycle Data Model: Established foundational relational schemas for products, release cycles, and support windows.",
      "Initial Catalog Directory: Seeded the first 50 core runtime languages, operating systems, and database engines.",
      "Status Classification Engine: Implemented rule-based lifecycle states (Supported, Action Needed, End of Life).",
      "Proof-of-Concept Interface: Initial search and filter interface for exploring lifecycle milestones.",
    ],
  },
];
