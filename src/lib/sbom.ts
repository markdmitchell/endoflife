// src/lib/sbom.ts
/**
 * Machine-Readable Inventory Ingestion Engine for CycloneDX & SPDX SBOMs,
 * Container Scanner Exporters (Trivy, Syft), and Enterprise CMDBs.
 */

import { type CatalogProduct } from "./catalog";
import { getThreatIntel, type ThreatIntelRecord } from "./threat-intel";

export interface SbomParsedEnvironment {
  id: string;
  platform: string;
  version: string;
  deployment_env: string;
  eol_date: string | null;
  lifecycle_phase: string;
  days_to_eol: number;
  risk_level: "CRITICAL (EOL)" | "HIGH" | "LOW";
  target_upgrade_path: string;
  migration_status: "In Progress" | "Migration Planned" | "No Action Needed";
  business_owner?: string;
  sourceType: "CycloneDX" | "SPDX" | "Trivy" | "Syft" | "CSV" | "Manual";
  threatIntel: ThreatIntelRecord;
  riskAccepted?: {
    approvedBy: string;
    expiresAt: string;
    compensatingControl: string;
    acceptedAt: string;
  };
}

export interface SbomParseResult {
  format: "CycloneDX" | "SPDX" | "Trivy" | "Syft" | "Unknown";
  specVersion?: string;
  documentName?: string;
  totalComponentsFound: number;
  matchedEnvironments: SbomParsedEnvironment[];
  unmatchedComponents: Array<{ name: string; version: string }>;
}

interface ScannerPackage {
  name?: string;
  version?: string | number;
  versionInfo?: string | number;
  description?: string;
  Name?: string;
  Version?: string | number;
}

interface ScannerDocument {
  bomFormat?: string;
  specVersion?: string;
  metadata?: { component?: { name?: string } };
  components?: ScannerPackage[];
  spdxVersion?: string;
  name?: string;
  packages?: ScannerPackage[];
  SchemaVersion?: number;
  ArtifactName?: string;
  Results?: Array<{ Packages?: ScannerPackage[] }>;
  artifacts?: ScannerPackage[];
  source?: { target?: string };
}

function calculateRisk(eolDate: string | null): {
  risk_level: "CRITICAL (EOL)" | "HIGH" | "LOW";
  days_to_eol: number;
  phase: string;
} {
  if (!eolDate) {
    return { risk_level: "LOW", days_to_eol: 9999, phase: "Active Support" };
  }
  const diffTime = new Date(`${eolDate}T00:00:00`).getTime() - Date.now();
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (days < 0) {
    return { risk_level: "CRITICAL (EOL)", days_to_eol: days, phase: "End of Life" };
  }
  if (days <= 180) {
    return { risk_level: "HIGH", days_to_eol: days, phase: "Security Support (< 6 Mo)" };
  }
  return { risk_level: "LOW", days_to_eol: days, phase: "Active Support" };
}

/**
 * Normalizes package names from SBOMs (e.g., "@angular/core", "libssl-dev", "python3")
 * to match software catalog products.
 */
