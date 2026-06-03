import { getApiBaseUrl } from '../config';

interface ApiResponse<T> {
  data: T;
  error?: string;
  status: number;
}

export const api = {
  post: async <T>(endpoint: string, data: any): Promise<T> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || 'Failed to save blood test results');
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
      }
      throw new Error('An unexpected error occurred');
    }
  }
};
