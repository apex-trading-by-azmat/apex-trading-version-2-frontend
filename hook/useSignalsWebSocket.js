import { useEffect, useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * WebSocket Signals Hook
 * Connects to the Apex FastAPI signals WebSocket feed and handles:
 *   - connected        -> stores session_id, updates connection status
 *   - signal/qualified -> updates active signal (UP/DOWN) & queries cache
 *   - signal/wait      -> updates active signal (WAIT/standby) & queries cache
 *   - chart/active_asset -> updates active chart pair & active pair state
 *   - watchlist/updated  -> syncs pinned tabs / watchlist from extension & queries cache
 *   - order/settled    -> syncs trade settlement and attribution
 *
 * Exposes the latest signal, session_id, active chart asset, watchlist, and connection status.
 *
 * @returns {{
 *   sessionId: string | null,
 *   activeSignal: any | null,
 *   activeChartAsset: string | null,
 *   activeChartPayout: number | null,
 *   watchlist: any[],
 *   watchlistAsset: string | null,
 *   totalWatchlistAssets: number,
 *   isConnected: boolean,
 *   lastEvent: string | null,
 *   connect: Function
 * }}
 */
const normalizeKey = (sym) =>
  sym ? String(sym).toUpperCase().replace(/[\/\s\(\)\-_]/g, "").replace(/OTC$/, "") : "";

const parseUtcEpoch = (val) => {
  if (!val) return null;
  if (typeof val === "number") {
    return val < 1e11 ? val * 1000 : val;
  }
  if (typeof val === "string") {
    let s = val.trim();
    if (!s) return null;
    if (/^\d+(\.\d+)?$/.test(s)) {
      const num = parseFloat(s);
      return num < 1e11 ? num * 1000 : num;
    }
    // If ISO string lacks timezone indicator (Z or +/-HH:MM), treat as UTC
    if (!s.endsWith("Z") && !/[+-]\d{2}(:\d{2})?$/.test(s)) {
      s += "Z";
    }
    const t = new Date(s).getTime();
    return isNaN(t) ? null : t;
  }
  return null;
};

export function useSignalsWebSocket() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState(null);
  const [activeSignal, setActiveSignal] = useState(null);
  const [activeChartAsset, setActiveChartAsset] = useState(null);
  const [activeChartPayout, setActiveChartPayout] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistAsset, setWatchlistAsset] = useState(null);
  const [totalWatchlistAssets, setTotalWatchlistAssets] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const connectRef = useRef(null);

  const updateConnectionStatus = useCallback((status) => {
    setIsConnected(status);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("apex_ws_status_change", {
          detail: { isConnected: status },
        })
      );
    }
  }, []);

  const getToken = useCallback(() => {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("apex_token") ||
      localStorage.getItem("apex_access_token") ||
      null
    );
  }, []);

  const buildWsUrl = useCallback(() => {
    const token = getToken();
    if (!token) return null;
    const apiUrl =
      process.env.NEXT_PUBLIC_API_URL ||
      (typeof window !== "undefined"
        ? `${window.location.protocol}//${window.location.hostname}:8000`
        : "http://localhost:8000");

    const wsBase = apiUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    return `${wsBase}/ws/signals?token=${encodeURIComponent(token)}`;
  }, [getToken]);

  const connect = useCallback(() => {
    const url = buildWsUrl();
    if (!url) {
      updateConnectionStatus(false);
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        updateConnectionStatus(true);
        setLastEvent("connected");
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (!msg || typeof msg !== "object") return;

          // Dispatch real-time backend data arrival
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("apex_ws_data_received", {
                detail: { event: msg.event || msg.type, timestamp: Date.now() },
              })
            );
          }

          if (msg.event === "connected") {
            const sid = msg.session_id || null;
            if (sid) {
              setSessionId(sid);
              if (typeof window !== "undefined") {
                localStorage.setItem("apex_session_id", sid);
              }
            }
            updateConnectionStatus(true);
            setLastEvent("connected");
            return;
          }

          if (msg.event === "chart/active_asset") {
            const data = msg.data || {};
            setLastEvent("chart/active_asset");
            const activeAsset = data.active_asset || data.asset || null;
            if (activeAsset) {
              setActiveChartAsset(activeAsset);
              setWatchlistAsset(activeAsset);
              if (data.broker_payout !== undefined) {
                setActiveChartPayout(data.broker_payout);
              }
              setActiveSignal((prev) => {
                const isSameAsset = !prev?.asset || normalizeKey(prev.asset) === normalizeKey(activeAsset);

                // If prev is an active qualified UP/DOWN signal within its 60s lifecycle (with clock skew buffer), keep it!
                if (
                  prev &&
                  prev.is_qualified &&
                  (prev.direction === "UP" || prev.direction === "DOWN")
                ) {
                  const createdAt = prev.created_at || prev.timestamp || prev.received_at;
                  const epoch = parseUtcEpoch(createdAt);
                  if (epoch != null) {
                    const ageMs = Date.now() - epoch;
                    if (ageMs >= -5000 && ageMs < 70000 && isSameAsset) {
                      return {
                        ...prev,
                        broker_payout: data.broker_payout ?? prev.broker_payout,
                      };
                    }
                  }
                }

                // If it is the same asset and prev is already in standby/wait, keep prev with updated payout
                if (prev && isSameAsset && prev.direction === "WAIT") {
                  return {
                    ...prev,
                    broker_payout: data.broker_payout ?? prev.broker_payout,
                  };
                }

                return {
                  id: `standby-${activeAsset}`,
                  asset: activeAsset,
                  broker_payout: data.broker_payout ?? prev?.broker_payout ?? 0,
                  direction: "WAIT",
                  status_code: "WAITING_FOR_SETUP",
                  is_qualified: false,
                  confidence_score: 0,
                  consensus_count: 0,
                  opposition_count: 0,
                  event: "chart/active_asset",
                  received_at: new Date().toISOString(),
                };
              });
            }
            return;
          }

          if (
            msg.event === "signal/qualified" ||
            msg.event === "signal/wait" ||
            msg.type === "signal" ||
            msg.type === "signal_result"
          ) {
            const data = msg.data || msg.payload || {};
            const eventName = msg.event || msg.type;
            setLastEvent(eventName);

            // Strictly update activeChartAsset ONLY if backend explicitly marks this as the active chart
            if (data.is_active_chart && (data.active_chart_asset || data.asset)) {
              setActiveChartAsset(data.active_chart_asset || data.asset);
            }
            const signalId = data.id || `sig-${data.asset || "unknown"}-${data.timestamp || Date.now()}`;
            const signalObj = {
              ...data,
              id: signalId,
              created_at: data.created_at || data.timestamp || new Date().toISOString(),
              direction: data.direction || "WAIT",
              event: eventName,
              received_at: new Date().toISOString(),
            };

            setActiveSignal((prev) => {
              // If incoming signal is WAIT (or unqualified), do NOT clobber an active qualified UP/DOWN signal within its 60s lifecycle!
              if (!signalObj.is_qualified || signalObj.direction === "WAIT") {
                if (
                  prev &&
                  prev.is_qualified &&
                  (prev.direction === "UP" || prev.direction === "DOWN")
                ) {
                  const isSameAsset = !prev.asset || !signalObj.asset || normalizeKey(prev.asset) === normalizeKey(signalObj.asset);
                  const createdAt = prev.created_at || prev.timestamp || prev.received_at;
                  const epoch = parseUtcEpoch(createdAt);
                  if (epoch != null && isSameAsset) {
                    const ageMs = Date.now() - epoch;
                    if (ageMs >= -5000 && ageMs < 70000) {
                      return prev;
                    }
                  }
                }
              }
              return signalObj;
            });

            // Only update TanStack query cache for qualified trade signals (UP/DOWN) — NEVER add WAIT states!
            if (
              signalObj.is_qualified &&
              (signalObj.direction === "UP" || signalObj.direction === "DOWN")
            ) {
              try {
                queryClient.setQueriesData(
                  { queryKey: ["signals", "recent"] },
                  (old) => {
                    if (!old) return [signalObj];
                    const list = Array.isArray(old) ? [...old] : [old];
                    const idx = list.findIndex(
                      (s) =>
                        (s.id && signalObj.id && s.id === signalObj.id) ||
                        (s.asset === signalObj.asset && s.created_at === signalObj.created_at)
                    );
                    if (idx >= 0) {
                      list[idx] = { ...list[idx], ...signalObj };
                    } else {
                      list.unshift(signalObj);
                    }
                    return list.slice(0, 50);
                  }
                );
              } catch {
                // Ignore cache update errors
              }
            }
            return;
          }

          if (msg.event === "watchlist/updated") {
            const data = msg.data || {};
            setLastEvent("watchlist/updated");
            if (data.session_id) {
              setSessionId(data.session_id);
              if (typeof window !== "undefined") {
                localStorage.setItem("apex_session_id", data.session_id);
              }
            }
            if (Array.isArray(data.watchlist)) {
              setWatchlist(data.watchlist);
              // Update TanStack query cache for watchlist in-memory
              try {
                queryClient.setQueriesData(
                  { queryKey: ["extension", "watchlist"] },
                  data.watchlist
                );
              } catch {
                // Ignore cache update errors
              }
            }
            if (data.active_asset) {
              setWatchlistAsset(data.active_asset);
              setActiveChartAsset(data.active_asset);
            }
            setTotalWatchlistAssets(
              data.total_assets || (Array.isArray(data.watchlist) ? data.watchlist.length : 0)
            );
            return;
          }

          if (msg.event === "order/opened" || msg.event === "order/settled") {
            setLastEvent(msg.event);
            try {
              queryClient.invalidateQueries({ queryKey: ["signals", "attribution"] });
            } catch {
              // Ignore cache update errors
            }
            return;
          }
        } catch {
          // Ignore malformed WebSocket messages
        }
      };

      socket.onclose = () => {
        wsRef.current = null;
        updateConnectionStatus(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, 3000);
      };

      socket.onerror = () => {
        updateConnectionStatus(false);
        socket.close();
      };
    } catch {
      updateConnectionStatus(false);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectRef.current?.();
      }, 3000);
    }
  }, [
    buildWsUrl,
    setSessionId,
    setActiveChartAsset,
    setActiveSignal,
    setWatchlist,
    setWatchlistAsset,
    setTotalWatchlistAssets,
    setLastEvent,
    setIsConnected,
    updateConnectionStatus,
  ]);

  // Keep connectRef in sync with the latest connect callback so reconnection
  // timeouts always invoke the current version without capturing stale closures.
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      connect();
    }, 0);
    return () => {
      clearTimeout(initTimer);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  return {
    sessionId,
    activeSignal,
    activeChartAsset,
    activeChartPayout,
    watchlist,
    watchlistAsset,
    totalWatchlistAssets,
    isConnected,
    lastEvent,
    connect,
  };
}

export default useSignalsWebSocket;
