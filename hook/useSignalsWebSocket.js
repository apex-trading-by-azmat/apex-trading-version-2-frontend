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
      setIsConnected(false);
      return;
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const socket = new WebSocket(url);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
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

          if (msg.event === "connected") {
            const sid = msg.session_id || null;
            if (sid) {
              setSessionId(sid);
              if (typeof window !== "undefined") {
                localStorage.setItem("apex_session_id", sid);
              }
            }
            setIsConnected(true);
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
              setActiveSignal((prev) => ({
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
              }));
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
            const chartAsset = data.active_chart_asset || data.asset || null;
            if (chartAsset) {
              setActiveChartAsset(chartAsset);
            }
            const signalId = data.id || `sig-${data.asset || "unknown"}-${data.timestamp || Date.now()}`;
            const signalObj = {
              ...data,
              id: signalId,
              direction: data.direction || "WAIT",
              event: eventName,
              received_at: new Date().toISOString(),
            };
            setActiveSignal(signalObj);

            // Update TanStack query cache for recent signals in-memory
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
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          connectRef.current?.();
        }, 3000);
      };

      socket.onerror = () => {
        setIsConnected(false);
        socket.close();
      };
    } catch {
      setIsConnected(false);
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
