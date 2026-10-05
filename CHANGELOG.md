# Changelog & Release Notes

All notable changes to **[endoflife.tech](https://endoflife.tech)** are documented in this file.

---

## [v1.2.0] — October 2026

### 🛡️ Enterprise SecOps, AppSec, GRC & Fleet Risk Engine
- **Machine-Readable SBOM & Inventory Ingestion (`/risk`)**:
  - Drag-and-drop parsing for **CycloneDX JSON** (v1.4, v1.5, v1.6), **SPDX JSON** (v2.2, v2.3), Aqua Security **Trivy JSON**, Anchore **Syft JSON**, and enterprise CMDB CSVs.
  - Automatic normalization and correlation of package identifiers (e.g. `pkg:generic/nodejs@18.19.0`, `@angular/core`, `libssl-dev`, `python3`) with catalog release cycles.
  - Interactive 1-click test datasets: *CycloneDX 1.5 (Trivy Container)* and *SPDX 2.3 (Syft Kubernetes Cluster)* for immediate test evaluation.
  - Scanner connectors and CI/CD CLI snippets (`npx endoflife-check ./sbom.json`) for GitHub Actions, GitLab CI, Wiz, Qualys, Rapid7, and ServiceNow.
- **Active Threat Correlation & CISA KEV Exploitations**:
  - Highlights critical vulnerabilities currently listed on the **CISA Known Exploited Vulnerabilities (KEV)** catalog (e.g., CVE-2024-4577, CVE-2023-32002, CVE-2024-1086).
  - Displays real-time Critical, High, and Medium CVSS severity counters alongside EOL milestones so security teams can triage active exploitability over simple calendar dates.
- **GRC Compliance Framework Mapping & Audit-Ready Reporting**:
  - Mapped unsupported components to specific regulatory mandates:
    - **PCI-DSS 4.0** (Requirement 6.3.3)
    - **NIST SP 800-53** (Controls SA-22 & SI-2)
    - **ISO 27001** (Control A.8.8)
    - **SOC 2 Type II** (Trust Services Criteria CC6.6 & CC7.1)
  - One-Click **Executive Audit Report Modal**: Printable and PDF-ready compliance summary featuring overall fleet compliance score, framework gap analysis, formal risk acceptance register, and 30/60/90-day exposure forecast.
- **Commercial Extended Support (ESM/ESU) & LTS Bridge**:
  - Structured support matrices for Ubuntu Pro ESM, Red Hat ELS, Microsoft ESU, AWS EKS Extended Support, and HeroDevs NES with coverage deadlines.
  - Direct LTS upgrade recommendations with breaking change summaries and vendor migration links.
- **Operational Exception & Waiver Workflows**:
  - Formal **Risk Acceptance Waiver** logging with executive approvers, finite non-perpetual expiration dates, and mandatory compensating controls (WAF, network isolation).
  - One-click copyable **Jira / ServiceNow Issue Exporter** formatting markdown tickets with vulnerability severity, audit impact, and remediation steps.

### 🌐 Massive Enterprise Catalog Expansion
- **4,228 Enterprise Products**: Ingested 1,024 brand-new enterprise products across CNCF, Apache, HashiCorp, VMware Tanzu, Red Hat, Linux Foundation, Google Cloud, AWS, and Azure.
- **11,461 Release Cycles**: Added 2,129 verified release cycles detailing release dates, mainstream support windows, EOL cutoffs, and latest patch versions.
- **43,384 Audit Provenance Records**: Added 3,052 verified provenance records guaranteeing 100% provenance linkage to official vendor documentation.
- **Query Optimization**: Expanded catalog range pagination to 4,999 items (`range(4000, 4999)`) with client-side localStorage caching for instant page loads.

### 🏛️ Corporate Heritage & Legal Governance
- Added dedicated **About Us** page detailing the Defense Health Agency (DHA) operational origin, founders James Shenberger and Mark D. Mitchell with LinkedIn profile integration.
- Added comprehensive **Contact**, **Privacy Policy**, and **Terms of Service** pages linked across all site footers.

---

## [v1.0.0] — September 21, 2026

### 🚀 General Availability Launch
- **Enterprise Suite & Vendor Sync**: Added live synchronization modules for Atlassian, Cisco, IBM, OpenText, SAP, ServiceNow, and Splunk catalogs.
- **Runtime Environment Risk Dashboard**: Interactive fleet risk modeling with CSV drag-and-drop import, starter template download, and exportable remediation reports.
- **Comprehensive Data Provenance**: Audited lineage across 32 upstream authorities with 39,600+ verified records, original source URLs, exact timestamps, and confidence scores.
- **Granular Access Control**: Production-grade role-based access control (RBAC) protecting all synchronization pipelines, CSV file imports, and custom lifecycle records.
- **Refined User Experience**: Clarified purpose subtitles across all platform views, bottom-anchored author attribution, and live Postgres catalog telemetry.

---

## [v0.9.0b] — September 2026

### ☁️ Cloud Integration & Architecture Overhaul
- **Supabase Database Architecture**: Migrated core storage to managed PostgreSQL with Row Level Security (RLS) policies and optimized RPC query functions.
- **UI & Navigation Overhaul**: Re-engineered layout with TanStack Router, custom responsive sidebar, dark mode support, and shadcn/ui components.
- **Expanded Lifecycle Index**: Scaled tracking to 2,900+ enterprise products, 8,800+ release cycles, and 41 integrated primary data sources.
- **Authentication & Role Gating**: Implemented Google OAuth and email sign-in with administrative role verification.

---

## [v0.5.0] — August 2026

### 📦 First Public GitHub Release
- **GitHub Community Publication**: Published the official codebase and repository to GitHub for public collaboration.
- **Automated REST API Ingestion**: Automated data pipelines harvesting software support dates directly from vendor public APIs.
- **Initial Data Provenance Tracking**: Established the foundation for tracking source authorities, licenses, and collection timestamps.
- **Runtime Fleet CSV Standard**: Defined the initial data schema for mapping host environments to lifecycle milestones.

---

## [v0.1.0b] — August 2026

### 🌱 Initial Prototype & Foundations
- **Core Lifecycle Data Model**: Relational schemas for products, release cycles, and support windows.
- **Initial Catalog Directory**: Seeded 50 core runtime languages, operating systems, and database engines.
- **Status Classification Engine**: Rule-based lifecycle states (Supported, Action Needed, End of Life).
- **Proof-of-Concept Interface**: Search and filter interface for exploring lifecycle milestones.
