import { Activity, Unplug, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";

const statuses = [
  {
    label: "Monitoring",
    value: "Stopped",
    desc: "No active chart session",
    icon: Activity,
    color: "neutral" as const,
  },
  {
    label: "Extension",
    value: "Disconnected",
    desc: "Chrome extension not linked",
    icon: Unplug,
    color: "down" as const,
  },
  {
    label: "Market Data",
    value: "Unavailable",
    desc: "Waiting for monitoring session",
    icon: DatabaseZap,
    color: "warn" as const,
  },
];

const colorMap = {
  neutral: {
    dot: "bg-subtle",
    badge: "text-muted-foreground bg-secondary border-border",
    iconBg: "bg-secondary border-border text-subtle",
  },
  down: {
    dot: "bg-down",
    badge: "text-down bg-down/8 border-down/20",
    iconBg: "bg-down/8 border-down/15 text-down",
  },
  warn: {
    dot: "bg-warning",
    badge: "text-warning bg-warning/8 border-warning/20",
    iconBg: "bg-warning/8 border-warning/15 text-warning",
  },
};

export function SystemStatusRow() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {statuses.map((s) => {
        const Icon = s.icon;
        const c = colorMap[s.color];
        return (
          <div
            key={s.label}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border"
          >
            <div className={cn("p-2 rounded-lg border", c.iconBg)}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              <p className="text-xs text-subtle mt-0.5 truncate">{s.desc}</p>
            </div>
            <span className={cn("shrink-0 flex items-center gap-1 text-[11px] font-semibold font-mono px-2 py-1 rounded-md border", c.badge)}>
              <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
              {s.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

