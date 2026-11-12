"use client";

import Link from "next/link";
import Image from "next/image";
import assets from "@/assets/assets";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  History,
  BarChart3,
  ShieldCheck,
  Settings,
  CircleHelp,
  Database,
  Cpu,
  LogOut,
  ChevronRight,
  Zap,
  Bell,
  Search,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { getActiveLicense } from "@/lib/auth-flow";

const NAV_SECTIONS = [
  {
    label: "PLATFORM",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      {
        title: "Live Signals",
        href: "/dashboard/live-signals",
        icon: Activity,
        badge: "LIVE",
      },
      { title: "Signal History", href: "/dashboard/signal-history", icon: History },
    ],
  },
  {
    label: "ANALYSIS",
    items: [
      { title: "Strategies", href: "/dashboard/strategies", icon: BarChart3, badge: "6" },
    ],
  },
  {
    label: "ACCOUNT",
    items: [
      { title: "License", href: "/dashboard/license", icon: ShieldCheck },
      { title: "Settings", href: "/dashboard/settings", icon: Settings },
      { title: "Help & Support", href: "/dashboard/help", icon: CircleHelp },
    ],
  },
  {
    label: "SYSTEM",
    items: [{ title: "Admin", href: "/dashboard/admin", icon: Database }],
  },
];

function StatusDot({ status }: { status: "online" | "offline" | "warn" }) {
  return (
    <span
      className={cn(
        "inline-block w-1.5 h-1.5 rounded-full",
        status === "online" && "bg-up",
        status === "offline" && "bg-down",
        status === "warn" && "bg-warning",
      )}
    />
  );
}

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [license, setLicense] = useState({ daysRemaining: 30, isValid: true, plan: "30-Day Pass" });

  useEffect(() => {
    const update = () => {
      const active = getActiveLicense();
      setLicense({
        daysRemaining: active.daysRemaining,
        isValid: active.isValid,
        plan: active.plan,
      });
    };
    update();
    window.addEventListener("apex_license_updated", update);
    return () => window.removeEventListener("apex_license_updated", update);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════
          SIDEBAR
      ══════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card border-r border-border transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-border shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-secondary/80 border border-border flex items-center justify-center shrink-0 p-1 overflow-hidden shadow-sm">
              <Image
                src={assets.logo}
                alt="Apex Signal Trading Logo"
                width={36}
                height={36}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="flex flex-col">
              <span className="text-xs font-semibold tracking-[0.18em] text-primary uppercase leading-none">
                Apex
              </span>
              <span className="text-sm font-semibold text-foreground leading-none mt-1">
                Signal Trading
              </span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Status Strip */}
        <div className="mx-4 mt-4 px-3 py-2.5 rounded-lg bg-secondary border border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StatusDot status="offline" />
            <span className="text-xs text-muted-foreground font-medium">
              Decision Engine
            </span>
          </div>
          <span className="text-[10px] font-mono font-semibold uppercase tracking-widest text-subtle border border-border rounded px-1.5 py-0.5">
            standby
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-[0.2em] text-subtle uppercase">
                {section.label}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent",
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon
                            className={cn(
                              "w-4 h-4 shrink-0",
                              isActive
                                ? "text-primary"
                                : "text-subtle group-hover:text-muted-foreground",
                            )}
                          />
                          {item.title}
                        </span>
                        {item.badge && (
                          <span
                            className={cn(
                              "text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded",
                              item.badge === "LIVE"
                                ? "bg-up/10 text-up border border-up/20"
                                : "bg-secondary text-muted-foreground border border-border",
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* License Block */}
        <div className="mx-4 mb-4 p-3.5 rounded-xl bg-secondary border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">
                License
              </span>
            </div>
            <span
              className={cn(
                "text-[10px] font-mono border rounded px-1.5 py-0.5",
                license.isValid
                  ? "text-up border-up/20 bg-up/10"
                  : "text-down border-down/20 bg-down/10"
              )}
            >
              {license.isValid ? "ACTIVE" : "EXPIRED"}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">{license.plan}</p>
          <div className="mt-2 w-full h-1 rounded-full bg-card overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.max(
                  5,
                  Math.min(100, Math.round(((30 - license.daysRemaining) / 30) * 100))
                )}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            {license.daysRemaining} days remaining
          </p>
        </div>

        {/* User & Theme */}
        <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center text-xs font-bold text-primary">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Azmat</p>
              <p className="text-[10px] text-subtle">Standard Member</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <ThemeToggle variant="icon" />
            <button
              className="p-1.5 rounded-lg text-subtle hover:text-down hover:bg-down/10 transition-colors"
              title="Sign out (placeholder)"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-4 md:px-6 bg-background/95 backdrop-blur border-b border-border">
          {/* Left */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-subtle font-medium">
              <span>Platform</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{title}</span>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {/* Monitoring badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground font-medium">
              <StatusDot status="offline" />
              <span>Monitoring</span>
              <span className="font-mono text-subtle">OFF</span>
            </div>

            {/* Extension badge */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-down/8 border border-down/20 text-xs text-down font-medium">
              <StatusDot status="offline" />
              Extension Disconnected
            </div>

            {/* Expiry tag */}
            <div className="hidden lg:flex items-center px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs font-mono font-semibold text-primary">
              60s Fixed
            </div>

            {/* Theme Toggle */}
            <ThemeToggle variant="pill" />

            {/* Bell */}
            <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent hover:border-border transition-all">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Page heading */}
          {description && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
