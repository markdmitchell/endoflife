import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Database, Gauge, Menu, Search, Settings2, Sparkles, Users, X } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ReleaseNotesModal } from "@/components/release-notes-modal";
import bannerIconAsset from "@/assets/endoflife-banner-icon-green.png.asset.json";

const nav = [
  { to: "/", label: "Catalog", icon: Search },
  { to: "/risk", label: "Risk overview", icon: Gauge },
  { to: "/sources", label: "Data sources", icon: Database },
  { to: "/provenance", label: "Provenance", icon: BookOpen },
  { to: "/admin", label: "Administration", icon: Settings2 },
] as const;

const DESIGNATED_ADMIN_EMAILS = [
  "fragglemark@gmail.com",
  "markdmitchell@outlook.com",
  "jbshenberger@gmail.com"
];

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    let mounted = true;

    async function checkRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) {
          if (mounted) {
            setIsAdmin(false);
            setIsSignedIn(false);
          }
          return;
        }

        if (mounted) setIsSignedIn(true);

        const email = (user.email ?? "").toLowerCase().trim();
        if (DESIGNATED_ADMIN_EMAILS.includes(email)) {
          if (mounted) setIsAdmin(true);
          return;
        }

        const { data: role } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (role?.role === "admin") {
          if (mounted) setIsAdmin(true);
          return;
        }

        const { data: allowed } = await supabase.rpc("has_role", {
          _user_id: user.id,
          _role: "admin"
        });

        if (mounted) setIsAdmin(Boolean(allowed));
      } catch {
        if (mounted) setIsAdmin(false);
      }
    }

    void checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        void checkRole();
      } else {
        if (mounted) {
          setIsAdmin(false);
          setIsSignedIn(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const visibleNav = nav.filter((item) => item.to !== "/admin" || isAdmin);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-7">
          <Link to="/" className="flex items-center gap-3" aria-label="endoflife.tech home">
            <img src={bannerIconAsset.url} alt="" className="size-9 rounded-md" />
            <span><strong className="block text-sm">endoflife.tech</strong><span className="block text-[11px] text-muted-foreground">Lifecycle intelligence</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <ReleaseNotesModal
              trigger={
                <button
                  type="button"
                  className="hidden items-center gap-1.5 rounded-full border border-border bg-muted/80 px-2.5 py-1 text-[11px] font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-accent sm:inline-flex cursor-pointer shadow-2xs"
                  title="View What's New & Release Notes"
                >
                  <Sparkles className="size-3 text-primary" />
                  <span>v1.0.0</span>
                  <span className="rounded bg-primary/15 px-1 py-0.2 text-[9px] font-bold uppercase tracking-wider text-primary">GA</span>
                </button>
              }
            />
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">{isSignedIn ? "Account" : "Sign in"}</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className={`${open ? "flex flex-col justify-between" : "hidden"} border-b border-border bg-sidebar px-4 py-4 lg:flex lg:flex-col lg:justify-between lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:px-3 lg:py-6`}>
          <div>
            <nav className="grid gap-1 sm:grid-cols-5 lg:grid-cols-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = item.to === "/" ? path === "/" || path.startsWith("/product/") : path.startsWith(item.to);
                return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon className="size-4" />{item.label}</Link>;
              })}
            </nav>
          </div>

          {/* Bottom Sidebar Area: What's New + Authors & Contributors */}
          <div className="mt-auto border-t border-sidebar-border pt-4">
            <ReleaseNotesModal
              trigger={
                <button
                  type="button"
                  className="mb-3 flex w-full items-center justify-between rounded-lg border border-sidebar-border bg-card/60 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground cursor-pointer shadow-2xs"
                  title="View Platform Release Notes"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="size-3.5 text-primary" />
                    <span>What&apos;s New in v1.0.0</span>
                  </span>
                  <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">GA</span>
                </button>
              }
            />

            <div className="rounded-xl border border-sidebar-border bg-card/60 p-3 shadow-xs">
              <div className="mb-2.5 flex items-center gap-2 px-1 text-xs font-semibold text-foreground">
                <Users className="size-3.5 text-primary" />
                <span>Authors &amp; Contributors</span>
              </div>
              <div className="space-y-1">
                <a
                  href="https://www.linkedin.com/in/markdmitchell/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-sidebar-accent hover:text-primary"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded bg-[#0A66C2] text-white">
                    <svg className="size-2.5 fill-white" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.35a1.65 1.65 0 0 0-1.66 1.65 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.65-1.66c0-.91-.74-1.65-1.65-1.65Z" />
                    </svg>
                  </span>
                  <span className="truncate">Mark D. Mitchell</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/jamesshenberger/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-sidebar-accent hover:text-primary"
                >
                  <span className="flex size-4 shrink-0 items-center justify-center rounded bg-[#0A66C2] text-white">
                    <svg className="size-2.5 fill-white" viewBox="0 0 24 24">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.35a1.65 1.65 0 0 0-1.66 1.65 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.65-1.66c0-.91-.74-1.65-1.65-1.65Z" />
                    </svg>
                  </span>
                  <span className="truncate">James Shenberger</span>
                </a>
              </div>
            </div>
          </div>
        </aside>
        <main className="min-w-0 px-4 py-7 md:px-7 lg:px-10 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h1 className="font-display text-3xl font-semibold tracking-normal md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}

export function StatusBadge({ status }: { status: "supported" | "approaching_eol" | "end_of_life" }) {
  const labels = { supported: "Supported", approaching_eol: "Action needed", end_of_life: "End of life" };
  return <span className={`status-badge status-${status}`}><span className="size-1.5 rounded-full bg-current" />{labels[status]}</span>;
}