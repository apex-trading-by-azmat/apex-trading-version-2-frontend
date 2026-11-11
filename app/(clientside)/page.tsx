import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Activity,
  Layers,
  Cpu,
  Zap,
  TrendingUp,
  CheckCircle2,
  Clock,
  Radio,
  ArrowUpRight,
  Lock,
} from "lucide-react";
import { CurrencyPairDisplay } from "@/components/ui/currency-pair";

export default function ClientLandingPage() {
  return (
    <div className="space-y-24 py-12 md:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* ── HERO SECTION ── */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-up animate-pulse" />
          <span className="font-mono text-foreground">Apex Engine v1.0</span>
          <span className="text-subtle">·</span>
          <span>60-Second Fixed Expiry Terminal</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
          AI-Powered Market Intelligence.{" "}
          <span className="text-primary">Zero Automatic Execution.</span>
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Apex evaluates live financial charts across six independent algorithmic technical strategies, uniting signals into unambiguous UP, DOWN, or WAIT states with strict 60-second execution horizons.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-xl shadow-primary/20"
          >
            Launch Terminal
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/auth/login"
            className="px-6 py-3 rounded-xl bg-card hover:bg-secondary text-foreground border border-border text-sm font-semibold transition-all"
          >
            Sign In to Session
          </Link>
        </div>

        {/* Live Terminal Signal Preview Card */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border text-xs">
              <div className="flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-up opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-up" />
                </span>
                <CurrencyPairDisplay pair="EUR/USD" market="OTC" size="md" showMarket />
              </div>
              <span className="font-mono text-primary">60s Fixed Expiry</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-xl bg-secondary border border-border">
                <p className="text-[10px] text-subtle uppercase font-mono">Consensus State</p>
                <p className="text-xl font-bold font-mono text-up mt-0.5 flex items-center justify-center gap-1">
                  <ArrowUpRight className="w-5 h-5" /> UP
                </p>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border">
                <p className="text-[10px] text-subtle uppercase font-mono">Strategy Agreement</p>
                <p className="text-xl font-bold font-mono text-foreground mt-0.5">5 of 6</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary border border-border">
                <p className="text-[10px] text-subtle uppercase font-mono">Confidence Score</p>
                <p className="text-xl font-bold font-mono text-primary mt-0.5">82 / 100</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CORE PILLARS ── */}
      <section id="features" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Architectural Integrity</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Built for Precision, Not Gambling</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Radio className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Automatic Pair Synchronization</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The Manifest V3 browser extension detects the currently focused chart and immediately invalidates stale candles on pair switch.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">OTC vs Regular Market Segregation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              OTC and standard market sessions are evaluated under distinct statistical models to eliminate behavioral contamination.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
            <div className="w-10 h-10 rounded-xl bg-up/10 border border-up/30 flex items-center justify-center text-up">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Non-Custodial &amp; Manual Execution</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Apex never places trades, links account funds, or accesses broker credentials. You retain total manual execution control.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 STRATEGIES SECTION ── */}
      <section id="strategies" className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Multi-Model Engine</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Six Independent Algorithmic Analyzers</h2>
          <p className="text-xs text-muted-foreground">Combined centralized consensus prevents single-indicator failure.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "EMA Trend + RSI Pullback", desc: "EMA 9 & 21 trend filter with RSI 14 oversold/overbought pullback zones.", tag: "Trend Following" },
            { title: "Support & Resistance Reversal", desc: "Dynamic zone rejections, pin bar formations, and high-volume engulfing wick filters.", tag: "Structure" },
            { title: "Bollinger Bands Breakout", desc: "20-period standard deviation volatility squeeze & expansion confirmation.", tag: "Volatility" },
            { title: "MACD Momentum Confirmation", desc: "Fast 12, Slow 26, Signal 9 histogram acceleration over centerline.", tag: "Momentum" },
            { title: "Stochastic Reversal", desc: "%K 14, %D 3 curve crossovers in extreme 80/20 exhaustion boundaries.", tag: "Oscillator" },
            { title: "Candlestick Price Action", desc: "Multi-candle structural validation: pin bars, hammers, and engulfing bars.", tag: "Price Action" },
          ].map((s, idx) => (
            <div key={s.title} className="p-5 rounded-xl bg-card border border-border flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-primary">STRATEGY 0{idx + 1}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground border border-border">{s.tag}</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{s.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 30-DAY PASS PRICING ── */}
      <section id="pricing" className="max-w-xl mx-auto text-center space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Membership Pass</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Single 30-Day Platform Pass</h2>
          <p className="text-xs text-muted-foreground">No recurring subscriptions. Manual Easypaisa payment verification.</p>
        </div>

        <div className="p-8 rounded-2xl bg-card border border-border text-left space-y-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-baseline justify-between border-b border-border pb-6">
            <div>
              <span className="text-xs font-mono text-primary uppercase tracking-wider block">30-Day Terminal Access</span>
              <span className="text-3xl font-bold text-foreground mt-1 block">Full License</span>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-up/10 text-up border border-up/20">
              ACTIVE STANDARD
            </span>
          </div>

          <ul className="space-y-3 text-xs text-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Real-time 60-second signals across OTC and Regular pairs
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              All 6 technical analysis strategies &amp; consensus score
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Chrome Extension Manifest V3 pair synchronization
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Historical outcome archive and performance telemetry
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-up shrink-0" />
              Manual renewal via Easypaisa transaction ID verification
            </li>
          </ul>

          <Link
            href="/auth/register"
            className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
          >
            Get Started Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

