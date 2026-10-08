import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Terms of Service — endoflife.tech" },
      {
        name: "description",
        content:
          "Terms of Service governing the use of endoflife.tech platform, catalog data, APIs, and services.",
      },
      { property: "og:title", content: "Terms of Service — endoflife.tech" },
      {
        property: "og:description",
        content:
          "Terms of Service governing the use of endoflife.tech platform, catalog data, APIs, and services.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Legal &amp; Compliance"
        title="Terms of Service"
        description="Terms governing your access to and use of the endoflife.tech website, software catalog, provenance records, and intelligence services."
      />

      <div className="mt-8 space-y-8 rounded-2xl border border-border bg-card p-6 md:p-10 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-4">
          <FileText className="size-4 text-primary" />
          <span>Last Updated: September 2026 | Version 1.0</span>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            1. Acceptance of Terms
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            By accessing or using <strong>endoflife.tech</strong> (the "Service"), you agree to be
            bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may
            not access or use the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            2. Purpose &amp; Lifecycle Data Notice
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              endoflife.tech aggregates and organizes software and hardware end-of-life (EOL),
              end-of-service (EOS), and release support milestones from official vendor
              announcements, developer documentation, security advisories, and public authorities.
            </p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-relaxed text-amber-900 dark:text-amber-200">
              <strong>Enterprise Notice:</strong> While we maintain rigorous data provenance
              pipelines and audit verification, lifecycle policies and support channels can vary
              based on individual enterprise contract terms, specialized government procurement
              agreements, or custom Long-Term Servicing Channel (LTSC) support. Organizations should
              always consult their direct vendor contracts for definitive legal and warranty
              guarantees.
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            3. Acceptable Use Policy
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You agree to use the Service in compliance with all applicable laws and ethical
            standards. Permitted and encouraged uses include:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>Enterprise IT asset management, software risk modeling, and migration planning.</li>
            <li>Cybersecurity vulnerability management and compliance auditing.</li>
            <li>Academic, research, and non-commercial open source analysis.</li>
          </ul>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Prohibited uses include attempting to compromise platform security, executing
            denial-of-service attacks, or launching high-concurrency automated scrapers that degrade
            platform availability for other users without prior coordination.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            4. Trademarks &amp; Intellectual Property
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            All vendor names, brand marks, logos, and product trademarks referenced on
            endoflife.tech are the property of their respective owners. Their inclusion in this
            catalog is strictly for informational identification, lifecycle documentation, and
            compatibility verification under nominative fair use.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The endoflife.tech name, custom data pipeline architectures, and platform codebase are
            maintained by the platform founders and open source contributors.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            5. Disclaimer of Warranties
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground uppercase font-mono text-xs">
            The service and all lifecycle data are provided on an "as is" and "as available" basis
            without warranties of any kind, whether express or implied, including but not limited to
            implied warranties of merchantability, fitness for a particular purpose, or
            non-infringement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            6. Limitation of Liability
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            To the maximum extent permitted by applicable law, endoflife.tech and its maintainers
            shall not be liable for any indirect, incidental, special, consequential, or punitive
            damages resulting from your access to or inability to access the service, or any
            reliance placed on lifecycle dates.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            7. Modifications to Service &amp; Terms
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We reserve the right to modify or discontinue any part of the service or update these
            Terms at our discretion. Any revisions will be reflected on this page with an updated
            effective date.
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            8. Questions &amp; Support
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            For legal inquiries or questions regarding these Terms, please contact us through our{" "}
            <Link to="/contact" className="font-medium text-primary hover:underline">
              Contact Form
            </Link>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
