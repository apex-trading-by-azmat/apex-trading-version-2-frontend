import axios from "axios";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://apex-api.udyanasoft.com:8001";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

// Helper: Parse JWT expiration time in milliseconds
function getJwtExp(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.exp ? parsed.exp * 1000 : null;
  } catch {
    return null;
  }
}

// Concurrency control for token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Raw token refresh call using axios (bypasses apiClient interceptors to avoid loops)
export async function refreshAccessToken() {
  if (typeof window === "undefined") return null;

  const refreshToken =
    localStorage.getItem("refresh_token") ||
    localStorage.getItem("apex_refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

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

  const data = response.data;
  const newAccessToken =
    data?.access_token ||
    data?.token ||
    data?.data?.access_token;
  const newRefreshToken =
    data?.refresh_token ||
    data?.data?.refresh_token;
  const newSessionId =
    data?.session_id ||
    data?.user?.session_id ||
    data?.data?.session_id ||
    null;
  const user = data?.user || null;

  if (!newAccessToken) {
    throw new Error("Invalid response from refresh endpoint");
  }

  // Persist updated tokens, session_id and user profile in localStorage
  localStorage.setItem("access_token", newAccessToken);
  localStorage.setItem("apex_token", newAccessToken);
  localStorage.setItem("apex_access_token", newAccessToken);

  if (newRefreshToken) {
    localStorage.setItem("refresh_token", newRefreshToken);
    localStorage.setItem("apex_refresh_token", newRefreshToken);
  }

  if (newSessionId) {
    localStorage.setItem("apex_session_id", newSessionId);
    localStorage.setItem("session_id", newSessionId);
  }

  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("apex_user", JSON.stringify(user));
  }

  apiClient.defaults.headers.common["Authorization"] = `Bearer ${newAccessToken}`;

  // Notify extension / other tabs immediately
  try {
    window.dispatchEvent(
      new CustomEvent("apex_token_refreshed", {
        detail: {
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
          session_id: newSessionId,
          user: user,
        },
      })
    );
  } catch {
    // Ignore event dispatch error
  }

  return newAccessToken;
}

// Request Interceptor: Auto-attach authorization token and proactively renew if expiring within 30s
apiClient.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      let token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("apex_token") ||
        localStorage.getItem("apex_access_token");

      const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("apex_refresh_token");

      const reqUrl = (config.url || "").toLowerCase();
      const isAuthUrl =
        reqUrl.includes("auth/login") ||
        reqUrl.includes("auth/refresh") ||
        reqUrl.includes("auth/register");

      // Proactively refresh if access token is about to expire (< 30s) and refresh token is present
      if (token && refreshToken && !isAuthUrl) {
        const exp = getJwtExp(token);
        if (exp && Date.now() >= exp - 30000) {
          if (!isRefreshing) {
            isRefreshing = true;
            try {
              token = await refreshAccessToken();
              processQueue(null, token);
            } catch (err) {
              processQueue(err, null);
              console.warn("[API] Proactive token refresh failed:", err);
            } finally {
              isRefreshing = false;
            }
          } else {
            try {
              token = await new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              });
            } catch {
              // fallback to existing token
            }
          }
        }
      }

      if (token) {
        if (typeof config.headers?.set === "function") {
          config.headers.set("Authorization", `Bearer ${token}`);
        } else {
          config.headers = config.headers || {};
          config.headers["Authorization"] = `Bearer ${token}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format errors and automatically renew access_token on 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Format error message
    let extractedMessage = "An unexpected network error occurred";
    const detail = error.response?.data?.detail;

    if (Array.isArray(detail) && detail.length > 0) {
      extractedMessage = detail
        .map((item) => {
          const field = Array.isArray(item.loc) ? item.loc[item.loc.length - 1] : "";
          return field ? `${field}: ${item.msg}` : item.msg;
        })
        .join("; ");
    } else if (typeof detail === "string") {
      extractedMessage = detail;
    } else if (error.response?.data?.message) {
      extractedMessage = error.response.data.message;
    } else if (error.response?.data?.error) {
      extractedMessage = error.response.data.error;
    } else if (error.message) {
      extractedMessage = error.message;
    }

    const errorPayload = {
      message: extractedMessage,
      status: error.response?.status,
      data: error.response?.data,
      originalError: error,
    };

    // Handle 401 Unauthorized by renewing access_token using refresh_token
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const reqUrl = (originalRequest?.url || "").toLowerCase();
      const isAuthUrl =
        reqUrl.includes("auth/login") ||
        reqUrl.includes("auth/refresh") ||
        reqUrl.includes("auth/register");

      const refreshToken =
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("apex_refresh_token");

      // If already retried once or it's an auth endpoint or no refresh token exists, redirect to login
      if (originalRequest?._retry || isAuthUrl || !refreshToken) {
        console.warn("[API] 401 Unauthorized - user session expired or refresh failed.");
        localStorage.removeItem("access_token");
        localStorage.removeItem("apex_token");
        localStorage.removeItem("apex_access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("apex_refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("apex_user");
        delete apiClient.defaults.headers.common["Authorization"];

        if (
          !window.location.pathname.startsWith("/auth/login") &&
          !window.location.pathname.startsWith("/auth/register")
        ) {
          window.location.href = "/auth/login?expired=true";
        }

        return Promise.reject(errorPayload);
      }

      // Mark request to prevent infinite retry loops
      originalRequest._retry = true;

      // If a refresh is already in flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (typeof originalRequest.headers?.set === "function") {
              originalRequest.headers.set("Authorization", `Bearer ${token}`);
            } else {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers["Authorization"] = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        console.log("[API] Access token expired (401). Automatically renewing via refresh token...");
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);

        // Update Authorization header on original request and replay
        if (typeof originalRequest.headers?.set === "function") {
          originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
        } else {
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        console.error("[API] Refresh token renewal failed:", refreshErr);

        localStorage.removeItem("access_token");
        localStorage.removeItem("apex_token");
        localStorage.removeItem("apex_access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("apex_refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("apex_user");
        delete apiClient.defaults.headers.common["Authorization"];

        if (
          !window.location.pathname.startsWith("/auth/login") &&
          !window.location.pathname.startsWith("/auth/register")
        ) {
          window.location.href = "/auth/login?expired=true";
        }

        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(errorPayload);
  }
);

export default apiClient;
