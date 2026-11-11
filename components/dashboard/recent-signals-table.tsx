import Link from "next/link";
import { recentSignals } from "@/lib/mock-data";
import { ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";

function DirectionBadge({ dir }: { dir: string }) {
  if (dir === "UP")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-up/8 text-up border border-up/20">
        <ArrowUpRight className="w-3 h-3" /> UP
      </span>
    );
  if (dir === "DOWN")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-down/8 text-down border border-down/20">
        <ArrowDownRight className="w-3 h-3" /> DOWN
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono bg-secondary text-muted-foreground border border-border">
      <Clock className="w-3 h-3" /> WAIT
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string }) {
  const map: Record<string, string> = {
    Win: "bg-up/10 text-up border-up/20",
    Loss: "bg-down/10 text-down border-down/20",
    Pending: "bg-secondary text-muted-foreground border-border",
  };
  return (
    <span className={cn("px-2 py-0.5 rounded-md text-[11px] font-semibold font-mono border", map[outcome] ?? map["Pending"])}>
      {outcome}
    </span>
  );
}

export function RecentSignalsTable() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <p className="text-sm font-semibold text-foreground">Recent Signals</p>
        <Link href="/dashboard/signal-history" className="text-xs text-primary hover:underline underline-offset-2">
          View all →
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border text-subtle font-mono uppercase text-[10px] tracking-wider">
              <th className="px-5 py-3">Asset</th>
              <th className="px-3 py-3">Market</th>
              <th className="px-3 py-3">Dir</th>
              <th className="px-3 py-3">Score</th>
              <th className="px-3 py-3">Entry</th>
              <th className="px-3 py-3">Exit</th>
              <th className="px-3 py-3 text-right">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentSignals.map((r, i) => (
              <tr key={i} className="hover:bg-secondary transition-colors">
                <td className="px-5 py-3.5">
                  <CurrencyPairDisplay pair={r.asset} size="sm" />
                </td>
                <td className="px-3 py-3.5">
                  <span className={cn(
                    "text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border",
                    r.market === "OTC"
                      ? "text-purple-400 bg-purple-500/8 border-purple-500/20"
                      : "text-primary bg-primary/8 border-primary/20",
                  )}>
                    {r.market}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <DirectionBadge dir={r.direction} />
                </td>
                <td className="px-3 py-3.5 font-mono text-muted-foreground">
                  <span className={parseInt(r.score) >= 70 ? "text-primary" : "text-muted-foreground"}>
                    {r.score}
                  </span>
                  <span className="text-subtle">/100</span>
                </td>
                <td className="px-3 py-3.5 font-mono text-muted-foreground">{r.entry}</td>
                <td className="px-3 py-3.5 font-mono text-muted-foreground">{r.exit}</td>
                <td className="px-3 py-3.5 text-right">
                  <OutcomeBadge outcome={r.result} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

