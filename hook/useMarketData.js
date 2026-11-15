import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  postExtensionEventApi,
  getWatchlistApi,
  updateWatchlistApi,
  syncPinnedTabsApi,
  getTopPayoutAssetsApi,
  addWatchlistAssetApi,
  removeWatchlistAssetApi,
} from "@/lib/API/marketData";

/**
 * Extension Market Data Hooks
 * TanStack React Query hooks for the 7 Extension Market Data endpoints.
 */

const resolveSessionId = (sessionId) => {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("apex_session_id") ||
      localStorage.getItem("session_id") ||
      null
    );
  }
  return null;
};

/**
 * Hook 1: Ingest Centralized Extension Event
 * Mutation hook for POST /extension/events/
 */
export const usePostExtensionEvent = (options = {}) => {
  return useMutation({
    mutationFn: (eventData) => postExtensionEventApi(eventData),
    ...options,
  });
};

/**
 * Hook 2: Get Multi-Asset Watchlist Status
 * Query hook for GET /extension/watchlist/
 */
export const useWatchlist = (sessionId = null, options = {}) => {
  const resolved = resolveSessionId(sessionId);
  return useQuery({
    queryKey: ["extension", "watchlist", resolved],
    queryFn: () => getWatchlistApi(resolved),
    refetchInterval: options.refetchInterval ?? 5000,
    ...options,
  });
};

/**
 * Hook 3: Update Multi-Asset Watchlist
 * Mutation hook for POST /extension/watchlist/
 */
export const useUpdateWatchlist = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const resolved = resolveSessionId(payload?.session_id);
      return updateWatchlistApi({
        ...payload,
        session_id: resolved || payload.session_id,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["extension", "watchlist"],
      });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook 4: Synchronize Quotex DOM Pinned Tabs
 * Mutation hook for POST /extension/tabs/pinned/
 */
export const useSyncPinnedTabs = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const resolved = resolveSessionId(payload?.session_id);
      return syncPinnedTabsApi({
        ...payload,
        session_id: resolved || payload.session_id,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["extension", "watchlist"],
      });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook 5: Get Top Payout Assets
 * Query hook for GET /extension/watchlist/top/
 */
export const useTopPayoutAssets = (
  { min_payout = 80, limit = 10 } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["extension", "watchlist", "top", min_payout, limit],
    queryFn: () => getTopPayoutAssetsApi({ min_payout, limit }),
    ...options,
  });
};

/**
 * Hook 6: Add Asset to Watchlist
 * Mutation hook for POST /extension/watchlist/add/
 */
export const useAddWatchlistAsset = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const resolved = resolveSessionId(payload?.session_id);
      return addWatchlistAssetApi({
        ...payload,
        session_id: resolved || payload.session_id,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["extension", "watchlist"],
      });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook 7: Remove Asset from Watchlist
 * Mutation hook for POST /extension/watchlist/remove/
 */
export const useRemoveWatchlistAsset = (options = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => {
      const resolved = resolveSessionId(payload?.session_id);
      return removeWatchlistAssetApi({
        ...payload,
        session_id: resolved || payload.session_id,
      });
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["extension", "watchlist"],
      });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
