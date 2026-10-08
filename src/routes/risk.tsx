import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileCheck2,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Flame,
  HelpCircle,
  Info,
  Layers,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Ticket,
  Upload,
  Workflow,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { getCatalog, formatDate, type LifecycleStatus } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  parseSbom,
  SAMPLE_CYCLONEDX_SBOM,
  SAMPLE_SPDX_SBOM,
  type SbomParsedEnvironment,
} from "@/lib/sbom";
import { getThreatIntel, type ThreatIntelRecord } from "@/lib/threat-intel";

export const Route = createFileRoute("/risk")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Enterprise SecOps & EOL Risk Dashboard — endoflife.tech" },
      {
        name: "description",
        content:
          "Ingest CycloneDX/SPDX SBOMs, correlate EOL runtimes with CISA KEV exploits, track PCI-DSS 4.0 compliance, and manage risk waivers.",
      },
      { property: "og:title", content: "Enterprise SecOps & EOL Risk Dashboard — endoflife.tech" },
      {
        property: "og:description",
        content:
          "Ingest CycloneDX/SPDX SBOMs, correlate EOL runtimes with CISA KEV exploits, track PCI-DSS 4.0 compliance, and manage risk waivers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskDashboardPage,
});

export type RuntimeEnvironment = SbomParsedEnvironment;

const INITIAL_SAMPLE_ENVIRONMENTS: RuntimeEnvironment[] = [
  {
    id: "env-1",
    platform: "Python",
    version: "3.10",
    deployment_env: "Data Engine Platform (Legacy)",
    eol_date: "2026-10-04",
    lifecycle_phase: "Security Support",
    days_to_eol: 13,
    risk_level: "HIGH",
    target_upgrade_path: "Python 3.12 LTS",
    migration_status: "Migration Planned",
    business_owner: "Data Platform Eng",
    sourceType: "CSV",
    threatIntel: getThreatIntel("Python", "3.10", false),
  },
  {
    id: "env-2",
    platform: "Node.js",
    version: "18",
    deployment_env: "Frontend Gateway Node-A",
    eol_date: "2025-04-30",
    lifecycle_phase: "End of Life",
    days_to_eol: -509,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "Node.js 22 LTS",
    migration_status: "In Progress",
    business_owner: "Edge Web Core",
    sourceType: "CycloneDX",
    threatIntel: getThreatIntel("Node.js", "18", true),
  },
  {
    id: "env-3",
    platform: "Node.js",
    version: "20",
    deployment_env: "E-Commerce Core Checkout",
    eol_date: "2026-04-30",
    lifecycle_phase: "End of Life",
    days_to_eol: -144,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "Node.js 22 LTS",
    migration_status: "Migration Planned",
    business_owner: "Checkout Payments",
    sourceType: "Trivy",
    threatIntel: getThreatIntel("Node.js", "20", true),
  },
  {
    id: "env-4",
    platform: "PHP",
    version: "8.1",
    deployment_env: "Corporate Public Website (WP)",
    eol_date: "2025-12-31",
    lifecycle_phase: "End of Life",
    days_to_eol: -264,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "PHP 8.3 LTS",
    migration_status: "In Progress",
    business_owner: "Digital Marketing Tech",
    sourceType: "CSV",
    threatIntel: getThreatIntel("PHP", "8.1", true),
  },
  {
    id: "env-5",
    platform: "Ubuntu",
    version: "20.04",
    deployment_env: "Kubernetes Worker Nodes (Cluster 04)",
    eol_date: "2025-04-02",
    lifecycle_phase: "End of Life",
    days_to_eol: -537,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "Ubuntu 24.04 LTS (Noble)",
    migration_status: "Migration Planned",
    business_owner: "Cloud Platform Ops",
    sourceType: "SPDX",
    threatIntel: getThreatIntel("Ubuntu", "20.04", true),
  },
  {
    id: "env-6",
    platform: "OpenSSL",
    version: "1.1.1",
    deployment_env: "Edge Ingress Load Balancer Envoy",
    eol_date: "2023-09-11",
    lifecycle_phase: "End of Life",
    days_to_eol: -1106,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "OpenSSL 3.0+ LTS",
    migration_status: "In Progress",
    business_owner: "NetOps Security",
    sourceType: "CycloneDX",
    threatIntel: getThreatIntel("OpenSSL", "1.1.1", true),
  },
  {
    id: "env-7",
    platform: ".NET",
    version: "8.0",
    deployment_env: "Inventory API Services Cluster",
    eol_date: "2026-11-10",
    lifecycle_phase: "Security Support",
    days_to_eol: 50,
    risk_level: "HIGH",
    target_upgrade_path: "Stay on .NET 8.0 LTS",
    migration_status: "No Action Needed",
    business_owner: "Supply Chain Services",
    sourceType: "CSV",
    threatIntel: getThreatIntel(".NET", "8.0", false),
  },
  {
    id: "env-8",
    platform: "Python",
    version: "3.12",
    deployment_env: "ML Model Training Runner",
    eol_date: "2028-10-02",
    lifecycle_phase: "Active Support",
    days_to_eol: 741,
    risk_level: "LOW",
    target_upgrade_path: "Stay on Python 3.12",
    migration_status: "No Action Needed",
    business_owner: "AI/ML Infrastructure",
    sourceType: "CSV",
    threatIntel: getThreatIntel("Python", "3.12", false),
  },
];