function normalizeSbomName(raw: string): string {
  let name = raw.toLowerCase().trim();
  // Strip package prefixes/suffixes
  name = name.replace(/^pkg:[a-z0-9-_.]+\//, "");
  name = name.replace(/^@[a-z0-9-_.]+\//, "");
  name = name.replace(/-dev$/, "").replace(/-common$/, "");
  if (name.startsWith("python3")) return "python";
  if (name.startsWith("python2")) return "python";
  if (name.startsWith("libssl") || name.startsWith("openssl")) return "openssl";
  if (name.startsWith("nodejs") || name === "node") return "node.js";
  if (name.startsWith("postgresql") || name.startsWith("libpq")) return "postgresql";
  if (name.startsWith("redis")) return "redis";
  if (name.startsWith("nginx")) return "nginx";
  if (name.startsWith("apache2") || name.startsWith("httpd")) return "apache http server";
  return name;
}

/**
 * Ingests and parses any raw JSON string representing CycloneDX, SPDX, Trivy, or Syft SBOMs.
 */
export function parseSbom(
  rawText: string,
  catalog: CatalogProduct[],
  defaultEnvironmentName?: string,
): SbomParseResult {
  let json: ScannerDocument;
  try {
    json = JSON.parse(rawText);
  } catch (e) {
    throw new Error("Invalid JSON: The uploaded file is not a valid JSON document.");
  }

  const result: SbomParseResult = {
    format: "Unknown",
    totalComponentsFound: 0,
    matchedEnvironments: [],
    unmatchedComponents: [],
  };

  const extracted: Array<{ name: string; version: string; description?: string | undefined }> = [];
  let envName = defaultEnvironmentName || "Container / Workload Fleet";

  // 1. Detect CycloneDX (JSON)
  if (json.bomFormat === "CycloneDX" || Array.isArray(json.components)) {
    result.format = "CycloneDX";
    result.specVersion = json.specVersion || "1.5";
    result.documentName = json.metadata?.component?.name || "CycloneDX Container Image";
    envName = defaultEnvironmentName || result.documentName || "CycloneDX Production Asset";

    const components = Array.isArray(json.components) ? json.components : [];
    for (const c of components) {
      if (c.name && c.version) {
        extracted.push({
          name: c.name,
          version: String(c.version).trim(),
          description: c.description,
        });
      }
    }
  }
  // 2. Detect SPDX (JSON)
  else if (json.spdxVersion || Array.isArray(json.packages)) {
    result.format = "SPDX";
    result.specVersion = json.spdxVersion || "SPDX-2.3";
    result.documentName = json.name || "SPDX Software Package";
    envName = defaultEnvironmentName || result.documentName || "SPDX Release Artifact";

    const packages = Array.isArray(json.packages) ? json.packages : [];
    for (const p of packages) {
      const ver = p.versionInfo || p.version;
      if (p.name && ver) {
        extracted.push({
          name: p.name,
          version: String(ver).trim(),
          description: p.description,
        });
      }
    }
  }
  // 3. Detect Trivy Scanner JSON
  else if (json.SchemaVersion === 2 || Array.isArray(json.Results)) {
    result.format = "Trivy";
    result.documentName = json.ArtifactName || "Trivy Vulnerability Scan";
    envName = defaultEnvironmentName || result.documentName || "Trivy CI/CD Pipeline Scan";

    const results = Array.isArray(json.Results) ? json.Results : [];
    for (const r of results) {
      const pkgs = Array.isArray(r.Packages) ? r.Packages : [];
      for (const p of pkgs) {
        if (p.Name && p.Version) {
          extracted.push({
            name: p.Name,
            version: String(p.Version).trim(),
          });
        }
      }
    }
  }
  // 4. Detect Syft Scanner JSON
  else if (Array.isArray(json.artifacts)) {
    result.format = "Syft";
    result.documentName = json.source?.target || "Syft Catalog Artifact";
    envName = defaultEnvironmentName || result.documentName || "Syft Container SBOM";

    for (const a of json.artifacts) {
      if (a.name && a.version) {
        extracted.push({
          name: a.name,
          version: String(a.version).trim(),
        });
      }
    }
  } else {
    throw new Error(
      "Unrecognized inventory format. Please provide a valid CycloneDX, SPDX, Trivy, or Syft JSON document.",
    );
  }

  result.totalComponentsFound = extracted.length;

  // Correlate with software catalog
  let itemCounter = 0;
  for (const item of extracted) {
    const cleanName = normalizeSbomName(item.name);
    const ver = item.version;

    // Search catalog
    const matchedProduct = catalog.find((p) => {
      const pSlug = p.slug.toLowerCase();
      const pName = p.name.toLowerCase();
      return (
        pSlug === cleanName ||
        pName === cleanName ||
        pSlug.includes(cleanName) ||
        cleanName.includes(pSlug) ||
        pName.includes(cleanName)
      );
    });

    let eolDate: string | null = null;
    let targetUpgrade = `${matchedProduct?.name || cleanName} (Latest Stable LTS)`;

    if (matchedProduct) {
      // Find matching cycle
      const cycles = Array.isArray(matchedProduct.release_cycles)
        ? matchedProduct.release_cycles
        : [];
      const matchedCycle = cycles.find((c) => {
        return (
          ver === c.cycle ||
          ver.startsWith(c.cycle + ".") ||
          ver.startsWith(c.cycle + "-") ||
          c.cycle.startsWith(ver)
        );
      });

      if (matchedCycle?.eol_date) {
        eolDate = matchedCycle.eol_date;
      }

      // Upgrade path to next supported LTS
      const supportedCycles = cycles.filter((c) => c.status === "supported");
      if (supportedCycles.length > 0) {
        targetUpgrade = `${matchedProduct.name} ${supportedCycles[0]?.cycle} LTS`;
      }
    }

    const risk = calculateRisk(eolDate);
    const isEol = risk.risk_level === "CRITICAL (EOL)";
    const threatIntel = getThreatIntel(matchedProduct?.name || cleanName, ver, isEol);

    // If neither catalog product nor active threat intel matches, record as unmatched component
    if (
      !matchedProduct &&
      !threatIntel.hasCisaKev &&
      threatIntel.knownExploitedCves.length === 0 &&
      !threatIntel.commercialBridge
    ) {
      result.unmatchedComponents.push({ name: item.name, version: item.version });
      continue;
    }

    // If KEV exists, escalate high to critical
    let finalRiskLevel = risk.risk_level;
    if (threatIntel.hasCisaKev) {
      finalRiskLevel = "CRITICAL (EOL)";
    }

    let migration_status: "In Progress" | "Migration Planned" | "No Action Needed" =
      "No Action Needed";
    if (finalRiskLevel === "CRITICAL (EOL)") {
      migration_status = "Migration Planned";
    } else if (finalRiskLevel === "HIGH") {
      migration_status = "In Progress";
    }

    itemCounter++;
    result.matchedEnvironments.push({
      id: `sbom-${Date.now()}-${itemCounter}`,
      platform: matchedProduct?.name || item.name,
      version: ver,
      deployment_env: envName,
      eol_date: eolDate,
      lifecycle_phase: risk.phase,
      days_to_eol: risk.days_to_eol,
      risk_level: finalRiskLevel,
      target_upgrade_path: threatIntel.recommendedUpgrade?.targetVersion || targetUpgrade,
      migration_status,
      business_owner: "SecOps / DevSecOps Pipeline",
      sourceType: result.format,
      threatIntel,
    });
  }

  return result;
}

// Built-in Sample CycloneDX SBOM for 1-Click Interactive Demo Testing
export const SAMPLE_CYCLONEDX_SBOM = JSON.stringify(
  {
    bomFormat: "CycloneDX",
    specVersion: "1.5",
    serialNumber: "urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79",
    version: 1,
    metadata: {
      timestamp: "2026-09-23T14:32:00Z",
      tools: [
        {
          vendor: "Aquasecurity",
          name: "Trivy",
          version: "0.55.0",
        },
      ],
      component: {
        name: "api-gateway-service:production-v3.2",
        type: "container",
        version: "v3.2",
      },
    },
    components: [
      {
        name: "nodejs",
        version: "18.19.0",
        purl: "pkg:generic/nodejs@18.19.0",
        type: "framework",
        description: "Node.js JavaScript Runtime Environment",
      },
      {
        name: "python",
        version: "3.10.12",
        purl: "pkg:generic/python@3.10.12",
        type: "application",
        description: "Python Programming Language",
      },
      {
        name: "php",
        version: "8.1.28",
        purl: "pkg:generic/php@8.1.28",
        type: "application",
        description: "PHP Hypertext Preprocessor",
      },
      {
        name: "openssl",
        version: "1.1.1u",
        purl: "pkg:generic/openssl@1.1.1u",
        type: "library",
        description: "Cryptography and SSL/TLS Toolkit",
      },
      {
        name: "ubuntu",
        version: "20.04",
        purl: "pkg:generic/ubuntu@20.04",
        type: "operating-system",
        description: "Ubuntu Linux Base Operating System",
      },
      {
        name: "postgresql",
        version: "12.18",
        purl: "pkg:generic/postgresql@12.18",
        type: "database",
        description: "PostgreSQL Database Engine",
      },
      {
        name: "redis",
        version: "7.2.4",
        purl: "pkg:generic/redis@7.2.4",
        type: "database",
        description: "Redis In-Memory Key-Value Store",
      },
      {
        name: "nginx",
        version: "1.26.1",
        purl: "pkg:generic/nginx@1.26.1",
        type: "application",
        description: "High Performance Web Server and Reverse Proxy",
      },
    ],
  },
  null,
  2,
);

// Built-in Sample SPDX SBOM for 1-Click Interactive Demo Testing
export const SAMPLE_SPDX_SBOM = JSON.stringify(
  {
    spdxVersion: "SPDX-2.3",
    dataLicense: "CC0-1.0",
    SPDXID: "SPDXRef-DOCUMENT",
    name: "cloud-native-k8s-platform",
    creationInfo: {
      creators: ["Tool: Syft-v1.14.0", "Organization: Enterprise SecOps AppSec"],
      created: "2026-09-23T15:00:00Z",
    },
    packages: [
      {
        name: "kubernetes",
        SPDXID: "SPDXRef-Package-k8s",
        versionInfo: "1.25.16",
        downloadLocation: "NOASSERTION",
        filesAnalyzed: false,
      },
      {
        name: "nodejs",
        SPDXID: "SPDXRef-Package-node",
        versionInfo: "20.15.0",
        downloadLocation: "NOASSERTION",
        filesAnalyzed: false,
      },
      {
        name: "rhel",
        SPDXID: "SPDXRef-Package-rhel",
        versionInfo: "7.9",
        downloadLocation: "NOASSERTION",
        filesAnalyzed: false,
      },
      {
        name: "python",
        SPDXID: "SPDXRef-Package-py",
        versionInfo: "3.12.3",
        downloadLocation: "NOASSERTION",
        filesAnalyzed: false,
      },
    ],
  },
  null,
  2,
);
