import { QueryClient, QueryFunction } from "@tanstack/react-query";

interface ApiError extends Error {
  status?: number;
  code?: string;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const error = new Error() as ApiError;
    error.status = res.status;
    
    try {
      const data = await res.json();
      error.message = data.error || res.statusText;
      error.code = data.code;
    } catch {
      error.message = res.statusText;
    }
    
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  options: {
    data?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<Response> {
  const { data, headers = {}, signal } = options;
  
  const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5050';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  
  const isFormData = data instanceof FormData;
  
  const res = await fetch(fullUrl, {
    method,
    headers: {
      ...(data && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...headers
    },
    body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
    signal
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey, signal }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      signal
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Don't retry on 4xx errors except for 429 (rate limit)
        if (apiError.status && apiError.status < 500 && apiError.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        const apiError = error as ApiError;
        // Only retry on network errors and 5xx server errors
        if (apiError.status && apiError.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      onError: (error) => {
        // Log errors to your error tracking service here
        console.error('Mutation error:', error);
      }
    }
  }
});
