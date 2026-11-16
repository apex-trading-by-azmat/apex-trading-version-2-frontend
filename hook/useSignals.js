import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRecentSignalsApi,
  getAttributionStatsApi,
  getAttributedOrdersApi,
  backfillAttributionApi,
  getSignalByIdApi,
} from "@/lib/API/signals";

/**
 * Hook: Retrieve recent qualified signals
 * Supports filtering by asset and setting query limits. Auto-refetches periodically for live monitoring.
 *
 * @param {{ asset?: string | null, limit?: number }} [params]
 * @param {object} [options]
 */
export const useRecentSignals = (
  { asset = null, limit = 50 } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["signals", "recent", asset, limit],
    queryFn: () => getRecentSignalsApi({ asset, limit }),
    refetchInterval: options.refetchInterval ?? false,
    staleTime: options.staleTime ?? Infinity,
    refetchIntervalInBackground: options.refetchIntervalInBackground ?? false,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    ...options,
  });
};

/**
 * Hook: Retrieve Attribution Win Rate and Profit Statistics
 *
 * @param {object} [options]
 */
export const useAttributionStats = (options = {}) => {
  return useQuery({
    queryKey: ["signals", "attribution", "stats"],
    queryFn: () => getAttributionStatsApi(),
    refetchInterval: options.refetchInterval ?? false,
    staleTime: options.staleTime ?? Infinity,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    ...options,
  });
};

/**
 * Hook: Retrieve Attributed Trade Orders
 *
 * @param {{ asset?: string | null, limit?: number }} [params]
 * @param {object} [options]
 */
export const useAttributedOrders = (
  { asset = null, limit = 50 } = {},
  options = {}
) => {
  return useQuery({
    queryKey: ["signals", "attribution", "orders", asset, limit],
    queryFn: () => getAttributedOrdersApi({ asset, limit }),
    refetchInterval: options.refetchInterval ?? false,
    staleTime: options.staleTime ?? Infinity,
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    ...options,
  });
};

/**
 * Hook: Backfill Attribution Mutation
 * Retrospectively correlates unattributed orders with predictive signals.
 *
 * @param {object} [options]
 */
export const useBackfillAttribution = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ max_window_seconds = 90 } = {}) =>
      backfillAttributionApi({ max_window_seconds }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: ["signals", "attribution"],
      });
      options.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

/**
 * Hook: Retrieve single signal details by UUID
 *
 * @param {string} signalId
 * @param {object} [options]
 */
export const useSignalById = (signalId, options = {}) => {
  return useQuery({
    queryKey: ["signals", "detail", signalId],
    queryFn: () => getSignalByIdApi(signalId),
    enabled: !!signalId,
    ...options,
  });
};
