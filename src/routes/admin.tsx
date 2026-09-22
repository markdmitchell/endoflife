import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Database, 
  Download, 
  FileSpreadsheet, 
  FileUp, 
  Globe, 
  Layers, 
  Loader2, 
  Plus, 
  RefreshCw, 
  Server, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Zap 
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { 
  addCustomProduct, 
  importInventory, 
  syncProduct, 
  syncEnterpriseSuites, 
  syncBulkCatalog 
} from "@/lib/admin.functions";
import { getCatalogStats } from "@/lib/catalog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — endoflife.tech" },
      { name: "description", content: "Manage lifecycle sources, records, and enterprise synchronization." },
      { property: "og:title", content: "Administration — endoflife.tech" },
      { property: "og:description", content: "Manage lifecycle sources, records, and enterprise synchronization." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" }
    ]
  }),
  component: AdminPage
});

function AdminPage() {
  const [access, setAccess] = useState<"loading" | "signedout" | "denied" | "admin">("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [slug, setSlug] = useState("kubernetes");
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [stats, setStats] = useState<{ products: number; cycles: number; provenance: number }>({
    products: 2978,
    cycles: 8843,
    provenance: 39613
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [custom, setCustom] = useState({
    slug: "",
    name: "",
    vendor: "",
    category: "Business applications",
    cycle: "1.0",
    eolDate: "",
    sourceName: "Enterprise Architecture Notice",
    sourceUrl: ""
  });

  useEffect(() => {
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        setAccess("signedout");
        return;
      }
      setUserEmail(data.user.email ?? "Authenticated User");
      const { data: role } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "admin")
        .maybeSingle();

      let isAdmin = Boolean(role);
      if (!isAdmin) {
        const { data: allowed } = await supabase.rpc("has_role", {
          _user_id: data.user.id,
          _role: "admin"
        });
        isAdmin = Boolean(allowed);
      }
      setAccess(isAdmin ? "admin" : "denied");
    });

    void getCatalogStats().then((s) => {
      setStats({
        products: s.totalProducts,
        cycles: s.totalCycles,
        provenance: s.totalProvenance
      });
    });
  }, []);

  const sync = useServerFn(syncProduct);
  const syncSuites = useServerFn(syncEnterpriseSuites);
  const syncBulk = useServerFn(syncBulkCatalog);
  const importRows = useServerFn(importInventory);
  const add = useServerFn(addCustomProduct);

  const handleSyncSingle = async () => {
    if (!slug.trim()) return;
    setBusyAction("single");
    try {
      const r = await sync({ data: { slug: slug.trim().toLowerCase() } });
      toast.success(`${r.product}: ${r.cycles} release cycles synchronized.`);
      const s = await getCatalogStats();
      setStats({ products: s.totalProducts, cycles: s.totalCycles, provenance: s.totalProvenance });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Product synchronization failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSyncSuites = async () => {
    setBusyAction("suites");
    try {
      const r = await syncSuites();
      toast.success(`Enterprise Suites Ingested: ${r.updatedProducts} products, ${r.updatedCycles} release cycles updated.`);
      const s = await getCatalogStats();
      setStats({ products: s.totalProducts, cycles: s.totalCycles, provenance: s.totalProvenance });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enterprise suites ingestion failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSyncBulk = async () => {
    setBusyAction("bulk");
    try {
      const r = await syncBulk();
      toast.success(`Bulk Ingestion Complete: Updated ${r.updatedProducts} priority products and ${r.updatedCycles} cycles.`);
      const s = await getCatalogStats();
      setStats({ products: s.totalProducts, cycles: s.totalCycles, provenance: s.totalProvenance });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk synchronization failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusyAction("upload");

    try {
      const text = await file.text();
      const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        toast.error("CSV file is empty or missing header row.");
        return;
      }

      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const getIndex = (keys: string[]) => headers.findIndex((h) => keys.includes(h));

      const envIdx = getIndex(["deployment_env", "environment", "env", "server", "app", "workload"]);
      const platformIdx = getIndex(["platform", "product_name", "product", "software", "name"]);
      const versionIdx = getIndex(["version", "installed_version", "ver", "release"]);
      const eolIdx = getIndex(["eol_date", "eol", "end_of_life"]);
      const ownerIdx = getIndex(["business_owner", "owner", "team", "maintainer"]);
      const statusIdx = getIndex(["migration_status", "status", "phase"]);

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        const environment = envIdx >= 0 && cells[envIdx] ? cells[envIdx] : `Host-${i}`;
        const product_name = platformIdx >= 0 && cells[platformIdx] ? cells[platformIdx] : "Application";
        const installed_version = versionIdx >= 0 && cells[versionIdx] ? cells[versionIdx] : "1.0";
        const eol_date = eolIdx >= 0 && cells[eolIdx] ? cells[eolIdx] : null;
        const business_owner = ownerIdx >= 0 && cells[ownerIdx] ? cells[ownerIdx] : "Unassigned";
        const migration_status = statusIdx >= 0 && cells[statusIdx] ? cells[statusIdx] : "Not started";

        rows.push({
          environment,
          product_name,
          installed_version,
          eol_date,
          business_owner,
          migration_status
        });
      }

      const r = await importRows({ data: { rows } });
      toast.success(`Successfully imported ${r.count} runtime inventory records.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "CSV import failed.");
    } finally {
      setBusyAction(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    const rows = [
      "deployment_env,platform,version,eol_date,business_owner,migration_status",
      '"Production API Gateway Node-1","Node.js","18","2025-04-30","Edge Web Core","In Progress"',
      '"Enterprise Data Lake Engine","Python","3.10","2026-10-04","Data Platform Eng","Migration Planned"',
      '"Identity & Single Sign-On Cluster",".NET","8.0","2026-11-10","Security Systems","No Action Needed"',
      '"Legacy Customer Billing Portal","PHP","8.1","2025-12-31","Finance Tech","In Progress"'
    ];
    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + rows.join("\n"));
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "enterprise_runtime_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Downloaded inventory CSV template.");
  };

  const handleSaveCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction("custom");
    try {
      const r = await add({ data: custom });
      toast.success(`Registered custom lifecycle record for ${r.name}`);
      setCustom({
        slug: "",
        name: "",
        vendor: "",
        category: "Business applications",
        cycle: "1.0",
        eolDate: "",
        sourceName: "Enterprise Architecture Notice",
        sourceUrl: ""
      });
      const s = await getCatalogStats();
      setStats({ products: s.totalProducts, cycles: s.totalCycles, provenance: s.totalProvenance });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add custom record.");
    } finally {
      setBusyAction(null);
    }
  };

  if (access !== "admin") {
    return (
      <div>
        <PageHeader
          eyebrow="Administration"
          title="Protected Ingestion &amp; Governance"
          description="Catalog synchronization, enterprise suite ingestion, and database records management are restricted to authenticated administrators."
        />
        <div className="mx-auto mt-16 max-w-md rounded-xl border border-border bg-card p-8 text-center shadow-sm">
          <ShieldAlert className="mx-auto size-10 text-primary" />
          <h2 className="mt-4 font-display text-xl font-semibold">
            {access === "loading"
              ? "Verifying administrator permissions…"
              : access === "signedout"
              ? "Sign in required"
              : "Administrator access required"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {access === "denied"
              ? "Your account is authenticated but does not possess the 'admin' governance role. Contact an administrator to request access."
              : "Please sign in with an authorized administrator account to access synchronization controls."}
          </p>
          {access === "signedout" && (
            <Button asChild className="mt-6">
              <Link to="/auth">Sign in to Console</Link>
            </Button>
          )}
          {access === "denied" && userEmail && (
            <div className="mt-4 rounded-md border border-border bg-muted/40 p-2.5 text-xs font-mono text-muted-foreground">
              Signed in as: {userEmail}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Enterprise Governance &amp; Ingestion"
        title="Data Ingestion &amp; Management Console"
        description="Synchronize enterprise suites, trigger bulk REST API updates, ingest runtime inventory CSV files, and register proprietary lifecycle milestones."
        action={
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 sm:inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3.5" />
              Admin: {userEmail}
            </span>
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">Account</Link>
            </Button>
          </div>
        }
      />

      {/* Database State & Telemetry KPIs */}
      <section className="mb-8 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
        <div className="bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <Server className="size-4" />
            <Badge variant="outline" className="text-[10px] uppercase font-bold">Postgres DB</Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{stats.products.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Enterprise Products</p>
        </div>
        <div className="bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <Layers className="size-4" />
            <Badge variant="outline" className="text-[10px] uppercase font-bold">100% Tracked</Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{stats.cycles.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Release Cycles</p>
        </div>
        <div className="bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <ShieldCheck className="size-4" />
            <Badge variant="outline" className="text-[10px] uppercase font-bold">Audit Lineage</Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{stats.provenance.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Verified Provenance Records</p>
        </div>
        <div className="bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <Globe className="size-4" />
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-[10px] text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase font-bold">Live</Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">41</p>
          <p className="text-xs text-muted-foreground">Upstream Source Authorities</p>
        </div>
      </section>

      {/* Two-Column Grid: Enterprise Sync & CSV Ingestion */}
      <div className="grid gap-7 lg:grid-cols-2">
        {/* Left Card: Sync Enterprise Suites & Vendor Catalogs */}
        <section className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Globe className="size-5" />
              </div>
              <h2 className="font-display text-xl font-semibold">
                Sync Enterprise Suites &amp; Vendor Catalogs
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Ingest Atlassian (Jira, Confluence), OpenText / Micro Focus (ALM, Content Suite, Vertica), IBM, SAP, Cisco, ServiceNow, and Splunk.
            </p>

            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-11 text-sm font-medium hover:border-primary/50"
                onClick={handleSyncSuites}
                disabled={busyAction !== null}
              >
                {busyAction === "suites" ? (
                  <Loader2 className="mr-2 size-4 animate-spin text-primary" />
                ) : (
                  <Globe className="mr-2 size-4 text-primary" />
                )}
                Ingest All Enterprise Software Suites (Jira, OpenText, IBM, SAP, Cisco, etc.)
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start h-11 text-sm font-medium hover:border-primary/50"
                onClick={handleSyncBulk}
                disabled={busyAction !== null}
              >
                {busyAction === "bulk" ? (
                  <Loader2 className="mr-2 size-4 animate-spin text-amber-500" />
                ) : (
                  <Zap className="mr-2 size-4 text-amber-500" />
                )}
                ⚡ Full GitHub &amp; REST API Bulk Sync (473+ Products &amp; 8,600+ Cycles)
              </Button>
            </div>

            <div className="mt-7 rounded-lg border border-border/80 bg-muted/30 p-4">
              <Label htmlFor="slug" className="text-xs font-semibold text-foreground">
                Sync Specific Product Slug (e.g. &apos;python&apos;, &apos;ubuntu&apos;, &apos;kubernetes&apos;)
              </Label>
              <div className="mt-2.5 flex gap-2">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  placeholder="e.g. kubernetes, python, jira"
                  className="h-10 bg-background"
                />
                <Button
                  onClick={handleSyncSingle}
                  disabled={busyAction !== null || !slug.trim()}
                  className="h-10 shrink-0"
                >
                  {busyAction === "single" ? (
                    <>
                      <Loader2 className="mr-1.5 size-4 animate-spin" /> Syncing…
                    </>
                  ) : (
                    "Sync Single Product from REST API"
                  )}
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Quick pick:</span>
                {["kubernetes", "python", "ubuntu", "jira", "confluence", "splunk", "cisco-ios"].map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSlug(item)}
                    className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground flex items-center justify-between">
            <span>Authoritative Source: endoflife.date API v1 &amp; GitHub</span>
            <span className="font-mono text-[11px]">Auto-reconciles</span>
          </div>
        </section>

        {/* Right Card: Import Active Runtime Inventory CSV */}
        <section className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <FileSpreadsheet className="size-5" />
              </div>
              <h2 className="font-display text-xl font-semibold">
                Import Active Runtime Inventory CSV
              </h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Upload a CSV file with enterprise runtime environment inventory records to audit deployments against verified EOL milestones.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <Label className="text-xs font-semibold text-foreground">
                  Choose Inventory CSV
                </Label>
                <div className="mt-2 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 p-6 text-center transition-colors hover:bg-muted/40">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <div className="mx-auto flex max-w-[280px] flex-col items-center">
                    <FileUp className="size-8 text-muted-foreground opacity-60" />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={busyAction !== null}
                      className="mt-3"
                    >
                      {busyAction === "upload" ? (
                        <>
                          <Loader2 className="mr-1.5 size-4 animate-spin" /> Ingesting…
                        </>
                      ) : (
                        <>
                          <Upload className="mr-1.5 size-4" /> Upload
                        </>
                      )}
                    </Button>
                    <p className="mt-2 text-xs text-muted-foreground">
                      200MB per file • CSV
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card p-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground">Required Columns:</span>
                  <p className="text-muted-foreground font-mono text-[11px] mt-0.5">
                    deployment_env, platform, version, eol_date, business_owner, migration_status
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 text-xs shrink-0 ml-3"
                >
                  <Download className="mr-1 size-3.5" /> Template
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border/60 pt-4 text-xs text-muted-foreground flex items-center justify-between">
            <span>Target Table: public.environment_inventories</span>
            <span className="font-mono text-[11px]">Instant audit mapping</span>
          </div>
        </section>
      </div>

      {/* Bottom Section: Custom Lifecycle Record Registration */}
      <section className="mt-8 rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Plus className="size-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Register Custom Lifecycle Record</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add proprietary internal enterprise platforms or unlisted vendor milestones directly to the shared catalog with verified audit lineage.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveCustom} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="c-slug">Product Slug</Label>
            <Input
              id="c-slug"
              placeholder="e.g. acme-platform"
              className="mt-1.5"
              required
              value={custom.slug}
              onChange={(e) => setCustom({ ...custom, slug: e.target.value.toLowerCase().trim() })}
            />
          </div>
          <div>
            <Label htmlFor="c-name">Product Name</Label>
            <Input
              id="c-name"
              placeholder="e.g. Acme Core API"
              className="mt-1.5"
              required
              value={custom.name}
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-vendor">Vendor</Label>
            <Input
              id="c-vendor"
              placeholder="e.g. Acme Corporation"
              className="mt-1.5"
              required
              value={custom.vendor}
              onChange={(e) => setCustom({ ...custom, vendor: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-cat">Category</Label>
            <Input
              id="c-cat"
              placeholder="e.g. Business applications"
              className="mt-1.5"
              required
              value={custom.category}
              onChange={(e) => setCustom({ ...custom, category: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-cycle">Release Cycle / Version</Label>
            <Input
              id="c-cycle"
              placeholder="e.g. 2.0 LTS"
              className="mt-1.5"
              required
              value={custom.cycle}
              onChange={(e) => setCustom({ ...custom, cycle: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-eol">End of Life (EOL) Date</Label>
            <Input
              id="c-eol"
              type="date"
              className="mt-1.5"
              required
              value={custom.eolDate}
              onChange={(e) => setCustom({ ...custom, eolDate: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-srcname">Authority / Source Name</Label>
            <Input
              id="c-srcname"
              placeholder="e.g. Internal Architecture Board"
              className="mt-1.5"
              required
              value={custom.sourceName}
              onChange={(e) => setCustom({ ...custom, sourceName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="c-srcurl">Source Documentation URL</Label>
            <Input
              id="c-srcurl"
              type="url"
              placeholder="https://..."
              className="mt-1.5"
              value={custom.sourceUrl}
              onChange={(e) => setCustom({ ...custom, sourceUrl: e.target.value })}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-end pt-2">
            <Button type="submit" disabled={busyAction !== null} className="min-w-[180px]">
              {busyAction === "custom" ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" /> Registering…
                </>
              ) : (
                <>
                  <Plus className="mr-1.5 size-4" /> Add Lifecycle Record
                </>
              )}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}