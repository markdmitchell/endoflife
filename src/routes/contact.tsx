import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Github,
  Mail,
  MessageSquare,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/contact")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contact Us | endoflife.tech" },
      {
        name: "description",
        content:
          "Get in touch with the endoflife.tech team to suggest products, report lifecycle corrections, or discuss enterprise integration.",
      },
      { property: "og:title", content: "Contact Us | endoflife.tech" },
      {
        property: "og:description",
        content:
          "Get in touch with the endoflife.tech team to suggest products, report lifecycle corrections, or discuss enterprise integration.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("suggestion");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    // Simulate swift submission handling
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      toast.success("Thank you! Your message has been received.");
    }, 600);
  };

  return (
    <div className="max-w-5xl">
      <PageHeader
        eyebrow="Get In Touch"
        title="Contact &amp; Collaboration"
        description="Have a question, need to report an updated lifecycle milestone, or interested in enterprise integration? We'd love to hear from you."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]">
        {/* Left Column: Form */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-xs">
          {submitted ? (
            <div className="py-12 text-center">
              <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <h3 className="mt-5 font-display text-2xl font-semibold text-foreground">
                Message Received
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                Thank you for reaching out, <strong>{name}</strong>. Our team reviews all inquiries,
                data corrections, and product suggestions diligently.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSubmitted(false);
                    setName("");
                    setEmail("");
                    setSubject("");
                    setMessage("");
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Send us a message
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  All submissions are monitored by the platform maintainers.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact-name">Your Name *</Label>
                  <Input
                    id="contact-name"
                    required
                    placeholder="e.g. Jane Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email Address *</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    required
                    placeholder="jane@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-topic">Category / Topic</Label>
                <Select value={topic} onValueChange={setTopic}>
                  <SelectTrigger id="contact-topic">
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="suggestion">Suggest a New Product / Technology</SelectItem>
                    <SelectItem value="provenance">
                      Report EOL Date / Provenance Correction
                    </SelectItem>
                    <SelectItem value="enterprise">
                      Enterprise Support / Custom Ingestion
                    </SelectItem>
                    <SelectItem value="partnership">Vendor Partnership / Authority Feed</SelectItem>
                    <SelectItem value="general">General Feedback or Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-subject">Subject</Label>
                <Input
                  id="contact-subject"
                  placeholder="e.g. Add VMware vSphere 8.0 LTSC lifecycle milestones"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-message">Message Details *</Label>
                <Textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="Please include links to vendor press releases, support bulletins, or specific questions..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full gap-2 cursor-pointer" disabled={isSubmitting}>
                <Send className="size-4" />
                <span>{isSubmitting ? "Sending..." : "Submit Inquiry"}</span>
              </Button>
            </form>
          )}
        </div>

        {/* Right Column: Channels & Maintainers */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xs">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
              <Mail className="size-4" />
              <span>Direct Channels</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              We welcome contributions, corrections, and inquiries from defense teams, system
              administrators, and open source engineers worldwide.
            </p>

            <div className="mt-5 space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-semibold text-foreground">Open Source Repository</div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Submit issues, feature requests, and upstream data tickets directly on GitHub.
                </p>
                <a
                  href="https://github.com/markdmitchell/endoflife"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <Github className="size-3.5" />
                  <span>markdmitchell/endoflife</span>
                </a>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-semibold text-foreground">Meet the Maintainers</div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Learn more about the origins, mission, and creators behind endoflife.tech.
                </p>
                <Link
                  to="/about"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                >
                  <span>Read our story on the About page</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
