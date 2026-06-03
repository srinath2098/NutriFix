import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "../lib/queryClient";
import { redirectToLogin } from "../lib/authUtils";

export type User = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  dietaryPreferences?: string[];
  allergies?: string[];
  healthGoals?: string[];
};

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        console.log("Fetching user data...");
        const baseUrl = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5050';
        const response = await fetch(`${baseUrl}/api/user`, {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
            'Origin': window.location.origin
          }
        });
        
        if (response.status === 401) {
          console.log("User not authenticated");
          return null;
        }
        
        if (!response.ok) {
          throw new Error(`${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Auth success:", data);
        return data;
      } catch (error) {
        console.error("Auth error:", error);
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0,
  });

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
