import Link from "next/link";
import { strategyCards } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export function StrategyGrid({ compact = false }: { compact?: boolean }) {
  const items = compact ? strategyCards.slice(0, 4) : strategyCards;

  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <p className="text-sm font-semibold text-foreground">
          {compact ? "Strategy Status" : "All Strategies"}
        </p>
        {compact && (
          <Link href="/dashboard/strategies" className="text-xs text-primary hover:underline underline-offset-2">
            View all →
          </Link>
        )}
      </div>
      <div className="divide-y divide-border">
        {items.map((s, i) => {
          const score = parseInt(s.score);
          const pct = score;
          return (
            <div key={i} className="px-5 py-3.5 hover:bg-secondary transition-colors">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                <span className="shrink-0 text-[10px] font-mono font-bold text-primary">
                  {s.score}/100
                </span>
              </div>
              {/* Score bar */}
              <div className="w-full h-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${pct}%`, opacity: 0.7 }}
                />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-subtle">{s.lastAnalysis}</span>
                <span className="text-[10px] font-mono text-up">{s.contribution}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

