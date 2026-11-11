import { Activity, Timer, ShieldCheck, Layers } from "lucide-react";

const cards = [
  {
    label: "Today's Signals",
    value: "0",
    sub: "Session stopped — Standby",
    icon: Activity,
    accent: "#4f8ef7",
    accentBg: "rgba(79,142,247,0.08)",
    accentBorder: "rgba(79,142,247,0.15)",
  },
  {
    label: "Active Pair",
    value: "None",
    sub: "Awaiting extension sync",
    icon: Timer,
    accent: "#7a8ba0",
    accentBg: "rgba(122,139,160,0.06)",
    accentBorder: "rgba(122,139,160,0.12)",
  },
  {
    label: "License",
    value: "24 days",
    sub: "30-Day Pass · Easypaisa verified",
    icon: ShieldCheck,
    accent: "#00c896",
    accentBg: "rgba(0,200,150,0.08)",
    accentBorder: "rgba(0,200,150,0.15)",
  },
  {
    label: "Strategy Engine",
    value: "6 / 6",
    sub: "All analyzers initialized",
    icon: Layers,
    accent: "#4f8ef7",
    accentBg: "rgba(79,142,247,0.08)",
    accentBorder: "rgba(79,142,247,0.15)",
  },
];

export function MetricsRow() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="relative p-4 rounded-xl bg-card border border-border overflow-hidden"
            style={{ boxShadow: `inset 0 0 0 1px ${c.accentBorder}` }}
          >
            {/* Faint top accent line */}
            <div
              className="absolute inset-x-0 top-0 h-px"
              style={{ background: c.accent, opacity: 0.4 }}
            />
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">{c.label}</p>
              <div
                className="p-1.5 rounded-lg"
                style={{ background: c.accentBg, border: `1px solid ${c.accentBorder}` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: c.accent }} />
              </div>
            </div>
            <p className="text-2xl font-semibold text-foreground leading-none">{c.value}</p>
            <p className="mt-1.5 text-[11px] text-subtle">{c.sub}</p>
          </div>
        );
      })}
    </div>
  );
}

