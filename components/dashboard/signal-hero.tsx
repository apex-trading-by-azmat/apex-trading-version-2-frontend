import { PauseCircle, ShieldAlert, Clock, Zap } from "lucide-react";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";

const rules = [
  { label: "Min Consensus", value: "4 of 6 strategies" },
  { label: "Min Score", value: "70 / 100" },
  { label: "Max Opposition", value: "1 strategy" },
  { label: "Expiry", value: "60 seconds" },
];

export function SignalHero() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2.5">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Signal Intelligence Engine</span>
          <span className="hidden sm:inline text-[10px] font-mono text-subtle">— centralized 6-strategy decision unit</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-semibold text-primary border border-primary/20 bg-primary/8 rounded px-2 py-1">
            60s FIXED EXPIRY
          </span>
          <span className="text-[10px] font-mono text-subtle border border-border rounded px-2 py-1 bg-secondary">
            M1 CANDLE
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.4fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Left — Signal State Display */}
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-10">
          {/* State badge */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-2xl bg-secondary border border-border flex items-center justify-center">
              <PauseCircle className="w-10 h-10 text-subtle" />
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold font-mono tracking-widest text-muted-foreground">WAIT</p>
              <p className="text-xs text-subtle mt-1">Engine standby — no active stream</p>
            </div>
          </div>

          {/* Asset / pair info */}
          <div className="w-full max-w-xs grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="col-span-2 px-3 py-2 rounded-lg bg-secondary border border-border flex items-center justify-between">
              <div>
                <p className="text-subtle text-[10px] mb-0.5">DEFAULT ASSET</p>
                <CurrencyPairDisplay pair="EUR/USD" market="OTC" size="sm" showMarket />
              </div>
              <span className="text-[10px] font-mono text-up bg-up/10 border border-up/20 px-2 py-0.5 rounded">
                READY
              </span>
            </div>
            <div className="px-3 py-2 rounded-lg bg-secondary border border-border">
              <p className="text-subtle text-[10px] mb-0.5">SCORE THRESHOLD</p>
              <p className="text-muted-foreground">≥ 70 / 100</p>
            </div>
            <div className="px-3 py-2 rounded-lg bg-secondary border border-border">
              <p className="text-subtle text-[10px] mb-0.5">EXPIRY STANDARD</p>
              <p className="text-primary">60s Fixed</p>
            </div>
          </div>
        </div>

        {/* Right — Rules + Disclaimer */}
        <div className="p-6 flex flex-col gap-5">
          {/* Decision Rules */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Decision Thresholds
            </p>
            <div className="grid grid-cols-2 gap-2">
              {rules.map((r) => (
                <div key={r.label} className="px-3 py-2.5 rounded-lg bg-secondary border border-border">
                  <p className="text-[10px] text-subtle uppercase tracking-wider mb-1">{r.label}</p>
                  <p className="text-sm font-semibold text-foreground">{r.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Strategy bars preview */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Strategy Consensus (Standby)
            </p>
            <div className="space-y-2">
              {["EMA + RSI", "S&R Reversal", "Bollinger BB", "MACD", "Stochastic", "Price Action"].map((s, i) => (
                <div key={s} className="flex items-center gap-2.5 text-xs">
                  <span className="w-28 shrink-0 text-subtle font-mono">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 text-muted-foreground">{s}</span>
                  <span className="font-mono text-subtle">—</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex gap-2.5 p-3 rounded-lg bg-secondary border border-border">
            <ShieldAlert className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Informational only.</span>{" "}
              Apex never places trades or accesses account funds. All trade execution is manual and at the user&apos;s own discretion.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

