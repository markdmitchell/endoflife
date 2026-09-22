import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown,
  ChevronUp,
  Clock3, 
  Download, 
  FileSpreadsheet, 
  Info,
  Layers, 
  RefreshCw, 
  RotateCcw, 
  Search, 
  Server, 
  ShieldAlert, 
  ShieldCheck,
  Sparkles,
  Upload 
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { getCatalog, formatDate, type LifecycleStatus } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/risk")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Runtime Environment Risk Dashboard — endoflife.tech" },
      { name: "description", content: "Track active runtime environments, fleet versions, and migration risks against verified EOL milestones." },
      { property: "og:title", content: "Runtime Environment Risk Dashboard — endoflife.tech" },
      { property: "og:description", content: "Track active runtime environments, fleet versions, and migration risks against verified EOL milestones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ]
  }),
  component: RiskDashboardPage
});

export interface RuntimeEnvironment {
  id: string | number;
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
}

const INITIAL_SAMPLE_ENVIRONMENTS: RuntimeEnvironment[] = [
  {
    id: 1,
    platform: "Python",
    version: "3.10",
    deployment_env: "Data Engine Platform (Legacy)",
    eol_date: "2026-10-04",
    lifecycle_phase: "Security Support",
    days_to_eol: 13,
    risk_level: "HIGH",
    target_upgrade_path: "Python 3.12 LTS",
    migration_status: "Migration Planned",
    business_owner: "Data Platform Eng"
  },
  {
    id: 2,
    platform: "Node.js",
    version: "18",
    deployment_env: "Frontend Gateway Node-A",
    eol_date: "2025-04-30",
    lifecycle_phase: "End of Life",
    days_to_eol: -509,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "Node.js 22 LTS",
    migration_status: "In Progress",
    business_owner: "Edge Web Core"
  },
  {
    id: 3,
    platform: "Node.js",
    version: "20",
    deployment_env: "E-Commerce Core Checkout",
    eol_date: "2026-04-30",
    lifecycle_phase: "End of Life",
    days_to_eol: -144,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "Node.js 22 LTS",
    migration_status: "Migration Planned",
    business_owner: "Checkout Payments"
  },
  {
    id: 4,
    platform: "PHP",
    version: "8.1",
    deployment_env: "Corporate Public Website (WP)",
    eol_date: "2025-12-31",
    lifecycle_phase: "End of Life",
    days_to_eol: -264,
    risk_level: "CRITICAL (EOL)",
    target_upgrade_path: "PHP 8.3",
    migration_status: "In Progress",
    business_owner: "Digital Marketing Tech"
  },
  {
    id: 5,
    platform: "PHP",
    version: "8.2",
    deployment_env: "Internal Billing Dashboard",
    eol_date: "2026-12-31",
    lifecycle_phase: "Security Support",
    days_to_eol: 101,
    risk_level: "HIGH",
    target_upgrade_path: "PHP 8.3",
    migration_status: "No Action Needed",
    business_owner: "Finance Systems"
  },
  {
    id: 6,
    platform: ".NET",
    version: "8.0",
    deployment_env: "Inventory API Services Cluster",
    eol_date: "2026-11-10",
    lifecycle_phase: "Security Support",
    days_to_eol: 50,
    risk_level: "HIGH",
    target_upgrade_path: "Stay on .NET 8.0",
    migration_status: "No Action Needed",
    business_owner: "Supply Chain Services"
  },
  {
    id: 7,
    platform: "Python",
    version: "3.12",
    deployment_env: "ML Model Training Runner",
    eol_date: "2028-10-02",
    lifecycle_phase: "Active Support",
    days_to_eol: 741,
    risk_level: "LOW",
    target_upgrade_path: "Stay on Python 3.12",
    migration_status: "No Action Needed",
    business_owner: "AI/ML Infrastructure"
  }
];