function calculateRiskFromDate(eolDate: string | null): {
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

function RiskDashboardPage() {
  const { data: catalog = [] } = useQuery({ queryKey: ["catalog"], queryFn: getCatalog });
  const [activeTab, setActiveTab] = useState<"fleet" | "catalog">("fleet");
  const [environments, setEnvironments] = useState<RuntimeEnvironment[]>(
    INITIAL_SAMPLE_ENVIRONMENTS,
  );
  const [isSampleData, setIsSampleData] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [complianceFilter, setComplianceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals state
  const [activeWaiverEnv, setActiveWaiverEnv] = useState<RuntimeEnvironment | null>(null);
  const [waiverApprover, setWaiverApprover] = useState("Jane Doe (CISO / SecOps Lead)");
  const [waiverExpires, setWaiverExpires] = useState("2027-06-30");
  const [waiverControl, setWaiverControl] = useState(
    "Compensating WAF rules (OWASP CRS) deployed; isolated in private VPC security group.",
  );

  const [activeJiraEnv, setActiveJiraEnv] = useState<RuntimeEnvironment | null>(null);
  const [copiedJira, setCopiedJira] = useState(false);

  const [activeThreatDetailEnv, setActiveThreatDetailEnv] = useState<RuntimeEnvironment | null>(
    null,
  );
  const [showAuditReport, setShowAuditReport] = useState(false);
  const [showConnectorsModal, setShowConnectorsModal] = useState(false);

  // Catalog release cycles calculations
  const catalogCycles = useMemo(() => {
    return catalog.flatMap((p) =>
      p.release_cycles.map((c) => ({ ...c, product: p.name, vendor: p.vendor, slug: p.slug })),
    );
  }, [catalog]);

  const catalogEol = catalogCycles.filter((c) => c.status === "end_of_life");
  const catalogSoon = catalogCycles.filter((c) => c.status === "approaching_eol");
  const catalogSupported = catalogCycles.filter((c) => c.status === "supported");

  // Fleet environment calculations
  const filteredEnvironments = useMemo(() => {
    return environments.filter((env) => {
      const text =
        `${env.deployment_env} ${env.platform} ${env.version} ${env.business_owner ?? ""} ${env.target_upgrade_path}`.toLowerCase();
      const matchQuery = !query || text.includes(query.toLowerCase());

      let matchRisk = true;
      if (riskFilter === "cisa_kev") {
        matchRisk = Boolean(env.threatIntel?.hasCisaKev);
      } else if (riskFilter === "waiver_active") {
        matchRisk = Boolean(env.riskAccepted);
      } else if (riskFilter !== "all") {
        matchRisk = env.risk_level === riskFilter && !env.riskAccepted;
      }

      let matchCompliance = true;
      if (complianceFilter === "pci_dss") {
        matchCompliance =
          env.threatIntel?.complianceImpacts?.some((c) => c.standard === "PCI-DSS 4.0") ?? false;
      } else if (complianceFilter === "nist") {
        matchCompliance =
          env.threatIntel?.complianceImpacts?.some((c) => c.standard === "NIST SP 800-53") ?? false;
      } else if (complianceFilter === "iso") {
        matchCompliance =
          env.threatIntel?.complianceImpacts?.some((c) => c.standard === "ISO 27001") ?? false;
      }

      const matchStatus = statusFilter === "all" || env.migration_status === statusFilter;
      return matchQuery && matchRisk && matchCompliance && matchStatus;
    });
  }, [environments, query, riskFilter, complianceFilter, statusFilter]);

  // Aggregate stats
  const totalFleet = environments.length;
  const cisaKevCount = environments.filter(
    (e) => e.threatIntel?.hasCisaKev && !e.riskAccepted,
  ).length;
  const criticalCount = environments.filter(
    (e) => e.risk_level === "CRITICAL (EOL)" && !e.riskAccepted,
  ).length;
  const highRiskCount = environments.filter(
    (e) => e.risk_level === "HIGH" && !e.riskAccepted,
  ).length;
  const lowRiskCount = environments.filter((e) => e.risk_level === "LOW" || e.riskAccepted).length;
  const activeWaiverCount = environments.filter((e) => Boolean(e.riskAccepted)).length;
  const pciDssViolations = environments.filter(
    (e) =>
      !e.riskAccepted &&
      e.threatIntel?.complianceImpacts?.some((c) => c.standard === "PCI-DSS 4.0"),
  ).length;

  // Compliance percentage score
  const complianceScore =
    totalFleet > 0 ? Math.round(((totalFleet - criticalCount) / totalFleet) * 100) : 100;

  // Handle Multi-Format File Upload (SBOM JSON or CSV)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const fileName = file.name.toLowerCase();

      // Check if file is JSON (CycloneDX, SPDX, Trivy, Syft)
      if (
        fileName.endsWith(".json") ||
        fileName.endsWith(".spdx") ||
        fileName.endsWith(".cdx") ||
        text.trim().startsWith("{")
      ) {
        const result = parseSbom(text, catalog, file.name.replace(/\.[^/.]+$/, ""));
        if (!result.matchedEnvironments.length) {
          toast.error("No extractable software components found in the uploaded SBOM.");
          return;
        }

        setEnvironments(result.matchedEnvironments);
        setIsSampleData(false);
        toast.success(
          `Imported ${result.format} SBOM with ${result.matchedEnvironments.length} components (${result.matchedEnvironments.filter((e) => e.threatIntel.hasCisaKev).length} CISA KEV alerts).`,
        );
        setActiveTab("fleet");
        return;
      }

      // Otherwise parse as CSV
      const lines = text
        .trim()
        .split(/\r?\n/)
        .filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error("CSV file is empty or missing headers.");
        return;
      }

      const headers = (lines[0] ?? "")
        .split(",")
        .map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const getIndex = (keys: string[]) => headers.findIndex((h) => keys.includes(h));

      const envIdx = getIndex([
        "deployment_env",
        "environment",
        "env",
        "server",
        "app",
        "workload",
        "asset",
      ]);
      const platformIdx = getIndex([
        "platform",
        "product_name",
        "product",
        "software",
        "name",
        "package",
      ]);
      const versionIdx = getIndex(["version", "installed_version", "ver", "release"]);
      const eolIdx = getIndex(["eol_date", "eol", "end_of_life"]);
      const ownerIdx = getIndex(["business_owner", "owner", "team", "maintainer"]);
      const statusIdx = getIndex(["migration_status", "status", "phase"]);
      const targetIdx = getIndex(["target_upgrade_path", "target_version", "target", "upgrade"]);

      const parsed: RuntimeEnvironment[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cells = (lines[i] ?? "").split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        const platform = (platformIdx >= 0 ? cells[platformIdx] : "Application") || "Application";
        const version = (versionIdx >= 0 ? cells[versionIdx] : "1.0") || "1.0";
        const deployment_env =
          (envIdx >= 0 ? cells[envIdx] : `Environment ${i}`) || `Environment ${i}`;
        let eolDate = eolIdx >= 0 && cells[eolIdx] ? cells[eolIdx] : null;

        // Auto-match against catalog if EOL date missing
        if (!eolDate && catalog.length > 0) {
          const matchedProd = catalog.find(
            (p) =>
              p.name.toLowerCase().includes(platform.toLowerCase()) ||
              p.slug.toLowerCase().includes(platform.toLowerCase()),
          );
          if (matchedProd) {
            const matchedCycle = matchedProd.release_cycles.find(
              (c) => c.cycle === version || version.startsWith(c.cycle),
            );
            if (matchedCycle?.eol_date) {
              eolDate = matchedCycle.eol_date;
            }
          }
        }

        const risk = calculateRiskFromDate(eolDate);
        const isEol = risk.risk_level === "CRITICAL (EOL)";
        const threatIntel = getThreatIntel(platform, version, isEol);

        let finalRiskLevel = risk.risk_level;
        if (threatIntel.hasCisaKev) {
          finalRiskLevel = "CRITICAL (EOL)";
        }

        const rawStatus = (statusIdx >= 0 ? cells[statusIdx] : "") ?? "";
        let migration_status: "In Progress" | "Migration Planned" | "No Action Needed" =
          "Migration Planned";
        if (rawStatus.toLowerCase().includes("progress")) migration_status = "In Progress";
        else if (
          rawStatus.toLowerCase().includes("no") ||
          rawStatus.toLowerCase().includes("healthy")
        )
          migration_status = "No Action Needed";

        parsed.push({
          id: `csv-${Date.now()}-${i}`,
          platform,
          version,
          deployment_env,
          eol_date: eolDate,
          lifecycle_phase: risk.phase,
          days_to_eol: risk.days_to_eol,
          risk_level: finalRiskLevel,
          target_upgrade_path:
            targetIdx >= 0 && cells[targetIdx]
              ? cells[targetIdx]
              : threatIntel.recommendedUpgrade?.targetVersion || `${platform} (Latest LTS)`,
          migration_status,
          business_owner:
            (ownerIdx >= 0 ? cells[ownerIdx] : "Enterprise Fleet") || "Enterprise Fleet",
          sourceType: "CSV",
          threatIntel,
        });
      }

      setEnvironments(parsed);
      setIsSampleData(false);
      toast.success(`Successfully imported ${parsed.length} runtime environments.`);
      setActiveTab("fleet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Load Built-in CycloneDX Sample SBOM
  const handleLoadSampleCycloneDx = () => {
    try {
      const result = parseSbom(
        SAMPLE_CYCLONEDX_SBOM,
        catalog,
        "Trivy Container Scan (API Gateway)",
      );
      setEnvironments(result.matchedEnvironments);
      setIsSampleData(false);
      toast.success(
        `Loaded CycloneDX 1.5 SBOM (${result.matchedEnvironments.length} components analyzed with CISA KEV correlation).`,
      );
      setActiveTab("fleet");
    } catch (e) {
      toast.error("Failed to load sample CycloneDX SBOM.");
    }
  };

  // Load Built-in SPDX Sample SBOM
  const handleLoadSampleSpdx = () => {
    try {
      const result = parseSbom(SAMPLE_SPDX_SBOM, catalog, "Syft Kubernetes Fleet Manifest");
      setEnvironments(result.matchedEnvironments);
      setIsSampleData(false);
      toast.success(
        `Loaded SPDX 2.3 SBOM (${result.matchedEnvironments.length} components analyzed with CISA KEV correlation).`,
      );
      setActiveTab("fleet");
    } catch (e) {
      toast.error("Failed to load sample SPDX SBOM.");
    }
  };

  const handleExportCSV = () => {
    const headers = [
      "deployment_env",
      "platform",
      "version",
      "source_type",
      "eol_date",
      "days_to_eol",
      "risk_level",
      "cisa_kev_active",
      "critical_cves",
      "compliance_impacts",
      "target_upgrade_path",
      "migration_status",
      "business_owner",
      "risk_waiver_active",
      "waiver_approver",
    ];
    const rows = filteredEnvironments.map((e) => [
      `"${e.deployment_env}"`,
      `"${e.platform}"`,
      `"${e.version}"`,
      `"${e.sourceType}"`,
      `"${e.eol_date ?? ""}"`,
      e.days_to_eol,
      `"${e.riskAccepted ? "RISK ACCEPTED (WAIVER)" : e.risk_level}"`,
      e.threatIntel?.hasCisaKev ? "YES" : "NO",
      e.threatIntel?.cveCount?.critical ?? 0,
      `"${(e.threatIntel?.complianceImpacts || []).map((c) => c.standard).join("; ")}"`,
      `"${e.target_upgrade_path}"`,
      `"${e.migration_status}"`,
      `"${e.business_owner ?? ""}"`,
      e.riskAccepted ? "YES" : "NO",
      `"${e.riskAccepted?.approvedBy ?? ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `enterprise_eol_threat_risk_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Security & compliance risk register exported as CSV.");
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      "deployment_env,platform,version,eol_date,target_upgrade_path,migration_status,business_owner",
      '"Production API Gateway Node-1","Node.js","18","2025-04-30","Node.js 22 LTS","In Progress","Edge Web Core"',
      '"Enterprise Data Lake Engine","Python","3.10","2026-10-04","Python 3.12 LTS","Migration Planned","Data Platform Eng"',
      '"Identity & Single Sign-On Cluster",".NET","8.0","2026-11-10","Stay on .NET 8.0","No Action Needed","Security Systems"',
      '"Legacy Customer Billing Portal","PHP","8.1","2025-12-31","PHP 8.3 LTS","In Progress","Finance Tech"',
    ];
    const csvContent = "data:text/csv;charset=utf-8," + templateRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "runtime_fleet_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded runtime fleet CSV template.");
  };

  const handleResetSampleFleet = () => {
    setEnvironments(INITIAL_SAMPLE_ENVIRONMENTS);
    setIsSampleData(true);
    toast.info("Reset to default enterprise demo fleet.");
  };

  // Grant Risk Acceptance / Waiver
  const handleSaveWaiver = () => {
    if (!activeWaiverEnv) return;
    setEnvironments((prev) =>
      prev.map((env) => {
        if (env.id === activeWaiverEnv.id) {
          return {
            ...env,
            migration_status: "No Action Needed",
            riskAccepted: {
              approvedBy: waiverApprover,
              expiresAt: waiverExpires,
              compensatingControl: waiverControl,
              acceptedAt: new Date().toISOString().split("T")[0],
            },
          };
        }
        return env;
      }),
    );
    toast.success(
      `Formal Risk Acceptance Waiver applied for ${activeWaiverEnv.platform} in ${activeWaiverEnv.deployment_env}.`,
    );
    setActiveWaiverEnv(null);
  };

  // Revoke Risk Acceptance / Waiver
  const handleRevokeWaiver = (envId: string) => {
    setEnvironments((prev) =>
      prev.map((env) => {
        if (env.id === envId) {
          const { riskAccepted, ...rest } = env;
          return {
            ...rest,
            migration_status: "Migration Planned",
          };
        }
        return env;
      }),
    );
    toast.info("Risk waiver revoked. Workload returned to active audit review.");
  };

  // Generate Jira Markdown text
  const generateJiraMarkdown = (env: RuntimeEnvironment): string => {
    const isEol = env.risk_level === "CRITICAL (EOL)";
    const kevList = env.threatIntel?.knownExploitedCves || [];
    const complianceList = env.threatIntel?.complianceImpacts || [];
    const bridge = env.threatIntel?.commercialBridge;

    return `h1. [EOL Remediation] Upgrade ${env.platform} ${env.version} on ${env.deployment_env}

*Priority:* ${env.threatIntel?.hasCisaKev ? "P1 - Blocker (Active CISA KEV Exploit)" : isEol ? "P2 - Critical" : "P3 - High"}
*Component:* Infrastructure / AppSec
*Owner:* ${env.business_owner || "SecOps"}
*Environment:* ${env.deployment_env}
*Software Platform:* ${env.platform} ${env.version}
*Current Status:* ${env.lifecycle_phase} (EOL: ${formatDate(env.eol_date)})
*Days to EOL / Cutoff:* ${env.days_to_eol < 0 ? `${Math.abs(env.days_to_eol)} days overdue` : `${env.days_to_eol} days remaining`}

----

h2. Active Threat Intelligence & Vulnerability Telemetry
${env.threatIntel?.hasCisaKev ? "*{color:red}CRITICAL ALERT: CISA Known Exploited Vulnerability (KEV) Catalog Flagged{color}*" : "No known active in-the-wild zero-day exploits currently logged."}

*Open CVEs:* ${env.threatIntel?.cveCount?.critical ?? 0} Critical, ${env.threatIntel?.cveCount?.high ?? 0} High, ${env.threatIntel?.cveCount?.medium ?? 0} Medium
${kevList.length > 0 ? kevList.map((k) => `* *${k.cveId}* (CVSS ${k.cvss}): ${k.summary}\n  - Ransomware Campaign: ${k.ransomwareUse ? "YES" : "No"}\n  - Required Mitigation: ${k.requiredAction}`).join("\n") : ""}

----

h2. Regulatory & Compliance Framework Violations
${complianceList.length > 0 ? complianceList.map((c) => `* *${c.standard} (${c.section}):* ${c.title} — ${c.mandate}`).join("\n") : "None currently violated."}

----

h2. Remediation Strategy & LTS Upgrade Recommendation
* *Recommended Upgrade Target:* ${env.target_upgrade_path}
* *Breaking Change Advisory:* ${env.threatIntel?.recommendedUpgrade?.breakingChangesSummary || "Consult official vendor release notes."}
${env.threatIntel?.recommendedUpgrade?.migrationGuideUrl ? `* *Migration Guide:* ${env.threatIntel.recommendedUpgrade.migrationGuideUrl}` : ""}

${bridge ? `h3. Commercial Bridge Option (ESM / ESU)\nIf full application refactoring cannot be completed before the cutoff, commercial extended support is available:\n* *Provider:* ${bridge.provider} (${bridge.programName})\n* *Coverage Extension:* Until ${bridge.supportedUntil}\n* *Notes:* ${bridge.notes}\n* *Portal:* ${bridge.vendorUrl}` : ""}

----
_Generated by endoflife.tech Enterprise SecOps Platform_`;
  };

  const handleCopyJira = () => {
    if (!activeJiraEnv) return;
    navigator.clipboard.writeText(generateJiraMarkdown(activeJiraEnv));
    setCopiedJira(true);
    toast.success("Jira markdown issue copied to clipboard.");
    setTimeout(() => setCopiedJira(false), 2000);
  };

  return (
    <div>
      <PageHeader
        eyebrow="SecOps & IT Operations Intelligence"
        title="Runtime Environment Risk Dashboard"
        description="Correlate software end-of-life timelines with active threat intelligence (CISA KEV), ingest machine-readable SBOMs (CycloneDX/SPDX), enforce PCI-DSS 4.0 compliance, and manage operational risk waivers."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.spdx,.cdx,.xml,.csv,text/csv,application/json"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAuditReport(true)}
              className="border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 font-semibold"
            >
              <FileCheck2 className="mr-1.5 size-4 text-primary" /> Executive Audit Report
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowConnectorsModal(true)}>
              <Workflow className="mr-1.5 size-4" /> Scanner Connectors / CLI
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 size-4" /> Ingest SBOM / CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1.5 size-4" /> Export Risk Register
            </Button>
            {!isSampleData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetSampleFleet}
                title="Reset to sample environments"
              >
                <RotateCcw className="mr-1.5 size-4" /> Reset Demo
              </Button>
            )}
          </div>
        }
      />

      {/* Interactive Ingestion Sandbox & Threat Intel Banner */}
      <div className="mb-6 overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Enterprise SecOps Ingestion &amp; Active Threat Correlation
                </h3>
                {isSampleData ? (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  >
                    Sample Fleet ({environments.length} Workloads)
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    Custom Imported Fleet ({environments.length} Workloads)
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Connect your CI/CD vulnerability scanners and CMDB inventories. Software components
                are mapped against verified EOL milestones,{" "}
                <strong>CISA Known Exploited Vulnerabilities (KEV)</strong>, open Critical/High
                CVEs, and compliance standards (<strong>PCI-DSS 4.0 Req 6.3.3</strong>,{" "}
                <strong>NIST SP 800-53 SA-22</strong>).
              </p>

              {/* Quick 1-Click SBOM Demo Buttons */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Test with 1-click sample:
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleCycloneDx}
                  className="h-7 text-xs border-blue-300 bg-blue-50/70 hover:bg-blue-100 text-blue-900 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-200"
                >
                  <FileCode2 className="mr-1 size-3.5 text-blue-600" /> CycloneDX 1.5 (Trivy
                  Container)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadSampleSpdx}
                  className="h-7 text-xs border-purple-300 bg-purple-50/70 hover:bg-purple-100 text-purple-900 dark:border-purple-800 dark:bg-purple-950/60 dark:text-purple-200"
                >
                  <FileCode2 className="mr-1 size-3.5 text-purple-600" /> SPDX 2.3 (Syft Kubernetes)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-7 text-xs"
                >
                  <FileSpreadsheet className="mr-1 size-3.5 text-emerald-600" /> CSV Template
                </Button>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 md:self-center">
            <Button size="sm" onClick={() => fileInputRef.current?.click()} className="h-9">
              <Upload className="mr-1.5 size-4" /> Upload SBOM / CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHowItWorks((prev) => !prev)}
              className="h-9 text-xs font-medium"
            >
              {showHowItWorks ? (
                <>
                  Hide Architecture <ChevronUp className="ml-1 size-3.5" />
                </>
              ) : (
                <>
                  Architecture Guide <ChevronDown className="ml-1 size-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Expandable Architecture Guide */}
        {showHowItWorks && (
          <div className="mt-4 pt-4 border-t border-border/60 grid gap-3 sm:grid-cols-4 text-xs">
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-blue-500/10 p-1.5 text-blue-600 dark:text-blue-400 shrink-0">
                <FileCode2 className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">1. Ingest SBOMs &amp; CMDB</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Upload CycloneDX/SPDX JSON from Trivy, Syft, Wiz, or ServiceNow exports to
                  discover runtime versions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400 shrink-0">
                <Flame className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">2. CISA KEV Correlation</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Correlate end-of-life dates with active in-the-wild zero-days and known exploited
                  vulnerability catalogs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">3. GRC Audit Mapping</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Flag mandatory vendor-support compliance cutoffs (PCI-DSS 4.0 Req 6.3.3 &amp; NIST
                  800-53 SA-22).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Ticket className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">4. Jira &amp; Waiver Workflow</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Record leadership-approved risk acceptance waivers with compensating controls or
                  export Jira tickets.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Tabs */}
      <div className="mb-6 flex border-b border-border">
        <button
          onClick={() => setActiveTab("fleet")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "fleet"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Server className="size-4" />
          Enterprise Fleet Risk &amp; Threat Register
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            {isSampleData ? `Demo (${environments.length})` : `Custom (${environments.length})`}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
            activeTab === "catalog"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="size-4" />
          Global EOL Threat Watchlist
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            {catalogEol.length + catalogSoon.length} Expiring Cycles
          </span>
        </button>
      </div>

      {activeTab === "fleet" ? (
        <div>
          {/* Executive Bento KPI Tiles */}
          <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border grid-cols-2 lg:grid-cols-5 shadow-xs">
            <div className="bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <Server className="size-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Fleet Assets
                </span>
              </div>
              <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold">{totalFleet}</p>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                <span>{complianceScore}% GRC Compliant</span>
              </div>
            </div>

            <div className="bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
                <Flame className="size-4" />
                <Badge
                  variant="destructive"
                  className="bg-rose-600 hover:bg-rose-700 text-[10px] uppercase font-bold"
                >
                  P1 Urgent
                </Badge>
              </div>
              <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-rose-600 dark:text-rose-400">
                {cisaKevCount}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Active CISA KEV Exploitations
              </p>
            </div>

            <div className="bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between text-destructive">
                <AlertTriangle className="size-4" />
                <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                  Action Needed
                </Badge>
              </div>
              <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-destructive">
                {criticalCount}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Critical (EOL Reached)
              </p>
            </div>

            <div className="bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between text-amber-500">
                <Clock3 className="size-4" />
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 uppercase font-bold"
                >
                  PCI-DSS Risk
                </Badge>
              </div>
              <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-amber-600 dark:text-amber-400">
                {pciDssViolations}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                PCI 4.0 Req 6.3.3 Gaps
              </p>
            </div>

            <div className="bg-card p-4 sm:p-5 col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
                <Shield className="size-4" />
                <Badge
                  variant="outline"
                  className="border-blue-300 bg-blue-50 text-[10px] text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300 uppercase font-bold"
                >
                  Exceptions
                </Badge>
              </div>
              <p className="mt-3 font-display text-2xl sm:text-3xl font-semibold text-blue-600 dark:text-blue-400">
                {activeWaiverCount}
              </p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">
                Approved Risk Waivers
              </p>
            </div>
          </section>

          {/* Clean Padded Search & Filters Bar */}
          <section className="my-7 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
            <form
              onSubmit={(e) => {
                e.preventDefault();
              }}
              className="flex flex-col gap-3 lg:flex-row lg:items-center"
            >
              <div className="flex flex-1 items-center gap-2">
                <Input
                  className="h-10 px-3.5"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search workload name, platform, version, owner, or CVE..."
                />
                <Button
                  type="submit"
                  className="h-10 px-4 gap-1.5 font-medium cursor-pointer shrink-0"
                >
                  <Search className="size-4" />
                  <span>Search</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[190px]">
                    <SelectValue placeholder="Threat / Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="cisa_kev">🚨 CISA KEV Exploited (P1)</SelectItem>
                    <SelectItem value="CRITICAL (EOL)">Critical EOL</SelectItem>
                    <SelectItem value="HIGH">High Risk (&lt; 6 Mo)</SelectItem>
                    <SelectItem value="waiver_active">🛡️ Active Waivers</SelectItem>
                    <SelectItem value="LOW">Low Risk (Active)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[180px]">
                    <SelectValue placeholder="Compliance Mandate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Compliance</SelectItem>
                    <SelectItem value="pci_dss">PCI-DSS 4.0 Req 6.3.3</SelectItem>
                    <SelectItem value="nist">NIST SP 800-53 (SA-22)</SelectItem>
                    <SelectItem value="iso">ISO 27001 (A.8.8)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[170px]">
                    <SelectValue placeholder="Migration Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Migration Planned">Migration Planned</SelectItem>
                    <SelectItem value="No Action Needed">No Action Needed</SelectItem>
                  </SelectContent>
                </Select>

                {(query ||
                  riskFilter !== "all" ||
                  complianceFilter !== "all" ||
                  statusFilter !== "all") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 cursor-pointer"
                    onClick={() => {
                      setQuery("");
                      setRiskFilter("all");
                      setComplianceFilter("all");
                      setStatusFilter("all");
                    }}
                  >
                    Reset
                  </Button>
                )}
              </div>
            </form>
          </section>

          {/* Results Summary */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">
                {filteredEnvironments.length} enterprise workloads analyzed
              </p>
              {isSampleData ? (
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                >
                  Simulated SecOps Fleet
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  Custom Fleet
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Correlated with CISA KEV exploit intelligence, PCI-DSS 4.0 mandates, and verified
              upstream schedules
            </p>
          </div>

          {/* Runtime Fleet & SecOps Threat Table */}
          <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="bg-muted/70 text-xs text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Workload &amp; Owner</th>
                  <th className="px-4 py-3.5">Software &amp; Version</th>
                  <th className="px-4 py-3.5">Threat Intel &amp; CISA KEV</th>
                  <th className="px-4 py-3.5">Compliance Impact</th>
                  <th className="px-4 py-3.5">EOL Cutoff / Window</th>
                  <th className="px-4 py-3.5">Upgrade Path &amp; ESM Bridge</th>
                  <th className="px-4 py-3.5">Status &amp; Risk</th>
                  <th className="px-4 py-3.5 text-right">SecOps Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEnvironments.map((env) => {
                  const isEol = env.risk_level === "CRITICAL (EOL)";
                  const isHigh = env.risk_level === "HIGH";
                  const hasKev = Boolean(env.threatIntel?.hasCisaKev);
                  const isWaiver = Boolean(env.riskAccepted);
                  const bridge = env.threatIntel?.commercialBridge;
                  const cveCount = env.threatIntel?.cveCount;

                  return (
                    <tr
                      key={env.id}
                      className={`transition-colors hover:bg-muted/40 ${
                        hasKev && !isWaiver ? "bg-rose-50/25 dark:bg-rose-950/15" : ""
                      }`}
                    >
                      {/* Workload & Owner */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 font-semibold text-foreground">
                          <span>{env.deployment_env}</span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                            {env.sourceType}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          Owner:{" "}
                          <span className="text-foreground/80 font-medium">
                            {env.business_owner ?? "Unassigned"}
                          </span>
                        </div>
                      </td>

                      {/* Software & Version */}
                      <td className="px-4 py-4">
                        <span className="font-semibold text-foreground">{env.platform}</span>{" "}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground font-semibold">
                          {env.version}
                        </span>
                      </td>

                      {/* Threat Intel & CISA KEV */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          {hasKev ? (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/80 dark:text-rose-300 cursor-help">
                                    <Flame className="size-3 text-rose-600 animate-pulse" /> CISA
                                    KEV: Active Exploit
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-sm text-xs bg-white text-zinc-900 border border-border shadow-md p-3"
                                >
                                  <p className="font-bold text-rose-600 mb-1">
                                    CISA Known Exploited Vulnerability
                                  </p>
                                  <p className="text-zinc-600 leading-snug">
                                    This software version has unpatched CVEs listed on CISA's
                                    official Known Exploited Vulnerabilities catalog with
                                    in-the-wild weaponized exploit campaigns.
                                  </p>
                                  {env.threatIntel.knownExploitedCves.map((c) => (
                                    <div
                                      key={c.cveId}
                                      className="mt-1.5 pt-1 border-t border-border/60"
                                    >
                                      <span className="font-mono font-bold">
                                        {c.cveId} (CVSS {c.cvss})
                                      </span>
                                      : {c.summary}
                                    </div>
                                  ))}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <ShieldCheck className="size-3.5 text-emerald-600" /> No KEVs Flagged
                            </span>
                          )}

                          {cveCount && (cveCount.critical > 0 || cveCount.high > 0) && (
                            <div className="text-[11px] font-mono text-muted-foreground">
                              {cveCount.critical > 0 && (
                                <span className="font-semibold text-rose-600 dark:text-rose-400 mr-1.5">
                                  {cveCount.critical} Crit
                                </span>
                              )}
                              {cveCount.high > 0 && (
                                <span className="font-medium text-amber-600 dark:text-amber-400">
                                  {cveCount.high} High
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Compliance Impact */}
                      <td className="px-4 py-4">
                        {env.threatIntel?.complianceImpacts &&
                        env.threatIntel.complianceImpacts.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[190px]">
                            {env.threatIntel.complianceImpacts.slice(0, 2).map((comp) => (
                              <TooltipProvider key={comp.standard} delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 cursor-help">
                                      {comp.standard}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    side="top"
                                    className="max-w-xs text-xs bg-white text-zinc-900 border border-border shadow-md p-2.5"
                                  >
                                    <p className="font-bold text-zinc-950">
                                      {comp.standard} ({comp.section})
                                    </p>
                                    <p className="font-medium text-zinc-800 mt-0.5">{comp.title}</p>
                                    <p className="mt-1 text-zinc-600 leading-snug">
                                      {comp.mandate}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            Compliant
                          </span>
                        )}
                      </td>

                      {/* EOL Cutoff / Window */}
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium">{formatDate(env.eol_date)}</div>
                        <div
                          className={`text-[11px] font-mono ${
                            isEol
                              ? "text-destructive font-bold"
                              : isHigh
                                ? "text-amber-600 dark:text-amber-400 font-semibold"
                                : "text-muted-foreground"
                          }`}
                        >
                          {env.days_to_eol < 0
                            ? `${Math.abs(env.days_to_eol)}d overdue`
                            : `${env.days_to_eol}d remaining`}
                        </div>
                      </td>

                      {/* Target Upgrade & ESM Bridge */}
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <span className="inline-block rounded-md border border-border bg-muted/60 px-2 py-0.5 text-xs font-semibold text-foreground">
                            {env.target_upgrade_path}
                          </span>
                          {bridge && (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 cursor-help">
                                    <Shield className="size-3" /> {bridge.programName}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs text-xs bg-white text-zinc-900 border border-border shadow-md p-2.5"
                                >
                                  <p className="font-bold text-zinc-950">{bridge.provider}</p>
                                  <p className="font-semibold text-blue-600">
                                    {bridge.programName} (Until {bridge.supportedUntil})
                                  </p>
                                  <p className="mt-1 text-zinc-600 leading-snug">
                                    {bridge.coverageSummary}
                                  </p>
                                  <p className="mt-1 text-zinc-500 font-mono text-[10px]">
                                    Cost model: {bridge.costModel}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </td>

                      {/* Status & Risk */}
                      <td className="px-4 py-4">
                        <div className="space-y-1.5">
                          {isWaiver ? (
                            <TooltipProvider delayDuration={150}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-800 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300 cursor-help">
                                    <ShieldCheck className="size-3" /> WAIVER ACTIVE
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs text-xs bg-white text-zinc-900 border border-border shadow-md p-2.5"
                                >
                                  <p className="font-bold text-zinc-950">
                                    Approved Risk Acceptance Waiver
                                  </p>
                                  <p className="text-zinc-700 mt-0.5">
                                    Approved by:{" "}
                                    <span className="font-medium">
                                      {env.riskAccepted?.approvedBy}
                                    </span>
                                  </p>
                                  <p className="text-zinc-700">
                                    Expires:{" "}
                                    <span className="font-medium">
                                      {env.riskAccepted?.expiresAt}
                                    </span>
                                  </p>
                                  <p className="text-zinc-600 mt-1 italic">
                                    "{env.riskAccepted?.compensatingControl}"
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : hasKev ? (
                            <Badge
                              variant="destructive"
                              className="bg-rose-600 text-[11px] font-bold"
                            >
                              CRITICAL (KEV)
                            </Badge>
                          ) : isEol ? (
                            <Badge variant="destructive" className="text-[11px] font-bold">
                              CRITICAL (EOL)
                            </Badge>
                          ) : isHigh ? (
                            <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                              HIGH
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              LOW
                            </span>
                          )}

                          <div className="text-[11px]">
                            <span
                              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                env.migration_status === "In Progress"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                                  : env.migration_status === "Migration Planned"
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {env.migration_status}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SecOps Actions */}
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveJiraEnv(env)}
                            title="Export as Jira / ServiceNow issue"
                            className="h-8 px-2 text-xs"
                          >
                            <Ticket className="size-3.5 mr-1" /> Jira
                          </Button>

                          {isWaiver ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeWaiver(env.id)}
                              title="Revoke risk acceptance waiver"
                              className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Revoke
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setActiveWaiverEnv(env);
                                setWaiverControl(
                                  `Compensating WAF rules (OWASP CRS) deployed; isolated in private VPC security group for ${env.platform}.`,
                                );
                              }}
                              title="Grant formal Risk Acceptance / Exception Waiver"
                              className="h-8 px-2 text-xs"
                            >
                              <Shield className="size-3.5 mr-1 text-primary" /> Waiver
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setActiveThreatDetailEnv(env)}
                            title="View CVEs & threat intelligence"
                            className="h-8 px-2 text-xs"
                          >
                            <Info className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredEnvironments.length && (
              <div className="p-12 text-center">
                <FileSpreadsheet className="mx-auto size-8 text-muted-foreground opacity-50" />
                <p className="mt-3 font-semibold">No matching workloads found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try clearing filters or importing a CycloneDX / SPDX SBOM manifest.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Catalog Priority Watchlist View */}
          <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {[
              {
                icon: AlertTriangle,
                value: catalogEol.length,
                label: "EOL Catalog Cycles",
                tone: "text-destructive",
              },
              {
                icon: Clock3,
                value: catalogSoon.length,
                label: "Action Needed Cycles",
                tone: "text-warning",
              },
              {
                icon: CheckCircle2,
                value: catalogSupported.length,
                label: "Supported Cycles",
                tone: "text-success",
              },
            ].map(({ icon: Icon, value, label, tone }) => (
              <div className="bg-card p-5" key={label}>
                <Icon className={`size-5 ${tone}`} />
                <p className="mt-6 font-display text-3xl font-semibold">{value}</p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
              </div>
            ))}
          </section>

          <div className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">Priority Watchlist</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Release cycles across the software catalog requiring immediate attention.
                </p>
              </div>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {[...catalogEol, ...catalogSoon].slice(0, 16).map((c, i) => (
                <Link
                  to="/product/$slug"
                  params={{ slug: c.slug }}
                  key={c.id}
                  className={`grid gap-3 p-4 hover:bg-muted/50 sm:grid-cols-[1.5fr_1fr_1fr] sm:items-center ${
                    i ? "border-t border-border" : ""
                  }`}
                >
                  <div>
                    <p className="font-semibold text-foreground group-hover:text-primary">
                      {c.product} {c.cycle}
                    </p>
                    <p className="text-xs text-muted-foreground">{c.vendor}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">EOL {formatDate(c.eol_date)}</p>
                  <div className="sm:text-right">
                    <StatusBadge status={c.status as LifecycleStatus} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 1. Formal Risk Acceptance / Waiver Modal */}
      <Dialog
        open={Boolean(activeWaiverEnv)}
        onOpenChange={(open) => !open && setActiveWaiverEnv(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Shield className="size-5 text-primary" />
              Formal Risk Acceptance Waiver
            </DialogTitle>
            <DialogDescription>
              Grant a formal compliance exception and risk acceptance waiver for{" "}
              <strong>
                {activeWaiverEnv?.platform} {activeWaiverEnv?.version}
              </strong>{" "}
              deployed in <strong>{activeWaiverEnv?.deployment_env}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Authorized Approver (CISO / SecOps Lead)
              </label>
              <Input
                className="mt-1"
                value={waiverApprover}
                onChange={(e) => setWaiverApprover(e.target.value)}
                placeholder="e.g. Jane Doe, VP of Security & CISO"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Waiver Expiration Date
              </label>
              <Input
                type="date"
                className="mt-1"
                value={waiverExpires}
                onChange={(e) => setWaiverExpires(e.target.value)}
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Auditors (PCI QSA, SOC 2, ISO) require all risk acceptance waivers to have a finite
                lifespan not exceeding 12 months.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Mandatory Compensating Controls
              </label>
              <Textarea
                className="mt-1 min-h-[90px]"
                value={waiverControl}
                onChange={(e) => setWaiverControl(e.target.value)}
                placeholder="Describe mitigating controls (e.g. WAF rules, isolated VPC, network segmentation, runtime agents)..."
              />
            </div>

            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200 leading-relaxed">
              <strong>GRC Audit Note:</strong> Approving this waiver documents an authorized
              exception under PCI-DSS 4.0 Appendix B and NIST SP 800-53 SA-22. It will appear on
              your formal Executive Audit Report.
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveWaiverEnv(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveWaiver}>
              <Check className="mr-1.5 size-4" /> Approve &amp; Log Waiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. Jira / ServiceNow Ticket Creation Modal */}
      <Dialog
        open={Boolean(activeJiraEnv)}
        onOpenChange={(open) => !open && setActiveJiraEnv(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Ticket className="size-5 text-primary" />
              Export Jira / ServiceNow Remediation Issue
            </DialogTitle>
            <DialogDescription>
              Copy this pre-formatted enterprise ticket template directly into Jira, Linear, or
              ServiceNow with complete threat telemetry.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap select-all">
              {activeJiraEnv ? generateJiraMarkdown(activeJiraEnv) : ""}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground">
              Includes CISA KEV tags, CVE scores &amp; LTS target
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setActiveJiraEnv(null)}>
                Close
              </Button>
              <Button onClick={handleCopyJira}>
                {copiedJira ? (
                  <>
                    <Check className="mr-1.5 size-4 text-emerald-500" /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="mr-1.5 size-4" /> Copy Jira Markdown
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Threat Intelligence & CVE Details Modal */}
      <Dialog
        open={Boolean(activeThreatDetailEnv)}
        onOpenChange={(open) => !open && setActiveThreatDetailEnv(null)}
      >
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="size-5 text-rose-600" />
              Threat Intelligence &amp; Vulnerability Profile
            </DialogTitle>
            <DialogDescription>
              Deep CVE telemetry for{" "}
              <strong>
                {activeThreatDetailEnv?.platform} {activeThreatDetailEnv?.version}
              </strong>{" "}
              in <strong>{activeThreatDetailEnv?.deployment_env}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-sm">
            {activeThreatDetailEnv?.threatIntel?.hasCisaKev ? (
              <div className="rounded-lg border border-rose-300 bg-rose-50 p-4 text-rose-950 dark:border-rose-900 dark:bg-rose-950/80 dark:text-rose-200">
                <div className="flex items-center gap-2 font-bold text-rose-700 dark:text-rose-300 text-sm">
                  <Flame className="size-4 text-rose-600 animate-pulse" />
                  CISA Known Exploited Vulnerability (KEV) Flagged
                </div>
                <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
                  The Cybersecurity and Infrastructure Security Agency (CISA) has confirmed active
                  exploitation in the wild against this version. Federal agencies and enterprise
                  SecOps are mandated to remediate or isolate immediately.
                </p>
                <div className="mt-3 space-y-2">
                  {activeThreatDetailEnv.threatIntel.knownExploitedCves.map((cve) => (
                    <div
                      key={cve.cveId}
                      className="rounded border border-rose-200 bg-white/80 p-2.5 text-xs text-zinc-900 dark:border-rose-800 dark:bg-zinc-900 dark:text-zinc-100"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-rose-600">{cve.cveId}</span>
                        <span className="font-semibold text-rose-700">CVSS {cve.cvss}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground leading-normal">{cve.summary}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400">
                        <span>
                          Ransomware Campaign:{" "}
                          <strong>{cve.ransomwareUse ? "Confirmed" : "None Detected"}</strong>
                        </span>
                        <span>Added to KEV: {cve.dateAddedToKev}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <span>
                  No active zero-day exploits or CISA KEV listings registered for this branch.
                </span>
              </div>
            )}

            {/* CVE Aggregation */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="text-xs text-muted-foreground">Critical CVEs</span>
                <p className="text-xl font-bold text-rose-600">
                  {activeThreatDetailEnv?.threatIntel?.cveCount?.critical ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="text-xs text-muted-foreground">High CVEs</span>
                <p className="text-xl font-bold text-amber-600">
                  {activeThreatDetailEnv?.threatIntel?.cveCount?.high ?? 0}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3 text-center">
                <span className="text-xs text-muted-foreground">Medium CVEs</span>
                <p className="text-xl font-bold text-muted-foreground">
                  {activeThreatDetailEnv?.threatIntel?.cveCount?.medium ?? 0}
                </p>
              </div>
            </div>

            {/* Compliance Impacts */}
            <div>
              <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                Applicable Compliance Frameworks
              </h4>
              <div className="mt-2 space-y-2">
                {(activeThreatDetailEnv?.threatIntel?.complianceImpacts || []).map((c) => (
                  <div
                    key={c.standard}
                    className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between font-semibold text-foreground">
                      <span>
                        {c.standard} ({c.section})
                      </span>
                      <span className="text-[10px] text-destructive uppercase font-bold">
                        {c.auditRisk} Risk
                      </span>
                    </div>
                    <p className="mt-1 text-muted-foreground leading-relaxed">{c.mandate}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveThreatDetailEnv(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Executive GRC Audit Report Modal */}
      <Dialog open={showAuditReport} onOpenChange={setShowAuditReport}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="size-6 text-primary" />
                <span>Executive EOL &amp; Software Supply Chain Audit Report</span>
              </div>
              <Badge
                variant="outline"
                className="border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Audit Ready
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Prepared for GRC Auditors (PCI QSA, SOC 2 Type II, ISO 27001 Lead Auditor). Generated
              on{" "}
              {new Date().toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              .
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-3 text-sm">
            {/* Audit Executive Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Fleet Compliance Score
                </span>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{complianceScore}%</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Total Fleet Workloads
                </span>
                <p className="text-3xl font-bold text-foreground mt-1">{totalFleet}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Active KEV Exploits
                </span>
                <p className="text-3xl font-bold text-rose-600 mt-1">{cisaKevCount}</p>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <span className="text-xs text-muted-foreground font-semibold">
                  Approved Risk Waivers
                </span>
                <p className="text-3xl font-bold text-blue-600 mt-1">{activeWaiverCount}</p>
              </div>
            </div>

            {/* Framework Evaluation Breakdown */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="font-display font-semibold text-base">
                Regulatory Framework Assessment
              </h4>
              <div className="mt-3 space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40">
                  <div>
                    <span className="font-bold text-foreground">
                      PCI-DSS 4.0 (Requirement 6.3.3)
                    </span>
                    <p className="text-muted-foreground mt-0.5">
                      Mandates all software system components be actively supported by vendors.
                    </p>
                  </div>
                  <Badge variant={pciDssViolations === 0 ? "outline" : "destructive"}>
                    {pciDssViolations === 0 ? "PASSED" : `${pciDssViolations} Deficiencies`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40">
                  <div>
                    <span className="font-bold text-foreground">
                      NIST SP 800-53 (Control SA-22 &amp; SI-2)
                    </span>
                    <p className="text-muted-foreground mt-0.5">
                      Mandates replacement of software components when support expires.
                    </p>
                  </div>
                  <Badge variant={criticalCount === 0 ? "outline" : "destructive"}>
                    {criticalCount === 0 ? "PASSED" : `${criticalCount} Non-Compliant`}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/40">
                  <div>
                    <span className="font-bold text-foreground">ISO 27001 (Control A.8.8)</span>
                    <p className="text-muted-foreground mt-0.5">
                      Management of technical vulnerabilities and exposure mitigation.
                    </p>
                  </div>
                  <Badge variant={cisaKevCount === 0 ? "outline" : "destructive"}>
                    {cisaKevCount === 0 ? "PASSED" : `${cisaKevCount} High Exploits`}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Formal Risk Acceptance Register Table */}
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-semibold text-base">
                  Formal Risk Acceptance Register (Waivers)
                </h4>
                <span className="text-xs text-muted-foreground">
                  {activeWaiverCount} Approved Exceptions
                </span>
              </div>

              {activeWaiverCount === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  No active risk waivers recorded. All non-compliant components require active
                  engineering remediation.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-muted text-muted-foreground font-semibold">
                      <tr>
                        <th className="p-2">Workload</th>
                        <th className="p-2">Software</th>
                        <th className="p-2">Approved By</th>
                        <th className="p-2">Valid Until</th>
                        <th className="p-2">Compensating Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {environments
                        .filter((e) => e.riskAccepted)
                        .map((e) => (
                          <tr key={e.id}>
                            <td className="p-2 font-semibold text-foreground">
                              {e.deployment_env}
                            </td>
                            <td className="p-2">
                              {e.platform} {e.version}
                            </td>
                            <td className="p-2 text-muted-foreground">
                              {e.riskAccepted?.approvedBy}
                            </td>
                            <td className="p-2 font-mono text-emerald-600">
                              {e.riskAccepted?.expiresAt}
                            </td>
                            <td className="p-2 text-muted-foreground italic max-w-xs">
                              {e.riskAccepted?.compensatingControl}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 30/60/90 Day Exposure Horizon */}
            <div className="rounded-xl border border-border bg-card p-5">
              <h4 className="font-display font-semibold text-base mb-2">
                Upcoming 30 / 60 / 90-Day Exposure Forecast
              </h4>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-muted-foreground">&lt; 30 Days to EOL</span>
                  <p className="text-xl font-bold text-rose-600 mt-1">
                    {environments.filter((e) => e.days_to_eol >= 0 && e.days_to_eol <= 30).length}{" "}
                    Workloads
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-muted-foreground">&lt; 60 Days to EOL</span>
                  <p className="text-xl font-bold text-amber-600 mt-1">
                    {environments.filter((e) => e.days_to_eol > 30 && e.days_to_eol <= 60).length}{" "}
                    Workloads
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3">
                  <span className="text-muted-foreground">&lt; 90 Days to EOL</span>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {environments.filter((e) => e.days_to_eol > 60 && e.days_to_eol <= 90).length}{" "}
                    Workloads
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between border-t border-border pt-3">
            <span className="text-xs text-muted-foreground">
              Certified compliance audit snapshot
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAuditReport(false)}>
                Close
              </Button>
              <Button onClick={() => window.print()}>
                <Printer className="mr-1.5 size-4" /> Print / Save as PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Scanner Connectors & CLI Integration Modal */}
      <Dialog open={showConnectorsModal} onOpenChange={setShowConnectorsModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Workflow className="size-5 text-primary" />
              Scanner Connectors &amp; CI/CD Ingestion Guides
            </DialogTitle>
            <DialogDescription>
              Export software inventories directly from your enterprise scanners into
              endoflife.tech.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="cli" className="py-2">
            <TabsList className="grid grid-cols-3">
              <TabsTrigger value="cli">CI/CD CLI Tool</TabsTrigger>
              <TabsTrigger value="scanners">Trivy / Syft</TabsTrigger>
              <TabsTrigger value="cmdb">Wiz / AWS / ServiceNow</TabsTrigger>
            </TabsList>

            <TabsContent value="cli" className="space-y-3 pt-3 text-xs leading-relaxed">
              <p className="text-muted-foreground">
                Run our official lightweight CLI in GitHub Actions, GitLab CI, or Jenkins to
                automatically fail PRs when an unsupported or EOL runtime is introduced:
              </p>
              <div className="rounded-md bg-muted p-3 font-mono">
                # Audit any CycloneDX or SPDX SBOM file in your pipeline
                <br />
                npx endoflife-check ./sbom.json
              </div>
              <div className="rounded-md border border-border p-3 space-y-1">
                <span className="font-semibold text-foreground">
                  GitHub Actions Workflow Snippet:
                </span>
                <pre className="font-mono text-[11px] text-muted-foreground overflow-x-auto">
                  {`- name: Audit EOL & KEV Risks
  run: |
    trivy fs --format cyclonedx --output sbom.json .
    npx endoflife-check ./sbom.json`}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="scanners" className="space-y-3 pt-3 text-xs leading-relaxed">
              <p className="text-muted-foreground">
                Generate CycloneDX or SPDX SBOMs using popular open-source container and filesystem
                scanners:
              </p>
              <div className="space-y-2">
                <div className="rounded-md border border-border p-3">
                  <span className="font-semibold text-foreground">Aqua Security Trivy:</span>
                  <div className="font-mono text-[11px] mt-1 bg-muted p-2 rounded">
                    trivy image --format cyclonedx --output sbom.json your-image:tag
                  </div>
                </div>
                <div className="rounded-md border border-border p-3">
                  <span className="font-semibold text-foreground">Anchore Syft:</span>
                  <div className="font-mono text-[11px] mt-1 bg-muted p-2 rounded">
                    syft packages your-image:tag -o cyclonedx-json=sbom.json
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cmdb" className="space-y-3 pt-3 text-xs leading-relaxed">
              <p className="text-muted-foreground">
                Export inventory tables from enterprise asset discovery and CMDB solutions:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground">
                <li>
                  <strong>AWS Systems Manager (SSM) Inventory:</strong> Export installed software
                  packages via AWS CLI as JSON or CSV.
                </li>
                <li>
                  <strong>Wiz / Qualys / Rapid7:</strong> Go to Vulnerability Management &rarr;
                  Asset Inventory &rarr; Export as CycloneDX SBOM.
                </li>
                <li>
                  <strong>ServiceNow CMDB:</strong> Query the <code>cmdb_ci_appl</code> or{" "}
                  <code>cmdb_ci_spkg</code> tables via REST Table API and upload the resulting JSON.
                </li>
              </ul>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setShowConnectorsModal(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
