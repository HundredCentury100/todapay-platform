import { useState, useEffect } from "react";
import { toast } from "sonner";

interface UseDataFetchingOptions<T> {
  fetchFn: () => Promise<T>;
  onError?: (error: any) => void;
  errorMessage?: string;
  dependencies?: any[];
}

/**
 * Consolidated hook for data fetching with loading and error states
 * Reduces code duplication across components
 */
export function useDataFetching<T>({
  fetchFn,
  onError,
  errorMessage = "Failed to load data",
  dependencies = []
}: UseDataFetchingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFn();
      setData(result);
    } catch (err: any) {
      console.error(errorMessage, err);
      setError(err);
      if (onError) {
        onError(err);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, dependencies);

  return { data, loading, error, refetch: fetchData };
}
