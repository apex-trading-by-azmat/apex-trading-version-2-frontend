import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { strategyCards } from "@/lib/mock-data";
import { Layers, Sliders, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StrategiesPage() {
  return (
    <AppShell
      title="Strategies"
      description="Six independent technical analyzers operating under centralized decision engine rules."
    >
      <div className="space-y-5">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-xl bg-card border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/10">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">
                Centralized Hypothesis Validation
              </h3>
              <p className="text-xs text-muted-foreground">
                Strategies evaluate market conditions independently without sharing state to avoid correlation bias.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto text-xs font-mono">
            <span className={cn("px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap", "text-primary border-primary/30 bg-primary/5")}>
              Consensus Threshold: <strong className="text-primary font-bold">4 of 6</strong>
            </span>
            <span className={cn("px-2.5 py-1 rounded-lg border font-medium whitespace-nowrap", "text-up border-up/20 bg-up/5")}>
              Min Score: <strong className="text-up font-bold">70 / 100</strong>
            </span>
          </div>
        </div>

        {/* 6 Strategy Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {strategyCards.map((strategy, idx) => (
            <Card
              key={strategy.name}
              className={cn(
                "border-border bg-card hover:border-primary/40 transition-all shadow-sm hover:shadow-md",
                strategy.status === "ACTIVE" ? "border-up/40" : "border-border"
              )}
            >
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono border shrink-0", "bg-primary/10 text-primary border-primary/20")}>
                      0{idx + 1}
                    </span>
                    <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                      {strategy.name}
                    </CardTitle>
                  </div>
                  <span className={cn("text-[10px] font-bold font-mono px-2 py-0.5 rounded border shrink-0", strategy.status === "ACTIVE" ? "bg-up/10 text-up border-up/20" : "bg-secondary text-muted-foreground border-border")}>
                    {strategy.status}
                  </span>
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {strategy.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="rounded-lg border border-border bg-secondary p-2.5">
                    <p className="text-[10px] uppercase text-subtle">Last Analysis</p>
                    <p className="mt-1 font-semibold text-foreground">{strategy.lastAnalysis}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-secondary p-2.5">
                    <p className="text-[10px] uppercase text-subtle">Confidence Weight</p>
                    <p className="mt-1 font-semibold text-primary">{strategy.score} / 100</p>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Score Impact</span>
                    <span className="font-mono text-up font-semibold">{strategy.contribution}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary border border-border/80">
                    <div
                      className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                      style={{ width: `${Number(strategy.score)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
