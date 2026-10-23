import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { actionSummary, type ActionRecords } from "@/lib/action-tracking";
import type { SbomParsedEnvironment } from "@/lib/sbom";

export function ActionTrackingSummary({ environments, records, isSampleData, signedIn, loading, error }: {
  environments: SbomParsedEnvironment[]; records: ActionRecords; isSampleData: boolean; signedIn: boolean; loading: boolean; error: string;
}) {
  const summary = actionSummary(environments, records, new Date().toISOString().slice(0, 10));
  return <section className="mb-6 border-b border-border pb-6" aria-labelledby="action-tracking-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="action-tracking-title" className="text-lg font-semibold">Remediation action tracking</h2>
      <span className="text-xs text-muted-foreground">{isSampleData ? "Demo statuses · Not saved" : loading ? "Loading saved statuses" : signedIn ? "Account-saved statuses · Inventory session-only" : "Sign in to save statuses"}</span>
    </div>
    <dl className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
      {[["Outstanding EOL actions", summary.outstandingEol], ["Planned", summary.planned], ["In progress", summary.inProgress], ["Remediated", summary.remediated]].map(([label, value]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold text-foreground">{!isSampleData && (loading || error) ? "N/A" : value}</dd></div>)}
    </dl>
    <p className="mt-4 text-xs text-muted-foreground">{summary.reportedEol} EOL versions still reported · {summary.unknown} unknown EOL dates. Remediated is a self-reported action status, not verified support. Lifecycle risk remains until an updated inventory confirms resolution.</p>
    {!isSampleData && !loading && !signedIn && <Button className="mt-3" variant="outline" asChild><Link to="/auth">Sign in to track actions</Link></Button>}
    {error && !isSampleData && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </section>;
}