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
  Volume2,
  VolumeX,
  Sparkles,
  Database,
  Radio,
  Gauge,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  PauseCircle,
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
import { LiveSignalsSlider } from "@/components/dashboard/live-signals-slider";
import { useRecentSignals } from "@/hook/useSignals";
import { useSignalsWebSocket } from "@/hook/useSignalsWebSocket";
import { useSession } from "@/hook/useSession";
import { useWatchlist } from "@/hook/useMarketData";
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
      reason_code: "SR_NO_SETUP",
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
    case "SR_REVERSAL":
      return "Support & Resistance Reversal";
    case "EMA_RSI_PULLBACK":
      return "EMA Trend + RSI Pullback";
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
    case "NONE":
      return "Standby / No Trigger";
    default:
      return code ? code.replace(/_/g, " ") : "Analyzed";
  }
}

export default function LiveSignalsPage() {
  const [soundEnabled, setSoundEnabled] = useState(true);
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

  // TanStack Query: High-speed 1-second polling (active even in background tabs)
  const {
    data: apiSignals,
    isFetching: isSignalsFetching,
    refetch: refetchSignals,
  } = useRecentSignals(
    { limit: 30 },
    {
      refetchInterval: 1000,
      staleTime: 0,
      refetchIntervalInBackground: true,
      refetchOnWindowFocus: true,
    },
  );

  // WebSocket: real-time signal feed from backend (signal/qualified, signal/wait, connected)
  const {
    activeSignal: wsActiveSignal,
    activeChartAsset: wsActiveChartAsset,
  } = useSignalsWebSocket();

  // Session from /auth/session — source of truth for auth state
  const { session: authSession, loading: sessionLoading } = useSession();

  // Watchlist pairs from GET /extension/watchlist/?session_id=<session_id>
  const watchlistSessionId = authSession?.session_id ?? null;
  const {
    data: restWatchlist,
    isLoading: watchlistLoading,
    refetch: refetchWatchlist,
  } = useWatchlist(watchlistSessionId as any, {
    refetchInterval: 1000,
    refetchOnWindowFocus: false,
    enabled: !!watchlistSessionId,
  });

  // Build watchlist asset set for filtering signalsList
  const watchlistAssetSet = useMemo(() => {
    if (!restWatchlist) return new Set<string>();

    let list: any[] = [];

    if (typeof restWatchlist === "string") {
      try {
        list = JSON.parse(restWatchlist);
      } catch {
        return new Set<string>();
      }
    } else if (Array.isArray(restWatchlist)) {
      list = restWatchlist;
    } else if (typeof restWatchlist === "object") {
      // Try direct array keys on the root object
      for (const key of [
        "watchlist",
        "data",
        "items",
        "signals",
        "pairs",
        "records",
        "list",
        "result",
        "response",
        "payload",
      ]) {
        if (Array.isArray(restWatchlist[key])) {
          list = restWatchlist[key];
          break;
        }
      }
      // Try deeply nested structures (e.g. { data: { watchlist: [...] } })
      if (!Array.isArray(list) && restWatchlist.data && typeof restWatchlist.data === "object") {
        for (const key of [
          "watchlist",
          "data",
          "items",
          "signals",
          "pairs",
          "records",
          "list",
        ]) {
          if (Array.isArray(restWatchlist.data[key])) {
            list = restWatchlist.data[key];
            break;
          }
        }
      }
    }

    const set = new Set<string>();
    for (const item of list) {
      if (item && item.asset) {
        set.add(
          item.asset
            .toUpperCase()
            .replace(/[\/\s\(\)\-_]/g, "")
            .replace(/OTC$/, ""),
        );
      }
    }
    return set;
  }, [restWatchlist]);

  // Instantly trigger sync on M1 candle boundaries (:00, :01) to catch newly qualified signal with 0ms latency
  const lastSecondRef = useRef<number>(-1);
  useEffect(() => {
    if (nowDate) {
      const sec = nowDate.getSeconds();
      if (sec !== lastSecondRef.current) {
        lastSecondRef.current = sec;
        if (sec === 0 || sec === 1) {
          refetchSignals();
          refetchWatchlist();
        }
      }
    }
  }, [nowDate, refetchSignals, refetchWatchlist]);

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

  const signalsList: SignalData[] = useMemo(() => {
    const list = extractSignalArray(apiSignals);
    // Sort by created_at descending (newest first) so signalsList[0] is always the latest backend signal.
    // This ensures a WAIT signal returned by the API is not shadowed by an older UP/DOWN signal.
    return list.sort((a, b) => {
      const ta = parseSignalTime(a.created_at);
      const tb = parseSignalTime(b.created_at);
      if (ta !== tb) return tb - ta;
      return 0;
    });
  }, [apiSignals, extractSignalArray, parseSignalTime]);

  const hasLiveSignals = signalsList.length > 0;

  // Active watchlist pairs from GET /extension/watchlist/?session_id=<session_id>
  // Combined Unique Active Pairs for the Live Signals Stream Slider
  // Only signals whose asset is in the active watchlist are displayed!
  const displaySignals: SignalData[] = useMemo(() => {
    const seenAssets = new Set<string>();
    const uniqueList: SignalData[] = [];

    const normalizeKey = (sym?: string) => {
      if (!sym) return "";
      return sym.toUpperCase().replace(/[\/\s\(\)\-_]/g, "").replace(/OTC$/, "");
    };

    // Map each signal from signalsList, deduplicating by currency pair
    // Only include signals that are in the active watchlist
    for (const sig of signalsList) {
      const normKey = normalizeKey(sig.asset);
      if (!normKey || seenAssets.has(normKey)) continue;

      // When watchlist data exists, only show signals for watchlisted assets
      if (watchlistAssetSet.size > 0 && !watchlistAssetSet.has(normKey)) continue;

      seenAssets.add(normKey);

      // Candle freshness check — stale signals (previous minute) show WAIT instead of old UP/DOWN
      let signalData = sig;
      if (nowDate && sig.created_at) {
        const sigTime = parseSignalTime(sig.created_at);
        if (sigTime) {
          const sigDate = new Date(sigTime);
          if (
            sigDate.getMinutes() !== nowDate.getMinutes() ||
            sigDate.getHours() !== nowDate.getHours()
          ) {
            signalData = {
              ...sig,
              direction: "WAIT",
              status_code: sig.status_code || "CANDLE_EXPIRED",
              is_qualified: false,
              confidence_score: sig.confidence_score ?? 0,
              consensus_count: sig.consensus_count ?? 0,
              votes: sig.votes || WAIT_SIGNAL.votes,
            } as SignalData;
          }
        }
      }

      uniqueList.push(signalData);
    }

    return uniqueList;
  }, [signalsList, watchlistAssetSet, nowDate]);

  // Auto-select the active chart asset from backend/extension when it changes
  const [wsAssetSelected, setWsAssetSelected] = useState<string | null>(null);
  useEffect(() => {
    if (!wsActiveChartAsset || wsAssetSelected === wsActiveChartAsset) return;
    const matching = displaySignals.find(
      (s) =>
        s.asset &&
        s.asset.toUpperCase().trim() ===
          wsActiveChartAsset.toUpperCase().trim(),
    );
    if (matching) {
      setTimeout(() => {
        setWsAssetSelected(wsActiveChartAsset);
        setSelectedSignalId(matching.id);
      }, 0);
    }
  }, [wsActiveChartAsset, displaySignals, wsAssetSelected]);

  // Determine if the newest backend signal belongs to the CURRENT 60-second candle
  const latestBackendSignal = signalsList.length > 0 ? signalsList[0] : null;

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

  // Check if a backend signal represents a WAIT/STANDBY state
  const isBackendSignalWait = useCallback((sig: SignalData | null): boolean => {
    if (!sig) return true;
    if (sig.direction === "WAIT" || (sig.direction as string) === "STANDBY")
      return true;
    if (sig.is_qualified === false) return true;
    if (
      sig.status_code &&
      (sig.status_code.toUpperCase().includes("WAIT") ||
        sig.status_code.toUpperCase().includes("STANDBY") ||
        sig.status_code.toUpperCase().includes("NO_SETUP"))
    ) {
      return true;
    }
    return false;
  }, []);

  // Dynamic Active Signal:
  // 1. User manual inspection (clicking a specific pair/historical signal) takes immediate priority.
  // 2. Real-time qualified signal from WebSocket or REST that belongs to the current 60s candle:
  //    MUST stay displayed for the ENTIRE 60 seconds (seconds 00-30: Open, seconds 30-59: Locked/Expiring).
  //    It should NEVER be prematurely cleared into WAIT at 30s while the trade is still running!
  // 3. If no active qualified signal exists for the current candle:
  //    Display dynamic WAIT/Standby state for the monitored pair.
  const activeSignal: SignalData = useMemo(() => {
    // ── 1. User's explicit inspection from slider or table ──
    // Only show the selected signal if it belongs to the current 60-second candle.
    // If it's stale (from a previous minute), show WAIT for THAT selected pair —
    // not the standby pair's data.
    if (selectedSignalId) {
      const found = displaySignals.find((s) => s.id === selectedSignalId);
      if (found) {
        if (!nowDate || !found.created_at) {
          // No timestamp — show this pair in WAIT standby state
          return {
            ...WAIT_SIGNAL,
            id: found.id,
            asset: found.asset,
            broker_payout: found.broker_payout,
            status_code: "WAITING_FOR_SETUP",
            is_qualified: false,
            confidence_score: 0,
            consensus_count: 0,
            votes: WAIT_SIGNAL.votes,
          };
        }
        const sigTime = parseSignalTime(found.created_at);
        if (sigTime) {
          const sigDate = new Date(sigTime);
          // Signal belongs to current candle → show it
          if (
            sigDate.getMinutes() === nowDate.getMinutes() &&
            sigDate.getHours() === nowDate.getHours()
          ) {
            return found;
          }
        }
        // Signal is stale → show WAIT for this selected pair's asset
        return {
          ...WAIT_SIGNAL,
          id: found.id,
          asset: found.asset,
          broker_payout: found.broker_payout,
          status_code: "CANDLE_EXPIRED",
          is_qualified: false,
          confidence_score: 0,
          consensus_count: 0,
          votes: WAIT_SIGNAL.votes,
        };
      }
      // Selected signal not found → fall through to WAIT state below
    }

    // ── 2. Candle expiry check ──
    // If we've crossed into a new 60-second candle, any signal from the previous
    // minute is stale. Show WAIT immediately — no waiting for WebSocket signal/wait
    // or REST polling delay.
    if (nowDate && latestBackendSignal && latestBackendSignal.created_at) {
      const signalTime = parseSignalTime(latestBackendSignal.created_at);
      if (signalTime) {
        const signalDate = new Date(signalTime);
        if (
          signalDate.getMinutes() !== nowDate.getMinutes() ||
          signalDate.getHours() !== nowDate.getHours()
        ) {
          return {
            ...latestBackendSignal,
            direction: "WAIT",
            status_code: latestBackendSignal.status_code || "CANDLE_EXPIRED",
            is_qualified: false,
            confidence_score: latestBackendSignal.confidence_score ?? 0,
            consensus_count: latestBackendSignal.consensus_count ?? 0,
            votes: latestBackendSignal.votes || WAIT_SIGNAL.votes,
          };
        }
      }
    }

    // ── 3. Check for active qualified signal in the current candle from WebSocket ──
    if (
      wsActiveSignal &&
      wsActiveSignal.is_qualified &&
      (wsActiveSignal.direction === "UP" || wsActiveSignal.direction === "DOWN")
    ) {
      // If backend REST reports WAIT, the WebSocket UP/DOWN is stale — show WAIT instead
      if (latestBackendSignal && isBackendSignalWait(latestBackendSignal)) {
        return {
          ...latestBackendSignal,
          direction: "WAIT",
          status_code: latestBackendSignal.status_code || "WAITING_FOR_SETUP",
          is_qualified: false,
          confidence_score: latestBackendSignal.confidence_score ?? 0,
          consensus_count: latestBackendSignal.consensus_count ?? 0,
          votes: latestBackendSignal.votes || WAIT_SIGNAL.votes,
        };
      }
      return wsActiveSignal;
    }

    // ── 4. Check for active qualified signal in the current candle from REST polling ──
    if (
      latestBackendSignal &&
      !isBackendSignalWait(latestBackendSignal) &&
      isSignalStillActiveCandle(latestBackendSignal)
    ) {
      return latestBackendSignal;
    }

    // ── 5. If WebSocket explicitly sent a WAIT signal with live telemetry, use its asset info ──
    if (
      wsActiveSignal &&
      (wsActiveSignal.direction === "WAIT" ||
        (wsActiveSignal.direction as string) === "STANDBY" ||
        wsActiveSignal.is_qualified === false)
    ) {
      return {
        ...wsActiveSignal,
        direction: "WAIT",
        status_code: wsActiveSignal.status_code || "WAITING_FOR_SETUP",
        is_qualified: false,
        confidence_score: wsActiveSignal.confidence_score ?? 0,
        consensus_count: wsActiveSignal.consensus_count ?? 0,
        votes: wsActiveSignal.votes || WAIT_SIGNAL.votes,
        asset:
          wsActiveSignal.active_chart_asset ||
          wsActiveSignal.asset ||
          displaySignals[0]?.asset ||
          "EURUSD_OTC",
      };
    }

    // ── 6. REST API latest signal is WAIT/standby ──
    if (latestBackendSignal && isBackendSignalWait(latestBackendSignal)) {
      return {
        ...latestBackendSignal,
        direction: "WAIT",
        status_code: latestBackendSignal.status_code || "WAITING_FOR_SETUP",
        is_qualified: false,
        confidence_score: latestBackendSignal.confidence_score ?? 0,
        consensus_count: latestBackendSignal.consensus_count ?? 0,
        votes: latestBackendSignal.votes || WAIT_SIGNAL.votes,
      };
    }

    // ── 7. Default dynamic WAITING STATE for the monitored pair ──
    const monitoredAsset =
      wsActiveChartAsset ||
      displaySignals[0]?.asset ||
      "EURUSD_OTC";
    const monitoredPayout =
      displaySignals.find((s) => s.asset === monitoredAsset)?.broker_payout ||
      displaySignals[0]?.broker_payout ||
      undefined;

    return {
      ...WAIT_SIGNAL,
      id: "live-standby-wait",
      asset: monitoredAsset,
      broker_payout: monitoredPayout,
      created_at: nowDate ? nowDate.toISOString() : undefined,
    };
  }, [
    selectedSignalId,
    displaySignals,
    wsActiveChartAsset,
    latestBackendSignal,
    isBackendSignalWait,
    isSignalStillActiveCandle,
    nowDate,
    wsActiveSignal,
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

  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    soundEffects.isMuted = !nextState;
    if (nextState) {
      soundEffects.playUpSignal();
    }
  };

  return (
    <AppShell
      title="Live Signals"
      description="Real-time 60-second fixed expiry signal engine powered by 3 independent strategies."
    >
      <div className="space-y-6 relative w-full max-w-full min-w-0">
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

        {/* ── TOP TELEMETRY STATUS BAR ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-foreground">
                  {hasLiveSignals
                    ? `LIVE BEACON SIGNALS FEED CONNECTED (${signalsList.length} QUALIFIED)`
                    : "QUOTEX TELEMETRY INGESTION STREAM ACTIVE"}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-2 py-0.5 rounded-full border shrink-0",
                    activeSignal?.direction === "UP"
                      ? "bg-up/10 text-up border-up/20"
                      : activeSignal?.direction === "DOWN"
                      ? "bg-down/10 text-down border-down/20"
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                  )}
                >
                  {activeSignal ? `${activeSignal.asset} ${activeSignal.direction}` : "HTTP 202 ACCEPTED"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasLiveSignals
                  ? `Active Asset: ${assetStr} · Confidence: ${activeSignal.confidence_score}/100 · ${activeSignal.consensus_count} of 3 Strategies Satisfied`
                  : "Forwarding real-time Quotex ticks. Waiting for strategy confidence > 75."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 transition-all cursor-pointer",
                soundEnabled
                  ? "bg-up/15 text-up border-up/30 shadow-[0_0_12px_rgba(0,200,150,0.15)]"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground",
              )}
              title={
                soundEnabled ? "Audio alert is ON" : "Audio alert is MUTED"
              }
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-up" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span>Sound: {soundEnabled ? "ON" : "MUTED"}</span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={() => refetchSignals()}
              className="p-2 rounded-lg bg-secondary border border-border hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
              title="Force sync latest signals"
            >
              <RefreshCw
                className={cn(
                  "w-3.5 h-3.5 text-primary",
                  isSignalsFetching && "animate-spin",
                )}
              />
            </button>
          </div>
        </div>

        {/* ── LIVE SIGNALS STREAM SLIDER (Shadcn Slider Component) ── */}
        <LiveSignalsSlider
          signals={displaySignals}
          activeSignalId={activeSignal.id}
          onSelectSignal={(id) =>
            setSelectedSignalId((prev) => (prev === id || !id ? null : id))
          }
          isFetching={isSignalsFetching || sessionLoading || watchlistLoading}
        />

        {/* ══════════════════════════════════════════════════════════════
            HERO SIGNAL COMMAND CENTER (WITH INTEGRATED TELEMETRY)
        ══════════════════════════════════════════════════════════════ */}
        <section
          className={cn(
            "relative rounded-2xl border p-6 sm:p-8 lg:p-10 transition-all duration-300 overflow-hidden",
            isUp &&
              "bg-gradient-to-br from-up/15 via-card to-background border-up/40 shadow-[0_0_50px_rgba(0,200,150,0.12)]",
            isDown &&
              "bg-gradient-to-br from-down/15 via-card to-background border-down/40 shadow-[0_0_50px_rgba(240,77,92,0.12)]",
            isWait &&
              "bg-gradient-to-br from-secondary/50 via-card to-background border-border shadow-[0_0_30px_rgba(122,139,160,0.06)]",
          )}
        >
          {/* Top Ambient Light Strip */}
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-1.5",
              isUp && "bg-up",
              isDown && "bg-down",
              isWait && "bg-muted-foreground/40",
            )}
          />

          {/* Historical Inspection Notice (Shown when user manually clicks a previous signal) */}
          {selectedSignalId && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-primary/10 border border-primary/25 text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono text-foreground">
                  Inspecting Historical Signal:{" "}
                  <strong>{activeSignal.asset}</strong> (
                  {activeSignal.direction})
                </span>
                <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                  •{" "}
                  {activeSignal.created_at
                    ? `${formatToUTC5(activeSignal.created_at)} (UTC+5)`
                    : ""}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSignalId(null)}
                className="px-2.5 py-1 rounded-md bg-secondary hover:bg-secondary/80 text-foreground font-mono text-xs border border-border cursor-pointer transition-all"
              >
                ✕ Return to Live Wait State
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* ── LEFT: GIGANTIC SIGNAL DIRECTION, TELEMETRY & HERO TEXT (7 COLS) ── */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border shadow-sm">
                  <DualFlagIcon base={base} quote={quote} size="sm" />
                  <span className="font-mono font-bold text-xs text-foreground">
                    {base}/{quote}
                  </span>
                  <span
                    className={cn(
                      "text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase",
                      isOtc
                        ? "bg-purple-900/30 text-purple-300 border border-purple-500/30"
                        : "bg-blue-900/30 text-blue-300 border border-blue-500/30",
                    )}
                  >
                    {marketType}
                  </span>
                </div>

                <span
                  className={cn(
                    "text-xs font-mono font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider border shrink-0",
                    isUp && "bg-up/10 text-up border-up/30",
                    isDown && "bg-down/10 text-down border-down/30",
                    isWait &&
                      "bg-secondary text-muted-foreground border-border",
                  )}
                >
                  {isWait
                    ? "STANDBY STATE"
                    : !isWindowOpen
                      ? "IN-TRADE EXPIRY PHASE"
                      : activeSignal.status_code?.replace(/_/g, " ") ||
                        "QUALIFIED SIGNAL"}
                </span>

                <span className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg">
                  60-Second Fixed Expiry
                </span>

                {isWait ? (
                  <span className="text-xs font-mono font-bold text-muted-foreground bg-secondary border border-border px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    Status: Standby (Wait)
                  </span>
                ) : isWindowOpen ? (
                  <span className="text-xs font-mono font-bold text-up bg-up/10 border border-up/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                    <Unlock className="w-3.5 h-3.5" />
                    Window: OPEN (30s)
                  </span>
                ) : (
                  <span className="text-xs font-mono font-bold text-warning bg-warning/15 border border-warning/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    Window: LOCKED (Rest 30s)
                  </span>
                )}
              </div>

              {/* Huge Direction Icon Box */}
              <div className="flex items-center gap-6">
                <div
                  className={cn(
                    "w-24 h-24 sm:w-28 sm:h-28 rounded-3xl flex items-center justify-center border shrink-0 transition-transform duration-200 shadow-lg",
                    isUp &&
                      "bg-up/20 border-up/60 text-up shadow-[0_0_40px_rgba(0,200,150,0.3)]",
                    isDown &&
                      "bg-down/20 border-down/60 text-down shadow-[0_0_40px_rgba(239,68,68,0.3)]",
                    isWait &&
                      "bg-surface-3 border-border text-muted-foreground shadow-xs",
                  )}
                >
                  {isUp && (
                    <ArrowUpRight className="w-10 h-10 sm:w-12 sm:h-12" />
                  )}
                  {isDown && (
                    <ArrowDownRight className="w-10 h-10 sm:w-12 sm:h-12" />
                  )}
                  {isWait && (
                    <PauseCircle className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                  )}
                </div>

                <div>
                  <div className="flex items-baseline gap-3">
                    <h2
                      className={cn(
                        "text-5xl sm:text-7xl font-black font-mono tracking-tight leading-none",
                        isUp && "text-up",
                        isDown && "text-down",
                        isWait && "text-muted-foreground",
                      )}
                    >
                      {activeSignal.direction}
                    </h2>
                    <span className="text-lg sm:text-xl font-mono text-muted-foreground font-semibold">
                      {isWait ? "STATE" : "DIRECTION"}
                    </span>
                  </div>

                  <p
                    className={cn(
                      "text-sm sm:text-base font-bold font-mono tracking-wider mt-2",
                      isUp && "text-up",
                      isDown && "text-down",
                      isWait && "text-muted-foreground",
                    )}
                  >
                    ACTION:{" "}
                    {isWait
                      ? "WAIT / NO TRADE"
                      : isWindowOpen
                        ? isUp
                          ? "CALL / HIGHER (BUY)"
                          : "PUT / LOWER (SELL)"
                        : isUp
                          ? "CALL IN PROGRESS (Awaiting :00 Expiry)"
                          : "PUT IN PROGRESS (Awaiting :00 Expiry)"}
                  </p>
                </div>
              </div>

              {/* Rationale & Regime Statement */}
              <div className="p-4 sm:p-5 rounded-xl bg-card border border-border shadow-sm text-xs sm:text-sm text-foreground leading-relaxed space-y-2">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <span className="text-primary font-semibold uppercase font-mono text-xs flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    Market Regime:{" "}
                    {isWait
                      ? "SCANNING OTC PAIRS"
                      : activeSignal.market_regime?.replace(/_/g, " ") ||
                        "Bullish Trend"}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {isWait
                      ? "0 of 3 Strategies Satisfied"
                      : `${activeSignal.consensus_count} of 3 Strategies Satisfied`}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isWait
                    ? "The 3-strategy decision engine is actively evaluating real-time Quotex ticks. Waiting for multi-strategy consensus (requires ≥ 2 of 3 strategies to trigger with confidence ≥ 70). No trade should be entered in standby state."
                    : `Qualified setup detected on ${base}/${quote}. Strategy consensus reached with ${activeSignal.consensus_count} supporting strategy votes and ${activeSignal.opposition_count} opposing votes.`}
                </p>
              </div>

              {/* ── KEY TRADE TELEMETRY (BROKER PAYOUT, ENTRY BASELINE, TARGET STRIKE) ── */}
              <div className="grid grid-cols-3 gap-3 pt-1">
                <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border shadow-sm">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-semibold">
                    Broker Payout
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span
                      className={cn(
                        "text-xl sm:text-2xl font-black font-mono",
                        isWait ? "text-muted-foreground" : "text-up",
                      )}
                    >
                      {activeSignal.broker_payout
                        ? `${activeSignal.broker_payout}%`
                        : isWait
                          ? "—"
                          : "85%"}
                    </span>
                    {!isWait && activeSignal.broker_payout && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-up/10 text-up border border-up/20 uppercase font-bold">
                        Profit
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">
                    {isWait ? "Standby" : "Active Broker Margin"}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border shadow-sm">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-semibold">
                    Entry Baseline
                  </span>
                  <span
                    className={cn(
                      "text-xl sm:text-2xl font-black font-mono mt-1 block truncate",
                      isWait ? "text-muted-foreground" : "text-primary",
                    )}
                  >
                    {activeSignal.entry_baseline ??
                      activeSignal.spot_price ??
                      (isWait ? "—" : "0.00000")}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">
                    {isWait ? "Pending Setup" : "Execution Reference"}
                  </span>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-card border border-border shadow-sm">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase block tracking-wider font-semibold">
                    Target Strike
                  </span>
                  <span
                    className={cn(
                      "text-xl sm:text-2xl font-black font-mono mt-1 block truncate",
                      isUp
                        ? "text-up"
                        : isDown
                          ? "text-down"
                          : "text-muted-foreground",
                    )}
                  >
                    {activeSignal.target_strike ?? (isWait ? "—" : "0.00000")}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground mt-0.5 block">
                    {isWait
                      ? "Pending Analysis"
                      : isUp
                        ? "Higher Strike (> Entry)"
                        : "Lower Strike (< Entry)"}
                  </span>
                </div>
              </div>
            </div>

            {/* ── RIGHT: TIMER & 3-STRATEGY CONSENSUS METRICS (5 COLS) ── */}
            <div className="lg:col-span-5 space-y-4">
              <div
                className={cn(
                  "p-5 rounded-xl border transition-all duration-300 space-y-3.5 shadow-sm",
                  isWait
                    ? "bg-card border-border"
                    : isWindowOpen
                      ? "bg-primary/5 border-primary/20"
                      : "bg-warning/10 border-warning/40 shadow-[0_0_30px_rgba(245,166,35,0.12)]",
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-mono uppercase tracking-wider flex items-center gap-1.5 font-bold",
                      isWait
                        ? "text-muted-foreground"
                        : isWindowOpen
                          ? "text-muted-foreground"
                          : "text-warning",
                    )}
                  >
                    <Clock
                      className={cn(
                        "w-4 h-4",
                        isWait
                          ? "text-muted-foreground"
                          : isWindowOpen
                            ? "text-primary"
                            : "text-warning",
                      )}
                    />
                    {isWait
                      ? `Cadence: M1 Candle Pulse • UTC+5: ${utc5TimeDisplay}`
                      : isWindowOpen
                        ? `Trading Window: Open (60s → 31s) • UTC+5: ${utc5TimeDisplay}`
                        : `Trading Window: Closed (30s → 00s) • UTC+5: ${utc5TimeDisplay}`}
                  </span>

                  <span
                    className={cn(
                      "text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border",
                      isWait
                        ? "bg-secondary text-muted-foreground border-border"
                        : isWindowOpen
                          ? "bg-up/15 text-up border-up/30"
                          : "bg-warning/20 text-warning border-warning/40 animate-pulse",
                    )}
                  >
                    {isWait
                      ? "STANDBY"
                      : isWindowOpen
                        ? "ENTER NOW"
                        : "LOCKED / WAIT"}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span
                      className={cn(
                        "text-5xl sm:text-6xl font-black font-mono transition-colors",
                        isWait
                          ? "text-foreground"
                          : isWindowOpen
                            ? "text-foreground"
                            : "text-warning",
                      )}
                    >
                      {String(secondsRemaining).padStart(2, "0")}s
                    </span>
                    <span
                      className={cn(
                        "text-xs ml-2 font-mono font-semibold block sm:inline mt-1 sm:mt-0",
                        isWait
                          ? "text-muted-foreground"
                          : isWindowOpen
                            ? "text-up"
                            : "text-warning",
                      )}
                    >
                      {isWait
                        ? `• 60s Candle Sync (${secondsRemaining > 30 ? "Entry Phase" : "Lockout Phase"})`
                        : isWindowOpen
                          ? "• Window Open (60s → 31s)"
                          : "• Window Locked (30s → 00s)"}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "text-xs font-mono font-bold px-2.5 py-1 rounded border",
                      isWait
                        ? "bg-secondary text-muted-foreground border-border"
                        : isWindowOpen
                          ? "bg-up/10 text-up border-up/30"
                          : "bg-warning/20 text-warning border-warning/40 animate-pulse",
                    )}
                  >
                    {isWait
                      ? "Phase: Monitoring"
                      : isWindowOpen
                        ? "Window: Open"
                        : "Phase: Yellow Lock"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex border border-border">
                    <div className="w-1/2 h-full relative border-r border-background">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          isWait
                            ? "bg-muted-foreground/30"
                            : isWindowOpen
                              ? isUp
                                ? "bg-up"
                                : isDown
                                  ? "bg-down"
                                  : "bg-muted-foreground"
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
                    <div className="w-1/2 h-full relative">
                      <div
                        className={cn(
                          "h-full transition-all duration-1000",
                          isWait
                            ? "bg-muted-foreground/20"
                            : "bg-warning shadow-[0_0_12px_rgba(245,166,35,0.4)]",
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
                  <div className="flex justify-between text-[10px] font-mono">
                    <span
                      className={cn(
                        isWait
                          ? "text-muted-foreground font-medium"
                          : isWindowOpen
                            ? "text-up font-bold"
                            : "text-muted-foreground",
                      )}
                    >
                      [60s → 31s] Entry Window
                    </span>
                    <span
                      className={cn(
                        isWait
                          ? "text-muted-foreground font-medium"
                          : !isWindowOpen
                            ? "text-warning font-bold"
                            : "text-muted-foreground",
                      )}
                    >
                      [30s → 00s] Lockout / Expiry
                    </span>
                  </div>
                </div>

                {/* Window State Banner */}
                {isWait ? (
                  <div className="p-2.5 rounded-lg bg-secondary border border-border flex items-center gap-2 text-xs text-muted-foreground">
                    <Radio className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
                    <span>
                      Quotex Telemetry Active — Ingesting ticks & awaiting
                      qualified setup.
                    </span>
                  </div>
                ) : isWindowOpen ? (
                  <div className="p-2.5 rounded-lg bg-up/10 border border-up/20 flex items-center gap-2 text-xs text-up">
                    <Unlock className="w-4 h-4 shrink-0" />
                    <span>
                      Trading window is open. Execute trade now during first 30
                      seconds.
                    </span>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-warning/15 border border-warning/40 flex items-center gap-2 text-xs text-warning">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-warning" />
                    <span className="font-semibold">
                      Window closed (30s to 00s). In-trade expiry phase. Do not
                      enter new trades.
                    </span>
                  </div>
                )}
              </div>

              {/* Confidence Score & Consensus Metric Cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Confidence Score
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span
                      className={cn(
                        "text-3xl font-extrabold font-mono",
                        activeSignal.confidence_score >= 75
                          ? "text-up"
                          : "text-muted-foreground",
                      )}
                    >
                      {activeSignal.confidence_score}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      / 100
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    {activeSignal.confidence_score >= 75
                      ? "Passed (≥ 75 Required)"
                      : "Sub-75 Standby"}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    3-Strategy Consensus
                  </p>
                  <p className="text-3xl font-extrabold font-mono text-primary mt-1">
                    {activeSignal.consensus_count} of 3
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    Threshold: ≥ 2 of 3 Agree
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            3. THE 3 INDEPENDENT STRATEGIES ANALYSIS MATRIX
               WITH COMPETENCE METRE & SATISFACTION STATUS
        ══════════════════════════════════════════════════════════════ */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                The 3 Beacon Strategies Matrix ({
                  activeSignal.consensus_count
                }{" "}
                of 3 Satisfied)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time strategy satisfaction status and competence meters
                evaluated by the decision engine.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded bg-card border border-border text-muted-foreground">
                Consensus Target:{" "}
                <strong className="text-primary">≥ 2 of 3</strong>
              </span>
              <span className="px-2.5 py-1 rounded bg-card border border-border text-muted-foreground">
                Opposition:{" "}
                <strong className="text-emerald-400">
                  {activeSignal.opposition_count} Opposing
                </strong>
              </span>
            </div>
          </div>

          {/* 3 Strategy Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {votesList.map((vote, idx) => {
              const voteDir = vote.direction || "WAIT";
              const isVoteUp = voteDir === "UP";
              const isVoteDown = voteDir === "DOWN";
              const isVoteWait = voteDir === "WAIT";

              // Check if this strategy satisfied the overall signal
              const isSatisfied =
                voteDir === activeSignal.direction && vote.confidence_score > 0;
              const isOpposing =
                !isVoteWait && voteDir !== activeSignal.direction;
              const isNeutral = !isSatisfied && !isOpposing;

              return (
                <div
                  key={vote.strategy_name || idx}
                  className={cn(
                    "p-5 rounded-xl border bg-card transition-all flex flex-col justify-between space-y-4 shadow-sm relative overflow-hidden",
                    isSatisfied &&
                      "border-up/50 bg-gradient-to-b from-up/10 to-card shadow-[0_0_20px_rgba(0,200,150,0.08)]",
                    isOpposing &&
                      "border-down/50 bg-gradient-to-b from-down/10 to-card shadow-[0_0_20px_rgba(239,68,68,0.08)]",
                    isNeutral && "border-border",
                  )}
                >
                  {/* Top Satisfaction Badge Strip */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                      <span className="w-4 h-4 rounded bg-secondary text-primary flex items-center justify-center font-bold border border-border">
                        0{idx + 1}
                      </span>
                      STRATEGY
                    </span>

                    {/* SATISFACTION STATUS BADGE */}
                    {isSatisfied && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-up/15 text-up border border-up/30">
                        <CheckCircle2 className="w-3 h-3 text-up" />
                        SATISFIED (Voted {voteDir})
                      </span>
                    )}
                    {isOpposing && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-down/15 text-down border border-down/30">
                        <XCircle className="w-3 h-3 text-down" />
                        OPPOSING ({voteDir})
                      </span>
                    )}
                    {isNeutral && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-secondary text-muted-foreground border border-border">
                        <Clock className="w-3 h-3 text-subtle" />
                        NO SETUP ({voteDir})
                      </span>
                    )}
                  </div>

                  {/* Strategy Title & Direction */}
                  <div>
                    <h4 className="text-sm font-bold text-foreground">
                      {formatStrategyName(vote.strategy_name)}
                    </h4>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold border",
                          isVoteUp && "bg-up/10 text-up border-up/25",
                          isVoteDown && "bg-down/10 text-down border-down/25",
                          isVoteWait &&
                            "bg-secondary text-muted-foreground border-border",
                        )}
                      >
                        {isVoteUp && <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isVoteDown && (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                        {isVoteWait && <Clock className="w-3.5 h-3.5" />}
                        Vote: {voteDir}
                      </span>

                      <span className="text-[11px] font-mono text-muted-foreground">
                        {vote.eligible ? "Active Engine" : "Disabled"}
                      </span>
                    </div>

                    {/* Technical Reason Code */}
                    <div className="mt-3 p-2.5 rounded-lg bg-secondary/60 border border-border/80">
                      <span className="text-[10px] font-mono text-subtle uppercase block mb-0.5">
                        TRIGGER REASON:
                      </span>
                      <p className="text-xs font-mono text-foreground font-medium">
                        {formatReasonCode(vote.reason_code)}
                      </p>
                      <span className="text-[9px] font-mono text-subtle block mt-0.5">
                        Code: {vote.reason_code || "NONE"}
                      </span>
                    </div>
                  </div>

                  {/* ── COMPETENCE METRE (CONFIDENCE SCORE) ── */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-primary" />
                        Competence Metre
                      </span>
                      <span
                        className={cn(
                          "font-bold text-sm",
                          isSatisfied
                            ? "text-up font-mono"
                            : isOpposing
                              ? "text-down font-mono"
                              : "text-muted-foreground font-mono",
                        )}
                      >
                        {vote.confidence_score} / 100
                      </span>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden border border-border/80 p-0.5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-700",
                          isSatisfied &&
                            "bg-gradient-to-r from-emerald-500 to-up shadow-[0_0_12px_rgba(0,200,150,0.5)]",
                          isOpposing &&
                            "bg-gradient-to-r from-rose-500 to-down shadow-[0_0_12px_rgba(240,77,92,0.5)]",
                          isNeutral && "bg-muted-foreground/30",
                        )}
                        style={{
                          width: `${Math.max(vote.confidence_score, 0)}%`,
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-subtle pt-0.5">
                      <span>Threshold: ≥ 70</span>
                      <span>
                        {vote.confidence_score >= 70
                          ? "✓ High Conviction"
                          : vote.confidence_score > 0
                            ? "Moderate"
                            : "Neutral (0%)"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            4. REAL-TIME SIGNALS FEED TABLE (GET /signals/recent)
        ══════════════════════════════════════════════════════════════ */}
        <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">
                Recent Qualified Signals Feed (GET /signals/recent)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {hasLiveSignals
                  ? `${signalsList.length} QUALIFIED SIGNALS`
                  : "MONITORING ACTIVE"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => refetchSignals()}
              className="text-xs text-primary hover:underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw
                className={cn("w-3 h-3", isSignalsFetching && "animate-spin")}
              />
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-subtle font-mono uppercase text-[10px] tracking-wider bg-secondary/20">
                  <th className="px-6 py-3.5">Asset</th>
                  <th className="px-3 py-3.5">Direction</th>
                  <th className="px-3 py-3.5">Confidence</th>
                  <th className="px-3 py-3.5">3-Strategy Consensus</th>
                  <th className="px-3 py-3.5">Entry Baseline</th>
                  <th className="px-3 py-3.5">Target Strike</th>
                  <th className="px-3 py-3.5">Broker Payout</th>
                  <th className="px-3 py-3.5">Market Regime</th>
                  <th className="px-3 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Result</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isSignalsFetching && !hasLiveSignals ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`signals-skeleton-${i}`}>
                      <td className="px-6 py-3.5">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-3 py-3.5">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Skeleton className="h-6 w-14 ml-auto rounded" />
                      </td>
                    </tr>
                  ))
                ) : hasLiveSignals ? (
                  signalsList.map((sig) => {
                    const isSigUp = sig.direction === "UP";
                    const isSigDown = sig.direction === "DOWN";
                    const isSelected = activeSignal.id === sig.id;

                    return (
                      <tr
                        key={sig.id}
                        onClick={() => setSelectedSignalId(sig.id)}
                        className={cn(
                          "transition-colors cursor-pointer",
                          isSelected
                            ? "bg-primary/8 font-semibold"
                            : "hover:bg-secondary/40",
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
                                  : "bg-secondary text-muted-foreground border-border",
                            )}
                          >
                            {isSigUp && <ArrowUpRight className="w-3 h-3" />}
                            {isSigDown && (
                              <ArrowDownRight className="w-3 h-3" />
                            )}
                            {sig.direction}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 font-mono">
                          <span
                            className={
                              sig.confidence_score >= 75
                                ? "text-emerald-400 font-bold"
                                : "text-foreground"
                            }
                          >
                            {sig.confidence_score}
                          </span>
                          <span className="text-subtle">/100</span>
                        </td>
                        <td className="px-3 py-3.5 font-mono text-primary">
                          {sig.consensus_count || 2} Satisfied •{" "}
                          {sig.opposition_count || 0} Opposing
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
                        <td className="px-3 py-3.5 font-mono text-muted-foreground text-[11px]">
                          {sig.market_regime?.replace(/_/g, " ") ||
                            "BULLISH TREND"}
                        </td>
                        <td className="px-3 py-3.5 font-mono text-subtle">
                          {sig.created_at ? formatToUTC5(sig.created_at) : "—"}
                        </td>
                        {/* Result Column */}
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border shrink-0",
                              (() => {
                                const s = sig as any;
                                const outcome =
                                  s.outcome ??
                                  s.result ??
                                  (s.is_win !== undefined
                                    ? s.is_win
                                      ? "Win"
                                      : "Loss"
                                    : undefined);
                                if (
                                  outcome === "Win" ||
                                  outcome === "win" ||
                                  outcome === "WON"
                                )
                                  return "bg-up/10 text-up border-up/20";
                                if (
                                  outcome === "Loss" ||
                                  outcome === "loss" ||
                                  outcome === "LOST"
                                )
                                  return "bg-down/10 text-down border-down/20";
                                return "bg-secondary text-muted-foreground border-border";
                              })()
                            )}
                          >
                            {(() => {
                              const s = sig as any;
                              const outcome =
                                s.outcome ??
                                s.result ??
                                (s.is_win !== undefined
                                  ? s.is_win
                                    ? "Win"
                                    : "Loss"
                                  : undefined);
                              return (
                                outcome === "Win" ||
                                outcome === "win" ||
                                outcome === "WON"
                                  ? "Win"
                                : outcome === "Loss" ||
                                  outcome === "loss" ||
                                  outcome === "LOST"
                                  ? "Loss"
                                  : "Pending"
                              );
                            })()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSignalId(sig.id);
                            }}
                            className={cn(
                              "px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all cursor-pointer",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                                : "bg-secondary text-muted-foreground border-border hover:text-foreground",
                            )}
                          >
                            {isSelected ? "Active" : "Inspect"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={11} className="px-6 py-8 text-center">
                      <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                        <Radio className="w-8 h-8 text-emerald-400 animate-pulse" />
                        <p className="text-sm font-semibold text-foreground">
                          Quotex Telemetry Active — Listening for Setups
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Browser extension is actively streaming chart ticks to
                          the backend. Signals with confidence score &gt; 75
                          will appear here automatically.
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
