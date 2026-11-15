import apiClient from "@/lib/apiClient";

/**
 * Authentication API Service
 * Handles user login and session authentication against the FastAPI backend.
 */

/**
 * Authenticate User / Extension
 * Endpoint: POST /auth/login
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{
 *   access_token: string,
 *   refresh_token: string,
 *   token_type: string,
 *   user: {
 *     id: string,
 *     email: string,
 *     full_name: string,
 *     role: string,
 *     is_active: boolean,
 *     status: string,
 *     subscription_expires_at: string,
 *     created_at: string
 *   }
 * }>}
 */
export const loginApi = async (credentials) => {
  const response = await apiClient.post("auth/login", credentials);
  return response.data;
};

/**
 * Get Authenticated Session
 * Endpoint: GET /auth/session
 * @returns {Promise<{
 *   session_id: string,
 *   user_id: string,
 *   email: string,
 *   full_name: string,
 *   active_asset: string,
 *   is_authenticated: boolean
 * }>}
 */
export const getSessionApi = async () => {
  const response = await apiClient.get("auth/session");
  return response.data;
};

export const authApi = {
  login: loginApi,
  getSession: getSessionApi,
};

export default authApi;
