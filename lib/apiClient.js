import axios from "axios";

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "/api/proxy/";

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 15000,
});

// Request Interceptor: Auto-attach authorization token if available
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token =
        localStorage.getItem("access_token") ||
        localStorage.getItem("apex_token") ||
        localStorage.getItem("apex_access_token");

      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format and normalize API errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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

    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.warn("[API] 401 Unauthorized - authentication required or session expired.");
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
    }

    return Promise.reject(errorPayload);
  }
);

export default apiClient;
