"use client";

import Link from "next/link";
import Image from "next/image";
import assets from "@/assets/assets";
import { usePathname, useRouter } from "next/navigation";
import apiClient from "@/lib/apiClient";
import {
  LayoutDashboard,
  Activity,
  History,
  BarChart3,
  ShieldCheck,
  Settings,
  CircleHelp,
  Database,
  LogOut,
  ChevronRight,
  Zap,
  Bell,
  Menu,
  X,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { useSession } from "@/hook/useSession";
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
      {
        title: "Signal History",
        href: "/dashboard/signal-history",
        icon: History,
      },
    ],
  },
  {
    label: "ANALYSIS",
    items: [
      {
        title: "Strategies",
        href: "/dashboard/strategies",
        icon: BarChart3,
        badge: "4",
      },
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
        "inline-block w-2 h-2 rounded-full animate-pulse",
        status === "online" && "bg-up shadow-[0_0_8px_rgba(16,185,129,0.6)]",
        status === "offline" &&
          "bg-muted-foreground shadow-[0_0_8px_rgba(113,113,122,0.4)]",
        status === "warn" && "bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]",
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
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [license, setLicense] = useState({
    daysRemaining: 30,
    isValid: true,
    plan: "Professional",
  });
  const [userProfile, setUserProfile] = useState<{
    email?: string;
    full_name?: string;
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [extensionConnected, setExtensionConnected] = useState(false);
  const [monitoringActive, setMonitoringActive] = useState(false);

  // Session from /auth/session — source of truth for session_id
  const { session, loading: sessionLoading } = useSession();

  const sessionId = session?.session_id ?? null;

  // Dynamic extension connection status from localStorage + custom events
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkExtension = () => {
      const sid =
        localStorage.getItem("apex_session_id") ||
        localStorage.getItem("session_id") ||
        null;
      setExtensionConnected(!!sid && !!sessionId);
      setMonitoringActive(!!sid);
    };

    checkExtension();

    const handleExtConnect = () => {
      setExtensionConnected(true);
      setMonitoringActive(true);
    };
    const handleExtDisconnect = () => {
      setExtensionConnected(false);
      setMonitoringActive(false);
    };

    window.addEventListener("apex_extension_connected", handleExtConnect);
    window.addEventListener("apex_extension_disconnected", handleExtDisconnect);
    window.addEventListener("apex_monitoring_started", () =>
      setMonitoringActive(true),
    );
    window.addEventListener("apex_monitoring_stopped", () =>
      setMonitoringActive(false),
    );

    return () => {
      window.removeEventListener("apex_extension_connected", handleExtConnect);
      window.removeEventListener(
        "apex_extension_disconnected",
        handleExtDisconnect,
      );
      window.removeEventListener(
        "apex_monitoring_started",
        () => setMonitoringActive(true),
      );
      window.removeEventListener(
        "apex_monitoring_stopped",
        () => setMonitoringActive(false),
      );
    };
  }, [sessionId]);

  useEffect(() => {
    // Wait for session to load before checking auth state
    if (sessionLoading) return;

    if (!session || !session.is_authenticated || !sessionId) {
      setAuthChecked(true);
      setTimeout(() => {
        try {
          router.replace("/auth/login?unauthorized=true");
        } catch {
          window.location.href = "/auth/login?unauthorized=true";
        }
      }, 0);
      return;
    }

    setAuthChecked(true);
    setUserProfile({
      email: session.email ?? undefined,
      full_name: session.full_name ?? undefined,
    });
  }, [sessionLoading, session, sessionId, router]);

  const handleLogout = () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("access_token");
    localStorage.removeItem("apex_token");
    localStorage.removeItem("apex_access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("apex_refresh_token");
    localStorage.removeItem("user");
    localStorage.removeItem("apex_user");
    delete apiClient.defaults.headers.common["Authorization"];
    router.replace("/auth/login");
  };

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

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="relative flex h-8 w-8">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-8 w-8 bg-primary shadow-[0_0_15px_rgba(59,130,246,0.6)]"></span>
            </div>
          </div>
          <h2 className="text-sm font-semibold text-foreground mb-2">
            Verifying terminal authorization…
          </h2>
          <p className="text-xs font-mono text-muted-foreground animate-pulse">
            Initializing secure session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-lg lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ═════════════════════════════════════════════════════════════════════
          SIDEBAR (MODERN TERMINAL DESIGN)
      ═════════════════════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card/95 backdrop-blur-md border-r border-border shrink-0 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo + Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-border/70 shrink-0 bg-surface-1/60">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 group transition-transform active:scale-98"
          >
            <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 via-surface-2 to-surface-3 p-1.5 border border-primary/30 shadow-[0_0_15px_rgba(240,185,11,0.15)] group-hover:border-primary/60 transition-colors">
              <Image
                src={assets.logo}
                alt="Apex Signal Trading Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain drop-shadow"
                priority
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black tracking-tight text-base text-foreground">
                  Apex<span className="text-primary">Signal</span>
                </span>
              </div>
              <span className="block text-[9px] font-mono tracking-widest text-muted-foreground uppercase font-semibold">
                PRO TERMINAL v2.4
              </span>
            </div>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Status Strip */}
        <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-surface-1/80 border border-border/80 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                  monitoringActive ? "bg-emerald-400" : "bg-primary/60",
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  monitoringActive ? "bg-emerald-400" : "bg-amber-400",
                )}
              />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-mono font-bold text-foreground leading-tight truncate">
                Decision Engine
              </p>
              <p className="text-[9px] font-mono text-muted-foreground leading-tight truncate">
                {monitoringActive ? "Quotex Live M1" : "Standby Scanner"}
              </p>
            </div>
          </div>
          <span
            className={cn(
              "text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
              monitoringActive
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-surface-2 text-muted-foreground border-border",
            )}
          >
            {monitoringActive ? "RUNNING" : "STANDBY"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <div className="px-2 mb-1.5 flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-[0.16em] text-muted-foreground uppercase">
                  {section.label}
                </span>
              </div>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "group relative flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                          isActive
                            ? "bg-surface-2 text-foreground border border-border shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-surface-2/60",
                        )}
                      >
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary rounded-r shadow-[0_0_8px_rgba(240,185,11,0.8)]" />
                        )}
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-auto text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md border shrink-0",
                              item.badge === "LIVE"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse"
                                : "bg-surface-3 text-primary border-primary/20",
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
        <div className="mx-3 mb-3 p-3 rounded-xl bg-surface-1/90 border border-border/80 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-mono font-bold text-foreground">
                {license.plan}
              </span>
            </div>
            <span
              className={cn(
                "text-[9px] font-mono font-bold border rounded px-1.5 py-0.5",
                license.isValid
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : "text-rose-400 border-rose-500/30 bg-rose-500/10",
              )}
            >
              {license.isValid ? "ACTIVE" : "EXPIRED"}
            </span>
          </div>

          {/* Progress Meter */}
          <div className="w-full h-1.5 rounded-full bg-surface-3 overflow-hidden border border-border/50">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary/80 to-primary transition-all duration-300"
              style={{
                width: `${Math.max(5, Math.min(100, Math.round(((30 - license.daysRemaining) / 30) * 100)))}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
            <span>Expires in {license.daysRemaining}d</span>
            <Link
              href="/dashboard/license"
              className="text-primary hover:underline font-semibold"
            >
              Manage →
            </Link>
          </div>
        </div>

        {/* User Profile & Theme */}
        <div className="p-3 border-t border-border/70 flex items-center justify-between shrink-0 bg-surface-1/40">
          <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-surface-2 border border-primary/40 flex items-center justify-center text-xs font-bold font-mono text-primary shrink-0 shadow-xs">
              {userProfile?.full_name
                ? userProfile.full_name[0].toUpperCase()
                : "A"}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {userProfile?.full_name ||
                  (userProfile?.email
                    ? userProfile.email.split("@")[0]
                    : "Operator")}
              </p>
              <p className="text-[10px] font-mono text-muted-foreground truncate leading-tight flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 inline-block" />
                Verified
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle variant="icon" />
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Sign out & disconnect session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:ml-64 min-w-0 max-w-full">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 md:px-6 bg-background/60 backdrop-blur border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium">
              <span className="text-muted-foreground">Platform</span>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                "hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                monitoringActive
                  ? "bg-up/10 border-up/20 text-up"
                  : "bg-secondary border-border text-muted-foreground",
              )}
            >
              <StatusDot status={monitoringActive ? "online" : "offline"} />
              <span>Monitoring</span>
              <span className="font-mono">
                {monitoringActive ? "ACTIVE" : "OFF"}
              </span>
            </div>

            <div
              className={cn(
                "hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all",
                extensionConnected
                  ? "bg-up/10 border-up/20 text-up"
                  : "bg-down/8 border-down/20 text-down",
              )}
            >
              <StatusDot status={extensionConnected ? "online" : "offline"} />
              <span>
                {extensionConnected
                  ? "Extension Connected"
                  : "Extension Disconnected"}
              </span>
            </div>

            <ThemeToggle variant="pill" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 min-w-0 max-w-full">
          {description && (
            <div className="mb-8">
              <h2 className="text-xl font-display font-semibold text-foreground tracking-tight mb-1">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
