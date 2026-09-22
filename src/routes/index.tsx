import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Boxes, CalendarClock, Search, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { 
  getCatalog, 
  getCatalogStats, 
  getCachedCatalogStats, 
  DEFAULT_CATALOG_STATS, 
  formatCategoryName, 
  type LifecycleStatus 
} from "@/lib/catalog";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "endoflife.tech - Product Lifecycle Intelligence" }, { name: "description", content: "Search software releases, support windows, and end-of-life dates." }, { property: "og:title", content: "endoflife.tech - Product Lifecycle Intelligence" }, { property: "og:description", content: "Search software releases, support windows, and end-of-life dates." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: CatalogPage,
});

function CatalogPage() {
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["catalog"],
    queryFn: getCatalog,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });
  const { data: stats } = useQuery({
    queryKey: ["catalog-stats"],
    queryFn: getCatalogStats,
    initialData: getCachedCatalogStats,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24,
  });
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);

  const categories = useMemo(
    () => [...new Set(data.map((p) => p.category))].sort((a, b) => formatCategoryName(a).localeCompare(formatCategoryName(b))),
    [data]
  );

  const filtered = useMemo(() => {
    if (!hasSearched) return [];
    return data.filter((p) => {
      const text = `${p.name} ${p.vendor} ${p.category} ${formatCategoryName(p.category)} ${p.slug}`.toLowerCase();
      const statuses = Array.isArray(p.release_cycles) ? p.release_cycles.map((r) => r.status) : [];
      return (
        text.includes(query.toLowerCase()) &&
        (category === "all" || p.category === category) &&
        (status === "all" || statuses.includes(status as LifecycleStatus))
      );
    });
  }, [data, hasSearched, query, category, status]);

  const fallbackStats = getCachedCatalogStats();
  const productCount = stats?.products ?? fallbackStats.products;
  const cycleCount = stats?.cycles ?? fallbackStats.cycles;
  const provenanceCount = stats?.provenance ?? fallbackStats.provenance;

  const handleRunSearch = () => {
    setHasSearched(true);
  };

  const handleShowAll = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setHasSearched(true);
  };

  const handleReset = () => {
    setQuery("");
    setCategory("all");
    setStatus("all");
    setHasSearched(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Lifecycle catalog"
        title="Know what reaches end of life next."
        description="Search, filter, and track active support lifecycles, upcoming end-of-support deadlines, and verified end-of-life dates across thousands of software products and frameworks."
        action={
          <Button asChild>
            <Link to="/risk">
              Review risk <ArrowRight className="ml-1.5 size-4" />
            </Link>
          </Button>
        }
      />

      {/* Top 3 Metric Cards */}
      <section className="grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-3 shadow-xs">
        {/* Clickable Enterprise Products box */}
        <button
          type="button"
          onClick={handleShowAll}
          className="group bg-card p-5 text-left transition-all hover:bg-muted/50 cursor-pointer"
          title="Click to view all products"
        >
          <Boxes className="mb-5 size-4 text-muted-foreground group-hover:text-primary transition-colors" />
          <div className="font-display text-3xl font-semibold text-foreground">
            {productCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Enterprise Products</p>
        </button>

        <div className="bg-card p-5">
          <CalendarClock className="mb-5 size-4 text-muted-foreground" />
          <div className="font-display text-3xl font-semibold text-foreground">
            {cycleCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Release Cycles Tracked</p>
        </div>

        <div className="bg-card p-5">
          <ShieldCheck className="mb-5 size-4 text-muted-foreground" />
          <div className="font-display text-3xl font-semibold text-foreground">
            {provenanceCount.toLocaleString()}
          </div>
          <p className="mt-1 text-xs font-medium text-muted-foreground">Verified Provenance Records</p>
        </div>
      </section>

      {/* Clean Padded Search & Filter Card */}
      <section className="my-7 rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunSearch();
          }}
          className="flex flex-col gap-3 lg:flex-row lg:items-center"
        >
          {/* Search Field + Search Button */}
          <div className="flex flex-1 items-center gap-2">
            <Input
              className="h-10 px-3.5"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, vendors, or categories (e.g. Windows, Cisco, Python)"
            />
            <Button type="submit" className="h-10 px-4 gap-1.5 font-medium cursor-pointer shrink-0">
              <Search className="size-4" />
              <span>Search</span>
            </Button>
          </div>

          {/* Filters + Reset Button */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Select
              value={category}
              onValueChange={(val) => {
                setCategory(val);
                setHasSearched(true);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((x) => (
                  <SelectItem key={x} value={x}>
                    {formatCategoryName(x)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val);
                setHasSearched(true);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="supported">Supported</SelectItem>
                <SelectItem value="approaching_eol">Action needed</SelectItem>
                <SelectItem value="end_of_life">End of life</SelectItem>
              </SelectContent>
            </Select>

            {(hasSearched || query || category !== "all" || status !== "all") && (
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

      {/* Main Content Area: Prompt when not searched, Results when searched */}
      {!hasSearched ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-10 text-center my-2 shadow-2xs">
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Enter a product or vendor above to look up support lifecycles, or click below to view the full product index.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShowAll}
              className="cursor-pointer gap-2"
            >
              <Boxes className="size-4 text-primary" />
              Browse All {productCount ? productCount.toLocaleString() : ""} Products
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {filtered.length} {filtered.length === 1 ? "product" : "products"} found
            </p>
            <p className="text-xs text-muted-foreground">Updated from verified sources</p>
          </div>

          {isLoading && (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading product lifecycle intelligence…
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              The catalog could not be loaded.
            </div>
          )}

          <div className="mt-3 overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            {filtered.map((product, i) => {
              const cycles = Array.isArray(product.release_cycles)
                ? [...product.release_cycles].sort((a, b) =>
                    (b.release_date ?? "").localeCompare(a.release_date ?? "")
                  )
                : [];
              const top = cycles[0];
              return (
                <Link
                  to="/product/$slug"
                  params={{ slug: product.slug }}
                  key={product.id}
                  className={`group grid gap-4 p-5 transition-colors hover:bg-muted/50 md:grid-cols-[1.6fr_1fr_1fr_auto] md:items-center ${
                    i ? "border-t border-border" : ""
                  }`}
                >
                  <div>
                    <h2 className="font-display text-base font-semibold group-hover:text-primary">
                      {product.name}
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.vendor} · {formatCategoryName(product.category)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground">
                      Current cycle
                    </p>
                    <p className="mt-1 text-sm font-medium font-mono">{top?.cycle ?? "Not indexed"}</p>
                  </div>
                  <div>
                    {top ? (
                      <StatusBadge status={top.status as LifecycleStatus} />
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting data</span>
                    )}
                  </div>
                  <ArrowRight className="hidden size-4 text-muted-foreground transition-transform group-hover:translate-x-1 md:block" />
                </Link>
              );
            })}

            {!isLoading && !filtered.length && (
              <div className="p-12 text-center">
                <p className="font-semibold text-foreground">No matching products</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a broader search term or clear the filters.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}