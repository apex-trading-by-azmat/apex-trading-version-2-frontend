"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  ShieldAlert,
  X,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DualFlagIcon } from "@/components/ui/currency-pair";

export type OutcomeType = "WIN" | "LOSS";

interface TradeOutcomeModalProps {
  outcome: OutcomeType | null;
  pair: string;
  base: string;
  quote: string;
  market: string;
  direction: "UP" | "DOWN" | "WAIT";
  entryPrice?: string;
  exitPrice?: string;
  onClose: () => void;
}

export function TradeOutcomeModal({
  outcome,
  pair,
  base,
  quote,
  market,
  direction,
  entryPrice = "1.08420",
  exitPrice = "1.08436",
  onClose,
}: TradeOutcomeModalProps) {
  const [countdown, setCountdown] = useState(6);

  useEffect(() => {
    if (!outcome) return;
    setCountdown(6);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [outcome, onClose]);

  if (!outcome) return null;

  const isWin = outcome === "WIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-in fade-in duration-300">
      {/* ── FULL SCREEN BACKDROP WITH DYNAMIC THEME GLOW ── */}
      <div
        className={cn(
          "absolute inset-0 backdrop-blur-md transition-colors duration-500",
          isWin
            ? "bg-background/85 shadow-[inset_0_0_120px_rgba(0,200,150,0.35)]"
            : "bg-background/85 shadow-[inset_0_0_120px_rgba(240,77,92,0.35)]"
        )}
        onClick={onClose}
      />

      {/* ── WINNING FULL-SCREEN CONFETTI & LIGHT STREAMS ── */}
      {isWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Ambient Radial Spotlight */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-up/20 rounded-full blur-[140px] animate-pulse" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-warning/15 rounded-full blur-[100px]" />

          {/* Animated Falling Confetti Particles */}
          <div className="absolute inset-0">
            {Array.from({ length: 32 }).map((_, i) => {
              const left = `${(i * 3.2 + 2) % 100}%`;
              const animDuration = `${2 + (i % 4) * 0.7}s`;
              const animDelay = `${(i * 0.15) % 2}s`;
              const colors = [
                "#00c896",
                "#4f8ef7",
                "#f5a623",
                "#ffffff",
                "#34d399",
                "#fbbf24",
              ];
              const color = colors[i % colors.length];
              const size = (i % 3 === 0 ? 10 : i % 2 === 0 ? 8 : 6) + "px";

              return (
                <span
                  key={i}
                  className="absolute rounded-sm animate-bounce"
                  style={{
                    left,
                    top: "-20px",
                    width: size,
                    height: size,
                    backgroundColor: color,
                    opacity: 0.85,
                    transform: `rotate(${i * 45}deg)`,
                    animation: `fallDown ${animDuration} cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite`,
                    animationDelay: animDelay,
                    boxShadow: `0 0 10px ${color}`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* ── LOSING FULL-SCREEN SCANLINE & SHADOW VIGNETTE ── */}
      {!isWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-down/15 rounded-full blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]" />
        </div>
      )}

      {/* ── CENTERPIECE CELEBRATION / OUTCOME CARD ── */}
      <div
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border p-6 sm:p-8 text-center shadow-2xl transition-all duration-300 transform scale-100",
          isWin
            ? "bg-card border-up/60 shadow-[0_0_80px_rgba(0,200,150,0.35)]"
            : "bg-card border-down/60 shadow-[0_0_80px_rgba(240,77,92,0.3)]"
        )}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Close overlay"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Dynamic Icon Centerpiece */}
        <div className="flex justify-center mb-4">
          {isWin ? (
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-up/30 to-warning/30 border-2 border-up flex items-center justify-center shadow-[0_0_40px_rgba(0,200,150,0.5)] animate-pulse">
                <Trophy className="w-12 h-12 text-up drop-shadow-[0_0_12px_rgba(0,200,150,0.8)]" />
              </div>
              <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-warning text-black text-xs font-bold shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-down/25 to-black border-2 border-down flex items-center justify-center shadow-[0_0_40px_rgba(240,77,92,0.4)]">
              <ShieldAlert className="w-12 h-12 text-down drop-shadow-[0_0_12px_rgba(240,77,92,0.8)]" />
            </div>
          )}
        </div>

        {/* Primary Outcome Headline */}
        <div className="space-y-1 mb-5">
          <span
            className={cn(
              "text-xs font-mono font-bold uppercase tracking-widest px-3 py-1 rounded-full border inline-block mb-1",
              isWin
                ? "bg-up/15 text-up border-up/40"
                : "bg-down/15 text-down border-down/40"
            )}
          >
            60-Second Fixed Expiry Verified
          </span>

          <h2
            className={cn(
              "text-3xl sm:text-4xl font-black font-mono tracking-tight",
              isWin ? "text-up" : "text-down"
            )}
          >
            {isWin ? "TRADE WON (+85% PAYOUT)" : "TRADE LOSS (-100%)"}
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground">
            {isWin
              ? "Closed candle price confirmed in favored direction at 00s expiry mark."
              : "Candle closed against signal trajectory. Capital discipline maintained."}
          </p>
        </div>

        {/* Traded Pair Details with Country Flags */}
        <div className="p-4 rounded-xl bg-card/90 border border-border space-y-3 mb-5 text-left">
          <div className="flex items-center justify-between pb-2.5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <DualFlagIcon base={base} quote={quote} size="md" />
              <span className="font-mono font-bold text-sm text-foreground">
                {pair}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
                {market}
              </span>
            </div>

            <span
              className={cn(
                "text-xs font-mono font-bold px-2.5 py-0.5 rounded border flex items-center gap-1",
                direction === "UP"
                  ? "bg-up/15 text-up border-up/30"
                  : "bg-down/15 text-down border-down/30"
              )}
            >
              {direction === "UP" ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {direction}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-subtle block">ENTRY PRICE</span>
              <span className="text-foreground font-semibold">{entryPrice}</span>
            </div>
            <div>
              <span className="text-[10px] text-subtle block">EXIT (00s CLOSE)</span>
              <span
                className={cn(
                  "font-bold",
                  isWin ? "text-up" : "text-down"
                )}
              >
                {exitPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Financial Result Summary */}
        {isWin ? (
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-up/10 border border-up/20 text-xs font-mono mb-5">
            <div>
              <span className="text-[10px] text-muted-foreground block">POSITION</span>
              <span className="text-foreground font-bold">$100.00</span>
            </div>
            <div>
              <span className="text-[10px] text-up block">NET PROFIT</span>
              <span className="text-up font-bold text-sm">+$85.00</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">RETURN</span>
              <span className="text-foreground font-bold">$185.00</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-down/10 border border-down/30 text-xs text-down mb-5 text-left flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-[11px]">
              <strong className="block font-semibold">Risk Protocol Activated:</strong>
              <p className="text-muted-foreground">
                Martingale multiplication is strictly prohibited. Keep single-trade exposure capped at 1-2% of total equity.
              </p>
            </div>
          </div>
        )}

        {/* Footer with auto-close countdown */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono text-[11px]">
            Auto-closing in {countdown}s...
          </span>

          <button
            onClick={onClose}
            className={cn(
              "px-4 py-1.5 rounded-lg font-mono text-xs font-bold border transition-colors",
              isWin
                ? "bg-up text-black border-up hover:bg-up/90 shadow-md shadow-up/30"
                : "bg-secondary text-foreground border-border hover:bg-muted"
            )}
          >
            Dismiss [Enter]
          </button>
        </div>
      </div>
    </div>
  );
}