function calculateRiskFromDate(eolDate: string | null): { risk_level: "CRITICAL (EOL)" | "HIGH" | "LOW"; days_to_eol: number; phase: string } {
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
  const [environments, setEnvironments] = useState<RuntimeEnvironment[]>(INITIAL_SAMPLE_ENVIRONMENTS);
  const [isSampleData, setIsSampleData] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(true);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Catalog release cycles calculations
  const catalogCycles = useMemo(() => {
    return catalog.flatMap((p) => p.release_cycles.map((c) => ({ ...c, product: p.name, vendor: p.vendor, slug: p.slug })));
  }, [catalog]);

  const catalogEol = catalogCycles.filter((c) => c.status === "end_of_life");
  const catalogSoon = catalogCycles.filter((c) => c.status === "approaching_eol");
  const catalogSupported = catalogCycles.filter((c) => c.status === "supported");

  // Fleet environment calculations
  const filteredEnvironments = useMemo(() => {
    return environments.filter((env) => {
      const text = `${env.deployment_env} ${env.platform} ${env.version} ${env.business_owner ?? ""} ${env.target_upgrade_path}`.toLowerCase();
      const matchQuery = !query || text.includes(query.toLowerCase());
      const matchRisk = riskFilter === "all" || env.risk_level === riskFilter;
      const matchStatus = statusFilter === "all" || env.migration_status === statusFilter;
      return matchQuery && matchRisk && matchStatus;
    });
  }, [environments, query, riskFilter, statusFilter]);

  const criticalCount = environments.filter((e) => e.risk_level === "CRITICAL (EOL)").length;
  const highRiskCount = environments.filter((e) => e.risk_level === "HIGH").length;
  const lowRiskCount = environments.filter((e) => e.risk_level === "LOW").length;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error("CSV file is empty or missing headers.");
        return;
      }

      const headers = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const getIndex = (keys: string[]) => headers.findIndex((h) => keys.includes(h));

      const envIdx = getIndex(["deployment_env", "environment", "env", "server", "app", "workload"]);
      const platformIdx = getIndex(["platform", "product_name", "product", "software", "name"]);
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
        const deployment_env = (envIdx >= 0 ? cells[envIdx] : `Environment ${i}`) || `Environment ${i}`;
        let eolDate = eolIdx >= 0 && cells[eolIdx] ? cells[eolIdx] : null;

        // Auto-match against catalog if EOL date missing
        if (!eolDate && catalog.length > 0) {
          const matchedProd = catalog.find((p) => p.name.toLowerCase().includes(platform.toLowerCase()) || p.slug.toLowerCase().includes(platform.toLowerCase()));
          if (matchedProd) {
            const matchedCycle = matchedProd.release_cycles.find((c) => c.cycle === version || version.startsWith(c.cycle));
            if (matchedCycle?.eol_date) {
              eolDate = matchedCycle.eol_date;
            }
          }
        }

        const risk = calculateRiskFromDate(eolDate);
        const rawStatus = (statusIdx >= 0 ? cells[statusIdx] : "") ?? "";
        let migration_status: "In Progress" | "Migration Planned" | "No Action Needed" = "Migration Planned";
        if (rawStatus.toLowerCase().includes("progress")) migration_status = "In Progress";
        else if (rawStatus.toLowerCase().includes("no") || rawStatus.toLowerCase().includes("healthy")) migration_status = "No Action Needed";

        parsed.push({
          id: `csv-${Date.now()}-${i}`,
          platform,
          version,
          deployment_env,
          eol_date: eolDate,
          lifecycle_phase: risk.phase,
          days_to_eol: risk.days_to_eol,
          risk_level: risk.risk_level,
          target_upgrade_path: targetIdx >= 0 && cells[targetIdx] ? cells[targetIdx] : `${platform} (Latest)`,
          migration_status,
          business_owner: (ownerIdx >= 0 ? cells[ownerIdx] : "Enterprise Fleet") || "Enterprise Fleet"
        });
      }

      setEnvironments(parsed);
      setIsSampleData(false);
      toast.success(`Successfully imported ${parsed.length} runtime environments.`);
      setActiveTab("fleet");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse CSV file.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    const headers = ["deployment_env", "platform", "version", "eol_date", "days_to_eol", "risk_level", "target_upgrade_path", "migration_status", "business_owner"];
    const rows = filteredEnvironments.map((e) => [
      `"${e.deployment_env}"`,
      `"${e.platform}"`,
      `"${e.version}"`,
      `"${e.eol_date ?? ""}"`,
      e.days_to_eol,
      `"${e.risk_level}"`,
      `"${e.target_upgrade_path}"`,
      `"${e.migration_status}"`,
      `"${e.business_owner ?? ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `runtime_environment_risk_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory risk report exported as CSV.");
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      "deployment_env,platform,version,eol_date,target_upgrade_path,migration_status,business_owner",
      '"Production API Gateway Node-1","Node.js","18","2025-04-30","Node.js 22 LTS","In Progress","Edge Web Core"',
      '"Enterprise Data Lake Engine","Python","3.10","2026-10-04","Python 3.12 LTS","Migration Planned","Data Platform Eng"',
      '"Identity & Single Sign-On Cluster",".NET","8.0","2026-11-10","Stay on .NET 8.0","No Action Needed","Security Systems"',
      '"Legacy Customer Billing Portal","PHP","8.1","2025-12-31","PHP 8.3","In Progress","Finance Tech"'
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
    toast.info("Reset to default enterprise sample fleet.");
  };

  return (
    <div>
      <PageHeader
        eyebrow="Governance & Remediation"
        title="Runtime Environment Risk Dashboard"
        description="Assess infrastructure exposure and technical debt by mapping deployed host fleets and runtime versions against verified end-of-life timelines to prioritize upgrade remediation."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} title="Download starter CSV template">
              <FileSpreadsheet className="mr-1.5 size-4" /> CSV Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-1.5 size-4" /> Import Fleet CSV
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="mr-1.5 size-4" /> Export Report
            </Button>
            {!isSampleData && (
              <Button variant="ghost" size="sm" onClick={handleResetSampleFleet} title="Reset to sample environments">
                <RotateCcw className="mr-1.5 size-4" /> Restore Demo Fleet
              </Button>
            )}
          </div>
        }
      />

      {/* Interactive Sandbox & Demo Notice Banner */}
      <div className="mb-6 overflow-hidden rounded-xl border border-primary/25 bg-gradient-to-r from-primary/5 via-card to-primary/5 p-5 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="rounded-lg bg-primary/10 p-2.5 text-primary shrink-0 mt-0.5">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  Interactive Demo Fleet Sandbox
                </h3>
                {isSampleData ? (
                  <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                    Sample Data (7 Environments)
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[11px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    Custom Imported Fleet ({environments.length} Environments)
                  </Badge>
                )}
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                This dashboard demonstrates how infrastructure and security teams audit software obsolescence across active production workloads. The 7 environments below simulate enterprise applications mapped against our verified EOL knowledge base. You can test filters, simulate risk calculations, or upload your own infrastructure inventory to audit your organization's real risk.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:self-center">
            <Button variant="outline" size="sm" onClick={handleDownloadTemplate} className="h-9">
              <FileSpreadsheet className="mr-1.5 size-4" /> Download Template
            </Button>
            <Button size="sm" onClick={() => fileInputRef.current?.click()} className="h-9">
              <Upload className="mr-1.5 size-4" /> Import Your Fleet
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHowItWorks((prev) => !prev)}
              className="h-9 text-xs font-medium"
            >
              {showHowItWorks ? (
                <>Hide Guide <ChevronUp className="ml-1 size-3.5" /></>
              ) : (
                <>How It Works <ChevronDown className="ml-1 size-3.5" /></>
              )}
            </Button>
          </div>
        </div>

        {/* Expandable 3-Step "How It Works" Guide */}
        {showHowItWorks && (
          <div className="mt-4 pt-4 border-t border-border/60 grid gap-3 sm:grid-cols-3 text-xs">
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-primary/10 p-1.5 text-primary shrink-0">
                <Server className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">1. Map Fleet Inventory</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Catalog your servers, cloud runtimes, containers, or microservices with their installed software platforms and version numbers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-amber-500/10 p-1.5 text-amber-600 dark:text-amber-400 shrink-0">
                <ShieldAlert className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">2. Automated EOL Correlation</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Every version is correlated in real-time with 39,613 verified lifecycle records and 8,843 release cycles to detect support deadlines.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/60 p-3">
              <div className="rounded-full bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400 shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <span className="font-semibold text-foreground">3. Triage &amp; Assign Remediation</span>
                <p className="mt-0.5 text-muted-foreground leading-relaxed">
                  Identify overdue unpatched runtimes, calculate days to compliance cutoffs, define recommended LTS upgrade paths, and assign engineering owners.
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
          Runtime Fleet Inventory
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
          Global Catalog Watchlist
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
            {catalogEol.length + catalogSoon.length} Expiring Cycles
          </span>
        </button>
      </div>

      {activeTab === "fleet" ? (
        <div>
          {/* Bento KPI Tiles for Tracked Environments */}
          <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4">
            <div className="bg-card p-5">
              <div className="flex items-center justify-between text-muted-foreground">
                <Server className="size-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Fleet Total</span>
              </div>
              <p className="mt-4 font-display text-3xl font-semibold">{environments.length}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Tracked Environments</p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center justify-between text-destructive">
                <AlertTriangle className="size-4" />
                <Badge variant="destructive" className="text-[10px] uppercase font-bold">Action Needed</Badge>
              </div>
              <p className="mt-4 font-display text-3xl font-semibold text-destructive">{criticalCount}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Critical (EOL Reached)</p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center justify-between text-amber-500">
                <Clock3 className="size-4" />
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 uppercase font-bold">Migration Needed</Badge>
              </div>
              <p className="mt-4 font-display text-3xl font-semibold text-amber-600 dark:text-amber-400">{highRiskCount}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">High Risk (EOL &lt; 6 Mo)</p>
            </div>
            <div className="bg-card p-5">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 uppercase font-bold">Healthy</Badge>
              </div>
              <p className="mt-4 font-display text-3xl font-semibold text-emerald-600 dark:text-emerald-400">{lowRiskCount}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">Low Risk (Active Support)</p>
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
                  placeholder="Search environment name, platform, version, or owner..."
                />
                <Button type="submit" className="h-10 px-4 gap-1.5 font-medium cursor-pointer shrink-0">
                  <Search className="size-4" />
                  <span>Search</span>
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[170px]">
                    <SelectValue placeholder="Risk Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risk Levels</SelectItem>
                    <SelectItem value="CRITICAL (EOL)">Critical (EOL)</SelectItem>
                    <SelectItem value="HIGH">High Risk (&lt; 6 Mo)</SelectItem>
                    <SelectItem value="LOW">Low Risk (Active)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-full sm:w-[180px]">
                    <SelectValue placeholder="Migration Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Migration Planned">Migration Planned</SelectItem>
                    <SelectItem value="No Action Needed">No Action Needed</SelectItem>
                  </SelectContent>
                </Select>

                {(query || riskFilter !== "all" || statusFilter !== "all") && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 cursor-pointer"
                    onClick={() => {
                      setQuery("");
                      setRiskFilter("all");
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
              <p className="text-sm font-semibold">{filteredEnvironments.length} environments displayed</p>
              {isSampleData ? (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                  Simulated Demo Fleet
                </Badge>
              ) : (
                <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  Custom Fleet
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk scores &amp; days-to-EOL computed live against verified upstream schedules
            </p>
          </div>

          {/* Runtime Fleet Table */}
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-muted/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Environment (Host &amp; Owner)</th>
                  <th className="px-4 py-3 font-semibold">Platform &amp; Version</th>
                  <th className="px-4 py-3 font-semibold">Lifecycle Phase</th>
                  <th className="px-4 py-3 font-semibold">EOL Cutoff / Timeline</th>
                  <th className="px-4 py-3 font-semibold">Target Upgrade Path</th>
                  <th className="px-4 py-3 font-semibold">Risk Level</th>
                  <th className="px-4 py-3 font-semibold">Migration Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEnvironments.map((env, i) => {
                  const isEol = env.risk_level === "CRITICAL (EOL)";
                  const isHigh = env.risk_level === "HIGH";

                  return (
                    <tr key={env.id} className={`border-t border-border hover:bg-muted/40 transition-colors`}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-foreground">{env.deployment_env}</div>
                        <div className="text-xs text-muted-foreground">{env.business_owner ?? "Unassigned"}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-medium text-foreground">{env.platform}</span>{" "}
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-muted-foreground">{env.version}</span>
                      </td>
                      <td className="px-4 py-4 text-xs font-medium text-muted-foreground">
                        {env.lifecycle_phase}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-medium">{formatDate(env.eol_date)}</div>
                        <div className={`text-[11px] font-mono ${isEol ? "text-destructive font-bold" : isHigh ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-muted-foreground"}`}>
                          {env.days_to_eol < 0 ? `${Math.abs(env.days_to_eol)}d overdue` : `${env.days_to_eol}d remaining`}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-md border border-border bg-muted/60 px-2 py-1 text-xs font-medium text-foreground">
                          {env.target_upgrade_path}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {isEol ? (
                          <Badge variant="destructive" className="text-[11px] font-bold">CRITICAL (EOL)</Badge>
                        ) : isHigh ? (
                          <span className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            HIGH
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            LOW
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          env.migration_status === "In Progress"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                            : env.migration_status === "Migration Planned"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {env.migration_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!filteredEnvironments.length && (
              <div className="p-12 text-center">
                <FileSpreadsheet className="mx-auto size-8 text-muted-foreground opacity-50" />
                <p className="mt-3 font-semibold">No matching environments</p>
                <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or importing a runtime inventory CSV.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          {/* Catalog Priority Watchlist View */}
          <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
            {[
              { icon: AlertTriangle, value: catalogEol.length, label: "EOL Catalog Cycles", tone: "text-destructive" },
              { icon: Clock3, value: catalogSoon.length, label: "Action Needed Cycles", tone: "text-warning" },
              { icon: CheckCircle2, value: catalogSupported.length, label: "Supported Cycles", tone: "text-success" }
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
                <p className="mt-1 text-sm text-muted-foreground">Release cycles across the software catalog requiring immediate attention.</p>
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
    </div>
  );
}