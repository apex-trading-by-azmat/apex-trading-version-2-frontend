import { useQuery } from "@tanstack/react-query";
import { getEasypaisaInfoApi } from "@/lib/API/auth";

/**
 * TanStack Query Hook: useEasypaisaInfo
 * Query hook for GET /auth/easypaisa-info
 *
 * @param {object} [options] - Custom options for useQuery
 * @returns {import("@tanstack/react-query").UseQueryResult}
 */
export const useEasypaisaInfo = (options = {}) => {
  return useQuery({
    queryKey: ["easypaisa-info"],
    queryFn: getEasypaisaInfoApi,
    staleTime: 5 * 60 * 1000,
    retry: 2,
    ...options,
  });
};

export default useEasypaisaInfo;
