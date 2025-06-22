import { useQuery } from "@tanstack/react-query";
import { redirectToLogin } from '@/lib/auth';

export interface User {
  sub: string;
  name: string;
  email: string;
  picture: string;
}

export const useAuth = () => {
  const { data: user, isLoading, error, refetch } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      try {
        const response = await fetch('/api/user', {
          credentials: "include",
          headers: {
            'Accept': 'application/json',
          }
        });
        
        if (response.status === 401) {
          redirectToLogin();
          return null;
        }
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        return await response.json();
      } catch (error) {
        console.error("Auth error:", error);
        redirectToLogin();
        return null;
      }
    },
    retry: false,
    refetchOnWindowFocus: true,
  });

  return { user, isLoading, error, refetch, isAuthenticated: !!user };
};
