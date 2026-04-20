import { useState, useCallback } from "react";
import axios, { AxiosError, AxiosRequestConfig } from "axios";

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(
    async (config: AxiosRequestConfig): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios({
          baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
          ...config,
        });

        return response.data as T;
      } catch (err) {
        const axiosErr = err as AxiosError;
        setError(axiosErr.message || "API Error");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { request, loading, error };
}