"use client";

import { useState, useEffect } from "react";

export function DashboardWelcome() {
  const [greeting, setGreeting] = useState("Good day");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12
        ? "Good morning"
        : hour < 17
          ? "Good afternoon"
          : "Good evening",
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
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {greeting}, Azmat
        </h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Here&apos;s your trading intelligence overview for today.
        </p>
      </div>
      {dateStr && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-2 bg-card self-start sm:self-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-subtle" />
          {dateStr}
        </div>
      )}
    </div>
  );
}
