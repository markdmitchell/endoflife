import { useState, type ReactNode } from "react";
import {
  Compass,
  Calendar,
  CheckCircle2,
  CircleDashed,
  Clock,
  Sparkles,
  Tag,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROADMAP_PHASES } from "@/data/roadmap";

interface RoadmapModalProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSwitchToReleaseNotes?: () => void;
}

export function RoadmapModal({
  trigger,
  open,
  onOpenChange,
  onSwitchToReleaseNotes,
}: RoadmapModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const showModal = isControlled ? open : internalOpen;
  const setShowModal = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const handleOpenReleaseNotes = () => {
    setShowModal(false);
    if (onSwitchToReleaseNotes) {
      setTimeout(onSwitchToReleaseNotes, 150);
    }
  };

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border bg-card/80 px-6 py-5 text-left">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Compass className="size-4" />
              </span>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight">
                  Product Roadmap
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                  Phased priorities and architectural vision for endoflife.tech.
                </DialogDescription>
              </div>
            </div>
            {onSwitchToReleaseNotes && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
                onClick={handleOpenReleaseNotes}
              >
                <Sparkles className="mr-1.5 size-3.5 text-primary" />
                View Release Notes
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="max-h-[calc(88vh-8rem)] space-y-6 overflow-y-auto px-6 py-6">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Community-Driven Direction: </span>
            Our roadmap is prioritized by enterprise platform engineers, security compliance leads,
            and DevSecOps practitioners. Have a feature request or need a specific vendor sync?
            Reach out on LinkedIn via the authors section.
          </div>

          {ROADMAP_PHASES.map((phase) => {
            const isActive = phase.status === "active";
            return (
              <section
                key={phase.phase}
                className={`rounded-xl border p-5 transition-colors ${
                  isActive
                    ? "border-primary/40 bg-primary/[0.02] shadow-xs"
                    : "border-border/80 bg-card/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {phase.phase}
                    </span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-sm font-semibold text-foreground">{phase.theme}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      {phase.timeline}
                    </span>
                    <Badge
                      variant={isActive ? "default" : "secondary"}
                      className="text-[10px] uppercase tracking-wider font-semibold"
                    >
                      {phase.badge}
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 grid gap-3">
                  {phase.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-border/50 bg-background/60 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {item.status === "in-progress" ? (
                            <CircleDashed className="size-3 text-amber-500 animate-spin" />
                          ) : item.status === "planned" ? (
                            <CheckCircle2 className="size-3 text-muted-foreground" />
                          ) : (
                            <Sparkles className="size-3 text-primary" />
                          )}
                          {item.title}
                        </h4>
                        {item.tag && (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {item.tag}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
