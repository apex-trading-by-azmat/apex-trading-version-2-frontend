import { AppShell } from "@/components/layout/app-shell";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { SystemStatusRow } from "@/components/dashboard/system-status-row";
import { MetricsRow } from "@/components/dashboard/metrics-row";
import { SignalHero } from "@/components/dashboard/signal-hero";
import { StrategyGrid } from "@/components/dashboard/strategy-grid";
import { RecentSignalsTable } from "@/components/dashboard/recent-signals-table";
import { ExtensionCTA } from "@/components/dashboard/extension-cta";

export default function DashboardPage() {
  return (
    <AppShell title="Dashboard">
      <div className="space-y-5">
        <DashboardWelcome />
        <SystemStatusRow />
        <MetricsRow />
        <SignalHero />
        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <RecentSignalsTable />
          <div className="space-y-5">
            <ExtensionCTA />
            <StrategyGrid compact />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

