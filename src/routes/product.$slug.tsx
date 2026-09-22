import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getProduct, formatDate, type LifecycleStatus } from "@/lib/catalog";
import { PageHeader, StatusBadge } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

function displayName(slug: string) {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function headMeta(slug: string) {
  const name = displayName(slug);
  const title =
    slug === "python"
      ? "Python EOL Dates & Support Lifecycle — endoflife.tech"
      : `${name} lifecycle — endoflife.tech`;
  const description =
    slug === "python"
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

export const Route = createFileRoute("/product/$slug")({
  staticData: { sitemap: true },
  head: ({ params }) => headMeta(params.slug),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery({ queryKey: ["product", slug], queryFn: () => getProduct(slug) });
  if (isLoading) return <p className="py-20 text-sm text-muted-foreground">Loading product record…</p>;
  if (!data)
    return (
      <div>
        <PageHeader eyebrow="Not found" title="Product unavailable" description="This product may have moved or is not indexed." />
        <Button asChild variant="outline">
          <Link to="/">
            <ArrowLeft />
            Back to catalog
          </Link>
        </Button>
      </div>
    );
  const cycles = [...data.release_cycles].sort((a, b) => (b.release_date ?? "").localeCompare(a.release_date ?? ""));
  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/">
          <ArrowLeft />
          Catalog
        </Link>
      </Button>
      <PageHeader
        eyebrow={`${data.vendor} · ${data.category}`}
        title={data.name}
        description={data.description}
        action={
          data.homepage_url ? (
            <Button asChild variant="outline">
              <a href={data.homepage_url} target="_blank" rel="noreferrer">
                Product site <ExternalLink />
              </a>
            </Button>
          ) : undefined
        }
      />
      <div className="grid gap-7 xl:grid-cols-[1fr_300px]">
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Release cycles</h2>
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
                      <StatusBadge status={c.status as LifecycleStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {slug === "python" && <PythonEolGuide />}
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase text-muted-foreground">Source</p>
            <p className="mt-3 font-semibold">{data.data_sources?.name ?? "Catalog source"}</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{data.data_sources?.description}</p>
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
