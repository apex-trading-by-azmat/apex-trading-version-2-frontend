import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitPaymentApi } from "@/lib/API/auth";

/**
 * TanStack Query Hook: useSubmitPayment
 * Mutation hook for POST /auth/submit-payment
 *
 * @param {object} [options] - Custom callbacks and React Query mutation options
 * @returns {import("@tanstack/react-query").UseMutationResult}
 */
export const useSubmitPayment = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => submitPaymentApi(data),
    onSuccess: (data, variables, context) => {
      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
    ...options,
  });
};

export default useSubmitPayment;
