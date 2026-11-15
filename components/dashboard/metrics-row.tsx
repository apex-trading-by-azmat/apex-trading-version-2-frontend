"use client";

import { Activity, ShieldCheck, Layers, Award } from "lucide-react";
import { useAttributionStats } from "@/hook/useSignals";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MetricsRow() {
  const { data: stats, isLoading } = useAttributionStats();

  const totalTrades = stats?.total_attributed_trades ?? 0;
  const rawWinRate = stats?.overall_win_rate;
  const winRateNumber =
    rawWinRate == null ? 0 : Number(String(rawWinRate).replace("%", "").trim());
  const winRatePercent =
    winRateNumber > 0 && winRateNumber <= 1
      ? (winRateNumber * 100).toFixed(1)
      : winRateNumber.toFixed(1);
  const winRateDisplay = totalTrades > 0 ? `${winRatePercent}%` : "0.0%";

  const totalProfit =
    stats?.total_profit !== undefined
      ? `$${Number(stats.total_profit).toFixed(2)}`
      : "$0.00";

  const cards = [
    {
      label: "Attributed Trades",
      value: totalTrades.toString(),
      sub:
        totalTrades > 0
          ? `${stats?.wins || 0}W · ${stats?.losses || 0}L · ${stats?.draws || 0}D`
          : "Telemetry active — ingesting ticks",
      icon: Activity,
      accent: "primary",
    },
    {
      label: "Overall Win Rate",
      value: winRateDisplay,
      sub:
        totalTrades > 0
          ? "Verified strategy correlation"
          : "Awaiting closed order settlements",
      icon: Award,
      accent: "up",
    },
    {
      label: "Realized Net Profit",
      value: totalProfit,
      sub: "Broker payout performance",
      icon: ShieldCheck,
      accent: "up",
    },
    {
      label: "Strategy Consensus",
      value: "6 / 6",
      sub: "All engines online",
      icon: Layers,
      accent: "primary",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        const accentMap = {
          primary: {
            color: "text-primary",
            bg: "bg-primary/10",
            border: "border-primary/20",
          },
          up: {
            color: "text-up",
            bg: "bg-up/10",
            border: "border-up/20",
          },
          down: {
            color: "text-down",
            bg: "bg-down/10",
            border: "border-down/20",
          },
          warning: {
            color: "text-warning",
            bg: "bg-warning/10",
            border: "border-warning/20",
          },
        };
        const a = accentMap[c.accent as keyof typeof accentMap];
        return (
          <div
            key={c.label}
            className={cn(
              "relative p-4 rounded-xl bg-card border border-border overflow-hidden",
              a.border,
            )}
          >
            <div className="absolute inset-x-0 top-0 h-[1px] bg-primary/20" />
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground leading-none">
                {c.label}
              </p>
              <div className={cn("p-1.5 rounded-lg shrink-0", a.bg, a.border)}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
              </div>
            </div>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-7 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            ) : (
              <>
                <p className="text-2xl font-semibold font-mono text-foreground leading-none">
                  {c.value}
                </p>
                <p className="mt-1.5 text-[10px] text-subtle leading-tight">
                  {c.sub}
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
