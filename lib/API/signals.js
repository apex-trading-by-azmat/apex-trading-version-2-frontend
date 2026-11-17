import apiClient from "@/lib/apiClient";

/**
 * Signals API Services
 * Endpoints for retrieving real-time/recent predictive signals and trade attribution analytics.
 */

/**
 * 1. Get Recent Qualified Signals
 * Endpoint: GET /signals/recent
 * Retrieve recent qualified signals with their 6 strategy voting breakdowns.
 * Protected: Requires active VIP subscription verified by administrator.
 *
 * @param {{
 *   asset?: string | null,
 *   limit?: number
 * }} [params]
 * @returns {Promise<Array<{
 *   id: string,
 *   asset: string,
 *   direction: "UP" | "DOWN" | "WAIT",
 *   confidence_score: number,
 *   qualifying_strategy: string,
 *   consensus_count: number,
 *   opposition_count: number,
 *   status_code: string,
 *   is_qualified: boolean,
 *   entry_baseline: number,
 *   target_strike: number,
 *   spot_price: number,
 *   broker_payout: number,
 *   market_regime: string,
 *   regime_summary: string,
 *   boundary_details: {
 *     atr_14?: number,
 *     recent_resistance?: number,
 *     recent_support?: number,
 *     bollinger_upper?: number,
 *     bollinger_lower?: number
 *   },
 *   created_at: string,
 *   strategy_breakdown: Record<string, {
 *     strategy_name: string,
 *     direction: string,
 *     confidence_score: number,
 *     reason_code: string,
 *     eligible: boolean
 *   }>
 * }>>}
 */
export const getRecentSignalsApi = async ({ asset = null, limit = 50 } = {}) => {
  const params = { limit };
  if (asset) {
    params.asset = asset;
  }
  const response = await apiClient.get("signals/recent", { params });
  return response.data;
};

/**
 * 2. Get Attribution Stats
 * Endpoint: GET /signals/attribution/stats
 * Computes real-world trade outcome win rates and profit analytics broken down per strategy,
 * market regime, and confidence score tier.
 *
 * @returns {Promise<{
 *   total_attributed_trades: number,
 *   overall_win_rate: number,
 *   wins: number,
 *   losses: number,
 *   draws: number,
 *   total_profit: number,
 *   by_strategy: Record<string, any>,
 *   by_market_regime: Record<string, any>,
 *   by_confidence_tier: {
 *     score_85_plus: { trades: number, wins: number, losses: number, win_rate: number },
 *     score_80_to_84: { trades: number, wins: number, losses: number, win_rate: number },
 *     score_sub_80: { trades: number, wins: number, losses: number, win_rate: number }
 *   }
 * }>}
 */
export const getAttributionStatsApi = async () => {
  const response = await apiClient.get("signals/attribution/stats");
  return response.data;
};

/**
 * 4. Backfill Attribution
 * Endpoint: POST /signals/attribution/backfill
 * Retrospectively correlate unattributed historical orders with their matching signals.
 *
 * @param {{
 *   max_window_seconds?: number
 * }} [params]
 * @returns {Promise<{
 *   total_unattributed_checked: number,
 *   attributed_count: number
 * }>}
 */
export const backfillAttributionApi = async ({ max_window_seconds = 90 } = {}) => {
  const response = await apiClient.post(
    "signals/attribution/backfill",
    null,
    { params: { max_window_seconds } }
  );
  return response.data;
};

/**
 * 5. Get Signal by ID
 * Endpoint: GET /signals/{signal_id}
 * Retrieve single signal details and voting breakdown by UUID.
 * Protected: Requires active VIP subscription verified by administrator.
 *
 * @param {string} signalId - UUID of the signal
 * @returns {Promise<any>}
 */
export const getSignalByIdApi = async (signalId) => {
  if (!signalId) {
    throw new Error("Signal ID is required");
  }
  const response = await apiClient.get(`signals/${signalId}`);
  return response.data;
};

export const signalsApi = {
  getRecent: getRecentSignalsApi,
  getAttributionStats: getAttributionStatsApi,
  backfillAttribution: backfillAttributionApi,
  getById: getSignalByIdApi,
};

export default signalsApi;
