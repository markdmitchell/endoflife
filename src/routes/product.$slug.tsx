import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getProduct, formatDate, type LifecycleStatus } from "@/lib/catalog";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

function displayName(slug?: string) {
  if (!slug) return "Product";
  return slug
    .split("-")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

function headMeta(slug?: string) {
  const safeSlug = (slug || "").toLowerCase();
  const name = displayName(safeSlug);
  const title =
    safeSlug === "python"
      ? "Python EOL Dates & Support Lifecycle — endoflife.tech"
      : `${name} lifecycle — endoflife.tech`;
  const description =
    safeSlug === "python"
      ? "Python end-of-life (EOL) dates and support status for every 3.x release. See which Python versions still receive security fixes and when each branch reaches end of life."
      : `${name} release and support lifecycle details, including support windows and end-of-life dates.`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}

function cleanDescription(desc: string | null | undefined, name: string): string {
  if (!desc) return `Lifecycle support schedule and end-of-life milestones for ${name}.`;
  const trimmed = desc.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return `Lifecycle support schedule and end-of-life milestones for ${name} (${parsed.join(", ")}).`;
      }
    } catch {
      // ignore
    }
  }
  return trimmed;
}

export const Route = createFileRoute("/product/$slug")({
  staticData: { sitemap: true },
  head: (ctx) => headMeta(ctx?.params?.slug ?? (ctx as any)?.match?.params?.slug),
  component: ProductPage,
});

function ProductPage() {
  const params = Route.useParams();
  const slug = params?.slug ?? "";
  const { data, isLoading, error } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => (slug ? getProduct(slug) : null),
    enabled: Boolean(slug),
  });

  if (isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading product record…</div>;

  if (error || !data)
    return (
      <div>
        <PageHeader eyebrow="Not found" title="Product unavailable" description="This product may have moved or is not indexed." />
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft className="mr-1.5 size-4" />
            Back to catalog
          </Link>
        </Button>
      </div>
    );

  const rawCycles = Array.isArray(data.release_cycles) ? data.release_cycles : [];
  const cycles = [...rawCycles].sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/">
          <ArrowLeft className="mr-1.5 size-4" />
          Catalog
        </Link>
      </Button>
      <PageHeader
        eyebrow={`${data.vendor || "Enterprise Software"} · ${data.category || "General"}`}
        title={data.name || displayName(slug)}
        description={cleanDescription(data.description, data.name || displayName(slug))}
        action={
          data.homepage_url ? (
            <Button asChild variant="outline">
              <a href={data.homepage_url} target="_blank" rel="noreferrer">
                Product site <ExternalLink className="ml-1.5 size-4" />
              </a>
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-7 xl:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Release cycles</h2>
          {cycles.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No specific release cycles are currently indexed for this product.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-muted/70 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Cycle</th>
                    <th className="px-4 py-3">Latest</th>
                    <th className="px-4 py-3">Released</th>
                    <th className="px-4 py-3">Support ends</th>
                    <th className="px-4 py-3">End of life</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cycles.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="px-4 py-4 font-semibold">{c.cycle}</td>
                      <td className="px-4 py-4">{c.latest_version ?? "—"}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(c.release_date)}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(c.support_end)}</td>
                      <td className="px-4 py-4 text-muted-foreground">{formatDate(c.eol_date)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={(c.status || "supported") as LifecycleStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {slug === "python" && <PythonEolGuide />}
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase text-muted-foreground">Source</p>
            <p className="mt-3 font-semibold">{data.data_sources?.name ?? "Verified Upstream Authority"}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {data.data_sources?.description ?? "Collected directly from authoritative vendor feeds and public advisories."}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/50 p-5">
            <p className="text-sm font-semibold">Lifecycle confidence</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Dates should be validated against vendor guidance before production decisions.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function PythonEolGuide() {
  return (
    <div className="mt-8 rounded-lg border border-border bg-card p-6">
      <h2 className="font-display text-lg font-semibold">Understanding Python EOL dates</h2>
      <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
        <p>
          Each Python 3.x feature release (3.9, 3.10, 3.11, 3.12, 3.13, and so on) is supported for roughly five
          years from its initial release. For about the first two years a branch receives full bugfix releases; after
          that it moves into a security-only phase where fixes ship as source-only security releases.
        </p>
        <p>
          When a branch reaches its end of life (EOL), it stops receiving all updates — including security patches.
          Running an EOL Python version means newly disclosed vulnerabilities in the interpreter and standard library
          will never be fixed, which is a common compliance and audit finding.
        </p>
        <p>
          Use the release table above to check the exact EOL date for each Python version, and plan upgrades so
          production systems stay on a branch that still receives security support.
        </p>
      </div>
    </div>
  );
}
