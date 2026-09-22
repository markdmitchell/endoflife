import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Copy, ExternalLink, ShieldCheck, Terminal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getProduct, formatDate, type LifecycleStatus } from "@/lib/catalog";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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

function parseTags(desc: string | null | undefined, category: string, slug: string): string[] {
  if (!desc) {
    return Array.from(new Set([category, slug.replace(/-/g, " ")]));
  }
  const trimmed = desc.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((t) => String(t).toLowerCase());
      }
    } catch {
      // ignore
    }
  }
  return Array.from(new Set([category, slug.replace(/-/g, " ")]));
}

function getVerificationCommand(slug: string, name: string): string | null {
  const s = slug.toLowerCase();
  const n = name.toLowerCase();
  if (s.includes("windows") || n.includes("windows")) return "winver";
  if (s === "python") return "python --version";
  if (s === "nodejs" || s === "node") return "node -v";
  if (s === "go") return "go version";
  if (s === "rust") return "rustc --version";
  if (s === "ruby") return "ruby -v";
  if (s === "php") return "php -v";
  if (s.includes("dotnet") || n.includes(".net")) return "dotnet --version";
  if (s === "java" || s.includes("openjdk")) return "java -version";
  if (s === "ubuntu") return "lsb_release -a";
  if (s === "debian") return "cat /etc/debian_version";
  if (s === "rhel" || s.includes("redhat")) return "cat /etc/redhat-release";
  if (s === "centos") return "cat /etc/centos-release";
  if (s === "alpine") return "cat /etc/alpine-release";
  if (s === "postgresql" || s === "postgres") return "psql --version";
  if (s === "mysql") return "mysql --version";
  if (s === "mariadb") return "mariadb --version";
  if (s === "mongodb") return "mongod --version";
  if (s === "redis") return "redis-server -v";
  if (s === "nginx") return "nginx -v";
  if (s === "apache") return "httpd -v";
  if (s === "docker") return "docker --version";
  if (s === "kubernetes") return "kubectl version --client";
  if (s === "powershell") return "$PSVersionTable.PSVersion";
  if (s === "git") return "git --version";
  if (s === "terraform") return "terraform version";
  if (s.includes("linux") || n.includes("linux")) return "uname -a";
  if (s.includes("sql") && s.includes("server")) return "SELECT @@VERSION;";
  return null;
}

function formatTableDate(value: string | null | undefined): string {
  if (!value) return "Not published";
  const trimmed = value.trim();
  const match = trimmed.match(/^\d{4}-\d{2}-\d{2}/);
  if (match) return match[0];
  return formatDate(value);
}

function isLtsCycle(c: { cycle: string; latest_version?: string | null }): boolean {
  const text = `${c.cycle} ${c.latest_version ?? ""}`.toLowerCase();
  return text.includes("lts") || text.includes("long-term") || text.includes("esr");
}

