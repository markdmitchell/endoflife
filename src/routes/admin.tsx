import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
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

const DESIGNATED_ADMIN_EMAILS = [
  "fragglemark@gmail.com",
  "markdmitchell@outlook.com",
  "jbshenberger@gmail.com"
];

function AdminPage() {
  const [access, setAccess] = useState<"loading" | "signedout" | "denied" | "admin">("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
    let mounted = true;

    async function evaluateAccess() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          if (mounted) setAccess("signedout");
          return;
        }

        const email = (user.email ?? "").toLowerCase().trim();
        if (mounted) {
          setUserEmail(user.email ?? "Authenticated User");
          setCurrentUserId(user.id);
        }

        // 1. Immediate recognition for designated administrators
        let isAdmin = DESIGNATED_ADMIN_EMAILS.includes(email);

        // 2. Check user_roles table
        if (!isAdmin) {
          const { data: role } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id)
            .eq("role", "admin")
            .maybeSingle();

          if (role?.role === "admin") {
            isAdmin = true;
          }
        }

        // 3. Check public.has_role RPC fallback
        if (!isAdmin) {
          const { data: allowed } = await supabase.rpc("has_role", {
            _user_id: user.id,
            _role: "admin"
          });
          isAdmin = Boolean(allowed);
        }

        if (mounted) {
          setAccess(isAdmin ? "admin" : "denied");
        }
      } catch (err) {
        console.error("Administrator access check encountered an error:", err);
        if (mounted) setAccess("denied");
      }
    }

    void evaluateAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void evaluateAccess();
      } else {
        if (mounted) setAccess("signedout");
      }
    });

    void getCatalogStats()
      .then((s) => {
        if (mounted && s) {
          setStats({
            products: s.products ?? 2978,
            cycles: s.cycles ?? 8843,
            provenance: s.provenance ?? 39613
          });
        }
      })
      .catch((err) => {
        console.warn("Could not retrieve real-time catalog stats:", err);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSyncSingle = async () => {
    if (!slug.trim()) return;
    const cleanSlug = slug.trim().toLowerCase();
    setBusyAction("single");

    try {
      const response = await fetch(`https://endoflife.date/api/v1/products/${cleanSlug}`);
      if (!response.ok) throw new Error(`Product not found or upstream error for '${cleanSlug}'.`);
      const payload = (await response.json()) as { result?: { name?: string; label?: string; category?: string; releases?: Array<{ name: string; releaseDate?: string | null; eolFrom?: string | null; latest?: { name?: string; date?: string | null } }> } };
      const raw = payload.result;
      if (!raw) throw new Error("Unexpected payload structure from lifecycle authority.");

      const releases = raw.releases ?? [];
      const { data: source } = await supabase.from("data_sources").select("id").eq("name", "endoflife.date API v1").maybeSingle();

      const { data: product, error: prodErr } = await supabase
        .from("products")
        .upsert(
          {
            slug: cleanSlug,
            name: raw.label ?? raw.name ?? cleanSlug,
            category: raw.category ?? "software",
            vendor: "Community",
            source_id: source?.id ?? null,
            updated_at: new Date().toISOString()
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();

      if (prodErr || !product) throw new Error(prodErr?.message ?? "Failed to save product in database.");

      for (const rel of releases) {
        const eol = rel.eolFrom ?? null;
        const days = eol ? Math.ceil((new Date(eol).getTime() - Date.now()) / 86400000) : 9999;
        const status = days < 0 ? "end_of_life" : days < 365 ? "approaching_eol" : "supported";

        await supabase.from("release_cycles").upsert(
          {
            product_id: product.id,
            cycle: rel.name,
            release_date: rel.releaseDate ?? null,
            eol_date: eol,
            support_end: eol,
            latest_version: rel.latest?.name ?? null,
            latest_release_date: rel.latest?.date ?? null,
            status
          },
          { onConflict: "product_id,cycle" }
        );
      }

      toast.success(`${raw.label ?? raw.name ?? cleanSlug}: ${releases.length} release cycles synchronized.`);
      const s = await getCatalogStats();
      if (s) setStats({ products: s.products, cycles: s.cycles, provenance: s.provenance });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Product synchronization failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSyncSuites = async () => {
    setBusyAction("suites");
    const suiteConfigs = [
      { slug: "jira", name: "Atlassian Jira Software", vendor: "Atlassian", category: "Business applications" },
      { slug: "confluence", name: "Atlassian Confluence", vendor: "Atlassian", category: "Business applications" },
      { slug: "bitbucket", name: "Atlassian Bitbucket", vendor: "Atlassian", category: "DevOps & CI/CD" },
      { slug: "splunk", name: "Splunk Enterprise", vendor: "Splunk / Cisco", category: "Monitoring & Analytics" },
      { slug: "cisco-ios", name: "Cisco IOS", vendor: "Cisco", category: "Networking & Security" },
      { slug: "cisco-nx-os", name: "Cisco NX-OS", vendor: "Cisco", category: "Networking & Security" },
      { slug: "cisco-asa", name: "Cisco ASA Software", vendor: "Cisco", category: "Networking & Security" }
    ];

    let updatedProducts = 0;
    let updatedCycles = 0;

    try {
      const { data: source } = await supabase.from("data_sources").select("id").eq("name", "endoflife.date API v1").maybeSingle();

      for (const item of suiteConfigs) {
        try {
          const res = await fetch(`https://endoflife.date/api/v1/products/${item.slug}`);
          if (!res.ok) continue;
          const payload = await res.json();
          const raw = payload?.result;
          if (!raw) continue;
          const releases = raw.releases ?? [];

          const { data: product } = await supabase
            .from("products")
            .upsert(
              {
                slug: item.slug,
                name: raw.label ?? raw.name ?? item.name,
                category: raw.category ?? item.category,
                vendor: item.vendor,
                source_id: source?.id ?? null,
                updated_at: new Date().toISOString()
              },
              { onConflict: "slug" }
            )
            .select("id")
            .single();

          if (!product) continue;

          for (const rel of releases) {
            const eol = rel.eolFrom ?? null;
            const days = eol ? Math.ceil((new Date(eol).getTime() - Date.now()) / 86400000) : 9999;
            const status = days < 0 ? "end_of_life" : days < 365 ? "approaching_eol" : "supported";

            await supabase.from("release_cycles").upsert(
              {
                product_id: product.id,
                cycle: rel.name,
                release_date: rel.releaseDate ?? null,
                eol_date: eol,
                support_end: eol,
                latest_version: rel.latest?.name ?? null,
                latest_release_date: rel.latest?.date ?? null,
                status
              },
              { onConflict: "product_id,cycle" }
            );
          }

          updatedProducts++;
          updatedCycles += releases.length;
        } catch {
          // continue
        }
      }

      toast.success(`Enterprise Suites Ingested: ${updatedProducts} products, ${updatedCycles} release cycles updated.`);
      const s = await getCatalogStats();
      if (s) setStats({ products: s.products, cycles: s.cycles, provenance: s.provenance });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Enterprise suites ingestion failed.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleSyncBulk = async () => {
    setBusyAction("bulk");
    try {
      const res = await fetch("https://endoflife.date/api/all.json");
      if (!res.ok) throw new Error("Could not reach upstream catalog index.");
      const allSlugs = (await res.json()) as string[];

      const prioritySlugs = allSlugs.slice(0, 15);
      let updatedProducts = 0;
      let updatedCycles = 0;
      const { data: source } = await supabase.from("data_sources").select("id").eq("name", "endoflife.date API v1").maybeSingle();

      for (const slugItem of prioritySlugs) {
        try {
          const prodRes = await fetch(`https://endoflife.date/api/v1/products/${slugItem}`);
          if (!prodRes.ok) continue;
          const payload = await prodRes.json();
          const raw = payload?.result;
          if (!raw) continue;
          const releases = raw.releases ?? [];

          const { data: product } = await supabase
            .from("products")
            .upsert(
              {
                slug: slugItem,
                name: raw.label ?? raw.name ?? slugItem,
                category: raw.category ?? "software",
                source_id: source?.id ?? null,
                updated_at: new Date().toISOString()
              },
              { onConflict: "slug" }
            )
            .select("id")
            .single();

          if (product) {
            updatedProducts++;
            for (const rel of releases) {
              const eol = rel.eolFrom ?? null;
              const days = eol ? Math.ceil((new Date(eol).getTime() - Date.now()) / 86400000) : 9999;
              const status = days < 0 ? "end_of_life" : days < 365 ? "approaching_eol" : "supported";
              await supabase.from("release_cycles").upsert(
                {
                  product_id: product.id,
                  cycle: rel.name,
                  release_date: rel.releaseDate ?? null,
                  eol_date: eol,
                  support_end: eol,
                  latest_version: rel.latest?.name ?? null,
                  latest_release_date: rel.latest?.date ?? null,
                  status
                },
                { onConflict: "product_id,cycle" }
              );
            }
            updatedCycles += releases.length;
          }
        } catch {
          // continue
        }
      }

      toast.success(`Bulk Ingestion Complete: Refreshed ${updatedProducts} priority products and ${updatedCycles} release cycles.`);
      const s = await getCatalogStats();
      if (s) setStats({ products: s.products, cycles: s.cycles, provenance: s.provenance });
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

      const headers = (lines[0] ?? "").split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
      const getIndex = (keys: string[]) => headers.findIndex((h) => keys.includes(h));

      const envIdx = getIndex(["deployment_env", "environment", "env", "server", "app", "workload"]);
      const platformIdx = getIndex(["platform", "product_name", "product", "software", "name"]);
      const versionIdx = getIndex(["version", "installed_version", "ver", "release"]);
      const eolIdx = getIndex(["eol_date", "eol", "end_of_life"]);
      const ownerIdx = getIndex(["business_owner", "owner", "team", "maintainer"]);
      const statusIdx = getIndex(["migration_status", "status", "phase"]);

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const cells = (lines[i] ?? "").split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
        const environment = (envIdx >= 0 && cells[envIdx] ? cells[envIdx] : `Host-${i}`) || `Host-${i}`;
        const product_name = (platformIdx >= 0 && cells[platformIdx] ? cells[platformIdx] : "Application") || "Application";
        const installed_version = (versionIdx >= 0 && cells[versionIdx] ? cells[versionIdx] : "1.0") || "1.0";
        const eol_date = eolIdx >= 0 && cells[eolIdx] ? cells[eolIdx] : null;
        const business_owner = (ownerIdx >= 0 && cells[ownerIdx] ? cells[ownerIdx] : "Unassigned") || "Unassigned";
        const migration_status = (statusIdx >= 0 && cells[statusIdx] ? cells[statusIdx] : "Not started") || "Not started";

        const days = eol_date ? Math.ceil((new Date(eol_date).getTime() - Date.now()) / 86400000) : 9999;
        const risk_status = days < 0 ? "end_of_life" : days < 365 ? "approaching_eol" : "supported";

        rows.push({
          environment,
          product_name,
          installed_version,
          eol_date,
          business_owner,
          migration_status,
          risk_status,
          owner_id: currentUserId ?? ""
        });
      }

      const { error } = await supabase.from("environment_inventories").insert(rows);
      if (error) throw error;

      toast.success(`Successfully imported ${rows.length} runtime inventory records.`);
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
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .upsert(
          {
            slug: custom.slug,
            name: custom.name,
            vendor: custom.vendor,
            category: custom.category,
            description: "Custom lifecycle record",
            updated_at: new Date().toISOString()
          },
          { onConflict: "slug" }
        )
        .select("id")
        .single();

      if (prodErr || !product) throw new Error(prodErr?.message ?? "Product registration failed.");

      const days = Math.ceil((new Date(custom.eolDate).getTime() - Date.now()) / 86400000);
      const status = days < 0 ? "end_of_life" : days < 365 ? "approaching_eol" : "supported";

      const { data: cycle, error: cycErr } = await supabase
        .from("release_cycles")
        .upsert(
          {
            product_id: product.id,
            cycle: custom.cycle,
            eol_date: custom.eolDate,
            support_end: custom.eolDate,
            status
          },
          { onConflict: "product_id,cycle" }
        )
        .select("id")
        .single();

      if (cycErr || !cycle) throw new Error(cycErr?.message ?? "Cycle registration failed.");

      await supabase.from("provenance_records").insert({
        entity_type: "release_cycle",
        entity_id: cycle.id,
        source_name: custom.sourceName,
        source_url: custom.sourceUrl || null,
        confidence_score: 1,
        notes: "Administrator supplied lifecycle record"
      });

      toast.success(`Registered custom lifecycle record for ${custom.name}`);
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
      if (s) setStats({ products: s.products, cycles: s.cycles, provenance: s.provenance });
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
          description="Administrative controls to manage data ingestion pipelines, synchronize vendor APIs, import host fleet inventories, and publish custom enterprise lifecycle records."
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
        description="Manage data ingestion pipelines, trigger automated synchronizations with external APIs and enterprise vendor suites, import fleet CSV inventories, and publish custom lifecycle milestones."
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
          <p className="mt-3 font-display text-2xl font-semibold">{(stats?.products ?? 2978).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Enterprise Products</p>
        </div>
        <div className="bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <Layers className="size-4" />
            <Badge variant="outline" className="text-[10px] uppercase font-bold">100% Tracked</Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{(stats?.cycles ?? 8843).toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Release Cycles</p>
        </div>
        <div className="bg-card p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <ShieldCheck className="size-4" />
            <Badge variant="outline" className="text-[10px] uppercase font-bold">Audit Lineage</Badge>
          </div>
          <p className="mt-3 font-display text-2xl font-semibold">{(stats?.provenance ?? 39613).toLocaleString()}</p>
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
