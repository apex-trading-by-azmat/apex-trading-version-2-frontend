"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Filter,
  Download,
  RotateCw,
  CheckCircle2,
} from "lucide-react";
import { cn, formatToUTC5 } from "@/lib/utils";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";
import { useRecentSignals, useAttributedOrders, useBackfillAttribution } from "@/hook/useSignals";
import { Skeleton } from "@/components/ui/skeleton";

function DirBadge({ dir }: { dir: string }) {
  if (dir === "UP")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg bg-up/10 text-up border border-up/20 shadow-xs">
        <ArrowUpRight className="w-3 h-3" />
        UP
      </span>
    );
  if (dir === "DOWN")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg bg-down/10 text-down border border-down/20 shadow-xs">
        <ArrowDownRight className="w-3 h-3" />
        DOWN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-lg bg-secondary text-muted-foreground border border-border">
      <Clock className="w-3 h-3" />
      WAIT
    </span>
  );
}

export default function SignalHistoryPage() {
  const [selectedFilter, setSelectedFilter] = useState("All Markets");
  const [backfillMessage, setBackfillMessage] = useState<string | null>(null);

  const { data: recentSignals, isLoading: signalsLoading } = useRecentSignals({ limit: 100 });
  const { data: attributedOrders, isLoading: ordersLoading } = useAttributedOrders({ limit: 100 });
  const backfillMutation = useBackfillAttribution({
    onSuccess: (data: any) => {
      setBackfillMessage(
        `Backfill completed: Checked ${data?.total_unattributed_checked ?? 0} orders, correlated ${data?.attributed_count ?? 0} new trades.`,
      );
      setTimeout(() => setBackfillMessage(null), 5000);
    },
  });

  const extractSignalArray = (raw: any): any[] => {
    if (raw == null) return [];
    let parsed: any = raw;
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        return [];
      }
    }
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      if (parsed.id) return [parsed];
      for (const key of ["signals", "data", "items", "results", "pairs", "records", "list"]) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }
      for (const outer of ["data", "result", "response", "payload"]) {
        const inner = parsed[outer];
        if (inner && typeof inner === "object") {
          if (Array.isArray(inner)) return inner;
          for (const key of ["signals", "data", "items", "results", "pairs", "records", "list"]) {
            if (Array.isArray(inner[key])) return inner[key];
          }
          if (inner.id) return [inner];
        }
      }
    }
    return [];
  };

  const apiList = extractSignalArray(recentSignals);
  const hasApiData = apiList.length > 0;
  const rawList = apiList;

  const filteredList = rawList.filter((item: any) => {
    const pair = item.asset || "";
    const isOtc = pair.toUpperCase().includes("OTC") || item.market === "OTC" || pair.includes("_otc");
    const outcome = item.outcome || (item.is_qualified ? "Win" : "WAIT");

    if (selectedFilter === "OTC Only") return isOtc;
    if (selectedFilter === "Regular Market") return !isOtc;
    if (selectedFilter === "Wins") return outcome.toLowerCase() === "win";
    if (selectedFilter === "Losses") return outcome.toLowerCase() === "loss";
    if (selectedFilter === "WAIT Skips") return item.direction === "WAIT";
    return true;
  });

  return (
    <AppShell
      title="Signal History"
      description="Historical 60-second predictions and real trade attribution broken down per strategy."
    >
      <div className="space-y-5">
        {/* Backfill notification banner */}
        {backfillMessage && (
          <div className="flex items-center gap-2.5 p-3.5 rounded-lg bg-up/10 border border-up/20 text-up text-xs font-mono font-medium shadow-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{backfillMessage}</span>
          </div>
        )}

        {/* Filter & Action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-primary" />
              Filter:
            </span>
            {["All Markets", "OTC Only", "Regular Market", "Wins", "Losses", "WAIT Skips"].map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap",
                  selectedFilter === f
                    ? "bg-primary/10 text-primary border-primary/30 shadow-sm shadow-primary/10"
                    : "text-muted-foreground border-border bg-secondary hover:text-foreground hover:border-subtle hover:bg-secondary/80"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => (backfillMutation.mutate as any)({ max_window_seconds: 90 })}
              disabled={backfillMutation.isPending}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-foreground border border-border bg-secondary hover:bg-secondary/80 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Correlate historical Quotex orders with predictive signals"
            >
              <RotateCw className={cn("w-3.5 h-3.5 text-primary", backfillMutation.isPending && "animate-spin")} />
              <span>{backfillMutation.isPending ? "Backfilling…" : "Backfill Attribution"}</span>
            </button>

            <button
              onClick={() => {
                const json = JSON.stringify(filteredList, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `signals_history_${Date.now()}.json`;
                a.click();
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/20 bg-primary/8 hover:bg-primary/15 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Signals Table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider bg-secondary/40">
                  <th className="px-5 py-4">Asset</th>
                  <th className="px-3 py-4">Market</th>
                  <th className="px-3 py-4">Direction</th>
                  <th className="px-3 py-4">Timestamp</th>
                  <th className="px-3 py-4">Strategy / Expiry</th>
                  <th className="px-3 py-4">Score</th>
                  <th className="px-3 py-4">Entry Baseline</th>
                  <th className="px-3 py-4">Target Strike</th>
                  <th className="px-3 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {signalsLoading && !hasApiData ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`history-skeleton-${i}`}>
                      <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-14" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-4 text-right"><Skeleton className="h-5 w-16 ml-auto rounded" /></td>
                    </tr>
                  ))
                ) : filteredList.length > 0 ? (
                  filteredList.map((row: any, i: number) => {
                    const pair = row.asset || "EUR/USD";
                    const isOtc =
                      pair.toUpperCase().includes("OTC") ||
                      row.market === "OTC" ||
                      pair.includes("_otc");
                    const dir = row.direction || "WAIT";
                    const time = row.created_at ? formatToUTC5(row.created_at) : row.time || "—";
                    const strategy =
                      row.qualifying_strategy?.replace(/_/g, " ") || row.expiry || "M1 Momentum";
                    const score = row.confidence_score ?? parseInt(row.score || "0");
                    const entry = row.entry_baseline ?? row.spot_price ?? row.entry ?? "—";
                    const target = row.target_strike ?? row.exit ?? "—";
                    const outcome =
                      row.outcome || (row.is_qualified ? "QUALIFIED" : "WAIT");

                    return (
                      <tr
                        key={row.id ?? `history-row-${i}`}
                        className="hover:bg-secondary/50 transition-colors group"
                      >
                        <td className="px-5 py-4">
                          <CurrencyPairDisplay pair={pair} size="sm" />
                        </td>
                        <td className="px-3 py-4">
                          <span
                            className={cn(
                              "text-[10px] font-bold font-mono px-2 py-0.5 rounded border",
                              isOtc
                                ? "text-purple-400 bg-purple-500/10 border-purple-500/20"
                                : "text-primary bg-primary/10 border-primary/20"
                            )}
                          >
                            {isOtc ? "OTC" : "REGULAR"}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <DirBadge dir={dir} />
                        </td>
                        <td className="px-3 py-4 font-mono text-muted-foreground">{time}</td>
                        <td className="px-3 py-4 font-mono text-primary font-medium text-[11px]">
                          {strategy}
                        </td>
                        <td className="px-3 py-4 font-mono">
                          <span
                            className={
                              score >= 75
                                ? "text-emerald-400 font-bold"
                                : score >= 60
                                  ? "text-primary font-semibold"
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
                          {typeof target === "number" ? target.toFixed(4) : target}
                        </td>
                        <td className="px-3 py-4 text-right">
                          <span
                            className={cn(
                              "text-[11px] font-bold font-mono px-2 py-0.5 rounded border",
                              outcome.toLowerCase() === "win" || outcome === "QUALIFIED"
                                ? "bg-up/10 text-up border-up/20"
                                : outcome.toLowerCase() === "loss"
                                  ? "bg-down/10 text-down border-down/20"
                                  : "bg-secondary text-muted-foreground border-border"
                            )}
                          >
                            {outcome}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-xs text-muted-foreground font-mono">
                      <div className="flex flex-col items-center gap-2">
                        <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                        <p>No historical signals found matching the selected filter.</p>
                        <p className="text-[10px] text-subtle">Try adjusting your filter or wait for new signals.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
