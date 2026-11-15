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
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSessionApi();
      setSession({
        session_id: data.session_id ?? null,
        user_id: data.user_id ?? null,
        email: data.email ?? null,
        full_name: data.full_name ?? null,
        active_asset: data.active_asset ?? null,
        is_authenticated: data.is_authenticated ?? false,
      });
      // Persist session_id for watchlist API calls
      if (typeof window !== "undefined" && data.session_id) {
        localStorage.setItem("apex_session_id", data.session_id);
      }
    } catch (err) {
      setError(err?.message || "Failed to fetch session");
      setSession(null);
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
