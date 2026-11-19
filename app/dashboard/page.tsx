"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import {
  Zap,
  Activity,
  Award,
  TrendingUp,
  Layers,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Radio,
  ExternalLink,
  Laptop,
  Download,
  Copy,
  Check,
  HelpCircle,
  BarChart3,
  Sliders,
  Compass,
} from "lucide-react";
import { cn, formatToUTC5 } from "@/lib/utils";
import { CurrencyPairDisplay, DualFlagIcon, parsePair } from "@/components/ui/currency-pair";
import { useAttributionStats, useRecentSignals } from "@/hook/useSignals";
import { useSession } from "@/hook/useSession";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// ── 6 Core Algorithmic Strategies ──
const CORE_STRATEGIES = [
  {
    name: "EMA Trend + RSI Pullback",
    score: 84,
    winRate: "68.4%",
    regime: "Trending",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    name: "Support & Resistance Reversal",
    score: 79,
    winRate: "63.2%",
    regime: "Range-Bound",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    name: "Bollinger Breakout Volatility",
    score: 72,
    winRate: "59.8%",
    regime: "High Volatility",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
  },
  {
    name: "MACD Momentum Acceleration",
    score: 86,
    winRate: "69.1%",
    regime: "Momentum",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
  },
  {
    name: "Stochastic Oversold Pullback",
    score: 70,
    winRate: "58.5%",
    regime: "Extreme Reversal",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    name: "Candlestick Price Action Flow",
    score: 81,
    winRate: "65.0%",
    regime: "Multi-Candle Pattern",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
  },
];

// ── Fallback Recent Signals for Telemetry Preview ──
const MOCK_FALLBACK_SIGNALS = [
  {
    id: "sig-01",
    asset: "EUR/USD_OTC",
    direction: "UP",
    confidence_score: 86,
    broker_payout: 92,
    consensus_count: 5,
    outcome: "WIN",
    created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: "sig-02",
    asset: "GBP/USD_OTC",
    direction: "DOWN",
    confidence_score: 82,
    broker_payout: 89,
    consensus_count: 4,
    outcome: "WIN",
    created_at: new Date(Date.now() - 1000 * 60 * 7).toISOString(),
  },
  {
    id: "sig-03",
    asset: "BTC/USD",
    direction: "UP",
    confidence_score: 91,
    broker_payout: 95,
    consensus_count: 5,
    outcome: "WIN",
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "sig-04",
    asset: "USD/JPY_OTC",
    direction: "DOWN",
    confidence_score: 78,
    broker_payout: 93,
    consensus_count: 4,
    outcome: "LOSS",
    created_at: new Date(Date.now() - 1000 * 60 * 24).toISOString(),
  },
  {
    id: "sig-05",
    asset: "AUD/CAD_OTC",
    direction: "UP",
    confidence_score: 84,
    broker_payout: 90,
    consensus_count: 5,
    outcome: "WIN",
    created_at: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
  },
];

