import { AppShell } from "@/components/layout/app-shell";
import { historyRows } from "@/lib/mock-data";
import { ArrowUpRight, ArrowDownRight, Clock, Filter, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";

function DirBadge({ dir }: { dir: string }) {
  if (dir === "UP")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-up/10 text-up border border-up/20">
        <ArrowUpRight className="w-3 h-3" />
        UP
      </span>
    );
  if (dir === "DOWN")
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-down/10 text-down border border-down/20">
        <ArrowDownRight className="w-3 h-3" />
        DOWN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
      <Clock className="w-3 h-3" />
      WAIT
    </span>
  );
}

export default function SignalHistoryPage() {
  return (
    <AppShell
      title="Signal History"
      description="Historical 60-second outcomes classified strictly by OTC and Regular market conditions."
    >
      <div className="space-y-5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-primary" /> Filter:
            </span>
            {["All Markets", "OTC Only", "Regular Market", "Wins", "Losses", "WAIT Skips"].map((f, i) => (
              <button
                key={f}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                  i === 0
                    ? "bg-primary/15 text-primary border-primary/30"
                    : "text-muted-foreground border-border bg-secondary hover:text-foreground hover:border-subtle"
                )}
              >
                {f}
              </button>
            ))}
          </div>

          <button className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-primary border border-primary/20 bg-primary/8 hover:bg-primary/15 transition-colors flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>

        {/* Signals Table */}
        <div className="rounded-xl bg-card border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-subtle font-mono uppercase text-[10px] tracking-wider bg-secondary/40">
                  <th className="px-5 py-3.5">Asset</th>
                  <th className="px-3 py-3.5">Market</th>
                  <th className="px-3 py-3.5">Direction</th>
                  <th className="px-3 py-3.5">Timestamp</th>
                  <th className="px-3 py-3.5">Expiry</th>
                  <th className="px-3 py-3.5">Score</th>
                  <th className="px-3 py-3.5">Entry Price</th>
                  <th className="px-3 py-3.5">Exit Price</th>
                  <th className="px-3 py-3.5 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {historyRows.map((row, i) => (
                  <tr key={i} className="hover:bg-secondary transition-colors">
                    <td className="px-5 py-3.5">
                      <CurrencyPairDisplay pair={row.asset} size="sm" />
                    </td>
                    <td className="px-3 py-3.5">
                      <span
                        className={cn(
                          "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border",
                          row.market === "OTC"
                            ? "text-purple-400 bg-purple-500/8 border-purple-500/20"
                            : "text-primary bg-primary/8 border-primary/20"
                        )}
                      >
                        {row.market}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <DirBadge dir={row.direction} />
                    </td>
                    <td className="px-3 py-3.5 font-mono text-muted-foreground">{row.time}</td>
                    <td className="px-3 py-3.5 font-mono text-primary font-semibold">{row.expiry}</td>
                    <td className="px-3 py-3.5 font-mono">
                      <span className={parseInt(row.score) >= 70 ? "text-primary font-bold" : "text-muted-foreground"}>
                        {row.score}
                      </span>
                      <span className="text-subtle">/100</span>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-muted-foreground">{row.entry}</td>
                    <td className="px-3 py-3.5 font-mono text-muted-foreground">{row.exit}</td>
                    <td className="px-3 py-3.5 text-right">
                      <span
                        className={cn(
                          "text-[11px] font-mono font-semibold px-2 py-0.5 rounded border",
                          row.outcome === "Win"
                            ? "bg-up/10 text-up border-up/20"
                            : row.outcome === "Loss"
                            ? "bg-down/10 text-down border-down/20"
                            : "bg-secondary text-muted-foreground border-border"
                        )}
                      >
                        {row.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

