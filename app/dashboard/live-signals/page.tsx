"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Activity,
  ShieldCheck,
  Zap,
  RefreshCw,
  Info,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Layers,
  CheckCircle2,
  XCircle,
  Sparkles,
  Database,
  Radio,
  Gauge,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  PauseCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn, formatToUTC5 } from "@/lib/utils";
import {
  CurrencyPairDisplay,
  DualFlagIcon,
  CURRENCY_MAP,
  parsePair,
} from "@/components/ui/currency-pair";
import { soundEffects } from "@/lib/sound-effects";
import {
  TradeOutcomeModal,
  OutcomeType,
} from "@/components/dashboard/trade-outcome-modal";
import { useRecentSignals } from "@/hook/useSignals";
import { useSignalsWebSocket } from "@/hook/useSignalsWebSocket";
import { useSession } from "@/hook/useSession";
import { Skeleton } from "@/components/ui/skeleton";

type SignalMode = "UP" | "DOWN" | "WAIT";

interface StrategyVote {
  strategy_name: string;
  direction: SignalMode | string;
  confidence_score: number;
  reason_code: string;
  eligible: boolean;
}

interface SignalData {
  id: string;
  session_id?: string;
  asset: string;
  direction: SignalMode;
  confidence_score: number;
  consensus_count: number;
  opposition_count: number;
  status_code: string;
  is_qualified: boolean;
  entry_baseline?: number;
  target_strike?: number;
  spot_price?: number;
  broker_payout?: number;
  market_regime?: string;
  created_at?: string;
  votes?: StrategyVote[];
  strategy_breakdown?: Record<string, any>;
  is_active?: boolean;
  is_active_chart?: boolean;
  candle_count?: number;
  regime_summary?: string;
}

// Default waiting/standby state when engine is monitoring Quotex ticks and waiting for setups
const WAIT_SIGNAL: SignalData = {
  id: "standby-waiting",
  session_id: "telemetry-monitoring",
  asset: "EURUSD_OTC",
  direction: "WAIT",
  confidence_score: 0,
  consensus_count: 0,
  opposition_count: 0,
  status_code: "WAITING_FOR_SETUP",
  is_qualified: false,
  entry_baseline: undefined,
  target_strike: undefined,
  spot_price: undefined,
  broker_payout: undefined,
  market_regime: "STANDBY_MONITORING",
  created_at: undefined,
  votes: [
    {
      strategy_name: "CANDLESTICK_PRICE_ACTION",
      direction: "WAIT",
      confidence_score: 0,
      reason_code: "CANDLE_NO_PATTERN",
      eligible: true,
    },
    {
      strategy_name: "FAIR_VALUE_GAP",
      direction: "WAIT",
      confidence_score: 0,
      reason_code: "WAIT_NO_CONFIRMED_FVG_RETEST",
      eligible: true,
    },
    {
      strategy_name: "SR_REVERSAL",
      direction: "WAIT",
      confidence_score: 0,
      reason_code: "SR_NO_SETUP",
      eligible: true,
    },
    {
      strategy_name: "EMA_RSI_PULLBACK",
      direction: "WAIT",
      confidence_score: 0,
      reason_code: "NONE",
      eligible: true,
    },
  ],
};

function formatStrategyName(name: string): string {
  switch (name) {
    case "CANDLESTICK_PRICE_ACTION":
      return "Candlestick Price Action";
    case "FAIR_VALUE_GAP":
    case "FAIR_VALUE":
    case "FVG":
      return "Fair Value Gap (FVG)";
    case "SR_REVERSAL":
      return "Support & Resistance Reversal";
    case "EMA_RSI_PULLBACK":
      return "EMA Trend + RSI Pullback";
    case "BOLLINGER_BANDS_BREAKOUT":
    case "BOLLINGER_BREAKOUT":
    case "BOLLINGER_BANDS":
      return "Bollinger Bands Breakout";
    case "MACD_MOMENTUM":
    case "MACD_MOMENTUM_CONFIRMATION":
      return "MACD Momentum Confirmation";
    case "STOCHASTIC_REVERSAL":
      return "Stochastic Reversal";
    default:
      return name ? name.replace(/_/g, " ") : "Strategy";
  }
}

function formatReasonCode(code: string): string {
  switch (code) {
    case "MORNING_STAR":
      return "Bullish Morning Star Pattern";
    case "EVENING_STAR":
      return "Bearish Evening Star Pattern";
    case "BULLISH_ENGULFING":
      return "Bullish Engulfing Candle";
    case "BEARISH_ENGULFING":
      return "Bearish Engulfing Candle";
    case "SR_NO_SETUP":
      return "No S&R Setup Detected";
    case "SUPPORT_BOUNCE":
      return "Bounce off Dynamic Support";
    case "RESISTANCE_REJECTION":
      return "Rejection at Key Resistance";
    case "EMA_RSI_BULLISH_PULLBACK":
      return "Bullish Pullback on EMA & RSI";
    case "EMA_RSI_BEARISH_PULLBACK":
      return "Bearish Breakdown below EMA 20";
    case "BB_NO_BREAKOUT":
      return "No Volatility Breakout";
    case "BB_UPPER_BREAKOUT":
      return "Upper Band Volatility Breakout";
    case "BB_LOWER_BREAKOUT":
      return "Lower Band Volatility Breakdown";
    case "NONE":
      return "Standby / No Trigger";
    default:
      return code ? code.replace(/_/g, " ") : "Analyzed";
  }
}

