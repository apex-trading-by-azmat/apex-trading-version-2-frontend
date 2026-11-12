import { AppShell } from "@/components/layout/app-shell";
import { DashboardWelcome } from "@/components/dashboard/dashboard-welcome";
import { SystemStatusRow } from "@/components/dashboard/system-status-row";
import { MetricsRow } from "@/components/dashboard/metrics-row";
import { SignalHero } from "@/components/dashboard/signal-hero";
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
        <div className="grid gap-5 xl:grid-cols-[1fr_360px] items-start">
          <RecentSignalsTable />
          <ExtensionCTA />
        </div>
      </div>
    </AppShell>
  );
}

