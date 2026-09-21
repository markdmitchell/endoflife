Here is a comprehensive description of **endoflife.tech**:

---

# endoflife.tech — Enterprise Software Lifecycle & EOL Intelligence Portal

**endoflife.tech** is an open enterprise software lifecycle reference portal and risk management platform. It provides centralized, decision-ready visibility into End-of-Life (EOL), End-of-Active-Support (EOAS), and Long-Term Support (LTS) schedules across thousands of enterprise software products, operating systems, frameworks, databases, and vendor suites.

---

## 🚀 Key Features & Capabilities

### 1. Searchable Enterprise Product Catalog
- **Multi-dimensional Search**: Instant keyword search across product names, vendor names, software categories, and release slugs (e.g., *7-Zip, WinZip, Python, Jira, OpenText, Cisco, RHEL, Windows Server, MongoDB*).
- **Flexible Lifecycle Filtering**: Filter products by category (*OS, Language, Framework, Database, Server App, Niche App*), enterprise vendor (*Atlassian, IBM, SAP, Cisco, OpenText, Microsoft, Red Hat*), or support status (*Supported, Action Needed, End of Life*).
- **Interactive Metric Overview**: At-a-glance Bento-style summary stats tracking total products, release cycles, and verified provenance records.

### 2. Deep Product Detail & Support Timelines
- **Release Cycle Breakdown**: Detailed matrix for each product release cycle detailing release dates, end of active support dates, EOL dates, LTS status, and latest patch versions.
- **Version Verification CLI Commands**: Built-in bash/terminal execution commands to inspect and verify running software versions in live enterprise environments.
- **Direct Source Links**: Verified links to official vendor support portals, contract SLAs, and release documentation.

### 3. Runtime Environment Risk Dashboard
- **Live Inventory Risk Calculation**: Calculates active environment risk based on real-time system dates.
- **Risk Categorization**: Automatically tags tracked runtime environments into risk tiers:
  - **CRITICAL (EOL)**: Product has reached End of Life; immediate migration required.
  - **HIGH RISK**: EOL date approaching within 6 months.
  - **LOW RISK / HEALTHY**: Actively supported release cycles.
- **Migration Tracking & CSV Export**: Monitor target upgrade paths and export customized audit reports for compliance and leadership.

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
