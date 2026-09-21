import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Database, Gauge, Menu, Search, Settings2, ShieldCheck, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Catalog", icon: Search },
  { to: "/risk", label: "Risk overview", icon: Gauge },
  { to: "/sources", label: "Data sources", icon: Database },
  { to: "/provenance", label: "Provenance", icon: BookOpen },
  { to: "/admin", label: "Administration", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-7">
          <Link to="/" className="flex items-center gap-3" aria-label="endoflife.tech home">
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground"><ShieldCheck className="size-5" /></span>
            <span><strong className="block text-sm">endoflife.tech</strong><span className="block text-[11px] text-muted-foreground">Lifecycle intelligence</span></span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground sm:block">v1.0 beta</span>
            <Button asChild variant="outline" size="sm"><Link to="/auth">Sign in</Link></Button>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X /> : <Menu />}</Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1600px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className={`${open ? "block" : "hidden"} border-b border-border bg-sidebar px-4 py-4 lg:block lg:min-h-[calc(100vh-4rem)] lg:border-b-0 lg:border-r lg:px-3 lg:py-6`}>
          <nav className="grid gap-1 sm:grid-cols-5 lg:grid-cols-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = item.to === "/" ? path === "/" || path.startsWith("/product/") : path.startsWith(item.to);
              return <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"}`}><Icon className="size-4" />{item.label}</Link>;
            })}
          </nav>
          <div className="mt-8 hidden border-t border-sidebar-border pt-5 lg:block">
            <p className="px-3 text-xs leading-5 text-muted-foreground">Open lifecycle data for confident platform decisions.</p>
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