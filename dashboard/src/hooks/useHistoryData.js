import { useState, useEffect, useCallback } from 'react';
import { getVPDHistory } from '../services/ha-api';

/**
 * Hook for fetching and caching historical data
 * @param {number} hours - Number of hours to fetch (if startDate/endDate not provided)
 * @param {Date} startDate - Custom start date (optional)
 * @param {Date} endDate - Custom end date (optional)
 */
export function useHistoryData(hours = 24, startDate = null, endDate = null) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await getVPDHistory(hours, startDate, endDate);
      setData(history || []); // Ensure we always have an array
      setLastUpdated(new Date());
    } catch (err) {
      // History fetch errors are non-critical - charts can work without historical data
      console.warn('[useHistoryData] History fetch failed (non-critical):', err.message || err);
      setError(err);
      setData([]); // Set empty array on error so charts don't break
    } finally {
      setIsLoading(false);
    }
  }, [hours, startDate, endDate]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes (only if not using custom date range)
    if (!startDate && !endDate) {
      const interval = setInterval(fetchData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchData, startDate, endDate]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
