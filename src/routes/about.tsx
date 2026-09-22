import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Clock, Database, Globe, Layers, ShieldCheck, Users } from "lucide-react";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "About Us — endoflife.tech" },
      { name: "description", content: "Learn about the mission, origins, and team behind endoflife.tech — the authoritative product lifecycle intelligence platform." },
      { property: "og:title", content: "About Us — endoflife.tech" },
      { property: "og:description", content: "Learn about the mission, origins, and team behind endoflife.tech — the authoritative product lifecycle intelligence platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Mission &amp; Heritage"
        title="About endoflife.tech"
        description="The authoritative, provenance-backed product lifecycle intelligence catalog built for modern enterprise engineering, cybersecurity, and IT asset governance."
      />

      {/* Origin Story Banner */}
      <section className="mt-8 rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs">
        <div className="flex items-center gap-3 text-primary">
          <ShieldCheck className="size-6" />
          <span className="text-xs font-bold uppercase tracking-wider">The Origin Story</span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl text-foreground">
          Born from real-world Defense Health Agency operational challenges
        </h2>
        <div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          <p>
            During service tracking enterprise health systems at the <strong>Defense Health Agency (DHA)</strong>, one of the most critical weekly responsibilities was identifying and cataloging software components approaching or already past their <strong>End-of-Life (EOL)</strong> or <strong>End-of-Service (EOS)</strong> milestones.
          </p>
          <p>
            Gathering reliable, timely dates across thousands of packages was an unrelenting challenge. High-security government and clinical environments frequently operate on <strong>Extended Support agreements</strong> or <strong>Long-Term Servicing Channels (LTSC)</strong> — dates that are rarely found in standard consumer documentation and instead remain scattered across vendor support portals, obscure PDF bulletins, and private lifecycle matrices.
          </p>
          <p>
            Colleague <strong>James Shenberger</strong> built early automation to help manage the volume, but maintaining manual trackers under strict security boundaries without dedicated engineering infrastructure was an ongoing uphill battle.
          </p>
          <p>
            This operational experience led <strong>Mark D. Mitchell</strong> to build <strong>endoflife.tech</strong>: an enterprise-grade platform that programmatically queries official vendor portals, community authorities, and security bulletins with <em>uncompromising data provenance</em> to deliver reliable, verifiable lifecycle intelligence.
          </p>
        </div>
      </section>

      {/* Core Principles */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl text-foreground">
          Why endoflife.tech is different
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Built from the ground up for cybersecurity architects, enterprise IT managers, and platform engineers.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <BookOpen className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">100% Data Provenance</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Every release cycle links back to its verified source URL, publishing authority, snapshot timestamp, and confidence score so compliance auditors can verify with confidence.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Clock className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">Extended Support &amp; LTSC</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We differentiate between active mainstream support, extended support channels, and absolute end-of-life, ensuring enterprise-grade accuracy.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5 shadow-2xs">
            <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
              <Globe className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold text-foreground">Continuous Expansion</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              New technologies, operating systems, frameworks, databases, and enterprise applications are vetted and ingested weekly to ensure comprehensive coverage.
            </p>
          </div>
        </div>
      </section>

      {/* Platform Scale KPI Grid */}
      <section className="mt-12 rounded-xl border border-border bg-border overflow-hidden grid gap-px sm:grid-cols-3">
        <div className="bg-card p-6 text-center">
          <span className="block font-display text-3xl font-bold text-foreground">2,970+</span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enterprise Products</span>
        </div>
        <div className="bg-card p-6 text-center">
          <span className="block font-display text-3xl font-bold text-foreground">8,800+</span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tracked Release Cycles</span>
        </div>
        <div className="bg-card p-6 text-center">
          <span className="block font-display text-3xl font-bold text-foreground">39,000+</span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audit Provenance Records</span>
        </div>
      </section>

      {/* Maintainers Section */}
      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold tracking-tight md:text-2xl text-foreground">
          Maintainers &amp; Contributors
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Engineered with pride by enterprise practitioners for the global developer and defense community.
        </p>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                  MM
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">Mark D. Mitchell</h3>
                  <p className="text-xs text-muted-foreground">Creator &amp; Principal Maintainer</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Software architect and former Defense Health Agency contractor specializing in enterprise systems governance, automated data pipelines, and infrastructure compliance.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <a
                href="https://www.linkedin.com/in/markdmitchell/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <span>Connect on LinkedIn</span>
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 shadow-2xs">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary font-bold">
                  JS
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-base">James Shenberger</h3>
                  <p className="text-xs text-muted-foreground">Co-Founder &amp; Contributor</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                Defense Health Agency colleague and automation pioneer whose early tooling and lifecycle tracking methodologies directly inspired the inception of endoflife.tech.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border">
              <a
                href="https://www.linkedin.com/in/jamesshenberger/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
              >
                <span>Connect on LinkedIn</span>
                <ArrowRight className="size-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="mt-12 rounded-xl border border-border bg-muted/30 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">Explore the Intelligence Catalog</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-lg">
            Search thousands of software packages, view active support horizons, and verify provenance for your fleet.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button asChild>
            <Link to="/">Explore Catalog</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Get in Touch</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
