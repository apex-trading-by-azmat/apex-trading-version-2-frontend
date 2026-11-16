import { useEffect, useState, useRef, useCallback } from "react";

/**
 * WebSocket Signals Hook
 * Connects to the Apex FastAPI signals WebSocket feed and handles:
 *   - connected        -> stores session_id, updates connection status
 *   signal/qualified   -> updates active signal (UP/DOWN)
 *   signal/wait        -> updates active signal (WAIT/standby)
 *   watchlist/updated  -> syncs pinned tabs / watchlist from extension
 *
 * Exposes the latest signal, session_id, active chart asset, watchlist, and connection status.
 *
 * @returns {{
 *   sessionId: string | null,
 *   activeSignal: any | null,
 *   activeChartAsset: string | null,
 *   watchlist: any[],
 *   watchlistAsset: string | null,
 *   totalWatchlistAssets: number,
 *   isConnected: boolean,
 *   lastEvent: string | null,
 *   connect: Function
 * }}
 */
export function useSignalsWebSocket() {
  const [sessionId, setSessionId] = useState(null);
  const [activeSignal, setActiveSignal] = useState(null);
  const [activeChartAsset, setActiveChartAsset] = useState(null);
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

          if (
            msg.event === "signal/qualified" ||
            msg.event === "signal/wait"
          ) {
            const data = msg.data || {};
            setLastEvent(msg.event);
            setActiveChartAsset(
              data.active_chart_asset || data.asset || null,
            );
            setActiveSignal({
              ...data,
              direction: data.direction || "WAIT",
              event: msg.event,
              received_at: new Date().toISOString(),
            });
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
            }
            setWatchlistAsset(data.active_asset || null);
            setTotalWatchlistAssets(data.total_assets || 0);
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
    watchlist,
    watchlistAsset,
    totalWatchlistAssets,
    isConnected,
    lastEvent,
    connect,
  };
}

export default useSignalsWebSocket;
