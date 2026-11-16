import { useState, useEffect } from "react";
import { getSessionApi } from "@/lib/API/auth";

/**
 * Session Hook
 * Fetches authenticated session data from GET /auth/session:
 *   session_id, user_id, email, full_name, active_asset, is_authenticated
 *
 * @returns {{
 *   session: {
 *     session_id: string | null,
 *     user_id: string | null,
 *     email: string | null,
 *     full_name: string | null,
 *     active_asset: string | null,
 *     is_authenticated: boolean
 *   } | null,
 *   loading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 */
export function useSession() {
  const getInitialSession = () => {
    if (typeof window === "undefined") return null;
    try {
      const storedSid =
        localStorage.getItem("apex_session_id") ||
        localStorage.getItem("session_id");
      const userStr =
        localStorage.getItem("user") || localStorage.getItem("apex_user");
      const user = userStr ? JSON.parse(userStr) : null;
      const sid = storedSid || user?.session_id || user?.id || null;
      if (sid) {
        return {
          session_id: sid,
          user_id: user?.id || null,
          email: user?.email || null,
          full_name: user?.full_name || null,
          active_asset: null,
          is_authenticated: true,
        };
      }
    } catch {
      return null;
    }
    return null;
  };

  const [session, setSession] = useState(getInitialSession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessionApi();
      const sid =
        data?.session_id ||
        data?.user?.session_id ||
        data?.data?.session_id ||
        data?.user_id ||
        data?.id ||
        data?.user?.id ||
        null;

      const user_id =
        data?.user_id ||
        data?.user?.id ||
        data?.id ||
        null;

      const email =
        data?.email ||
        data?.user?.email ||
        null;

      const full_name =
        data?.full_name ||
        data?.user?.full_name ||
        null;

      const active_asset =
        data?.active_asset ||
        data?.data?.active_asset ||
        null;

      setSession({
        session_id: sid,
        user_id,
        email,
        full_name,
        active_asset,
        is_authenticated: data?.is_authenticated ?? true,
      });

      // Persist session_id for watchlist API calls
      if (typeof window !== "undefined" && sid) {
        localStorage.setItem("apex_session_id", sid);
        localStorage.setItem("session_id", sid);
      }
    } catch (err) {
      setError(err?.message || "Failed to fetch session");
      // Retain existing session from localStorage if network fails temporarily
      setSession((prev) => prev ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return { session, loading, error, refetch: fetchSession };
}

export default useSession;
