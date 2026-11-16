import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { loginApi } from "@/lib/API/auth";

/**
 * TanStack Query Hook: useLogin
 * Mutation hook for POST /auth/login
 *
 * @param {object} [options] - Custom callbacks and React Query mutation options
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export const useLogin = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials) => loginApi(credentials),
    onSuccess: (data, variables, context) => {
      if (typeof window !== "undefined") {
        const accessToken = data?.access_token || data?.tokens?.access;
        const refreshToken = data?.refresh_token || data?.tokens?.refresh;
        const user = data?.user;

        if (accessToken) {
          localStorage.setItem("access_token", accessToken);
          localStorage.setItem("apex_token", accessToken);
          localStorage.setItem("apex_access_token", accessToken);
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
        }
        if (refreshToken) {
          localStorage.setItem("refresh_token", refreshToken);
          localStorage.setItem("apex_refresh_token", refreshToken);
        }
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("apex_user", JSON.stringify(user));
        }
      }

      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useLogin;
