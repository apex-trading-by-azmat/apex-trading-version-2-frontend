import apiClient, { BASE_URL } from "@/lib/apiClient";
import axios from "axios";

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

/**
 * Refresh Access Token
 * Endpoint: POST /auth/refresh
 * @param {string} refreshToken
 * @returns {Promise<{
 *   access_token: string,
 *   refresh_token: string,
 *   token_type: string,
 *   session_id: string,
 *   user: {
 *     id: string,
 *     session_id: string,
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
export const refreshTokenApi = async (refreshToken) => {
  const response = await axios.post(
    `${BASE_URL}/auth/refresh`,
    { refresh_token: refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 10000,
    }
  );
  return response.data;
};

/**
 * Register New User
 * Endpoint: POST /auth/register
 * @param {{ email: string, password: string, full_name: string }} data
 * @returns {Promise<{
 *   message: string,
 *   user: {
 *     id: string,
 *     session_id: string,
 *     email: string,
 *     full_name: string,
 *     role: string,
 *     is_active: boolean,
 *     status: string,
 *     quotex_trader_id: string,
 *     subscription_expires_at: string,
 *     created_at: string
 *   },
 *   payment_instructions: {
 *     bank_or_wallet: string,
 *     account_title: string,
 *     account_number: string,
 *     amount: number,
 *     instructions: string
 *   }
 * }>}
 */
export const registerApi = async (data) => {
  const response = await apiClient.post("auth/register", data);
  return response.data;
};

/**
 * Submit EasyPaisa Payment Proof
 * Endpoint: POST /auth/submit-payment
 * @param {{
 *   transaction_id: string,
 *   sender_name?: string | null,
 *   email?: string | null,
 *   screenshot: File | Blob
 * }} data
 * @returns {Promise<{
 *   id: string,
 *   user_id: string,
 *   transaction_id: string,
 *   screenshot_path: string,
 *   sender_name: string,
 *   amount: string,
 *   status: string,
 *   rejection_reason?: string,
 *   reviewed_by?: string,
 *   reviewed_at?: string,
 *   created_at: string
 * }>}
 */
export const submitPaymentApi = async (data) => {
  const formData = new FormData();
  formData.append("transaction_id", data.transaction_id);
  if (data.sender_name) {
    formData.append("sender_name", data.sender_name);
  }
  if (data.email) {
    formData.append("email", data.email);
  }
  if (data.screenshot) {
    formData.append("screenshot", data.screenshot);
  }

  const response = await apiClient.post("auth/submit-payment", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * Get EasyPaisa Payment Info
 * Endpoint: GET /auth/easypaisa-info
 * @returns {Promise<{
 *   bank_or_wallet: string,
 *   account_title: string,
 *   account_number: string,
 *   amount: number,
 *   instructions: string
 * }>}
 */
export const getEasypaisaInfoApi = async () => {
  const response = await apiClient.get("auth/easypaisa-info");
  return response.data;
};

export const authApi = {
  login: loginApi,
  register: registerApi,
  submitPayment: submitPaymentApi,
  getEasypaisaInfo: getEasypaisaInfoApi,
  getSession: getSessionApi,
  refresh: refreshTokenApi,
};

export default authApi;