export default function LiveSignalsPage() {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("apex_sound_enabled") !== "false";
  });

  // Sync sound preference from localStorage (updated from Settings page)
  useEffect(() => {
    const handler = () => {
      setSoundEnabled(localStorage.getItem("apex_sound_enabled") !== "false");
    };
    window.addEventListener("apex_sound_toggled", handler);
    return () => window.removeEventListener("apex_sound_toggled", handler);
  }, []);
  const [outcomeModal, setOutcomeModal] = useState<OutcomeType | null>(null);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  // 100% Real-Time Clock synchronized to UTC+5 (PKT)
  const [nowDate, setNowDate] = useState<Date | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    startTimeRef.current = now;
    setNowDate(new Date(now));

    // Update once per second — enough for seconds display without 4x/sec re-renders
    const timer = setInterval(() => {
      const now = Date.now();
      setNowDate(new Date(now));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-time M1 candle calculations (60-second fixed expiry candle locked to :00 - :59)
  const currentSecond = nowDate ? nowDate.getSeconds() : 0;
  const secondsRemaining = nowDate ? 60 - currentSecond : 60;
  const isWindowOpen = secondsRemaining > 30; // First 30s is Entry Window

  // Formatted UTC+5 time string for live cadence display
  const utc5TimeDisplay = useMemo(() => {
    if (!nowDate) return "--:--:--";
    return nowDate.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Karachi",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [nowDate]);

  // TanStack Query: Initial hydration only (real-time updates arrive via WebSockets)
  const {
    data: apiSignals,
    isFetching: isSignalsFetching,
    refetch: refetchSignals,
  } = useRecentSignals(
    { limit: 30 },
    {
      refetchInterval: false,
      staleTime: Infinity,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
    },
  );

  // WebSocket: real-time signal feed from backend (signal/qualified, signal/wait, connected, watchlist/updated)
  const {
    activeSignal: wsActiveSignalRaw,
    activeChartAsset: wsActiveChartAssetRaw,
    activeChartPayout: wsActiveChartPayout,
    isConnected: isWsConnected,
  } = useSignalsWebSocket();

  const wsActiveSignal = wsActiveSignalRaw as SignalData | null;
  const wsActiveChartAsset = wsActiveChartAssetRaw as string | null;

  // Session from /auth/session — source of truth for auth state
  const { session: authSession } = useSession();

  const normalizeAssetKey = useCallback((sym?: string | null) => {
    if (!sym) return "";
    return sym.toUpperCase().replace(/[\/\s\(\)\-_]/g, "").replace(/OTC$/, "");
  }, []);

  // Strict Single Active Asset currently focused in Quotex
  const monitoredAsset = wsActiveChartAsset || "EURUSD_OTC";
  const monitoredKey = normalizeAssetKey(monitoredAsset);

  // Normalize API data to array (handles raw JSON string, array, or envelope object from backend)
  const extractSignalArray = useCallback((raw: any): SignalData[] => {
    if (raw == null) return [];

    let parsed: any = raw;

    // Handle stringified JSON from backend (FastAPI responses)
    if (typeof parsed === "string") {
      try {
        parsed = JSON.parse(parsed);
      } catch (err) {
        console.warn("[Apex] Failed to parse apiSignals JSON string:", err);
        return [];
      }
    }

    // Bare array
    if (Array.isArray(parsed)) return parsed;

    if (typeof parsed === "object") {
      // Single signal object
      if (parsed.id) return [parsed as SignalData];

      // Envelope shapes: { data: [...] }, { signals: [...] }, etc.
      for (const key of [
        "signals",
        "data",
        "items",
        "results",
        "pairs",
        "records",
        "list",
      ]) {
        if (Array.isArray(parsed[key])) return parsed[key];
      }

      // Nested envelope: { data: { signals: [...] } } or { result: { data: [...] } }
      for (const outer of ["data", "result", "response", "payload"]) {
        const inner = parsed[outer];
        if (inner && typeof inner === "object") {
          if (Array.isArray(inner)) return inner;
          for (const key of [
            "signals",
            "data",
            "items",
            "results",
            "pairs",
            "records",
            "list",
          ]) {
            if (Array.isArray(inner[key])) return inner[key];
          }
          if (inner.id) return [inner as SignalData];
        }
      }
    }

    return [];
  }, []);

  // Helper to parse signal timestamp as UTC epoch ms
  const parseSignalTime = useCallback((dateStr?: string): number => {
    if (!dateStr) return 0;
    const isoStr =
      dateStr.endsWith("Z") || dateStr.includes("+") ? dateStr : `${dateStr}Z`;
    const t = new Date(isoStr).getTime();
    return isNaN(t) ? 0 : t;
  }, []);

  // Check if a qualified signal was generated for the active 60s candle window (under 65s age)
  const isSignalStillActiveCandle = useCallback(
    (sig: SignalData | null): boolean => {
      if (!sig || !sig.created_at || !nowDate) return false;
      const sigTime = parseSignalTime(sig.created_at);
      if (!sigTime) return false;
      const nowMs = nowDate.getTime();
      const ageSeconds = (nowMs - sigTime) / 1000;
      // In 60s binary trading, a signal is active for the full 60 seconds of that candle (with 5s buffer)
      return ageSeconds >= 0 && ageSeconds < 65;
    },
    [nowDate, parseSignalTime],
  );

  const signalsList: SignalData[] = useMemo(() => {
    // Strictly qualified trade signals (UP or DOWN) for the active monitored asset
    const list = extractSignalArray(apiSignals).filter(
      (s) =>
        s &&
        s.direction !== "WAIT" &&
        (s.direction === "UP" || s.direction === "DOWN") &&
        normalizeAssetKey(s.asset) === monitoredKey
    );
    if (
      wsActiveSignal &&
      wsActiveSignal.id &&
      wsActiveSignal.is_qualified &&
      (wsActiveSignal.direction === "UP" || wsActiveSignal.direction === "DOWN") &&
      normalizeAssetKey(wsActiveSignal.asset) === monitoredKey
    ) {
      const idx = list.findIndex(
        (s) => s.id === wsActiveSignal.id || (s.asset === wsActiveSignal.asset && s.created_at === wsActiveSignal.created_at)
      );
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...wsActiveSignal };
      } else {
        list.unshift(wsActiveSignal);
      }
    }
    // Sort by created_at descending (newest first)
    return list.sort((a, b) => {
      const ta = parseSignalTime(a.created_at);
      const tb = parseSignalTime(b.created_at);
      if (ta !== tb) return tb - ta;
      return 0;
    });
  }, [apiSignals, wsActiveSignal, extractSignalArray, parseSignalTime, monitoredKey, normalizeAssetKey]);

  const hasLiveSignals = signalsList.length > 0;

  // Determine if the newest backend signal belongs to the CURRENT 60-second candle
  const latestBackendSignal = signalsList.length > 0 ? signalsList[0] : null;

  // When a live qualified signal arrives via WebSocket, automatically clear historical inspection so cockpit displays the live trade
  useEffect(() => {
    if (
      wsActiveSignal &&
      wsActiveSignal.is_qualified &&
      (wsActiveSignal.direction === "UP" || wsActiveSignal.direction === "DOWN") &&
      isSignalStillActiveCandle(wsActiveSignal) &&
      normalizeAssetKey(wsActiveSignal.asset) === monitoredKey
    ) {
      setSelectedSignalId(null);
    }
  }, [wsActiveSignal, isSignalStillActiveCandle, monitoredKey, normalizeAssetKey]);

  // Dynamic Active Signal for the single active monitored asset
  const activeSignal: SignalData = useMemo(() => {
    // 1. User manual inspection (clicking a historical signal in the feed table)
    if (selectedSignalId) {
      const found = signalsList.find((s) => s.id === selectedSignalId);
      if (found) {
        return found;
      }
    }

    // 2. Real-time qualified signal from WebSocket strictly for the active monitored pair in current 60s window
    if (
      wsActiveSignal &&
      wsActiveSignal.is_qualified &&
      (wsActiveSignal.direction === "UP" || wsActiveSignal.direction === "DOWN") &&
      isSignalStillActiveCandle(wsActiveSignal) &&
      normalizeAssetKey(wsActiveSignal.asset) === monitoredKey
    ) {
      return wsActiveSignal;
    }

    // 3. Active qualified signal from REST polling strictly for the active monitored pair in current 60s window
    if (
      latestBackendSignal &&
      latestBackendSignal.is_qualified &&
      (latestBackendSignal.direction === "UP" || latestBackendSignal.direction === "DOWN") &&
      isSignalStillActiveCandle(latestBackendSignal) &&
      normalizeAssetKey(latestBackendSignal.asset) === monitoredKey
    ) {
      return latestBackendSignal;
    }

    // 4. Default clean Standby / WAIT State strictly for the active pair
    return {
      ...WAIT_SIGNAL,
      id: `live-standby-${monitoredAsset}`,
      asset: monitoredAsset,
      broker_payout: wsActiveChartPayout ?? undefined,
      direction: "WAIT",
      status_code: "WAITING_FOR_SETUP",
      is_qualified: false,
      confidence_score: 0,
      consensus_count: 0,
      entry_baseline: undefined,
      target_strike: undefined,
      spot_price: undefined,
      votes: WAIT_SIGNAL.votes,
      created_at: nowDate ? nowDate.toISOString() : undefined,
    };
  }, [
    selectedSignalId,
    signalsList,
    wsActiveSignal,
    wsActiveChartPayout,
    latestBackendSignal,
    isSignalStillActiveCandle,
    monitoredAsset,
    monitoredKey,
    normalizeAssetKey,
    nowDate,
  ]);

  // Safe Currency Parsing
  const assetStr = activeSignal.asset || "EURUSD_OTC";
  const { base, quote } = parsePair(assetStr);
  const baseCurrency = CURRENCY_MAP[base];
  const quoteCurrency = CURRENCY_MAP[quote];
  const isOtc =
    assetStr.toLowerCase().includes("otc") ||
    activeSignal.market_regime?.includes("OTC");
  const marketType = isOtc ? "OTC" : "Regular";

  const isUp = activeSignal.direction === "UP";
  const isDown = activeSignal.direction === "DOWN";
  const isWait = activeSignal.direction === "WAIT";

  // Normalized 3 Strategies (votes array)
  const votesList: StrategyVote[] = useMemo(() => {
    if (Array.isArray(activeSignal.votes) && activeSignal.votes.length > 0) {
      return activeSignal.votes;
    }
    // Fallback if backend used strategy_breakdown object
    if (
      activeSignal.strategy_breakdown &&
      typeof activeSignal.strategy_breakdown === "object"
    ) {
      return Object.entries(activeSignal.strategy_breakdown).map(
        ([key, item]: [string, any]) => ({
          strategy_name: item?.strategy_name || key,
          direction: item?.direction || "WAIT",
          confidence_score: item?.confidence_score ?? 0,
          reason_code: item?.reason_code || "NONE",
          eligible: item?.eligible ?? true,
        }),
      );
    }
    return WAIT_SIGNAL.votes || [];
  }, [activeSignal]);

  // Guaranteed 4 strategies array for consistent display
  const fourStrategiesList = useMemo(() => {
    // If backend provided votes or strategy_breakdown with 4 or more, use all of them!
    if (votesList.length >= 4) {
      return votesList;
    }

    const knownKeys = [
      "CANDLESTICK_PRICE_ACTION",
      "FAIR_VALUE_GAP",
      "SR_REVERSAL",
      "EMA_RSI_PULLBACK",
    ];

    const matched = knownKeys.map((key) => {
      return (
        votesList.find(
          (v) =>
            v.strategy_name === key ||
            v.strategy_name?.toUpperCase().replace(/_/g, "") ===
              key.replace(/_/g, "") ||
            (key.includes("GAP") &&
              v.strategy_name?.toUpperCase().includes("GAP")),
        ) || null
      );
    });

    if (matched.some((m) => m !== null)) {
      return matched.map((m, idx) => {
        if (m) return m;
        return {
          strategy_name: knownKeys[idx],
          direction: "WAIT",
          confidence_score: 0,
          reason_code: "NONE",
          eligible: true,
        };
      });
    }

    return knownKeys.map((key, idx) => {
      return (
        votesList[idx] || {
          strategy_name: key,
          direction: "WAIT",
          confidence_score: 0,
          reason_code: "NONE",
          eligible: true,
        }
      );
    });
  }, [votesList]);


  // Sound alert on every new signal arrival so users can distinguish old from new signals
  const lastSignalRef = useRef<{
    id: string | null;
    asset: string | null;
    direction: string | null;
  } | null>(null);
  useEffect(() => {
    if (!activeSignal?.id) return;

    const prev = lastSignalRef.current;
    const isNewSignal = prev ? activeSignal.id !== prev.id : true;
    const isPairSwitch = prev ? activeSignal.asset !== prev.asset : false;

    if (isNewSignal || isPairSwitch) {
      lastSignalRef.current = {
        id: activeSignal.id,
        asset: activeSignal.asset,
        direction: activeSignal.direction,
      };

      if (!soundEnabled) return;
      try {
        if (isPairSwitch) {
          soundEffects.playPairSwitch();
        } else if (activeSignal.direction === "UP") {
          soundEffects.playUpSignal();
        } else if (activeSignal.direction === "DOWN") {
          soundEffects.playDownSignal();
        } else {
          // WAIT / standby signal - distinct chime to indicate a new signal arrived
          soundEffects.playPairSwitch();
        }
      } catch {
        // ignore audio failure
      }
    }
  }, [
    activeSignal?.id,
    activeSignal?.asset,
    activeSignal?.direction,
    soundEnabled,
  ]);

  return (
    <AppShell
      title="Live Signals"
      description="Real-time 60-second fixed expiry signal engine powered by 4 independent strategies."
      wsConnected={isWsConnected}
    >
      <div className="space-y-4 relative w-full max-w-full min-w-0">
        {/* Full-screen Win / Loss Celebration Modal */}
        <TradeOutcomeModal
          outcome={outcomeModal}
          pair={assetStr}
          base={base}
          quote={quote}
          market={marketType}
          direction={activeSignal.direction}
          entryPrice={activeSignal.entry_baseline?.toString() || "0.60658"}
          exitPrice={
            isUp
              ? ((activeSignal.entry_baseline || 0.60658) + 0.00011).toFixed(5)
              : ((activeSignal.entry_baseline || 0.60658) - 0.00011).toFixed(5)
          }
          onClose={() => setOutcomeModal(null)}
        />



        {/* ══════════════════════════════════════════════════════════════
            HERO SIGNAL COCKPIT (THE 3-COLUMN UNIFIED COMMAND CENTER)
        ══════════════════════════════════════════════════════════════ */}
        <section
          className={cn(
            "relative rounded-2xl border p-5 sm:p-6 lg:p-7 overflow-hidden transition-all duration-300 shadow-xl",
            isUp && "bg-gradient-to-br from-up/10 via-card to-background border-up/40 shadow-[0_0_50px_rgba(16,185,129,0.12)]",
            isDown && "bg-gradient-to-br from-down/10 via-card to-background border-down/40 shadow-[0_0_50px_rgba(244,63,94,0.12)]",
            isWait && "bg-card border-border shadow-sm",
          )}
        >
          {/* Subtle Top Ambient Neon Glow Line */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1",
              isUp && "bg-gradient-to-r from-up/20 via-up to-up/20",
              isDown && "bg-gradient-to-r from-down/20 via-down to-down/20",
              isWait && "bg-gradient-to-r from-transparent via-primary/30 to-transparent",
            )}
          />

          {/* Historical Inspection Alert Bar */}
          {selectedSignalId && (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-primary/10 border border-primary/25 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono text-foreground">
                  Inspecting Historical Telemetry: <strong>{activeSignal.asset}</strong> ({activeSignal.direction})
                </span>
                <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                  • {activeSignal.created_at ? `${formatToUTC5(activeSignal.created_at)} UTC+5` : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSignalId(null)}
                className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-3 text-foreground font-mono text-xs border border-border cursor-pointer transition-all"
              >
                ✕ Return to Live Wait State
              </button>
            </div>
          )}

          {/* Main 3-Column Cockpit Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

            {/* ── COL 1: DIRECTION & CONVICTION PANEL (4 COLS) ── */}
            <div className="lg:col-span-4 rounded-xl bg-surface-1 border border-border p-4 sm:p-5 flex flex-col justify-between gap-4">
              {/* Asset Header */}
              <div className="flex items-center justify-between gap-2 border-b border-border/70 pb-3">
                <div className="flex items-center gap-2">
                  <DualFlagIcon base={base} quote={quote} size="sm" />
                  <span className="font-mono font-bold text-sm text-foreground">
                    {base}/{quote}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                      isOtc
                        ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        : "bg-primary/15 text-primary border border-primary/30",
                    )}
                  >
                    {marketType}
                  </span>
                </div>

                <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase bg-surface-2 text-muted-foreground border border-border">
                  60s Expiry
                </span>
              </div>

              {/* Huge Direction Hero */}
              <div
                className={cn(
                  "p-4 rounded-xl border flex items-center gap-4 transition-all duration-300",
                  isUp && "bg-up/10 border-up/40 text-up shadow-[0_0_25px_rgba(16,185,129,0.2)]",
                  isDown && "bg-down/10 border-down/40 text-down shadow-[0_0_25px_rgba(244,63,94,0.2)]",
                  isWait && "bg-surface-2/60 border-border text-muted-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-16 h-16 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 shadow-md",
                    isUp && "bg-up/25 border-up/60 text-up",
                    isDown && "bg-down/25 border-down/60 text-down",
                    isWait && "bg-surface-3 border-border text-muted-foreground",
                  )}
                >
                  {isUp && <ArrowUpRight className="w-8 h-8" />}
                  {isDown && <ArrowDownRight className="w-8 h-8" />}
                  {isWait && <PauseCircle className="w-8 h-8" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={cn(
                        "text-3xl sm:text-4xl font-black font-mono tracking-tight",
                        isUp && "text-up",
                        isDown && "text-down",
                        isWait && "text-muted-foreground",
                      )}
                    >
                      {activeSignal.direction}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground font-semibold">
                      {isWait ? "STANDBY" : "SIGNAL"}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-xs font-bold font-mono tracking-wide mt-1 truncate",
                      isUp && "text-up",
                      isDown && "text-down",
                      isWait && "text-muted-foreground",
                    )}
                  >
                    {isWait
                      ? "WAIT / SCANNING TICKS"
                      : isWindowOpen
                      ? isUp
                        ? "CALL / HIGHER (BUY)"
                        : "PUT / LOWER (SELL)"
                      : isUp
                      ? "CALL RUNNING (Awaiting Expiry)"
                      : "PUT RUNNING (Awaiting Expiry)"}
                  </p>
                </div>
              </div>

              {/* Real-time Telemetry (Broker Payout, Entry Baseline, Target Strike) */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border/70">
                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-border/70 text-center">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Payout
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold font-mono block mt-0.5",
                      isWait ? "text-muted-foreground" : "text-up",
                    )}
                  >
                    {activeSignal.broker_payout ? `${activeSignal.broker_payout}%` : isWait ? "—" : "85%"}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground block truncate">
                    {isWait ? "Standby" : "Margin"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-border/70 text-center">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Baseline
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold font-mono block mt-0.5 truncate",
                      isWait ? "text-muted-foreground" : "text-primary",
                    )}
                    title={String(activeSignal.entry_baseline ?? activeSignal.spot_price ?? "0.00000")}
                  >
                    {activeSignal.entry_baseline ?? activeSignal.spot_price ?? (isWait ? "—" : "0.00000")}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground block truncate">
                    {isWait ? "Pending" : "Spot Price"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-2/60 border border-border/70 text-center">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">
                    Target
                  </span>
                  <span
                    className={cn(
                      "text-sm font-bold font-mono block mt-0.5 truncate",
                      isUp ? "text-up" : isDown ? "text-down" : "text-muted-foreground",
                    )}
                    title={String(activeSignal.target_strike ?? "0.00000")}
                  >
                    {activeSignal.target_strike ?? (isWait ? "—" : "0.00000")}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground block truncate">
                    {isWait ? "Pending" : isUp ? "> Baseline" : "< Baseline"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── COL 2: 60s CANDLE TIMER & TRADING WINDOW (4 COLS) ── */}
            <div className="lg:col-span-4 rounded-xl bg-surface-1 border border-border p-4 sm:p-5 flex flex-col justify-between gap-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <span className="text-xs font-mono font-bold text-foreground flex items-center gap-1.5 uppercase">
                  <Clock className="w-3.5 h-3.5 text-primary" />
                  M1 Candle Pulse
                </span>
                <span className="text-[11px] font-mono text-muted-foreground">
                  UTC+5: <strong className="text-foreground">{utc5TimeDisplay}</strong>
                </span>
              </div>

              {/* Giant Digital Chronometer */}
              <div className="text-center py-2">
                <div className="inline-flex items-baseline justify-center gap-1">
                  <span
                    className={cn(
                      "text-6xl sm:text-7xl font-black font-mono leading-none tracking-tight",
                      isWait
                        ? "text-foreground"
                        : isWindowOpen
                        ? "text-foreground"
                        : "text-warning",
                    )}
                  >
                    {String(secondsRemaining).padStart(2, "0")}
                  </span>
                  <span className="text-2xl font-mono text-muted-foreground font-semibold">
                    s
                  </span>
                </div>

                <p
                  className={cn(
                    "text-xs font-mono font-bold mt-2",
                    isWait
                      ? "text-muted-foreground"
                      : isWindowOpen
                      ? "text-up"
                      : "text-warning",
                  )}
                >
                  {isWait
                    ? `60s Candle Sync (${secondsRemaining > 30 ? "Entry Phase" : "Lockout Phase"})`
                    : isWindowOpen
                    ? "✓ Trading Window Open (60s → 31s)"
                    : "⚠ Window Locked / In-Trade Expiry (30s → 00s)"}
                </p>
              </div>

              {/* Dual-Track Visual Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full h-3 rounded-full bg-surface-2 overflow-hidden flex border border-border p-0.5">
                  {/* First 30s: Entry Window */}
                  <div className="w-1/2 h-full relative border-r border-background/50">
                    <div
                      className={cn(
                        "h-full rounded-l-full transition-all duration-1000",
                        isWait
                          ? "bg-muted-foreground/30"
                          : isWindowOpen
                          ? isUp
                            ? "bg-up shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            : isDown
                            ? "bg-down shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                            : "bg-primary"
                          : "bg-up/40",
                      )}
                      style={{
                        width: isWait
                          ? `${Math.round(((60 - secondsRemaining) / 60) * 100)}%`
                          : isWindowOpen
                          ? `${Math.round(((60 - secondsRemaining) / 30) * 100)}%`
                          : "100%",
                      }}
                    />
                  </div>
                  {/* Second 30s: Lockout Window */}
                  <div className="w-1/2 h-full relative">
                    <div
                      className={cn(
                        "h-full rounded-r-full transition-all duration-1000",
                        isWait
                          ? "bg-muted-foreground/15"
                          : !isWindowOpen
                          ? "bg-warning shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                          : "bg-transparent",
                      )}
                      style={{
                        width: isWait
                          ? "0%"
                          : !isWindowOpen
                          ? `${Math.round(((30 - secondsRemaining) / 30) * 100)}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] font-mono text-muted-foreground px-0.5">
                  <span className={isWindowOpen && !isWait ? "text-up font-bold" : ""}>
                    [60s → 31s] Entry Window
                  </span>
                  <span className={!isWindowOpen && !isWait ? "text-warning font-bold" : ""}>
                    [30s → 00s] Lockout / Expiry
                  </span>
                </div>
              </div>

              {/* Phase Banner */}
              <div
                className={cn(
                  "p-2.5 rounded-lg border text-xs font-mono flex items-center justify-between gap-2",
                  isWait
                    ? "bg-surface-2 text-muted-foreground border-border"
                    : isWindowOpen
                    ? "bg-up/10 text-up border-up/30 animate-pulse"
                    : "bg-warning/15 text-warning border-warning/40",
                )}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {isWait ? (
                    <Radio className="w-3.5 h-3.5 text-emerald-400 shrink-0 animate-pulse" />
                  ) : isWindowOpen ? (
                    <Unlock className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span className="truncate font-semibold">
                    {isWait
                      ? "Listening to Quotex ticks"
                      : isWindowOpen
                      ? "Execute trade on Quotex now"
                      : "Window locked. Do not enter trades"}
                  </span>
                </div>

                <span className="text-[10px] font-bold uppercase shrink-0 px-1.5 py-0.5 rounded bg-background/50 border border-border">
                  {isWait ? "STANDBY" : isWindowOpen ? "OPEN" : "LOCKED"}
                </span>
              </div>
            </div>

            {/* ── COL 3: 4-STRATEGY INSTITUTIONAL CONSENSUS (LIST VIEW) (4 COLS) ── */}
            <div className="lg:col-span-4 rounded-xl bg-surface-1 border border-border p-4 sm:p-5 flex flex-col justify-between gap-3">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/70 pb-3">
                <span className="text-primary font-bold uppercase font-mono text-xs flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  4 Strategies Consensus
                </span>
                <span
                  className={cn(
                    "text-[11px] font-mono px-2 py-0.5 rounded font-bold border",
                    isWait
                      ? "bg-surface-2 text-muted-foreground border-border"
                      : "bg-primary/10 text-primary border-primary/25",
                  )}
                >
                  {isWait
                    ? `0 of ${fourStrategiesList.length} Satisfied`
                    : `${activeSignal.consensus_count || fourStrategiesList.filter((v) => v.direction === activeSignal.direction).length} of ${fourStrategiesList.length} Satisfied`}
                </span>
              </div>

              {/* Conviction / Confidence Micro-Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Confidence Conviction:</span>
                  <span
                    className={cn(
                      "font-bold",
                      isWait
                        ? "text-muted-foreground"
                        : activeSignal.confidence_score >= 75
                          ? "text-emerald-400"
                          : activeSignal.confidence_score >= 60
                            ? "text-teal-400"
                            : "text-amber-400"
                    )}
                  >
                    {isWait
                      ? "0/100 (Waiting Setup)"
                      : `${activeSignal.confidence_score}/100 ${
                          activeSignal.confidence_score >= 90
                            ? "✓ High Confluence"
                            : activeSignal.confidence_score >= 75
                              ? "✓ Dual Confirmation"
                              : activeSignal.confidence_score >= 60
                                ? "✓ Single Confirmation"
                                : ""
                        }`}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-2 overflow-hidden border border-border/60">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      isWait
                        ? "bg-muted-foreground/30"
                        : activeSignal.confidence_score >= 75
                          ? "bg-emerald-500"
                          : activeSignal.confidence_score >= 60
                            ? "bg-teal-500"
                            : "bg-amber-500"
                    )}
                    style={{ width: `${isWait ? 0 : Math.max(activeSignal.confidence_score, 0)}%` }}
                  />
                </div>
              </div>

              {/* The 4 Strategies List View */}
              <div className="flex flex-col gap-2 pt-1">
                {fourStrategiesList.map((vote, idx) => {
                  const isSatisfied =
                    !isWait &&
                    (vote.direction === activeSignal.direction ||
                      (activeSignal as any).qualifying_strategy === vote.strategy_name) &&
                    (vote.confidence_score > 0 || activeSignal.is_qualified);

                  const isOpposing =
                    !isWait &&
                    !isSatisfied &&
                    vote.direction !== "WAIT" &&
                    vote.direction !== activeSignal.direction;

                  return (
                    <div
                      key={vote.strategy_name || idx}
                      className={cn(
                        "px-3 py-2.5 rounded-lg border transition-all duration-200 flex items-center justify-between gap-3 relative overflow-hidden",
                        isSatisfied
                          ? "bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/30"
                          : isOpposing
                          ? "bg-rose-500/10 border-rose-500/30"
                          : "bg-surface-2/60 border-border/80",
                      )}
                    >
                      {/* Left: Number + Strategy Name + Reason */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center font-mono font-bold text-[10px] border shrink-0",
                            isSatisfied
                              ? "bg-emerald-500/25 text-emerald-400 border-emerald-500/50"
                              : "bg-surface-3 text-primary border-border",
                          )}
                        >
                          0{idx + 1}
                        </span>

                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-xs font-semibold leading-tight truncate",
                              isSatisfied ? "text-emerald-300 font-bold" : "text-foreground",
                            )}
                            title={formatStrategyName(vote.strategy_name)}
                          >
                            {formatStrategyName(vote.strategy_name)}
                          </p>
                          <p
                            className={cn(
                              "text-[10px] font-mono mt-0.5 truncate",
                              isSatisfied
                                ? "text-emerald-400 font-medium"
                                : isOpposing
                                ? "text-rose-400"
                                : "text-muted-foreground",
                            )}
                          >
                            {isSatisfied
                              ? formatReasonCode(vote.reason_code) || `Voted ${vote.direction}`
                              : isOpposing
                              ? `Voted ${vote.direction} (${vote.confidence_score}%)`
                              : isWait
                              ? "Scanning Ticks"
                              : "No Trigger"}
                          </p>
                        </div>
                      </div>

                      {/* Right: Satisfaction Pill */}
                      <div className="shrink-0">
                        {isSatisfied ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/25 text-emerald-400 border border-emerald-500/50">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                            Satisfied
                          </span>
                        ) : isOpposing ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
                            Opposing
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-surface-2 text-muted-foreground border border-border">
                            <Clock className="w-3 h-3 text-subtle shrink-0" />
                            Standby
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </section>

        {/* ── MARKET REGIME & TELEMETRY DIAGNOSTIC STRIP ── */}
        <div className="px-5 py-3 rounded-xl bg-card border border-border text-xs flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Market Regime:
              <strong className="text-foreground ml-1">
                {activeSignal.market_regime?.replace(/_/g, " ") || (isOtc ? "OTC Algorithmic Flow" : "Standard Volatility")}
              </strong>
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="font-mono text-muted-foreground hidden sm:inline">
              Consensus Rule: <strong className="text-primary">≥ 3 of 4 Agree</strong>
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
            <span>
              Opposition:{" "}
              <strong className={activeSignal.opposition_count === 0 ? "text-emerald-400" : "text-rose-400"}>
                {activeSignal.opposition_count} Opposing
              </strong>
            </span>
            <span>•</span>
            <span>
              Window: <strong className="text-primary">30s Precision</strong>
            </span>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            REAL-TIME SIGNALS FEED TABLE (GET /signals/recent)
        ══════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2/40">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Recent Qualified Signals Feed
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {hasLiveSignals ? `${signalsList.length} QUALIFIED SIGNALS` : "MONITORING ACTIVE"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => refetchSignals()}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 font-mono cursor-pointer transition-colors"
            >
              <RefreshCw className={cn("w-3 h-3", isSignalsFetching && "animate-spin text-primary")} />
              Sync Feed
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-mono uppercase text-[10px] tracking-wider bg-surface-2/20">
                  <th className="px-6 py-3.5">Asset</th>
                  <th className="px-3 py-3.5">Direction</th>
                  <th className="px-3 py-3.5">Confidence</th>
                  <th className="px-3 py-3.5">4-Strategy Consensus</th>
                  <th className="px-3 py-3.5">Entry Baseline</th>
                  <th className="px-3 py-3.5">Target Strike</th>
                  <th className="px-3 py-3.5">Broker Payout</th>
                  <th className="px-3 py-3.5">Strategies Satisfied</th>
                  <th className="px-3 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isSignalsFetching && !hasLiveSignals ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`signals-skeleton-${i}`}>
                      <td className="px-6 py-3.5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-28" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-16" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-12" /></td>
                      <td className="px-3 py-3.5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-3 py-3.5 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                    </tr>
                  ))
                ) : hasLiveSignals ? (
                  signalsList.map((sig, idx) => {
                    const sigKey = sig.id || `live-sig-${sig.asset || "pair"}-${sig.created_at || idx}`;
                    const isSigUp = sig.direction === "UP";
                    const isSigDown = sig.direction === "DOWN";
                    const isSelected = Boolean(selectedSignalId)
                      ? selectedSignalId === sig.id || selectedSignalId === sigKey
                      : Boolean(activeSignal?.id) &&
                        activeSignal.is_qualified &&
                        (activeSignal.direction === "UP" || activeSignal.direction === "DOWN") &&
                        activeSignal.id === sig.id;

                    return (
                      <tr
                        key={sigKey}
                        onClick={() => setSelectedSignalId(sig.id || sigKey)}
                        className={cn(
                          "transition-colors cursor-pointer",
                          isSelected ? "bg-primary/10 font-semibold" : "hover:bg-surface-2/40",
                        )}
                      >
                        <td className="px-6 py-3.5">
                          <CurrencyPairDisplay pair={sig.asset} size="sm" />
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-bold border",
                              isSigUp
                                ? "bg-up/10 text-up border-up/25"
                                : isSigDown
                                ? "bg-down/10 text-down border-down/25"
                                : "bg-surface-2 text-muted-foreground border-border",
                            )}
                          >
                            {isSigUp && <ArrowUpRight className="w-3 h-3" />}
                            {isSigDown && <ArrowDownRight className="w-3 h-3" />}
                            {sig.direction}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono">
                          <span
                            className={
                              sig.confidence_score >= 75
                                ? "text-emerald-400 font-bold"
                                : sig.confidence_score >= 60
                                  ? "text-teal-400 font-bold"
                                  : "text-foreground font-semibold"
                            }
                          >
                            {sig.confidence_score}
                          </span>
                          <span className="text-muted-foreground/60">/100</span>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-primary">
                          {sig.consensus_count || 2} Satisfied • {sig.opposition_count || 0} Opposing
                        </td>
                        <td className="px-3 py-3.5 font-mono text-muted-foreground">
                          {sig.entry_baseline ?? sig.spot_price ?? "—"}
                        </td>
                        <td className="px-3 py-3.5 font-mono text-muted-foreground">
                          {sig.target_strike ?? "—"}
                        </td>
                        <td className="px-3 py-3.5 font-mono text-up">
                          {sig.broker_payout ? `${sig.broker_payout}%` : "—"}
                        </td>
                        <td className="px-3 py-3.5">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              const breakdown = sig.strategy_breakdown;
                              const entries = breakdown && typeof breakdown === "object" ? Object.entries(breakdown) : [];
                              if (entries.length === 0) {
                                return (
                                  <span className="text-[10px] font-mono text-muted-foreground">
                                    {sig.consensus_count || 0}/4 · {sig.confidence_score}/100
                                  </span>
                                );
                              }
                              return entries.map(([name, val], idx: number) => {
                                const v = val as any;
                                const voteDir = (v && (v.direction || v.vote || v.signal)) || "WAIT";
                                const isUp = voteDir === "UP";
                                const isDown = voteDir === "DOWN";
                                const conf = (v && (v.confidence_score || v.confidence || v.score)) || 0;
                                const isSatisfied = voteDir === sig.direction && conf > 0;
                                return (
                                  <div
                                    key={name || idx}
                                    className={cn(
                                      "flex items-center gap-1 text-[10px] font-mono",
                                      isSatisfied
                                        ? isUp
                                          ? "text-up"
                                          : isDown
                                          ? "text-down"
                                          : "text-muted-foreground"
                                        : "text-muted-foreground/50",
                                    )}
                                  >
                                    {isSatisfied ? <CheckCircle2 className="w-3 h-3 shrink-0" /> : <XCircle className="w-3 h-3 shrink-0" />}
                                    <span className="truncate max-w-[120px]">{name}</span>
                                    <span className="text-muted-foreground/60 ml-auto">{conf}%</span>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-muted-foreground text-right">
                          {sig.created_at ? formatToUTC5(sig.created_at) : "—"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <Radio className="w-8 h-8 text-primary animate-pulse" />
                        <p className="text-sm font-semibold text-foreground">
                          Quotex Telemetry Active — Listening for Setups
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Browser extension is actively streaming chart ticks to the backend. Qualified signals with strategy consensus will appear here automatically.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
