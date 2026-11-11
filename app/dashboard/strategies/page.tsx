import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { strategyCards } from "@/lib/mock-data";
import { Layers, Sliders, CheckCircle2, TrendingUp } from "lucide-react";

export default function StrategiesPage() {
  return (
    <AppShell
      title="Strategies"
      description="Six independent technical analyzers operating under centralized decision engine rules."
    >
      <div className="space-y-5">
        {/* Top Summary Banner */}
        <div className="p-4 rounded-xl bg-card border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Centralized Hypothesis Validation</h3>
              <p className="text-xs text-muted-foreground">
                Strategies evaluate market conditions independently without sharing state to avoid correlation bias.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto text-xs font-mono">
            <span className="px-2.5 py-1 rounded bg-secondary border border-border text-muted-foreground">
              Consensus Threshold: <strong className="text-primary">4 of 6</strong>
            </span>
            <span className="px-2.5 py-1 rounded bg-secondary border border-border text-muted-foreground">
              Min Score: <strong className="text-up">70/100</strong>
            </span>
          </div>
        </div>

        {/* 6 Strategy Cards Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {strategyCards.map((strategy, idx) => (
            <Card key={strategy.name} className="border-border bg-card hover:border-subtle transition-colors">
              <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-secondary text-[10px] font-mono text-primary flex items-center justify-center border border-border">
                      0{idx + 1}
                    </span>
                    <CardTitle className="text-sm font-bold text-foreground">{strategy.name}</CardTitle>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-up/10 text-up border border-up/20">
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
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary"
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

