"use client";

import { useState, useEffect } from "react";
import { Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardWelcome() {
  const [greeting, setGreeting] = useState("Good day");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening",
    );
    setDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    );
  }, []);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-1">
          <Sparkles className="w-3 h-3 text-warning" />
          Terminal Session Active
        </div>
        <h1 className="text-2xl font-display font-bold tracking-tight text-foreground">
          {greeting}, Azmat
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Market intelligence for {dateStr}. Engine is on standby awaiting chart data.
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 bg-card self-start sm:self-auto">
        <Clock className="w-3 h-3 text-subtle shrink-0" />
        <span>{dateStr}</span>
      </div>
    </div>
  );
}
