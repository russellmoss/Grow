import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'grow-log-entries';

/**
 * Hook for managing grow log entries
 */
export function useGrowLog() {
  const [entries, setEntries] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Sort by timestamp descending (newest first)
        setEntries(parsed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }
    } catch (err) {
      console.error('[useGrowLog] Failed to load entries:', err);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.error('[useGrowLog] Failed to save entries:', err);
    }
  }, [entries]);

  /**
   * Add a new log entry
   */
  const addEntry = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setEntries(prev => [newEntry, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
    return newEntry;
  }, []);

  /**
   * Delete an entry
   */
  const deleteEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  /**
   * Clear all entries
   */
  const clearAll = useCallback(() => {
    if (window.confirm('Delete all log entries? This cannot be undone.')) {
      setEntries([]);
    }
  }, []);

  /**
   * Export entries as JSON
   */
  const exportEntries = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grow-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    clearAll,
    exportEntries,
    entryCount: entries.length,
  };
}
