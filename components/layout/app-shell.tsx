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
        badge: "6",
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
          SIDEBAR
      ═════════════════════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-60 flex flex-col bg-card border-r border-border shrink-0 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Logo + brand */}
        <div className="flex items-center gap-3 h-14 px-5 border-b border-border shrink-0 bg-surface-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-[0_0_16px_rgba(59,130,246,0.4)]">
              <Image
                src={assets.logo}
                alt="Apex Signal Trading Logo"
                width={32}
                height={32}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-display font-semibold tracking-tight text-foreground">
              Apex<span className="text-primary">Signal</span>
            </span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Status Strip */}
        <div
          className={cn(
            "mx-4 mt-4 px-3 py-2.5 rounded-lg border flex items-center justify-between gap-3 transition-colors",
            monitoringActive
              ? "bg-up/10 border-up/20"
              : "bg-secondary border-border",
          )}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <StatusDot
              status={monitoringActive ? "online" : "offline"}
            />
            <span
              className={cn(
                "text-[11px] font-medium truncate",
                monitoringActive ? "text-up" : "text-muted-foreground",
              )}
            >
              Decision Engine
            </span>
          </div>
          <span
            className={cn(
              "text-[10px] font-mono font-semibold uppercase tracking-wider border rounded px-1.5 py-0.5",
              monitoringActive
                ? "bg-up/10 text-up border-up/20"
                : "text-subtle border-border",
            )}
          >
            {monitoringActive ? "ACTIVE" : "STANDBY"}
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              <p className="px-2 mb-2 text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                {section.label}
              </p>
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
                          "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary border-r-2 border-primary"
                            : "text-muted-foreground hover:text-foreground hover:bg-secondary",
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-4 h-4 shrink-0",
                            isActive
                              ? "text-primary"
                              : "text-muted-foreground group-hover:text-foreground",
                          )}
                        />
                        {item.title}
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-auto text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded",
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
        <div className="mx-4 mb-6 p-3.5 rounded-lg bg-secondary border border-border">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">
                License
              </span>
            </div>
            <span
              className={cn(
                "text-[10px] font-mono font-bold border rounded px-1.5 py-0.5",
                license.isValid
                  ? "text-up border-up/20 bg-up/10"
                  : "text-down border-down/20 bg-down/10",
              )}
            >
              {license.isValid ? "ACTIVE" : "EXPIRED"}
            </span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {license.plan}
          </p>
          <div className="mt-2.5 w-full h-1.5 rounded-full bg-card overflow-hidden border border-border">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.max(5, Math.min(100, Math.round(((30 - license.daysRemaining) / 30) * 100)))}%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground font-medium">
            {license.daysRemaining} days remaining
          </p>
        </div>

        {/* User & Theme */}
        <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
              {userProfile?.full_name
                ? userProfile.full_name[0].toUpperCase()
                : "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-foreground truncate">
                {userProfile?.full_name ||
                  (userProfile?.email
                    ? userProfile.email.split("@")[0]
                    : "Operator")}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {userProfile?.email || "Terminal Member"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <ThemeToggle variant="icon" />
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-subtle hover:text-down hover:bg-down/5 transition-colors cursor-pointer"
              title="Sign out & disconnect session"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col lg:ml-60 min-w-0 max-w-full">
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