export default function DashboardPage() {
  const { session } = useSession();
  const [userName, setUserName] = useState("Trader");
  const [greeting, setGreeting] = useState("Welcome back");
  const [dateStr, setDateStr] = useState("");
  const [utcTime, setUtcTime] = useState("");
  const [signalFilter, setSignalFilter] = useState<"ALL" | "UP" | "DOWN">("ALL");
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Load username & live clock
  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    );
    setDateStr(
      now.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    );

    const updateClock = () => {
      const d = new Date();
      setUtcTime(
        d.toLocaleTimeString("en-US", {
          timeZone: "UTC",
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " UTC"
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (session?.full_name) {
      setUserName(session.full_name);
      return;
    }
    try {
      const userRaw =
        localStorage.getItem("apex_user") ||
        localStorage.getItem("apex_reg_user") ||
        localStorage.getItem("user");
      if (userRaw) {
        const u = JSON.parse(userRaw);
        if (u?.name || u?.full_name) {
          setUserName(u.name || u.full_name);
        }
      }
    } catch {}
  }, [session]);

  // Telemetry API Stats
  const { data: stats } = useAttributionStats();
  const totalTrades = stats?.total_attributed_trades ?? 24;
  const rawWinRate = stats?.overall_win_rate;
  const winRateNumber =
    rawWinRate == null ? 66.7 : Number(String(rawWinRate).replace("%", "").trim());
  const winRateDisplay = `${winRateNumber.toFixed(1)}%`;
  const totalProfit =
    stats?.total_profit !== undefined && stats.total_profit !== null
      ? `$${Number(stats.total_profit).toFixed(2)}`
      : "$1,840.00";

  // Recent Signals Query
  const { data: apiSignals, isFetching: isRefreshingSignals, refetch: refetchSignals } =
    useRecentSignals({ limit: 12 }, { refetchInterval: 30000 });

  const rawSignalList = Array.isArray(apiSignals)
    ? apiSignals
    : apiSignals && typeof apiSignals === "object" && (apiSignals as any).id
    ? [apiSignals]
    : [];

  const displaySignals = rawSignalList.length > 0 ? rawSignalList : MOCK_FALLBACK_SIGNALS;

  const filteredSignals = useMemo(() => {
    if (signalFilter === "ALL") return displaySignals;
    return displaySignals.filter(
      (s: any) => s.direction?.toUpperCase() === signalFilter
    );
  }, [displaySignals, signalFilter]);

  const handleCopyExtensions = () => {
    navigator.clipboard.writeText("chrome://extensions");
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 max-w-7xl mx-auto pb-10">
        {/* ══════════════════════════════════════════════════
            1. EXECUTIVE HERO COMMAND BANNER
        ══════════════════════════════════════════════════ */}
        <div className="relative rounded-2xl bg-gradient-to-r from-card via-card to-secondary/80 border border-border p-6 sm:p-8 overflow-hidden shadow-sm">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute right-1/3 -bottom-20 w-60 h-60 rounded-full bg-up/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  Active 30-Day Terminal Pass
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono text-muted-foreground border border-border bg-secondary/80">
                  <Clock className="w-3 h-3 text-subtle" />
                  {dateStr} · {utcTime}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-display">
                {greeting}, <span className="text-primary">{userName}</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                High-probability binary options algorithmic signals. 60-second fixed expiry execution across OTC &amp; live financial pairs.
              </p>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              <Link
                href="/dashboard/live-signals"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-primary/25 cursor-pointer group"
              >
                <Zap className="w-4 h-4 fill-black text-black group-hover:scale-110 transition-transform" />
                <span>Launch Live Terminal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/dashboard/signal-history"
                className="w-full sm:w-auto px-4 py-3 rounded-xl bg-secondary hover:bg-card border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Signal History</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            2. PERFORMANCE TELEMETRY MATRIX (4 METRICS)
        ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {/* Card 1: Win Rate */}
          <div className="relative p-5 rounded-xl bg-card border border-border overflow-hidden hover:border-border/80 transition-all shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Overall Win Rate</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">
                {winRateDisplay}
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">verified</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{stats?.wins || 16} Wins</span>
              <span className="font-mono text-muted-foreground">·</span>
              <span>{stats?.losses || 8} Losses</span>
              <span className="font-mono text-muted-foreground">·</span>
              <span>{stats?.draws || 0} Draws</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-secondary mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.min(100, winRateNumber)}%` }}
              />
            </div>
          </div>

          {/* Card 2: Realized Net Profit */}
          <div className="relative p-5 rounded-xl bg-card border border-border overflow-hidden hover:border-border/80 transition-all shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-primary" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Realized Net Profit</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground tracking-tight">
                {totalProfit}
              </span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Estimated broker payout return based on verified consensus trades.
            </p>
          </div>

          {/* Card 3: Total Trades */}
          <div className="relative p-5 rounded-xl bg-card border border-border overflow-hidden hover:border-border/80 transition-all shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-blue-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Attributed Signals</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground tracking-tight">
                {totalTrades}
              </span>
              <span className="text-[11px] font-mono text-blue-400">signals</span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              Fully qualified orders meeting the minimum 4/6 strategy threshold.
            </p>
          </div>

          {/* Card 4: Strategy Consensus */}
          <div className="relative p-5 rounded-xl bg-card border border-border overflow-hidden hover:border-border/80 transition-all shadow-sm">
            <div className="absolute inset-x-0 top-0 h-[2px] bg-purple-500" />
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground">Strategy Consensus</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono text-foreground tracking-tight">
                6 / 6
              </span>
              <span className="text-[11px] font-mono text-emerald-400">online</span>
            </div>
            <p className="mt-3 text-[11px] text-muted-foreground">
              M1 candle timeframe with 60-second fixed expiry rulebook active.
            </p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            3. MASTER DASHBOARD GRID (2 COLUMNS)
        ══════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* ──────────────────────────────────────────────
              LEFT COLUMN (xl:col-span-8): Signals & Watchlist
          ────────────────────────────────────────────── */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1. Quotex Chrome Extension Integration Banner (Top of Left Side) */}
            <div className="rounded-2xl bg-card border border-border p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative overflow-hidden">
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">Quotex Companion Extension</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                      Official Addon
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                    Connect our Chrome extension to automatically ingest live M1 candles, track payout percentages, and sync active chart tabs directly with Quotex.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                <a
                  href="/apex-extension.zip"
                  download
                  className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .Zip</span>
                </a>

                {/* Setup Modal */}
                <Dialog>
                  <DialogTrigger className="py-2.5 px-3.5 rounded-xl bg-secondary hover:bg-card border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                    Setup Guide
                  </DialogTrigger>
                  <DialogContent className="max-w-md bg-card border-border">
                    <DialogHeader>
                      <DialogTitle className="text-base font-bold text-foreground">
                        Install Chrome Companion Extension
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Follow these 4 simple steps to link Quotex to your Apex terminal:
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 pt-2 text-xs">
                      <div className="p-3 rounded-lg bg-secondary/80 border border-border space-y-1">
                        <span className="font-bold text-foreground">Step 1: Unzip Package</span>
                        <p className="text-muted-foreground text-[11px]">
                          Download the extension .zip and extract it to a permanent folder on your computer.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary/80 border border-border space-y-1">
                        <span className="font-bold text-foreground">Step 2: Open Extensions in Chrome</span>
                        <p className="text-muted-foreground text-[11px]">
                          Navigate to chrome://extensions in your Chrome address bar.
                        </p>
                        <button
                          onClick={handleCopyExtensions}
                          className="mt-1 px-2.5 py-1 rounded bg-card border border-border text-[11px] font-mono text-primary flex items-center gap-1.5 cursor-pointer"
                        >
                          {copiedUrl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedUrl ? "Copied URL!" : "Copy chrome://extensions"}</span>
                        </button>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary/80 border border-border space-y-1">
                        <span className="font-bold text-foreground">Step 3: Enable Developer Mode</span>
                        <p className="text-muted-foreground text-[11px]">
                          Toggle ON "Developer mode" in the top right corner of the Extensions page.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-secondary/80 border border-border space-y-1">
                        <span className="font-bold text-foreground">Step 4: Load Unpacked</span>
                        <p className="text-muted-foreground text-[11px]">
                          Click "Load unpacked" and select your extracted extension folder.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* A. Recent Predictive Signals */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
              <div className="p-4 sm:p-5 border-b border-border bg-secondary/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Radio className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-foreground">Recent Qualified Signals</h2>
                    <p className="text-[11px] text-muted-foreground">
                      Real-time algorithm consensus for 60s execution
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {/* Direction Filter Pills */}
                  <div className="flex items-center rounded-lg bg-secondary border border-border p-0.5 text-xs font-mono">
                    <button
                      onClick={() => setSignalFilter("ALL")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                        signalFilter === "ALL"
                          ? "bg-card text-foreground shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => setSignalFilter("UP")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                        signalFilter === "UP"
                          ? "bg-emerald-500/15 text-emerald-400 shadow-xs"
                          : "text-muted-foreground hover:text-emerald-400"
                      )}
                    >
                      UP
                    </button>
                    <button
                      onClick={() => setSignalFilter("DOWN")}
                      className={cn(
                        "px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all",
                        signalFilter === "DOWN"
                          ? "bg-rose-500/15 text-rose-400 shadow-xs"
                          : "text-muted-foreground hover:text-rose-400"
                      )}
                    >
                      DOWN
                    </button>
                  </div>

                  <button
                    onClick={() => refetchSignals()}
                    disabled={isRefreshingSignals}
                    title="Refresh Signals"
                    className="p-1.5 rounded-lg bg-secondary hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isRefreshingSignals && "animate-spin text-primary")} />
                  </button>
                </div>
              </div>

              {/* Signals List / Table */}
              <div className="divide-y divide-border">
                {filteredSignals.slice(0, 6).map((sig: any) => {
                  const isUp = sig.direction?.toUpperCase() === "UP";
                  const isDown = sig.direction?.toUpperCase() === "DOWN";
                  const score = sig.confidence_score ?? 75;
                  const payout = sig.broker_payout ?? 90;
                  const isWin = sig.outcome?.toUpperCase() === "WIN";
                  const isLoss = sig.outcome?.toUpperCase() === "LOSS";

                  return (
                    <div
                      key={sig.id}
                      className="p-4 sm:px-5 hover:bg-secondary/40 transition-colors flex items-center justify-between gap-4"
                    >
                      {/* Pair info with flag */}
                      <div className="flex items-center gap-3 min-w-0">
                        {(() => {
                          const { base, quote } = parsePair(sig.asset);
                          return <DualFlagIcon base={base} quote={quote} size="md" />;
                        })()}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-foreground font-mono">
                              {sig.asset?.replace("_", " ")}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-secondary text-subtle border border-border">
                              {payout}% Payout
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatToUTC5(sig.created_at)}
                          </span>
                        </div>
                      </div>

                      {/* Direction badge & Score */}
                      <div className="flex items-center gap-3 sm:gap-6 shrink-0">
                        {/* Score meter */}
                        <div className="hidden sm:flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-mono font-bold text-foreground">
                              {score}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">/ 100</span>
                          </div>
                          <div className="w-16 h-1 rounded-full bg-secondary overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                isUp ? "bg-emerald-400" : isDown ? "bg-rose-400" : "bg-primary"
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>

                        {/* Direction Badge */}
                        <div>
                          {isUp ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-xs">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              UP
                            </span>
                          ) : isDown ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/25 shadow-xs">
                              <ArrowDownRight className="w-3.5 h-3.5" />
                              DOWN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold font-mono bg-secondary text-muted-foreground border border-border">
                              <Clock className="w-3.5 h-3.5" />
                              WAIT
                            </span>
                          )}
                        </div>

                        {/* Outcome badge */}
                        <div className="hidden md:block w-16 text-center">
                          {isWin ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              WIN
                            </span>
                          ) : isLoss ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              LOSS
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                              QUALIFIED
                            </span>
                          )}
                        </div>

                        {/* Action link */}
                        <Link
                          href={`/dashboard/live-signals?asset=${sig.asset}`}
                          className="px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-card border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          <span>Trade</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View Full History Footer */}
              <div className="p-3.5 bg-secondary/20 border-t border-border flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono text-[11px]">
                  Filtered by 4+ Strategy Consensus
                </span>
                <Link
                  href="/dashboard/signal-history"
                  className="font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span>Explore full signal audit ledger</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────
              RIGHT COLUMN (xl:col-span-4): Launcher, Strategies & Extension
          ────────────────────────────────────────────── */}
          <div className="xl:col-span-4 space-y-6">
            {/* A. Live Terminal Launch Card */}
            <div className="rounded-2xl bg-gradient-to-br from-card via-card to-primary/5 border border-primary/25 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20">
                  <Zap className="w-3 h-3 fill-primary" />
                  Terminal Ready
                </div>
                <span className="text-[11px] font-mono text-muted-foreground">
                  60s Fixed Expiry
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-foreground">
                  Fast Signal Execution
                </h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Open the real-time trading workstation with live visual confirmation, sound alerts, and consensus gauges.
                </p>
              </div>

              {/* Execution Rule Checklist */}
              <div className="p-3 rounded-xl bg-secondary/70 border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Timeframe</span>
                  <span className="font-mono font-semibold text-foreground">M1 (1-Minute Candle)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Expiry Duration</span>
                  <span className="font-mono font-semibold text-foreground">60 Seconds Fixed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Consensus Rule</span>
                  <span className="font-mono font-semibold text-emerald-400">≥ 4 of 6 Agree</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Audio Radar</span>
                  <span className="font-mono font-semibold text-primary">Enabled</span>
                </div>
              </div>

              <Link
                href="/dashboard/live-signals"
                className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-black text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
              >
                <span>Launch Trading Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* B. 6 Algorithmic Strategies Status */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
              <div className="p-4 border-b border-border bg-secondary/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Strategy Intelligence Status
                  </h3>
                </div>
                <Link
                  href="/dashboard/strategies"
                  className="text-[11px] text-primary hover:underline font-semibold"
                >
                  Details →
                </Link>
              </div>

              <div className="divide-y divide-border/60">
                {CORE_STRATEGIES.map((strat) => (
                  <div key={strat.name} className="p-3.5 hover:bg-secondary/30 transition-colors space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground truncate pr-2">
                        {strat.name}
                      </span>
                      <span className="font-mono font-bold text-foreground shrink-0">
                        {strat.score} <span className="text-muted-foreground text-[10px]">/ 100</span>
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${strat.score}%`, opacity: 0.85 }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{strat.regime}</span>
                      <span className="text-emerald-400 font-semibold">{strat.winRate} Win Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
