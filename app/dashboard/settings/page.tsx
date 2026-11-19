"use client";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { settingsSections } from "@/lib/mock-data";
import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("apex_sound_enabled") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("apex_sound_enabled", String(soundEnabled));
    window.dispatchEvent(new Event("apex_sound_toggled"));
  }, [soundEnabled]);

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
  };

  return (
    <AppShell
      title="Settings"
      description="Configure account preferences, extension telemetry, and notification rules."
    >
      <div className="space-y-5 max-w-4xl">
        <div className="grid gap-4 md:grid-cols-2">
          {settingsSections.map((section) => (
            <Card
              key={section.title}
              className={cn(
                "border-border bg-card shadow-sm hover:border-primary/40 transition-colors"
              )}
            >
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {section.title}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {section.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs">
                  <span className="text-foreground">Telemetry Stream Sync</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-up/10 text-up border border-up/20">
                    ACTIVE
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs">
                  <span className="text-muted-foreground">Single Chart Enforcement</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    STRICT
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Sound Alerts Card */}
        <Card className="border-border bg-card shadow-sm hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Sound Alerts
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Configure audio notifications for signal events
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary px-3 py-2.5 text-xs">
              <div className="flex items-center gap-2">
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-up" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-foreground">Audio Alerts</span>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer",
                  soundEnabled
                    ? "bg-up/15 text-up border-up/30 shadow-[0_0_12px_rgba(0,200,150,0.15)]"
                    : "bg-secondary text-muted-foreground border-border hover:text-foreground",
                )}
              >
                {soundEnabled ? "ON" : "MUTED"}
              </button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-2">
          <button className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-black text-xs font-semibold transition-colors shadow-sm shadow-primary/20">
            Save Preferences
          </button>
        </div>
      </div>
    </AppShell>
  );
}
