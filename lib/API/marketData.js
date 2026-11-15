import apiClient from "@/lib/apiClient";

/**
 * Extension Market Data API Services
 * Endpoints for centralized browser extension event ingestion and multi-asset watchlist management.
 */

/**
 * 1. Centralized Browser Extension Event Ingestion
 * Endpoint: POST /extension/events/
 * @param {{
 *   event: string,
 *   direction?: string,
 *   payload: any,
 *   received_at?: string,
 *   session_id?: string
 * }} eventData
 * @returns {Promise<{
 *   status: string,
 *   event_name: string,
 *   session_id: string,
 *   message: string,
 *   received_at: string
 * }>}
 */
export const postExtensionEventApi = async (eventData) => {
  const response = await apiClient.post("extension/events/", eventData);
  return response.data;
};

/**
 * 2. Get Multi-Asset Watchlist Status
 * Endpoint: GET /extension/watchlist/
 * Returns active monitoring watchlist with broker payouts, spot prices, and detected market regimes.
 * @param {string | null} [sessionId]
 * @returns {Promise<any>}
 */
export const getWatchlistApi = async (sessionId = null) => {
  if (!sessionId && typeof window !== "undefined") {
    sessionId =
      localStorage.getItem("apex_session_id") ||
      localStorage.getItem("session_id") ||
      null;
  }
  const params = sessionId ? { session_id: sessionId } : {};
  const response = await apiClient.get("extension/watchlist/", { params });
  return response.data;
};

/**
 * 3. Update Multi-Asset Watchlist
 * Endpoint: POST /extension/watchlist/
 * @param {{
 *   session_id: string,
 *   assets: string[]
 * }} payload
 * @returns {Promise<any>}
 */
export const updateWatchlistApi = async (payload) => {
  if (!payload.session_id && typeof window !== "undefined") {
    payload.session_id =
      localStorage.getItem("apex_session_id") ||
      localStorage.getItem("session_id") ||
      payload.session_id;
  }
  const response = await apiClient.post("extension/watchlist/", payload);
  return response.data;
};

/**
 * 4. Synchronize Quotex DOM Pinned Tabs
 * Endpoint: POST /extension/tabs/pinned/
 * @param {{
 *   session_id: string,
 *   pinned_assets: string[],
 *   active_asset: string
 * }} payload
 * @returns {Promise<any>}
 */
export const syncPinnedTabsApi = async (payload) => {
  if (!payload.session_id && typeof window !== "undefined") {
    payload.session_id =
      localStorage.getItem("apex_session_id") ||
      localStorage.getItem("session_id") ||
      payload.session_id;
  }
  const response = await apiClient.post("extension/tabs/pinned/", payload);
  return response.data;
};

/**
 * 5. Get Top Payout Assets
 * Endpoint: GET /extension/watchlist/top/
 * Scans active payouts and returns top OTC pairs sorted by broker payout percentage.
 * @param {{
 *   min_payout?: number,
 *   limit?: number
 * }} [params]
 * @returns {Promise<any>}
 */
export const getTopPayoutAssetsApi = async ({ min_payout = 80, limit = 10 } = {}) => {
  const response = await apiClient.get("extension/watchlist/top/", {
    params: { min_payout, limit },
  });
  return response.data;
};

/**
 * 6. Add Asset to Watchlist
 * Endpoint: POST /extension/watchlist/add/
 * @param {{
 *   session_id: string,
 *   asset: string
 * }} payload
 * @returns {Promise<any>}
 */
export const addWatchlistAssetApi = async (payload) => {
  if (!payload.session_id && typeof window !== "undefined") {
    payload.session_id =
      localStorage.getItem("apex_session_id") ||
      localStorage.getItem("session_id") ||
      payload.session_id;
  }
  const response = await apiClient.post("extension/watchlist/add/", payload);
  return response.data;
};

/**
 * 7. Remove Asset from Watchlist
 * Endpoint: POST /extension/watchlist/remove/
 * @param {{
 *   session_id: string,
 *   asset: string
 * }} payload
 * @returns {Promise<any>}
 */
export const removeWatchlistAssetApi = async (payload) => {
  if (!payload.session_id && typeof window !== "undefined") {
    payload.session_id =
      localStorage.getItem("apex_session_id") ||
      localStorage.getItem("session_id") ||
      payload.session_id;
  }
  const response = await apiClient.post("extension/watchlist/remove/", payload);
  return response.data;
};

export const marketDataApi = {
  postExtensionEvent: postExtensionEventApi,
  getWatchlist: getWatchlistApi,
  updateWatchlist: updateWatchlistApi,
  syncPinnedTabs: syncPinnedTabsApi,
  getTopPayoutAssets: getTopPayoutAssetsApi,
  addWatchlistAsset: addWatchlistAssetApi,
  removeWatchlistAsset: removeWatchlistAssetApi,
};

export default marketDataApi;
