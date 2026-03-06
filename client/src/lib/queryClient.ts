import { QueryClient, QueryFunction } from "@tanstack/react-query";
import api from "./axios";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
) {
  try {
    const res = await api({
      method,
      url,
      data,
    });
    return res.data;
  } catch (err: any) {
    const errorDetails = err.response?.data?.detail || err.message;
    throw new Error(errorDetails);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
    try {
      const path = queryKey.join("/");
      const sanitizedPath = path.startsWith("/") ? path.slice(1) : path;
      const res = await api.get(sanitizedPath);
      return res.data;
    } catch (err: any) {
      if (err.response?.status === 401 && unauthorizedBehavior === "returnNull") {
        return null;
      }
      throw new Error(err.response?.data?.detail || err.message);
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
