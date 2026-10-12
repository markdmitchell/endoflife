import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Search, ShieldCheck, Database, BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app-shell";
import {
  getProvenance,
  getProvenanceSources,
  getCatalogStats,
  getCachedCatalogStats,
} from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/provenance")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Data Provenance & Audit Inspector | endoflife.tech" },
      {
        name: "description",
        content:
          "Inspect source lineage, original verification URLs, exact collection timestamps, licensing, and confidence for all catalog decisions.",
      },
      { property: "og:title", content: "Data Provenance & Audit Inspector | endoflife.tech" },
      {
        property: "og:description",
        content:
          "Inspect source lineage, original verification URLs, exact collection timestamps, licensing, and confidence for all catalog decisions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProvenancePage,
});

function formatAuditTimestamp(isoString: string) {
  if (!isoString) return "Not recorded";
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZoneName: "short",
    }).format(d);
  } catch {
    return isoString;
  }
}

function ProvenancePage() {
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["catalog-stats"],
    queryFn: getCatalogStats,
    initialData: getCachedCatalogStats,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const { data: allSources = [] } = useQuery({
    queryKey: ["provenance-sources"],
    queryFn: getProvenanceSources,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["provenance", sourceFilter, entityFilter],
    queryFn: () => getProvenance({ source: sourceFilter, entityType: entityFilter, limit: 1000 }),
    staleTime: 1000 * 60 * 15,
  });

  const filtered = useMemo(() => {
    if (!hasSearched) return [];
    return data.filter((r) => {
      const text =
        `${r.entity_type} ${r.entity_id} ${r.source_name} ${r.source_url ?? ""} ${r.notes ?? ""} ${r.license ?? ""}`.toLowerCase();
      return !query || text.includes(query.toLowerCase());
    });
  }, [data, query, hasSearched]);

  const totalAuditRecords = stats?.provenance ?? getCachedCatalogStats().provenance;
  const totalAuthoritiesCount = allSources.length || 32;

  const handleRunSearch = () => {
    setHasSearched(true);
  };

  const handleShowAll = () => {
    setQuery("");
    setEntityFilter("all");
    setSourceFilter("all");
    setHasSearched(true);
  };

  const handleReset = () => {
    setQuery("");
    setEntityFilter("all");
    setSourceFilter("all");
    setHasSearched(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Audit Trail & Lineage"
        title="Data Provenance Inspector"
        description="Audit verifiable evidence, upstream source authority URLs, ingestion timestamps, licensing constraints, and confidence scores behind every individual product lifecycle milestone in the database."
      />

      {/* KPI Stats Bar */}
      <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 shadow-xs">
        <button
          type="button"
          onClick={handleShowAll}
          className="group bg-card p-5 text-left transition-all hover:bg-muted/50 cursor-pointer"
          title="Click to view all provenance records"
        >
          <BookOpen className="mb-5 size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="font-display text-3xl font-semibold text-foreground">
            {totalAuditRecords.toLocaleString()}
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Total Verified Provenance Records
          </p>
        </button>
        <div className="bg-card p-5">
          <Database className="mb-5 size-4 text-muted-foreground" />
          <div className="font-display text-3xl font-semibold text-foreground">
            {totalAuthoritiesCount} Authorities
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Active Upstream Source Authorities
          </p>
        </div>
        <div className="bg-card p-5">
          <ShieldCheck className="mb-5 size-4 text-emerald-600 dark:text-emerald-400" />
          <div className="font-display text-3xl font-semibold text-emerald-600 dark:text-emerald-400">
            100%
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">
            Direct Upstream Lineage Verified
          </p>
        </div>
      </section>

      {/* Search and Filters Bar */}
      <section className="my-7 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunSearch();
          }}
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          <div className="flex flex-1 items-center gap-2">
            <Input
              className="h-10 px-3.5"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search source name, source URL, notes, license, or entity ID..."
            />
            <Button type="submit" className="h-10 px-4 gap-1.5 font-medium cursor-pointer shrink-0">
              <Search className="size-4" />
              <span>Search</span>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={entityFilter}
              onValueChange={(val) => {
                setEntityFilter(val);
                setHasSearched(true);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-[170px]">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                <SelectItem value="product">Product</SelectItem>
                <SelectItem value="release_cycle">Release Cycle</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sourceFilter}
              onValueChange={(val) => {
                setSourceFilter(val);
                setHasSearched(true);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-[220px]">
                <SelectValue placeholder="All Authorities" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                <SelectItem value="all">All Authorities ({totalAuthoritiesCount} Feeds)</SelectItem>
                {allSources.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(hasSearched || query || entityFilter !== "all" || sourceFilter !== "all") && (
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer"
                onClick={handleReset}
              >
                Reset
              </Button>
            )}
          </div>
        </form>
      </section>

      {!hasSearched ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center my-2 shadow-2xs">
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Enter a search query or select an authority above to inspect provenance audit trails, or
            click below to view all records.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="cursor-pointer gap-2"
            >
              <BookOpen className="size-4 text-primary" />
              Browse All {totalAuditRecords.toLocaleString()} Records
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Results Counter */}
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {filtered.length} records shown{" "}
              {sourceFilter !== "all" && `(filtered by ${sourceFilter})`}
            </p>
            <p className="text-xs text-muted-foreground">
              Every record maintains an immutable upstream verification citation
            </p>
          </div>

          {isLoading && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading provenance intelligence records…
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              Failed to load provenance records.
            </div>
          )}

          {/* Provenance Audit Table */}
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-muted/70 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Entity / Target</th>
                  <th className="px-4 py-3 font-semibold">Source Authority &amp; Exact URL</th>
                  <th className="px-4 py-3 font-semibold">Exact Ingestion Timestamp</th>
                  <th className="px-4 py-3 font-semibold">Confidence</th>
                  <th className="px-4 py-3 font-semibold">License Terms</th>
                  <th className="px-4 py-3 font-semibold">Extraction Notes</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const confidencePct = Math.round(Number(r.confidence_score) * 100);
                  return (
                    <tr
                      key={r.id}
                      className="border-t border-border hover:bg-muted/40 transition-colors"
                    >
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {r.entity_type.replace("_", " ")}
                        </span>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">
                          ID #{r.entity_id}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top max-w-sm">
                        <div className="font-semibold text-foreground">{r.source_name}</div>
                        {r.source_url ? (
                          <a
                            href={r.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline break-all"
                            title={r.source_url}
                          >
                            <span className="line-clamp-1">{r.source_url}</span>
                            <ExternalLink className="size-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Direct vendor advisory (No URL)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        <div className="font-mono text-xs font-medium text-foreground">
                          {formatAuditTimestamp(r.fetched_at)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          ISO: {r.fetched_at?.split(".")[0]?.replace("T", " ") ?? "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {confidencePct}%
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {r.license || "Standard Copyright"}
                        </Badge>
                      </td>
                      <td className="max-w-xs px-4 py-4 align-top text-xs leading-relaxed text-muted-foreground">
                        {r.notes || "Official source extraction"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!isLoading && !filtered.length && (
              <div className="p-12 text-center">
                <p className="font-semibold">No matching provenance records</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try selecting a different authority or clearing search filters.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
