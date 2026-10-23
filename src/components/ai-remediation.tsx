import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Loader2, Sparkles, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { prepareRemediationAssets } from "@/lib/remediation";
import type { SbomParsedEnvironment } from "@/lib/sbom";
import { actionStatus, type ActionRecords } from "@/lib/action-tracking";

export function AiRemediation({ environments, isSampleData, actionRecords = {} }: { environments: SbomParsedEnvironment[]; isSampleData: boolean; actionRecords?: ActionRecords }) {
  const [context, setContext] = useState("");
  const [includeNames, setIncludeNames] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [error, setError] = useState("");
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const [status, setStatus] = useState("");
  const abort = useRef<AbortController | null>(null);
  useEffect(() => { abort.current?.abort(); setResult(""); setReasoning(""); setStatus(""); setError(""); }, [environments]);
  useEffect(() => () => abort.current?.abort(), []);

  async function analyze() {
    setError(""); setNeedsSignIn(false);
    const { data } = await supabase.auth.getSession();
    if (!data.session) { setNeedsSignIn(true); return; }
    const controller = new AbortController(); abort.current = controller;
    setBusy(true); setResult(""); setReasoning(""); setStatus("Analyzing inventory");
    try {
      const response = await fetch("/api/remediation", { method: "POST", signal: controller.signal,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ assets: prepareRemediationAssets(environments, includeNames).map((asset, index) => {
          const env = environments[index];
          return { ...asset, migrationStatus: env ? actionStatus(env, actionRecords) : asset.migrationStatus };
        }), context }),
      });
      if (!response.ok) { const body = await response.json(); if (response.status === 401) setNeedsSignIn(true); throw new Error(body.message || "Analysis is unavailable."); }
      if (!response.body) throw new Error("No analysis was returned.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let pending = ""; let completed = false;
      while (true) {
        const chunk = await reader.read(); pending += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = pending.split("\n"); pending = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "text") setResult(previous => previous + event.text);
          if (event.type === "reasoning") setReasoning(previous => previous + event.text);
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "done") { completed = true; setStatus("Analysis complete"); }
        }
        if (chunk.done) break;
      }
      if (!completed) throw new Error("Analysis was interrupted. Partial recommendations are incomplete.");
    } catch (err) {
      if (controller.signal.aborted) setStatus("Stopped. Partial recommendations are incomplete.");
      else { setError(err instanceof Error ? err.message : "Analysis failed."); setStatus("Analysis ended"); }
    } finally { setBusy(false); abort.current = null; }
  }
  function download() {
    const tracking = environments.map((env, index) => `${includeNames ? env.deployment_env : `Asset ${index + 1}`} (${env.platform} ${env.version}): ${actionStatus(env, actionRecords)}`).join("\n");
    const blob = new Blob([`EOL remediation priorities\n${status}\n${isSampleData ? "Sample inventory" : "Uploaded inventory"}\n\n${result}\n\nCurrent action statuses\n${tracking}\n\nAI-generated advisory. Validate support dates and upgrade targets before making changes.`], { type: "text/plain" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "eol-remediation-plan.txt"; link.click(); URL.revokeObjectURL(url);
  }
  return <section className="mb-6 border-y border-border py-6" aria-labelledby="ai-remediation-title">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id="ai-remediation-title" className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-primary" /> AI remediation priorities</h2>
      <span className="text-sm text-muted-foreground">{environments.length} assets · {isSampleData ? "Sample inventory" : "Uploaded inventory"}</span>
    </div>
    <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="space-y-4">
        <label className="block text-sm font-medium" htmlFor="remediation-context">Business context (optional)</label>
        <Textarea id="remediation-context" value={context} onChange={e => setContext(e.target.value)} maxLength={2000} disabled={busy} placeholder="For example: public-facing payments services first; monthly maintenance window; limited migration capacity." className="min-h-24" />
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={includeNames} onCheckedChange={value => setIncludeNames(value === true)} disabled={busy} /> Include asset names (otherwise Asset 1, Asset 2, etc.)</label>
        <p className="text-xs leading-relaxed text-muted-foreground">Product, version, EOL date, proposed upgrade, migration status, waiver expiry, and your context are sent to Lovable AI. Owners and raw files are excluded. Remove secrets from context. Analysis uses workspace AI credits.</p>
        <label className="flex items-start gap-2 text-sm"><Checkbox checked={consent} onCheckedChange={value => setConsent(value === true)} disabled={busy} /> I am authorized to send this inventory to Lovable AI.</label>
        <div className="flex flex-wrap gap-2">
          <Button onClick={analyze} disabled={busy || !consent || !environments.length || environments.length > 200}><Sparkles className="mr-2 size-4" /> Prioritize remediation</Button>
          {busy && <Button variant="outline" onClick={() => abort.current?.abort()}><Square className="mr-2 size-4" /> Stop</Button>}
        </div>
        {environments.length > 200 && <p className="text-sm text-destructive">Analyze up to 200 assets at a time. Upload a smaller inventory.</p>}
        {needsSignIn && <Button variant="outline" asChild><Link to="/auth">Sign in to analyze</Link></Button>}
        {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
      </div>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground" aria-live="polite">
          <span className="flex items-center gap-2">{busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" />}{status || "Remediation plan"}</span>
          {result && <Button variant="ghost" size="icon" title="Download remediation plan" aria-label="Download remediation plan" onClick={download}><Download className="size-4" /></Button>}
        </div>
        {reasoning && <details className="mt-3 text-sm text-muted-foreground"><summary className="cursor-pointer">Analysis notes</summary><p className="mt-2 whitespace-pre-wrap break-words">{reasoning}</p></details>}
        {result && <div className="mt-3 max-h-[36rem] overflow-y-auto whitespace-pre-wrap break-words text-sm leading-7">{result}</div>}
        <p className="mt-4 text-xs text-muted-foreground">AI-generated advisory, not a verified vulnerability assessment. Confirm lifecycle dates, exposure, dependencies, and upgrade targets. No asset changes are executed.</p>
      </div>
    </div>
  </section>;
}