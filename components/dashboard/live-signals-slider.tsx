"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import { cn, formatToUTC5 } from "@/lib/utils";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export interface StrategyVote {
  strategy_name: string;
  direction: string;
  confidence_score: number;
  reason_code: string;
  eligible: boolean;
}

export interface SignalItem {
  id: string;
  asset: string;
  direction: "UP" | "DOWN" | "WAIT" | string;
  confidence_score: number;
  consensus_count: number;
  opposition_count: number;
  broker_payout?: number;
  entry_baseline?: number;
  target_strike?: number;
  spot_price?: number;
  market_regime?: string;
  created_at?: string;
  votes?: StrategyVote[];
}

interface LiveSignalsSliderProps {
  signals: SignalItem[];
  activeSignalId: string;
  onSelectSignal: (id: string) => void;
  isFetching?: boolean;
}

export function LiveSignalsSlider({
  signals,
  activeSignalId,
  onSelectSignal,
  isFetching = false,
}: LiveSignalsSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "UP" | "DOWN" | "WAIT">("ALL");

  // Deduplicate signals strictly by asset pair — each currency pair appears exactly ONCE!
  const uniquePairs = useMemo(() => {
    const seen = new Set<string>();
    const list: SignalItem[] = [];

    for (const sig of signals) {
      const key = sig.asset ? sig.asset.toUpperCase().trim() : "";
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(sig);
      }
    }
    return list;
  }, [signals]);

  // Counts based on unique currency pairs
  const upCount = useMemo(
    () => uniquePairs.filter((s) => s.direction === "UP").length,
    [uniquePairs]
  );
  const downCount = useMemo(
    () => uniquePairs.filter((s) => s.direction === "DOWN").length,
    [uniquePairs]
  );
  const waitCount = useMemo(
    () => uniquePairs.filter((s) => s.direction === "WAIT").length,
    [uniquePairs]
  );

  // Filter pairs based on selected direction
  const filteredSignals = useMemo(() => {
    if (filter === "ALL") return uniquePairs;
    return uniquePairs.filter((s) => s.direction === filter);
  }, [uniquePairs, filter]);

  // Check scroll boundary status
  const updateScrollBounds = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;

    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);

    if (maxScroll > 0) {
      const pct = Math.min(100, Math.max(0, Math.round((scrollLeft / maxScroll) * 100)));
      setSliderProgress(pct);
    } else {
      setSliderProgress(0);
    }
  }, []);

  // Sync scroll on mount, resize, or list change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollBounds();
    const handleResize = () => updateScrollBounds();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [filteredSignals.length, updateScrollBounds]);

  // Scroll smoothly by button
  const handleScroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const step = Math.max(260, Math.floor(el.clientWidth * 0.75));
    el.scrollBy({
      left: direction === "left" ? -step : step,
      behavior: "smooth",
    });
  };

  // Slider change handler (scrubbing)
  const handleSliderChange = (vals: number | readonly number[]) => {
    const el = scrollRef.current;
    if (!el) return;
    const val = Array.isArray(vals) ? vals[0] : (vals as number);
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return;

    const target = (val / 100) * maxScroll;
    el.scrollTo({ left: target, behavior: "auto" });
    setSliderProgress(val);
  };

  if (!uniquePairs || uniquePairs.length === 0) {
    if (isFetching) {
      return (
        <div className="w-full max-w-full min-w-0 rounded-2xl bg-card border border-border p-4 shadow-sm relative space-y-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-36 rounded-full" />
              <Skeleton className="h-4 w-24 hidden sm:block" />
            </div>
            <Skeleton className="h-6 w-44 rounded-lg" />
          </div>
          <div className="flex items-stretch gap-2.5 overflow-hidden py-1 px-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={`slider-skeleton-${i}`}
                className="snap-start shrink-0 min-w-[230px] max-w-[270px] p-3 rounded-xl border border-border bg-secondary/30 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <Skeleton className="w-20 h-4" />
                  </div>
                  <Skeleton className="w-14 h-4 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Skeleton className="w-16 h-3" />
                    <Skeleton className="w-8 h-3" />
                  </div>
                  <Skeleton className="w-full h-1.5 rounded-full" />
                </div>
                <div className="flex justify-between pt-1 border-t border-border/50">
                  <Skeleton className="w-16 h-3" />
                  <Skeleton className="w-16 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="w-full max-w-full min-w-0 rounded-2xl bg-card border border-border p-4 shadow-sm relative overflow-hidden flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <span className="text-xs font-mono font-bold text-foreground">
            Live Signals Stream: Standby Mode
          </span>
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            — Telemetry ingestion active. Awaiting qualified strategy setups...
          </span>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border font-bold">
          STANDBY
        </span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 rounded-2xl bg-card border border-border p-4 shadow-sm relative space-y-3 overflow-hidden">
      {/* ── HEADER CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-mono font-bold text-foreground">
              Live Signals Stream
            </span>
          </div>

          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">
            ({uniquePairs.length} Unique {uniquePairs.length === 1 ? "Pair" : "Pairs"} Active)
          </span>

          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="hidden sm:inline">1s Real-Time Stream</span>
          </span>
        </div>

        {/* Filter Pills + Navigation Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick Direction Filters */}
          <div className="flex items-center p-0.5 rounded-lg bg-secondary border border-border text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className={cn(
                "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer",
                filter === "ALL"
                  ? "bg-card text-foreground font-bold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All ({uniquePairs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("UP")}
              className={cn(
                "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1",
                filter === "UP"
                  ? "bg-up/15 text-up font-bold shadow-xs"
                  : "text-muted-foreground hover:text-up"
              )}
            >
              <ArrowUpRight className="w-3 h-3 text-up" />
              CALL ({upCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("DOWN")}
              className={cn(
                "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1",
                filter === "DOWN"
                  ? "bg-down/15 text-down font-bold shadow-xs"
                  : "text-muted-foreground hover:text-down"
              )}
            >
              <ArrowDownRight className="w-3 h-3 text-down" />
              PUT ({downCount})
            </button>
            {waitCount > 0 && (
              <button
                type="button"
                onClick={() => setFilter("WAIT")}
                className={cn(
                  "px-2 py-0.5 rounded-md font-medium transition-all cursor-pointer flex items-center gap-1",
                  filter === "WAIT"
                    ? "bg-secondary text-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clock className="w-3 h-3 text-muted-foreground" />
                WAIT ({waitCount})
              </button>
            )}
          </div>

          {/* Prev / Next Slider Arrows */}
          <div className="flex items-center gap-1 pl-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => handleScroll("left")}
              disabled={!canScrollLeft}
              className={cn(
                "h-7 w-7 rounded-lg transition-all cursor-pointer",
                !canScrollLeft && "opacity-35 cursor-not-allowed"
              )}
              title="Previous pairs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => handleScroll("right")}
              disabled={!canScrollRight}
              className={cn(
                "h-7 w-7 rounded-lg transition-all cursor-pointer",
                !canScrollRight && "opacity-35 cursor-not-allowed"
              )}
              title="Next pairs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── CAROUSEL / SLIDER VIEWPORT ── */}
      <div className="relative w-full max-w-full min-w-0 overflow-hidden">
        {/* Left edge shadow gradient */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-card via-card/80 to-transparent pointer-events-none z-10 transition-opacity" />
        )}

        {/* Right edge shadow gradient */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-card via-card/80 to-transparent pointer-events-none z-10 transition-opacity" />
        )}

        {/* Scrollable Track */}
        {filteredSignals.length === 0 ? (
          <div className="py-6 text-center text-xs font-mono text-muted-foreground">
            No pairs in this filter.{" "}
            <button
              type="button"
              onClick={() => setFilter("ALL")}
              className="text-primary underline cursor-pointer"
            >
              Show all pairs
            </button>
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={updateScrollBounds}
            className="flex items-stretch gap-2.5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-1 px-0.5 scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden w-full max-w-full"
          >
            {filteredSignals.map((sig, idx) => {
              const sigKey = sig.id || `slider-pair-${sig.asset || idx}`;
              const isSelected = activeSignalId === sig.id;
              const isSigUp = sig.direction === "UP";
              const isSigDown = sig.direction === "DOWN";
              const isSigWait = sig.direction === "WAIT";

              return (
                <div
                  key={sigKey}
                  onClick={() => onSelectSignal(isSelected ? "" : (sig.id || sigKey))}
                  className={cn(
                    "snap-start shrink-0 min-w-[230px] max-w-[270px] p-3 rounded-xl border text-left cursor-pointer select-none transition-all duration-150 flex flex-col justify-between gap-2.5",
                    isSelected
                      ? "bg-card border-primary shadow-[0_0_18px_rgba(240,185,11,0.28)] ring-1.5 ring-primary"
                      : "bg-secondary/40 border-border hover:border-primary/40 hover:bg-secondary/70"
                  )}
                >
                  {/* Row 1: Pair + Direction Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <CurrencyPairDisplay pair={sig.asset} size="sm" />

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border shrink-0",
                        isSigUp && "bg-up/10 text-up border-up/30",
                        isSigDown && "bg-down/10 text-down border-down/30",
                        isSigWait && "bg-secondary text-muted-foreground border-border"
                      )}
                    >
                      {isSigUp && <ArrowUpRight className="w-3 h-3" />}
                      {isSigDown && <ArrowDownRight className="w-3 h-3" />}
                      {isSigWait && <Clock className="w-3 h-3 text-muted-foreground" />}
                      {isSigWait ? "STANDBY" : sig.direction}
                    </span>
                  </div>

                  {/* Row 2: Confidence Metre Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-muted-foreground">
                        {isSigWait ? "Status" : "Confidence"}
                      </span>
                      <span
                        className={cn(
                          "font-bold",
                          isSigWait
                            ? "text-muted-foreground font-mono"
                            : sig.confidence_score >= 80
                            ? "text-up font-mono"
                            : "text-foreground font-mono"
                        )}
                      >
                        {isSigWait ? "Standby" : `${sig.confidence_score}%`}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden border border-border/60">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          isSigUp && "bg-gradient-to-r from-emerald-500 to-up",
                          isSigDown && "bg-gradient-to-r from-rose-500 to-down",
                          isSigWait && "bg-muted-foreground/30"
                        )}
                        style={{
                          width: `${isSigWait ? 0 : Math.max(sig.confidence_score, 0)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Broker Payout + Consensus + Time (UTC+5) */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-1 border-t border-border/50">
                    <span className="text-up font-semibold">
                      {sig.broker_payout ? `${sig.broker_payout}% Payout` : "—% Payout"}
                    </span>
                    <span className="text-subtle">
                      {isSigWait ? "Monitoring" : `${sig.consensus_count || 2}/3 Agree`}
                    </span>
                    <span className="text-subtle" title="Time in UTC+5 (PKT)">
                      {sig.created_at ? formatToUTC5(sig.created_at) : "UTC+5"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── INTERACTIVE SHADCN SLIDER CONTROL (SCRUBBER) ── */}
      {filteredSignals.length > 2 && (
        <div className="pt-1 px-1 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-subtle shrink-0">
            <SlidersHorizontal className="w-3 h-3 text-muted-foreground" />
            <span>Slider Scrub:</span>
          </div>

          <div className="flex-1">
            <Slider
              value={sliderProgress}
              onValueChange={handleSliderChange}
              min={0}
              max={100}
              className="cursor-pointer"
            />
          </div>

          <span className="text-[10px] font-mono text-subtle shrink-0 w-8 text-right">
            {sliderProgress}%
          </span>
        </div>
      )}
    </div>
  );
}
