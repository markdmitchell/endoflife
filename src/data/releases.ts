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
    version: "v1.0.0",
    badge: "General Availability",
    releaseDate: "September 21, 2026",
    title: "Official v1.0.0 General Availability (GA) Launch",
    tagline: "Full enterprise suite synchronization, runtime risk fleet modeling, 32 verified source authorities, and GA stability.",
    highlights: [
      "Enterprise Suite & Vendor Sync: Added live synchronization modules for Atlassian, Cisco, IBM, OpenText, SAP, ServiceNow, and Splunk catalogs.",
      "Runtime Environment Risk Dashboard: Interactive fleet risk modeling with CSV drag-and-drop import, starter template download, and exportable remediation reports.",
      "Comprehensive Data Provenance: Audited lineage across 32 upstream authorities with 39,600+ verified records, original source URLs, exact timestamps, and confidence scores.",
      "Granular Access Control: Production-grade role-based access control (RBAC) protecting all synchronization pipelines, CSV file imports, and custom lifecycle records.",
      "Refined User Experience: Clarified purpose subtitles across all platform views, bottom-anchored author attribution, and live Postgres catalog telemetry."
    ]
  },
  {
    version: "v0.9b beta",
    badge: "Cloud Architecture",
    releaseDate: "September 2026",
    title: "Lovable Cloud Integration & Architecture Overhaul",
    tagline: "Cloud migration with Supabase PostgreSQL, modernized UI system, and expanded enterprise catalog.",
    highlights: [
      "Supabase Database Architecture: Migrated core storage to managed PostgreSQL with Row Level Security (RLS) policies and optimized RPC query functions.",
      "UI & Navigation Overhaul: Re-engineered layout with TanStack Router, custom responsive sidebar, dark mode support, and shadcn/ui components.",
      "Expanded Lifecycle Index: Scaled tracking to 2,900+ enterprise products, 8,800+ release cycles, and 41 integrated primary data sources.",
      "Authentication & Role Gating: Implemented Google OAuth and email sign-in with administrative role verification."
    ]
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
      "Runtime Fleet CSV Standard: Defined the initial data schema for mapping host environments to lifecycle milestones."
    ]
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
      "Status Classification Engine: Implemented rule-based lifecycle states (Supported, Action Needed, End of Life).
      "Proof-of-Concept Interface: Initial search and filter interface for exploring lifecycle milestones."
    ]
  }
];
