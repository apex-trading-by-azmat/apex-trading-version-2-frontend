import { useMutation, useQueryClient } from "@tanstack/react-query";
import { registerApi } from "@/lib/API/auth";

/**
 * TanStack Query Hook: useRegister
 * Mutation hook for POST /auth/register
 *
 * @param {object} [options] - Custom callbacks and React Query mutation options
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export const useRegister = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => registerApi(data),
    onSuccess: (data, variables, context) => {
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

export default useRegister;
