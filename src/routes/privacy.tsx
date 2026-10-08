import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Privacy Policy | endoflife.tech" },
      {
        name: "description",
        content:
          "Privacy Policy for endoflife.tech. Transparent data protection, minimal telemetry, and zero sale of personal information.",
      },
      { property: "og:title", content: "Privacy Policy | endoflife.tech" },
      {
        property: "og:description",
        content:
          "Privacy Policy for endoflife.tech. Transparent data protection, minimal telemetry, and zero sale of personal information.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="max-w-4xl">
      <PageHeader
        eyebrow="Trust &amp; Governance"
        title="Privacy Policy"
        description="Our commitment to transparency, minimal data collection, and uncompromising data protection for software professionals and enterprise teams."
      />

      <div className="mt-8 space-y-8 rounded-2xl border border-border bg-card p-6 md:p-10 shadow-xs">
        <div className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-4">
          <ShieldCheck className="size-4 text-primary" />
          <span>Effective Date: September 2026 | Version 1.0</span>
        </div>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            1. Core Privacy Philosophy
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong>endoflife.tech</strong> exists to organize and deliver public software and
            hardware lifecycle intelligence. We believe developers, security engineers, and
            enterprise leaders deserve authoritative data without surveillance or commercial
            profiling. We do not sell, rent, or monetize your personal information to third parties.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            2. Information We Collect
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <strong>a. Anonymous Catalog Browsing:</strong> When searching the public catalog,
              browsing products, or verifying provenance, you do not need to create an account. We
              do not use third-party advertising cookies or cross-site tracking pixels.
            </p>
            <p>
              <strong>b. Authenticated Workspace Accounts:</strong> When signing in to manage data
              sources or enterprise administration, we collect your work email address and
              authentication tokens via our secure authentication provider (Supabase Auth / Google
              OAuth).
            </p>
            <p>
              <strong>c. Fleet Inventory &amp; Risk Dashboard Data:</strong> When uploading CSV
              fleet inventory files to the Risk Dashboard, files are parsed directly inside your
              browser memory to evaluate lifecycle status against the catalog. We do not inspect,
              log, or harvest private internal network hostnames, IP addresses, or proprietary asset
              topologies.
            </p>
            <p>
              <strong>d. Technical Telemetry:</strong> Like all web services, our global delivery
              network (Cloudflare edge) automatically logs basic operational metrics (HTTP status
              codes, coarse geographic region, browser user-agent) strictly to prevent
              denial-of-service attacks, maintain platform uptime, and optimize caching performance.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            3. How We Use Information
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>To provide, operate, and maintain the lifecycle intelligence platform.</li>
            <li>To authenticate authorized administrators and govern data ingestion pipelines.</li>
            <li>To respond to user support inquiries, data corrections, and product requests.</li>
            <li>
              To monitor system performance, uptime, and protect against security incidents or
              malicious traffic.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            4. Data Security &amp; Storage
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We implement industry-standard cryptographic protocols to protect data in transit (TLS
            1.3) and at rest (AES-256). All database infrastructure is hosted with SOC 2 Type II
            compliant providers. Role-based access control (RBAC) and row-level security (RLS)
            policies restrict database writes exclusively to authenticated administrators.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            5. Third-Party Service Providers
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We partner with reputable infrastructure providers to deliver reliable global service:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li>
              <strong>Supabase:</strong> Managed PostgreSQL database, authentication, and secure
              row-level access control.
            </li>
            <li>
              <strong>Cloudflare / Lovable Cloud:</strong> Edge hosting, TLS termination, CDN
              caching, and DDoS mitigation.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-foreground">
            6. Your Rights &amp; Data Control
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            You retain full rights over any account data associated with endoflife.tech. You may
            request account deletion, data export, or correction at any time by contacting our
            maintainers via our{" "}
            <Link to="/contact" className="font-medium text-primary hover:underline">
              Contact page
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3 border-t border-border pt-6">
          <h2 className="font-display text-xl font-semibold text-foreground">
            7. Contact Information
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            If you have questions regarding this Privacy Policy or our operational security
            practices, please reach out via our{" "}
            <Link to="/contact" className="font-medium text-primary hover:underline">
              Contact Form
            </Link>{" "}
            or connect with our maintainers directly.
          </p>
        </section>
      </div>
    </div>
  );
}
