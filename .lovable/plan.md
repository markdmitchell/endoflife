# Bring endoflife.tech into Lovable

## Goal
Rebuild the public Python/Streamlit application as a full working Lovable application, preserving its catalog and operational capabilities while substantially modernizing the experience for software lifecycle and risk teams.

## What will be built

### 1. Application structure and visual system
- Replace the blank first screen with the working product experience.
- Create a crisp, information-dense enterprise interface with clear navigation, compact status indicators, accessible controls, and polished desktop/mobile layouts.
- Establish a distinctive semantic color system for supported, approaching EOL, and EOL states, plus consistent typography, spacing, tables, forms, dialogs, loading states, and error states.
- Preserve the `endoflife.tech` identity and beta/version context without copying Streamlit’s layout constraints.

### 2. Catalog and product intelligence
- Build searchable, paginated catalog browsing with category, vendor, and lifecycle-status filters.
- Add dedicated product detail views with release cycles, support/EOL dates, latest-version context, links, and provenance.
- Preserve the existing search behavior across product names, slugs, vendors, categories, and release-cycle information.

### 3. Risk dashboard and inventory
- Rebuild the runtime environment risk dashboard with summary metrics and filters for risk and migration status.
- Support inventory CSV upload, validation, import feedback, and derived EOL risk status.
- Make dense inventory data readable with sortable tables and practical small-screen behavior.

### 4. Sources, provenance, and administration
- Rebuild the data-source registry with category and keyword filtering.
- Rebuild the provenance/audit inspector for products, release cycles, and inventory records.
- Add an administration area for:
  - syncing all or individual products from endoflife.date,
  - ingesting enterprise vendor suites,
  - importing inventory CSV files,
  - importing NIST NVD CPE records,
  - registering custom software lifecycle records.
- Protect data-changing administration tools behind sign-in and an administrator role.

### 5. Lovable Cloud and server-side migration
- Enable Lovable Cloud for the database, secure user login, file handling, and server-side synchronization tasks.
- Translate the current SQLite model into relational tables for products, release cycles, data sources, provenance, inventories, and administrator roles.
- Add row-level access rules and explicit grants so public catalog reads remain safe while imports and synchronization stay administrator-only.
- Port Python ingestion/search behavior to server-side TypeScript using edge-compatible APIs; no Python runtime or local filesystem dependency will remain.
- Seed the initial database from the repository’s catalog data so the first working version is populated.

### 6. External data and reliability
- Integrate the public endoflife.date API for product synchronization.
- Integrate NIST NVD CPE ingestion, with its API key stored as a server-side secret when supplied.
- Validate uploaded CSVs and all server inputs, surface source errors clearly, and prevent partial destructive updates.
- Add focused tests for lifecycle calculations, search/filtering, imports, and authorization.

### 7. Final validation
- Verify the main catalog, product detail, risk dashboard, data sources, provenance, login, and administrator workflows.
- Check desktop and mobile presentation, loading/empty/error states, accessibility basics, metadata, and current build/runtime diagnostics.

## Technical notes
- The existing repository is a single-page Streamlit application backed by SQLite, with tables for data sources, products, release cycles, provenance records, and environment inventories.
- The current operational integrations include endoflife.date, enterprise vendor datasets, CSV inventory imports, and the NIST NVD CPE API.
- This will be a functional rewrite into the project’s TanStack React application rather than a direct Python repository import.
- Data-changing tasks will run through authenticated server functions; external synchronization will never expose credentials in the browser.

## Delivery sequence
1. Enable and model Lovable Cloud, including authentication and access rules.
2. Establish the redesigned application shell and shared visual system.
3. Build the catalog, product details, search, filters, and provenance views.
4. Build inventory risk workflows and CSV import.
5. Build protected synchronization and custom-record administration.
6. Seed data, test key logic, and validate the complete experience across screen sizes.
