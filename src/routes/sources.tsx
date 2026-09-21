import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Database, ExternalLink, Layers, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import { getSources } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/sources")({
  head: () => ({
    meta: [
      { title: "Integrated Data Sources Registry — endoflife.tech" },
      { name: "description", content: "Comprehensive directory of all 41 primary APIs, vendor portals, standards (TEA / ECMA-428 CLE), and aggregators powering the database." },
      { property: "og:title", content: "Integrated Data Sources Registry — endoflife.tech" },
      { property: "og:description", content: "Comprehensive directory of all 41 primary APIs, vendor portals, standards (TEA / ECMA-428 CLE), and aggregators powering the database." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ]
  }),
  component: SourcesPage
});

function SourcesPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["sources"],
    queryFn: getSources
  });

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(() => {
    return [...new Set(data.map((s) => s.category))].filter(Boolean).sort();
  }, [data]);

  const filtered = useMemo(() => {
    return data.filter((s) => {
      const text = `${s.name} ${s.category} ${s.description} ${s.source_url ?? ""} ${s.license ?? ""}`.toLowerCase();
      const matchQuery = !query || text.includes(query.toLowerCase());
      const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
      return matchQuery && matchCategory;
    });
  }, [data, query, categoryFilter]);

  return (
    <div>
      <PageHeader
        eyebrow="Data Lineage & Feeds"
        title="Software EOL Data Sources Registry"
        description="Comprehensive directory of all primary APIs, vendor lifecycle portals, international standards (TEA / ECMA-428 CLE), and government dictionaries powering the catalog."
      />

      {/* KPI Stats Bar */}
      <section className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        <div className="bg-card p-5">
          <Database className="mb-5 size-4 text-muted-foreground" />
          <div className="font-display text-3xl font-semibold">{data.length} Feeds</div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Integrated Primary Data Sources</p>
        </div>
        <div className="bg-card p-5">
          <Layers className="mb-5 size-4 text-muted-foreground" />
          <div className="font-display text-3xl font-semibold">{categories.length} Categories</div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Taxonomy Disciplines Tracked</p>
        </div>
        <div className="bg-card p-5">
          <ShieldCheck className="mb-5 size-4 text-emerald-600 dark:text-emerald-400" />
          <div className="font-display text-3xl font-semibold text-emerald-600 dark:text-emerald-400">100%</div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Public &amp; Vendor Verified</p>
        </div>
      </section>

      {/* Search and Filters Bar */}
      <section className="mt-7 border-y border-border bg-card py-4">
        <div className="grid gap-3 md:grid-cols-[1fr_280px_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
            <Input
              className="h-10 pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search source name, category, description, or URL..."
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-10">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">All Categories ({categories.length})</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => {
              setQuery("");
              setCategoryFilter("all");
            }}
          >
            Clear
          </Button>
        </div>
      </section>

      {/* Results Counter */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm font-semibold">{filtered.length} data sources displayed</p>
        <p className="text-xs text-muted-foreground">Structured tabular registry of all integrated upstream intelligence feeds</p>
      </div>

      {isLoading && (
        <div className="py-20 text-center text-sm text-muted-foreground">
          Loading integrated data source feeds…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Failed to load data sources registry.
        </div>
      )}

      {/* Data Sources Table */}
      <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-muted/70 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold w-1/4">Source Name &amp; Portal</th>
              <th className="px-4 py-3 font-semibold w-48">Category</th>
              <th className="px-4 py-3 font-semibold">Scope &amp; Ingestion Description</th>
              <th className="px-4 py-3 font-semibold w-36">Licensing / Policy</th>
              <th className="px-4 py-3 font-semibold text-right w-20">Link</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border hover:bg-muted/40 transition-colors">
                <td className="px-4 py-4 align-top">
                  <div className="font-semibold text-foreground">{s.name}</div>
                  {s.source_url ? (
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
                    >
                      <span className="line-clamp-1">{s.source_url}</span>
                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Internal / Composite feed</span>
                  )}
                </td>
                <td className="px-4 py-4 align-top">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground border border-border">
                    {s.category}
                  </span>
                </td>
                <td className="px-4 py-4 align-top text-xs leading-relaxed text-muted-foreground">
                  {s.description}
                </td>
                <td className="px-4 py-4 align-top">
                  <Badge variant="outline" className="text-[11px] font-normal">
                    {s.license || "Vendor Advisory"}
                  </Badge>
                </td>
                <td className="px-4 py-4 align-top text-right">
                  {s.source_url && (
                    <Button asChild variant="ghost" size="icon" className="size-8" title={`Open ${s.name}`}>
                      <a href={s.source_url} target="_blank" rel="noopener noreferrer" aria-label={`Open ${s.name}`}>
                        <ExternalLink className="size-4 text-muted-foreground hover:text-primary" />
                      </a>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && !filtered.length && (
          <div className="p-12 text-center">
            <p className="font-semibold">No matching data sources</p>
            <p className="mt-1 text-sm text-muted-foreground">Try selecting a different category or clearing search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
}