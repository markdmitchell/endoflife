# Enterprise Software Lifecycle & EOL Intelligence Portal

**endoflife.tech** is an open enterprise software lifecycle reference portal and risk management platform. It provides centralized, decision-ready visibility into End-of-Life (EOL), End-of-Active-Support (EOAS), and Long-Term Support (LTS) schedules across thousands of enterprise software products, operating systems, frameworks, databases, and vendor suites.

---

## 🚀 Key Features & Capabilities

### 1. Searchable Enterprise Product Catalog (4,100+ Products)
- **Multi-dimensional Search**: Instant keyword search across product names, vendor names, software categories, and release slugs (e.g., *7-Zip, WinZip, Python, Jira, OpenText, Cisco, RHEL, Windows Server, MongoDB*).
- **Flexible Lifecycle Filtering**: Filter products by category (*OS, Language, Framework, Database, Server App, Niche App*), enterprise vendor (*Atlassian, IBM, SAP, Cisco, OpenText, Microsoft, Red Hat*), or support status (*Supported, Action Needed, End of Life*).
- **Interactive Metric Overview**: At-a-glance Bento-style summary stats tracking 4,100+ products, 11,200+ release cycles, and 40,000+ verified provenance records. Records not yet confirmed against vendor documentation are flagged as unverified.

### 2. Deep Product Detail & Support Timelines
- **Release Cycle Breakdown**: Detailed matrix for each product release cycle detailing release dates, end of active support dates, EOL dates, LTS status, and latest patch versions.
- **SecOps Threat Profile & GRC Mandates**: Dedicated security panel displaying CISA KEV flags, CVE severity counts, and specific compliance mandates (PCI-DSS 4.0, NIST SP 800-53, ISO 27001).
- **Commercial Extended Support (ESM/ESU)**: Bridge program matrices for Ubuntu Pro ESM, Red Hat ELS, Microsoft ESU, AWS EKS Extended Support, and HeroDevs NES.
- **Version Verification CLI Commands**: Built-in bash/terminal execution commands to inspect and verify running software versions in live enterprise environments.
- **Direct Source Links**: Verified links to official vendor support portals, contract SLAs, and release documentation.

### 3. SecOps & Runtime Fleet Risk Dashboard (`/risk`)
- **Machine-Readable SBOM & Inventory Ingestion**: Drag-and-drop parsing for **CycloneDX JSON** (v1.4–1.6), **SPDX JSON** (v2.2–2.3), Aqua Security **Trivy**, Anchore **Syft**, and CMDB CSVs.
- **Active Threat Correlation (CISA KEV)**: Real-time flags for vulnerabilities in the CISA Known Exploited Vulnerabilities catalog alongside Critical/High CVSS scores.
- **GRC Compliance Mapping**: Maps fleet exposure to PCI-DSS 4.0 Req 6.3.3, NIST SP 800-53 SA-22/SI-2, ISO 27001 A.8.8, and SOC 2.
- **One-Click Executive Audit Report**: Generate printable/PDF-ready executive audit summaries with compliance scores, risk acceptance registers, and 30/60/90-day exposure forecasts.
- **Operational Exception Handling**: Log formal Risk Acceptance waivers with authorized approvers, expiration dates, and compensating controls (WAF, network isolation).
- **Jira & ServiceNow Export**: One-click generation of formatted Markdown tickets for enterprise issue tracking.

### 4. Integrated Data Sources & Audit Provenance
- **Data Sources Registry**: Directory of integrated primary feeds (endoflife.date API, NIST NVD CPE 2.0 API, vendor documentation, ECMA/TEA standards).
- **Audit Trail Inspector**: Verifies data integrity by tracking confidence ratings (0–100%), licensing information, original source URLs, and verification timestamps for every database record.

### 5. Protected Administration & Multi-Source Synchronization
- **Role-Based Access Control (RBAC)**: Secure administrator authentication for data management.
- **Automated Data Scrapers**: Automated pipelines to ingest enterprise software suites (Jira, Confluence, IBM, SAP, Cisco, ServiceNow, Splunk).
- **NIST NVD CPE 2.0 Extractor**: Extract and decompose CPE 2.3 URIs directly from the National Vulnerability Database.
- **CSV Inventory Import & Custom Record Registration**: Upload internal infrastructure CSVs or register custom niche enterprise software SLA dates.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend UI** | React 19, TypeScript, TanStack Start, TanStack Query, Tailwind CSS, Lucide Icons, Shadcn UI |
| **Backend & Cloud** | Supabase PostgreSQL, Lovable Cloud, Drizzle ORM |
| **Security & Auth** | Supabase Auth with Row-Level Security (RLS) policies |
| **Data Sync Engine** | TypeScript server-side edge integration + Python multi-source scraping engine |
| **Deployment** | Hosted on `endoflife.tech` / Lovable Cloud |

---

## 👤 Target Audience & Use Cases

- **DevOps & Infrastructure Lead**: Identify unsupported OS/runtime versions before planning platform upgrades.
- **Security & Compliance Officers**: Mitigate zero-day vulnerabilities in unpatched, EOL enterprise software.
- **Software Architects**: Evaluate dependency lifecycle longevity before adopting new open-source or commercial technologies.
