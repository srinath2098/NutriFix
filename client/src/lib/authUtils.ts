import { type User } from "@/hooks/useAuth";

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' 
  : 'http://localhost:5050';

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin() {
  const currentPath = window.location.pathname;
  const returnTo = encodeURIComponent(`${window.location.origin}${currentPath}`);
  const loginUrl = `${API_BASE_URL}/api/login?returnTo=${returnTo}`;
  console.log('Redirecting to:', loginUrl);
  window.location.href = loginUrl;
}

export function redirectToLogout() {
  const returnTo = encodeURIComponent(window.location.origin);
  const logoutUrl = `${API_BASE_URL}/api/logout?returnTo=${returnTo}`;
  console.log('Redirecting to:', logoutUrl);
  window.location.href = logoutUrl;
}

export function handleAuthError(error: Error) {
  console.error('Auth error:', error);
  if (isUnauthorizedError(error)) {
    redirectToLogin();
  }
  throw error;
}

export async function fetchWithAuth<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      redirectToLogin();
      throw new Error('401: Unauthorized');
    }

    if (!response.ok) {
      throw new Error(`${response.status}: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}

export async function updateUserPreferences(preferences: Partial<User>) {
  return fetchWithAuth('/api/user/preferences', {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}