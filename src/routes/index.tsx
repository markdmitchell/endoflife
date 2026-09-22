import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Boxes, CalendarClock, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { getCatalog, getCatalogStats, type LifecycleStatus } from "@/lib/catalog";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Software lifecycle catalog — endoflife.tech" }, { name: "description", content: "Search software releases, support windows, and end-of-life dates." }, { property: "og:title", content: "Software lifecycle catalog — endoflife.tech" }, { property: "og:description", content: "Search software releases, support windows, and end-of-life dates." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: CatalogPage,
});

function CatalogPage() {
  const { data = [], isLoading, error } = useQuery({ queryKey: ["catalog"], queryFn: getCatalog });
  const { data: stats } = useQuery({ queryKey: ["catalog-stats"], queryFn: getCatalogStats });
  const [query, setQuery] = useState(""); const [category, setCategory] = useState("all"); const [status, setStatus] = useState("all");
  const categories = useMemo(() => [...new Set(data.map((p) => p.category))].sort(), [data]);
  const filtered = data.filter((p) => {
    const text = `${p.name} ${p.vendor} ${p.category} ${p.slug}`.toLowerCase();
    const statuses = p.release_cycles.map((r) => r.status);
    return text.includes(query.toLowerCase()) && (category === "all" || p.category === category) && (status === "all" || statuses.includes(status as LifecycleStatus));
  });
  const productCount = stats?.products ?? data.length;
  const cycleCount = stats?.cycles ?? data.reduce((n, p) => n + p.release_cycles.length, 0);
  const provenanceCount = stats?.provenance ?? 0;
  return <div>
    <PageHeader eyebrow="Lifecycle catalog" title="Know what reaches end of life next." description="Search, filter, and track active support lifecycles, upcoming end-of-support deadlines, and verified end-of-life dates across thousands of software products and frameworks." action={<Button asChild><Link to="/risk">Review risk <ArrowRight /></Link></Button>} />
    <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
      {[
        { icon: Boxes, value: productCount ? productCount.toLocaleString() : "...", label: "Enterprise Products" },
        { icon: CalendarClock, value: cycleCount ? cycleCount.toLocaleString() : "...", label: "Release Cycles Tracked" },
        { icon: ShieldCheck, value: provenanceCount ? provenanceCount.toLocaleString() : "...", label: "Verified Provenance Records" },
      ].map(({icon: Icon,value,label}) => <div key={label} className="bg-card p-5"><Icon className="mb-5 size-4 text-muted-foreground"/><div className="font-display text-3xl font-semibold">{value}</div><p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p></div>)}
    </section>
    <section className="mt-7 border-y border-border bg-card py-5"><div className="grid gap-3 md:grid-cols-[1fr_220px_190px_auto]"><div className="relative"><Search className="absolute left-3 top-3 size-4 text-muted-foreground"/><Input className="h-10 pl-9" value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search products, vendors, or categories" /></div><Select value={category} onValueChange={setCategory}><SelectTrigger className="h-10"><SelectValue placeholder="Category"/></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.map((x)=><SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select><Select value={status} onValueChange={setStatus}><SelectTrigger className="h-10"><SelectValue placeholder="Status"/></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="supported">Supported</SelectItem><SelectItem value="approaching_eol">Action needed</SelectItem><SelectItem value="end_of_life">End of life</SelectItem></SelectContent></Select><Button variant="outline" onClick={()=>{setQuery("");setCategory("all");setStatus("all")}}>Clear</Button></div></section>
    <div className="mt-5 flex items-center justify-between"><p className="text-sm font-semibold">{filtered.length} products</p><p className="text-xs text-muted-foreground">Updated from verified sources</p></div>
    {isLoading && <div className="py-20 text-center text-sm text-muted-foreground">Loading lifecycle intelligence…</div>}
    {error && <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">The catalog could not be loaded.</div>}
    <div className="mt-3 overflow-hidden rounded-lg border border-border bg-card">
      {filtered.map((product, i) => { const cycles=[...product.release_cycles].sort((a,b)=>(b.release_date??"").localeCompare(a.release_date??"")); const top=cycles[0]; return <Link to="/product/$slug" params={{slug:product.slug}} key={product.id} className={`group grid gap-4 p-5 transition-colors hover:bg-muted/50 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center ${i ? "border-t border-border" : ""}`}><div><h2 className="font-display text-base font-semibold group-hover:text-primary">{product.name}</h2><p className="mt-1 text-xs text-muted-foreground">{product.vendor} · {product.category}</p></div><div><p className="text-[11px] font-semibold uppercase text-muted-foreground">Current cycle</p><p className="mt-1 text-sm font-medium">{top?.cycle ?? "Not indexed"}</p></div><div>{top ? <StatusBadge status={top.status as LifecycleStatus}/> : <span className="text-xs text-muted-foreground">Awaiting data</span>}</div><ArrowRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-1 md:block"/></Link>})}
      {!isLoading && !filtered.length && <div className="p-12 text-center"><p className="font-semibold">No matching products</p><p className="mt-1 text-sm text-muted-foreground">Try a broader search or clear the filters.</p></div>}
    </div>
  </div>;
}