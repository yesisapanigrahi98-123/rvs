import { useState, useCallback } from 'react';

export function useApi(apiFunc) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunc(...args);
        setData(result);
        return { data: result, error: null };
      } catch (err) {
        setError(err.message || 'An error occurred');
        return { data: null, error: err };
      } finally {
        setLoading(false);
      }
    },
    [apiFunc]
  );

  return { data, loading, error, execute, setData };
}

export default useApi;
