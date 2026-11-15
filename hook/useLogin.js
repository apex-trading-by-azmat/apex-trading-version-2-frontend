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
        if (data?.access_token) {
          localStorage.setItem("access_token", data.access_token);
          localStorage.setItem("apex_token", data.access_token);
          localStorage.setItem("apex_access_token", data.access_token);
          apiClient.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
        }
        if (data?.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
          localStorage.setItem("apex_refresh_token", data.refresh_token);
        }
        if (data?.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("apex_user", JSON.stringify(data.user));
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
