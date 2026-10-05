import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Database, Gauge, LogOut, Menu, Search, Settings2, Sparkles, X } from "lucide-react";
import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { ReleaseNotesModal } from "@/components/release-notes-modal";
import bannerIconAsset from "@/assets/endoflife-banner-icon-green.png.asset.json";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { STATUS_EXPLANATIONS } from "@/lib/catalog";

const nav = [
  { to: "/", label: "Catalog", icon: Search },
  { to: "/risk", label: "SecOps & Risk", icon: Gauge },
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

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setIsSignedIn(false);
      setIsAdmin(false);
      toast.success("Signed out successfully");
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Failed to sign out");
    }
  };

  const visibleNav = nav.filter((item) => item.to !== "/admin" || isAdmin);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-28 max-w-[1600px] items-center justify-between px-4 lg:px-7">
          <Link to="/" className="flex items-center gap-3" aria-label="endoflife.tech home">
            <img src={bannerIconAsset.url} alt="" className="size-18 rounded-md" />
            <span><strong className="block text-[28px] leading-tight">endoflife.tech</strong><span className="block text-[22px] leading-tight text-muted-foreground">Product Lifecycle Intelligence</span></span>
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
            {isSignedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Log out of your account"
              >
                <LogOut className="size-3.5" />
                <span>Log out</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className={`${open ? "flex flex-col justify-between" : "hidden"} border-b border-border bg-sidebar px-4 py-4 lg:flex lg:flex-col lg:justify-between lg:sticky lg:top-28 lg:h-[calc(100vh-7rem)] lg:border-b-0 lg:border-r lg:px-3 lg:py-6`}>
          <div>
            <nav className="grid gap-1 sm:grid-cols-5 lg:grid-cols-1">
              {visibleNav.map((item) => {
                const Icon = item.icon;
                const active = item.to === "/" ? path === "/" || path.startsWith("/product/") : path.startsWith(item.to);
                return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon className="size-4" />{item.label}</Link>;
              })}
              {isSignedIn && (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    void handleSignOut();
                  }}
                  className="flex lg:hidden items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left w-full"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </button>
              )}
            </nav>
          </div>
        </aside>
        <main className="min-w-0 flex flex-col justify-between min-h-[calc(100vh-7rem)] px-4 py-7 md:px-7 lg:px-10 lg:py-9">
          <div className="flex-1">{children}</div>
          <footer className="mt-16 border-t border-border pt-6 pb-2 text-xs text-muted-foreground">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-foreground">endoflife.tech</span>
                <span className="text-muted-foreground/60 hidden sm:inline">•</span>
                <span>Product Lifecycle Intelligence</span>
              </div>
              <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
                <Link to="/contact" className="transition-colors hover:text-foreground">Contact</Link>
                <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
                <Link to="/terms" className="transition-colors hover:text-foreground">Terms</Link>
              </nav>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-7 md:flex-row md:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p><h1 className="font-display text-3xl font-semibold tracking-normal md:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></div>{action}</div>;
}

export function StatusBadge({ status }: { status: "supported" | "approaching_eol" | "end_of_life" }) {
  const labels = { supported: "Supported", approaching_eol: "Action needed", end_of_life: "End of life" };
  const info = STATUS_EXPLANATIONS[status] ?? STATUS_EXPLANATIONS.supported;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            title={`${info.title}: ${info.description}`}
            className={`status-badge status-${status} cursor-help`}
          >
            {labels[status]}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-xs bg-white text-zinc-900 border border-border shadow-md p-2.5">
          <p className="font-semibold text-zinc-950">{info.title}</p>
          <p className="mt-0.5 text-zinc-600 leading-snug">{info.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}