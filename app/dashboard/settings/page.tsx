import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsSections } from "@/lib/mock-data";
import { Settings, Shield, Bell, Globe, Sliders, Check } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Configure account preferences, extension telemetry, and notification rules."
    >
      <div className="space-y-5 max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Card key={section.title} className="border-border bg-card">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold text-foreground">{section.title}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground">{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs">
                  <span className="text-foreground">Telemetry Stream Sync</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-up/10 text-up border border-up/20">
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs">
                  <span className="text-muted-foreground">Single Chart Enforcement</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    STRICT
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-colors shadow-lg shadow-primary/20">
            Save Preferences
          </button>
        </div>
      </div>
    </AppShell>
  );
}
