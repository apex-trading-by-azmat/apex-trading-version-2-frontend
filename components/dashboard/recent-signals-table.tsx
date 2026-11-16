"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";
import { useRecentSignals } from "@/hook/useSignals";
import { Skeleton } from "@/components/ui/skeleton";

function DirectionBadge({ dir }: { dir: string }) {
  if (dir === "UP")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-up/10 text-up border border-up/20 shadow-xs">
        <ArrowUpRight className="w-3 h-3" /> UP
      </span>
    );
  if (dir === "DOWN")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-down/10 text-down border border-down/20 shadow-xs">
        <ArrowDownRight className="w-3 h-3" /> DOWN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono bg-secondary text-muted-foreground border border-border">
      <Clock className="w-3 h-3" /> WAIT
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, string> = {
    WIN: "bg-up/10 text-up border-up/20",
    Win: "bg-up/10 text-up border-up/20",
    LOSS: "bg-down/10 text-down border-down/20",
    Loss: "bg-down/10 text-down border-down/20",
    QUALIFIED: "bg-primary/10 text-primary border-primary/25",
    Qualified: "bg-primary/10 text-primary border-primary/25",
    PENDING: "bg-warning/10 text-warning border-warning/20",
    Pending: "bg-warning/10 text-warning border-warning/20",
    WAIT: "bg-secondary text-muted-foreground border-border",
    Wait: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded-md text-[11px] font-bold font-mono border",
        map[outcome] ?? "bg-secondary text-muted-foreground border-border"
      )}
    >
      {outcome}
    </span>
  );
}

export function RecentSignalsTable() {
  const { data: apiSignals, isFetching, refetch } = useRecentSignals(
    { limit: 10 },
    { refetchInterval: false, staleTime: Infinity, refetchOnWindowFocus: false },
  );

  const apiList = Array.isArray(apiSignals)
    ? apiSignals
    : apiSignals && typeof apiSignals === "object" && (apiSignals as any).id
      ? [apiSignals]
      : [];

  const hasApiData = apiList.length > 0;
  const displaySignals = apiList;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-secondary/40">
        <div className="flex items-center gap-2.5">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Recent Signals
          </p>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-primary/10 text-primary border border-primary/20">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
            </span>
            {hasApiData ? "LIVE FEED" : "STANDBY"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            title="Refresh signals"
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded hover:bg-secondary"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} />
          </button>
          <Link
            href="/dashboard/signal-history"
            className="text-xs font-medium text-primary hover:underline underline-offset-2 transition-colors"
          >
            View all →
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider">
              <th className="px-5 py-3.5">Asset</th>
              <th className="px-3 py-3.5">Market</th>
              <th className="px-3 py-3.5">Dir</th>
              <th className="px-3 py-3.5">Score</th>
              <th className="px-3 py-3.5">Entry</th>
              <th className="px-3 py-3.5">Exit / Target</th>
              <th className="px-3 py-3.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isFetching && !hasApiData ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`recent-skeleton-${i}`}>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-3 py-4"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-3 py-4"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-3 py-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="px-3 py-4"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-3 py-4"><Skeleton className="h-4 w-14" /></td>
                  <td className="px-3 py-4 text-right"><Skeleton className="h-5 w-16 ml-auto rounded" /></td>
                </tr>
              ))
            ) : hasApiData ? (
              displaySignals.map((item: any, i: number) => {
                const pair = item.asset || "EUR/USD";
                const isOtc =
                  pair.toUpperCase().includes("OTC") ||
                  item.market === "OTC" ||
                  item.asset?.includes("_otc");
                const score = item.confidence_score ?? parseInt(item.score || "0");
                const direction = item.direction || "WAIT";
                const entry =
                  item.entry_baseline ?? item.spot_price ?? item.entry ?? "—";
                const exit = item.target_strike ?? item.exit ?? "—";
                const result =
                  item.is_qualified !== undefined
                    ? item.is_qualified
                      ? "QUALIFIED"
                      : "WAIT"
                    : item.result || "Pending";

                return (
                  <tr
                    key={item.id ?? `recent-row-${i}`}
                    className="hover:bg-secondary/50 transition-colors group"
                  >
                    <td className="px-5 py-4">
                      <CurrencyPairDisplay pair={pair} size="sm" />
                    </td>
                    <td className="px-3 py-4">
                      <span
                        className={cn(
                          "text-[10px] font-bold font-mono px-1.5 py-0.5 rounded border",
                          isOtc
                            ? "text-purple-400 bg-purple-500/10 border-purple-500/25"
                            : "text-primary bg-primary/10 border-primary/25"
                        )}
                      >
                        {isOtc ? "OTC" : "REGULAR"}
                      </span>
                    </td>
                    <td className="px-3 py-4">
                      <DirectionBadge dir={direction} />
                    </td>
                    <td className="px-3 py-4 font-mono">
                      <span
                        className={
                          score >= 75
                            ? "text-emerald-400 font-bold"
                            : score >= 60
                              ? "text-primary font-medium"
                              : "text-muted-foreground"
                        }
                      >
                        {score}
                      </span>
                      <span className="text-muted-foreground">/100</span>
                    </td>
                    <td className="px-3 py-4 font-mono text-muted-foreground">
                      {typeof entry === "number" ? entry.toFixed(4) : entry}
                    </td>
                    <td className="px-3 py-4 font-mono text-muted-foreground">
                      {typeof exit === "number" ? exit.toFixed(4) : exit}
                    </td>
                    <td className="px-3 py-4 text-right">
                      <OutcomeBadge outcome={result} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-xs text-muted-foreground font-mono">
                  No signals available. Centralized decision engine is on standby.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