function TableStatusBadge({ status }: { status: LifecycleStatus | string }) {
  if (status === "end_of_life") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
        <span className="size-2 rounded-full bg-rose-500" />
        End of Life (EOL)
      </span>
    );
  }
  if (status === "approaching_eol") {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
        <span className="size-2 rounded-full bg-amber-500" />
        Action Needed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
      <span className="size-2 rounded-full bg-emerald-500" />
      Supported
    </span>
  );
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

  const [copied, setCopied] = useState(false);

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
  const tags = parseTags(data.description, data.category, slug);
  const verifyCmd = getVerificationCommand(slug, data.name);
  const sourceName = data.provenance?.source_name ?? data.data_sources?.name ?? "endoflife.date API v1";
  const sourceUrl = data.provenance?.source_url ?? data.data_sources?.source_url ?? (data.homepage_url || null);
  const license = data.provenance?.license ?? data.data_sources?.license ?? "CC0 1.0 Universal";
  const confidenceScore = data.provenance?.confidence_score ?? 1;

  const handleCopyCommand = () => {
    if (!verifyCmd) return;
    navigator.clipboard.writeText(verifyCmd);
    setCopied(true);
    toast.success("Copied version verification command to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-3">
        <Link to="/">
          <ArrowLeft className="mr-1.5 size-4" />
          Catalog
        </Link>
      </Button>

      {/* Product Overview Card matching exact UI */}
      <section className="mb-8 overflow-hidden rounded-xl border border-border bg-card p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📦</span>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {data.name}{" "}
              <span className="font-mono text-sm font-normal text-muted-foreground">({data.slug})</span>
            </h1>
            <span className="text-sm text-muted-foreground">
              — Vendor: <strong className="text-foreground">{data.vendor || "N/A"}</strong> | Category:{" "}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs uppercase text-foreground">
                {data.category}
              </span>
            </span>
          </div>
          {data.homepage_url && (
            <Button asChild variant="outline" size="sm">
              <a href={data.homepage_url} target="_blank" rel="noreferrer">
                Vendor Portal <ExternalLink className="ml-1.5 size-3.5" />
              </a>
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {/* Left Column: Vendor, Tags, Verification Command */}
          <div className="space-y-3">
            <div className="text-xs">
              <span className="font-semibold text-foreground">Vendor: </span>
              <span className="text-muted-foreground">{data.vendor || "N/A"}</span>
            </div>

            <div className="text-xs">
              <span className="font-semibold text-foreground">Tags: </span>
              <span className="text-muted-foreground">{tags.join(", ")}</span>
            </div>

            {verifyCmd && (
              <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="flex items-center justify-between text-[11px] font-mono italic text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="size-3 text-primary" />
                    # Version Verification Command
                  </span>
                  <button
                    onClick={handleCopyCommand}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    title="Copy command"
                  >
                    {copied ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="mt-1.5 font-mono text-xs font-semibold text-foreground selection:bg-primary/20">
                  {verifyCmd}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Source, License, Provenance Score */}
          <div className="space-y-3 md:text-right">
            <div className="text-xs">
              <span className="font-semibold text-foreground">Source: </span>
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline"
                >
                  {sourceName}
                </a>
              ) : (
                <span className="text-muted-foreground">{sourceName}</span>
              )}
            </div>

            <div className="text-xs">
              <span className="font-semibold text-foreground">License: </span>
              <span className="text-muted-foreground">{license}</span>
            </div>

            <div className="text-xs">
              <span className="font-semibold text-foreground">Provenance Score: </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {Math.round(confidenceScore * 100)}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Release Cycles Table */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold tracking-tight text-foreground">
            Release Cycles ({cycles.length})
          </h2>
          <span className="text-xs text-muted-foreground">
            Support windows and verified end-of-life dates
          </span>
        </div>

        {cycles.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-muted-foreground">
            No specific release cycles are currently indexed for this product.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-xs">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-muted/70 text-xs font-semibold text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="w-12 px-4 py-3.5 text-center text-[11px] font-mono">#</th>
                  <th className="px-4 py-3.5">Release Cycle</th>
                  <th className="px-4 py-3.5">Release Date</th>
                  <th className="px-4 py-3.5">End of Active Support</th>
                  <th className="px-4 py-3.5">End of Life (EOL) Date</th>
                  <th className="px-4 py-3.5">LTS Status</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Latest Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cycles.map((c, idx) => {
                  const isLts = isLtsCycle(c);
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-muted-foreground">
                        {idx}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-foreground font-mono">
                        {c.cycle}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {formatTableDate(c.release_date)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {formatTableDate(c.support_end)}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {formatTableDate(c.eol_date)}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        {isLts ? (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <Check className="size-3" /> LTS
                          </span>
                        ) : (
                          <span className="text-muted-foreground font-medium">Standard</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <TableStatusBadge status={c.status || "supported"} />
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-foreground">
                        {c.latest_version ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {slug === "python" && <PythonEolGuide />}
      </section>
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
