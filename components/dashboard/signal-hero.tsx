"use client";

import { PauseCircle, ShieldAlert, ArrowUpRight, ArrowDownRight, Zap } from "lucide-react";
import { CurrencyPairDisplay, parsePair } from "@/components/ui/currency-pair";
import { useSignalsWebSocket } from "@/hook/useSignalsWebSocket";
import { cn } from "@/lib/utils";

const rules = [
  { label: "Min Consensus", value: "4 of 6 strategies" },
  { label: "Min Score", value: "70 / 100" },
  { label: "Max Opposition", value: "1 strategy" },
  { label: "Expiry", value: "60 seconds" },
];

export function SignalHero() {
  const { activeChartAsset, activeChartPayout, activeSignal } = useSignalsWebSocket();
  const currentAsset = activeChartAsset || activeSignal?.asset || "EURUSD_OTC";
  const { base, quote } = parsePair(currentAsset);
  const isOtc = currentAsset.toUpperCase().includes("OTC");
  const payout = activeChartPayout ?? activeSignal?.broker_payout;
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Signal Intelligence Engine
          </span>
          <span className="hidden sm:inline text-[10px] font-mono text-muted-foreground">
            — centralized 6-strategy decision unit
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider text-primary border border-primary/20 bg-primary/8 rounded px-2 py-1")}>
            60s FIXED EXPIRY
          </span>
          <span className="text-[10px] font-mono text-subtle border border-border rounded px-2 py-1 bg-secondary">
            M1 CANDLE
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.5fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left — Signal State Display */}
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-3xl bg-secondary border border-border flex items-center justify-center shadow-[0_0_20px_rgba(0,0,0,0.3)]">
              <PauseCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold font-mono tracking-widest text-muted-foreground">
                WAIT
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">
                Engine standby — no active stream
              </p>
            </div>
          </div>

          {/* Asset / pair info */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="col-span-2 px-3 py-2.5 rounded-lg bg-secondary border border-border flex items-center justify-between gap-3">
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  Active Asset
                </p>
                <CurrencyPairDisplay pair={`${base}/${quote}`} market={isOtc ? "OTC" : "REGULAR"} size="sm" showMarket />
              </div>
              <span className="text-[10px] font-bold text-up bg-up/10 border border-up/20 px-2 py-0.5 rounded">
                {payout ? `${payout}% Payout` : "Ready"}
              </span>
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-secondary border border-border flex flex-col gap-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Score Threshold
              </p>
              <p className="text-muted-foreground font-medium">≥ 70 / 100</p>
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-secondary border border-border flex flex-col gap-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Expiry Standard
              </p>
              <p className="text-primary font-medium">60s Fixed</p>
            </div>
          </div>
        </div>

        {/* Right — Rules + Disclaimer */}
        <div className="p-6 flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Decision Thresholds
            </p>
            <div className="grid grid-cols-2 gap-2">
              {rules.map((r) => (
                <div key={r.label} className="px-3 py-2.5 rounded-lg bg-secondary border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                    {r.label}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Strategy Consensus (Standby)
            </p>
            <div className="space-y-2">
              {["EMA + RSI", "S&R Reversal", "Bollinger BB", "MACD", "Stochastic", "Price Action"].map(
                (s, i) => (
                  <div key={s} className="flex items-center gap-2.5 text-xs">
                    <span className="w-28 shrink-0 text-muted-foreground font-mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="flex-1 text-muted-foreground">{s}</span>
                    <span className="font-mono text-muted-foreground">—</span>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex gap-2.5 p-3.5 rounded-lg bg-secondary border border-border">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Informational only.</span>{" "}
              Apex never places trades or accesses account funds. All trade execution is manual and at the
              user&apos;s own discretion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
