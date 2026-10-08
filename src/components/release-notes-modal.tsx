import { useState, type ReactNode } from "react";
import {
  Sparkles,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Tag,
  Compass,
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
import { RELEASES } from "@/data/releases";
import { RoadmapModal } from "@/components/roadmap-modal";

interface ReleaseNotesModalProps {
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ReleaseNotesModal({ trigger, open, onOpenChange }: ReleaseNotesModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const isControlled = open !== undefined;
  const showModal = isControlled ? open : internalOpen;
  const setShowModal = isControlled ? (onOpenChange ?? (() => {})) : setInternalOpen;

  const handleOpenRoadmap = () => {
    setShowModal(false);
    setTimeout(() => setRoadmapOpen(true), 150);
  };

  const handleReturnFromRoadmap = () => {
    setRoadmapOpen(false);
    setTimeout(() => setShowModal(true), 150);
  };

  return (
    <>
      <RoadmapModal
        open={roadmapOpen}
        onOpenChange={setRoadmapOpen}
        onSwitchToReleaseNotes={handleReturnFromRoadmap}
      />
      <Dialog open={showModal} onOpenChange={setShowModal}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="border-b border-border bg-card/80 px-6 py-5 text-left">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <DialogTitle className="text-xl font-bold tracking-tight">
                    What&apos;s New in endoflife.tech
                  </DialogTitle>
                  <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                    Release notes and major milestones tracking platform evolution.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
                onClick={handleOpenRoadmap}
              >
                <Compass className="mr-1.5 size-3.5 text-primary" />
                View Roadmap
              </Button>
            </div>
          </DialogHeader>

          <div className="max-h-[calc(88vh-8rem)] space-y-6 overflow-y-auto px-6 py-6">
            {/* Roadmap Callout Banner */}
            <div className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-foreground">
                  Curious where we&apos;re headed next?
                </p>
                <p className="mt-0.5 text-muted-foreground">
                  Explore our phased product roadmap for automated syncs, public APIs, and SBOM
                  ingestion.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-primary/30 text-xs font-semibold hover:bg-primary hover:text-primary-foreground"
                onClick={handleOpenRoadmap}
              >
                <Compass className="mr-1.5 size-3.5" />
                Explore Roadmap
              </Button>
            </div>
            {RELEASES.map((rel, idx) => {
              const isLatest = idx === 0;
              return (
                <article
                  key={rel.version}
                  className={`relative rounded-xl border p-5 transition-colors ${
                    isLatest
                      ? "border-primary/40 bg-primary/[0.03] shadow-xs"
                      : "border-border/80 bg-card/40"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-base font-bold text-foreground">
                        {rel.version}
                      </span>
                      {rel.badge && (
                        <Badge
                          variant={isLatest ? "default" : "secondary"}
                          className="text-[10px] uppercase tracking-wider font-semibold"
                        >
                          {rel.badge}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span>{rel.releaseDate}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h3 className="text-sm font-semibold text-foreground">{rel.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {rel.tagline}
                    </p>

                    <ul className="mt-4 space-y-2">
                      {rel.highlights.map((highlight, hIdx) => {
                        const [headline, ...rest] = highlight.split(":");
                        return (
                          <li key={hIdx} className="flex items-start gap-2 text-xs leading-relaxed">
                            <CheckCircle2
                              className={`mt-0.5 size-3.5 shrink-0 ${
                                isLatest ? "text-primary" : "text-muted-foreground"
                              }`}
                            />
                            <span className="text-foreground/90">
                              {rest.length > 0 ? (
                                <>
                                  <strong className="font-semibold text-foreground">
                                    {headline}:
                                  </strong>
                                  {rest.join(":")}
                                </>
                              ) : (
                                highlight
                              )}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
