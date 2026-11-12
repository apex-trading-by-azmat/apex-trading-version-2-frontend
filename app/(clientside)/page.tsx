"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Layers,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
  Check,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Copy,
  ChevronDown,
  BarChart3,
  Sliders,
  Globe,
  Radio,
} from "lucide-react";
import { DualFlagIcon } from "@/components/ui/currency-pair";
import { EASYPAISA_CONFIG } from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

export default function ClientLandingPage() {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(48);
  const [previewMode, setPreviewMode] = useState<"UP" | "DOWN">("UP");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Continuous 60s countdown simulation for the hero mockup
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 60 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const isWindowOpen = seconds > 30;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const isUp = previewMode === "UP";

  const strategiesList = [
    {
      id: 1,
      num: "01",
      name: "EMA Trend + RSI Pullback",
      weight: "18%",
      type: "Trend & Mean Reversion",
      desc: "Fast EMA 9 & Slow EMA 21 crossovers filtered by RSI 14 dynamic pullback zones to identify high-momentum continuations.",
      indicators: ["EMA 9", "EMA 21", "RSI 14"],
    },
    {
      id: 2,
      num: "02",
      name: "Support & Resistance Reversal",
      weight: "20%",
      type: "Market Structure",
      desc: "Automatic structural support and resistance identification with volume rejection pin-bars and key zone bounces.",
      indicators: ["Dynamic S/R", "Pin Bar Rejection", "Wick Filters"],
    },
    {
      id: 3,
      num: "03",
      name: "Bollinger Bands Breakout",
      weight: "16%",
      type: "Volatility Expansion",
      desc: "Tracks 20-period standard deviation volatility squeezes followed by aggressive boundary band penetrations.",
      indicators: ["Bollinger Bands 20,2", "BandWidth", "%B"],
    },
    {
      id: 4,
      num: "04",
      name: "MACD Momentum Confirmation",
      weight: "16%",
      type: "Momentum Acceleration",
      desc: "Calculates MACD 12, 26, 9 centerline crossovers and histogram expansions to avoid false structural breakouts.",
      indicators: ["MACD 12/26/9", "Signal Line", "Histogram"],
    },
    {
      id: 5,
      num: "05",
      name: "Stochastic Reversal",
      weight: "15%",
      type: "Oscillator Exhaustion",
      desc: "Fast %K and %D line crossovers within extreme 80/20 overbought and oversold thresholds to capture swift exhaustion turns.",
      indicators: ["Stochastic 14,3,3", "80/20 Zones", "Divergence"],
    },
    {
      id: 6,
      num: "06",
      name: "Candlestick Price Action",
      weight: "15%",
      type: "Pure Price Action",
      desc: "Evaluates only confirmed, closed 1-minute candle geometries (bullish/bearish engulfing, hammers, and shooting stars).",
      indicators: ["M1 Closed Candle", "Engulfing", "Rejection Wicks"],
    },
  ];

  const faqs = [
    {
      q: "Does Apex execute trades automatically on my broker account?",
      a: "No. Apex is strictly an informational market intelligence platform. We never ask for broker passwords, API trade keys, or account balances. All trades are executed manually by you on your chosen broker, eliminating any risk of automated liquidation or broker account restrictions.",
    },
    {
      q: "What is the 30-Second Precision Trading Window rule?",
      a: "Our algorithm evaluates closed M1 candles and provides a clear directional signal at the start of the minute. You have a 30-second window (seconds 60 down to 31) to enter a 60-second fixed expiry trade. The remaining 30 seconds (seconds 30 down to 00) turn yellow and are locked to prevent late entries into candle exhaustion.",
    },
    {
      q: "Are OTC and Regular currency pairs separated?",
      a: "Yes. Regular market feeds and OTC (Over-The-Counter weekend/after-hours) feeds operate under distinct mathematical models to eliminate behavioral bias. The system clearly labels every asset as either OTC Market or Regular Market.",
    },
    {
      q: "How does the Easypaisa 30-Day License work?",
      a: "Apex operates on a transparent single 30-day fixed period model with zero recurring auto-debits. You send $25 via Easypaisa to our official account (03445679900 - Azmat Ullah khan), submit the Transaction ID (TID), and our administrators verify the deposit to issue your unique 30-day license key.",
    },
    {
      q: "What happens when market evidence is conflicting?",
      a: "Apex requires at least 4 of 6 strategies to agree with a weighted score of 70+ and no more than 1 opposing model. When criteria are not met, the engine forces a safe 'WAIT' state to protect your capital.",
    },
  ];

  return (
    <div className="space-y-28 py-10 md:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ══════════════════════════════════════════════════════════════
          1. HERO SECTION WITH INSTITUTIONAL AMBIENT GLOW
      ══════════════════════════════════════════════════════════════ */}
      <section className="relative text-center max-w-5xl mx-auto space-y-6 pt-4">
        {/* Ambient background glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Live Status Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-up opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-up" />
          </span>
          <span className="font-mono font-bold text-foreground">Apex Engine v1.0 Stable</span>
          <span className="text-subtle">·</span>
          <span className="font-mono text-primary">60-Second Fixed Expiry</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-foreground leading-[1.08]">
          Master 60-Second Markets With{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-up">
            Algorithmic Consensus
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
          Six independent algorithmic strategies evaluate closed M1 candle geometry simultaneously. Eliminate emotional guessing, avoid intra-candle tick noise, and trade with strict mathematical confidence.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
          <Link
            href="/auth/register"
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
          >
            Get 30-Day License ($25)
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Trust Badges Strip */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs font-mono text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-up" /> 60s Fixed Expiry Rule
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-up" /> 30s Precision Entry Window
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-up" /> Closed-Candle M1 Telemetry
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-up" /> 100% Non-Custodial
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            INTERACTIVE LIVE TERMINAL SHOWCASE (HERO MOCKUP)
        ══════════════════════════════════════════════════════════════ */}
        <div className="pt-8 max-w-4xl mx-auto text-left">
          <div className="rounded-2xl bg-card border border-border shadow-2xl p-6 sm:p-8 relative overflow-hidden space-y-6">
            {/* Top Bar: Live Pair & Interactive Preview Mode */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <DualFlagIcon base="EUR" quote="USD" size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-foreground">EUR/USD</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/80 uppercase">
                      OTC Market
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-muted-foreground">
                    Live Rate: <strong className="text-foreground">1.08420</strong> (+0.04%) · 112ms Latency
                  </p>
                </div>
              </div>

              {/* Toggle Preview Signal Button */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-subtle hidden sm:inline">PREVIEW SIGNAL:</span>
                <div className="p-1 rounded-lg bg-secondary border border-border flex items-center gap-1 text-xs font-mono">
                  <button
                    onClick={() => setPreviewMode("UP")}
                    className={cn(
                      "px-2.5 py-1 rounded font-bold transition-all",
                      isUp ? "bg-up text-black" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    UP Signal
                  </button>
                  <button
                    onClick={() => setPreviewMode("DOWN")}
                    className={cn(
                      "px-2.5 py-1 rounded font-bold transition-all",
                      !isUp ? "bg-down text-white" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    DOWN Signal
                  </button>
                </div>
              </div>
            </div>

            {/* Middle Grid: Signal Decision + 60s Trading Window Timer */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
              {/* Left Column: Massive Signal Hero (7 cols) */}
              <div
                className={cn(
                  "md:col-span-7 p-5 rounded-xl border flex flex-col justify-between space-y-4 transition-all duration-300",
                  isUp
                    ? "bg-up/8 border-up/30 shadow-[0_0_30px_rgba(0,200,150,0.1)]"
                    : "bg-down/8 border-down/30 shadow-[0_0_30px_rgba(240,77,92,0.1)]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded border inline-flex items-center gap-1.5",
                        isUp ? "bg-up/15 text-up border-up/30" : "bg-down/15 text-down border-down/30"
                      )}
                    >
                      {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      DECISION: {isUp ? "UP" : "DOWN"} (60S FIXED)
                    </span>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      Consensus: <strong className="text-foreground">{isUp ? "5 of 6" : "4 of 6"}</strong>
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground mt-3">
                    {isUp ? "CALL / HIGHER (BUY)" : "PUT / LOWER (SELL)"}
                  </h3>
                </div>

                {/* Strategy Tags in Action (requested feature) */}
                <div className="space-y-2 pt-2 border-t border-border/60">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Confirming Strategies in Agreement:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(isUp
                      ? [
                          "Support & Resistance",
                          "Bollinger Bands Breakout",
                          "MACD Momentum",
                          "EMA Trend + RSI",
                          "Candlestick PA",
                        ]
                      : [
                          "Support & Resistance",
                          "MACD Momentum",
                          "Stochastic Reversal",
                          "Candlestick PA",
                        ]
                    ).map((tag, idx, arr) => (
                      <React.Fragment key={tag}>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-[11px] font-mono font-semibold border flex items-center gap-1",
                            isUp
                              ? "bg-up/12 text-up border-up/25"
                              : "bg-down/12 text-down border-down/25"
                          )}
                        >
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          {tag}
                        </span>
                        {idx < arr.length - 1 && (
                          <span className="text-muted-foreground font-mono text-xs">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: 60s Timer with 30s Trading Window (5 cols) */}
              <div
                className={cn(
                  "md:col-span-5 p-5 rounded-xl border flex flex-col justify-between space-y-3 transition-all",
                  isWindowOpen
                    ? "bg-secondary/70 border-border"
                    : "bg-warning/10 border-warning/40 shadow-[0_0_20px_rgba(245,166,35,0.1)]"
                )}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono uppercase text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      Candle Countdown
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase",
                        isWindowOpen
                          ? "bg-up/15 text-up border-up/30"
                          : "bg-warning/20 text-warning border-warning/40 animate-pulse"
                      )}
                    >
                      {isWindowOpen ? "Window Open" : "Window Locked"}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2 mt-2">
                    <span
                      className={cn(
                        "text-4xl sm:text-5xl font-black font-mono",
                        isWindowOpen ? "text-foreground" : "text-warning"
                      )}
                    >
                      {String(seconds).padStart(2, "0")}s
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">/ 60s</span>
                  </div>

                  {/* Progress Line */}
                  <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden mt-2">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        isWindowOpen ? "bg-up" : "bg-warning"
                      )}
                      style={{ width: `${Math.round((seconds / 60) * 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isWindowOpen ? (
                    <span className="text-up font-medium">
                      ✓ First 30s open: Place your 60-second fixed expiry trade on broker now.
                    </span>
                  ) : (
                    <span className="text-warning font-medium">
                      ⚠ Rest of 30s locked: Do not open trades. Await closed-candle evaluation.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. THE 30-SECOND PRECISION TRADING WINDOW PROTOCOL
      ══════════════════════════════════════════════════════════════ */}
      <section id="rules" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Execution Discipline</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            The 30-Second Window Protocol
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Binary and options markets punish late entries. Apex divides every 60-second candle into two strict mathematical phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Phase 1 Card */}
          <div className="p-6 rounded-2xl bg-card border border-up/30 space-y-4 shadow-lg shadow-up/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-up px-2.5 py-1 rounded bg-up/10 border border-up/25 uppercase">
                Phase 1: Seconds 60 → 31
              </span>
              <span className="text-xs font-mono font-bold text-foreground">30-Second Open Window</span>
            </div>

            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Unlock className="w-5 h-5 text-up" />
              Optimal Execution Phase
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Upon closed M1 confirmation, the consensus signal is published instantly. Traders have the first 30 seconds of the minute to place their 60-second manual trade on their broker platform. Momentum and multi-timeframe moving averages are at maximum reliability.
            </p>

            <ul className="text-xs font-mono space-y-1.5 text-foreground/90 pt-1">
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-up" /> Direction confirmed across 4+ models
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-up" /> Valid entry price buffer intact
              </li>
            </ul>
          </div>

          {/* Phase 2 Card */}
          <div className="p-6 rounded-2xl bg-card border border-warning/30 space-y-4 shadow-lg shadow-warning/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-warning px-2.5 py-1 rounded bg-warning/10 border border-warning/25 uppercase">
                Phase 2: Seconds 30 → 00
              </span>
              <span className="text-xs font-mono font-bold text-foreground">Expiry &amp; Lockout</span>
            </div>

            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Lock className="w-5 h-5 text-warning" />
              Candle Exhaustion Lockout
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              When the candle crosses the 30-second threshold, the interface turns Yellow. No further entries are advised because broker latency and late-candle consolidation significantly degrade win probability. Traders wait for the candle to close cleanly.
            </p>

            <ul className="text-xs font-mono space-y-1.5 text-foreground/90 pt-1">
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Prevents chasing late breakouts
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Eliminates whip-saw losses
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. SIX INDEPENDENT STRATEGIES CONSENSUS MATRIX
      ══════════════════════════════════════════════════════════════ */}
      <section id="strategies" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Multi-Model Framework</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Six Algorithmic Components
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Single indicators lie; mathematical agreement does not. Apex evaluates each closed candle across 6 uncoupled algorithmic strategies.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {strategiesList.map((s) => (
            <div
              key={s.id}
              className="p-6 rounded-2xl bg-card border border-border hover:border-subtle transition-all space-y-4 flex flex-col justify-between shadow-sm"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-primary">STRATEGY {s.num}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-foreground border border-border">
                    Weight: {s.weight}
                  </span>
                </div>

                <h4 className="text-base font-bold text-foreground">{s.name}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>

              <div className="pt-3 border-t border-border/60 flex flex-wrap gap-1.5">
                {s.indicators.map((ind) => (
                  <span
                    key={ind}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-subtle"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Consensus Rule Banner */}
        <div className="p-5 rounded-2xl bg-secondary/80 border border-border max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-foreground">Consensus Threshold: 4 of 6 Required</p>
              <p className="text-[11px] text-muted-foreground">Signals trigger only when score ≥ 70 with ≤ 1 opposing strategy.</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded bg-primary/15 text-primary border border-primary/25 font-bold whitespace-nowrap">
            STRICT FILTER
          </span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. WHY NON-CUSTODIAL & MANUAL EXECUTION IS SUPERIOR
      ══════════════════════════════════════════════════════════════ */}
      <section id="features" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Safety &amp; Compliance</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Why Manual Execution Protects You
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Automated trading bots pose catastrophic risks in binary and high-frequency markets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Danger of Bots */}
          <div className="p-6 rounded-2xl bg-card border border-down/30 space-y-3.5">
            <div className="flex items-center gap-2 text-down font-mono font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" /> The Risk of Automated Bots
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-down font-bold">✕</span>
                <span><strong>Broker Bans:</strong> Binary brokers actively detect and terminate accounts using automated execution scripts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-down font-bold">✕</span>
                <span><strong>API Latency Slippage:</strong> Socket drops cause automated orders to execute seconds late at terrible strike prices.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-down font-bold">✕</span>
                <span><strong>Runaway Losses:</strong> Unchecked martingale bots can wipe entire account balances within minutes during news spikes.</span>
              </li>
            </ul>
          </div>

          {/* Apex Philosophy */}
          <div className="p-6 rounded-2xl bg-card border border-up/30 space-y-3.5">
            <div className="flex items-center gap-2 text-up font-mono font-bold text-xs uppercase">
              <ShieldCheck className="w-4 h-4" /> The Apex Institutional Standard
            </div>
            <ul className="space-y-2.5 text-xs text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-up font-bold">✓</span>
                <span><strong>100% Trader Discretion:</strong> You review the 6-strategy agreement and choose whether to execute on your broker.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-up font-bold">✓</span>
                <span><strong>Zero Account Access:</strong> We never request broker logins, API keys, or deposits. Your funds stay with you.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-up font-bold">✓</span>
                <span><strong>Closed-Candle Discipline:</strong> Only verified M1 candle closes trigger signals, filtering fake broker intra-candle spikes.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. 4-STEP ONBOARDING & EASYPAISA INTEGRATION
      ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Simple Onboarding</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            How to Get Started in 4 Steps
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Fast, secure, and manually verified via Pakistan&apos;s leading payment gateway.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {[
            {
              step: "01",
              title: "Create Account",
              desc: "Register with your name and email to initialize your platform session.",
            },
            {
              step: "02",
              title: "Easypaisa Deposit",
              desc: `Transfer $25 to ${EASYPAISA_CONFIG.accountNumber} (${EASYPAISA_CONFIG.accountTitle}) and upload screenshot.`,
            },
            {
              step: "03",
              title: "Admin Verification",
              desc: "Our financial team verifies the Transaction ID against the official ledger in under 30 mins.",
            },
            {
              step: "04",
              title: "30-Day Key Activation",
              desc: "Enter your issued license key to unlock complete terminal telemetry for 30 full days.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-xl bg-card border border-border relative overflow-hidden space-y-2"
            >
              <span className="text-2xl font-black font-mono text-primary/30 block">
                {item.step}
              </span>
              <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          6. PRICING & OFFICIAL DEPOSIT ACCOUNT
      ══════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="max-w-3xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Transparent Pricing</p>
          <h2 className="text-2xl sm:text-4xl font-bold text-foreground">
            Single 30-Day Platform Pass
          </h2>
          <p className="text-xs text-muted-foreground">
            No recurring auto-debits. No hidden subscription fees. Strictly 30 days of full terminal access.
          </p>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border text-left space-y-6 shadow-2xl relative">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-border pb-6">
            <div>
              <span className="text-xs font-mono text-primary uppercase tracking-wider block">
                Full Institutional Signal Pass
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-extrabold text-foreground">$25</span>
                <span className="text-xs text-muted-foreground font-mono">/ 30 Days Fixed</span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-up/10 text-up border border-up/20">
              30-DAY ACTIVE PERIOD
            </span>
          </div>

          {/* Official Easypaisa Account Details Box */}
          <div className="p-4 rounded-xl bg-secondary/80 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-up" />
                Official Easypaisa Payment Information
              </span>
              <span className="text-[10px] font-mono text-primary">Telenor Bank</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground block">ACCOUNT TITLE</span>
                  <span className="font-bold text-foreground">{EASYPAISA_CONFIG.accountTitle}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(EASYPAISA_CONFIG.accountTitle, "title")}
                  className="p-1 rounded text-subtle hover:text-foreground"
                >
                  {copiedField === "title" ? <Check className="w-3.5 h-3.5 text-up" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-2.5 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-muted-foreground block">EASYPAISA NUMBER</span>
                  <span className="font-bold font-mono text-primary">{EASYPAISA_CONFIG.accountNumber}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(EASYPAISA_CONFIG.accountNumber, "acc")}
                  className="p-1 rounded text-subtle hover:text-foreground"
                >
                  {copiedField === "acc" ? <Check className="w-3.5 h-3.5 text-up" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              60-Second signals on OTC &amp; Regular pairs
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              All 6 algorithmic strategy consensus indicators
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              30-Second open entry window &amp; yellow phase
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Real-time audio alerts &amp; outcome visuals
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Historical outcome archive &amp; win rate telemetry
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Direct admin verification under 30 minutes
            </li>
          </ul>

          <Link
            href="/auth/register"
            className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/25"
          >
            Start Registration &amp; Submit Payment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          7. FREQUENTLY ASKED QUESTIONS (FAQ)
      ══════════════════════════════════════════════════════════════ */}
      <section id="faq" className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Common Inquiries</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-card border border-border overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-semibold text-foreground hover:bg-secondary/50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0",
                    openFaq === idx && "rotate-180 text-primary"
                  )}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. FINAL CALL TO ACTION
      ══════════════════════════════════════════════════════════════ */}
      <section className="text-center rounded-2xl bg-gradient-to-br from-primary/15 via-card to-secondary p-8 sm:p-12 border border-primary/30 max-w-4xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-mono text-primary font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Stop Guessing. Start Calculating.
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
          Ready to Trade with Algorithmic Certainty?
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Join disciplined traders executing on validated mathematical consensus. Request your 30-day fixed signal license today.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/auth/register"
            className="px-8 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-xl shadow-primary/30 hover:-translate-y-0.5"
          >
            Create Account &amp; Activate License
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3.5 rounded-xl bg-secondary hover:bg-card border border-border text-foreground text-sm font-semibold transition-all"
          >
            Existing Member Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}
