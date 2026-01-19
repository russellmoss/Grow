import { createContext, useContext } from 'react';
import { useGrowLog } from '../hooks/useGrowLog';

const GrowLogContext = createContext(null);

/**
 * Provider component for Grow Log state
 */
export function GrowLogProvider({ children }) {
  const growLog = useGrowLog();

  return (
    <GrowLogContext.Provider value={growLog}>
      {children}
    </GrowLogContext.Provider>
  );
}

/**
 * Hook to access Grow Log context
 */
export function useGrowLogContext() {
  const context = useContext(GrowLogContext);
  if (!context) {
    throw new Error('useGrowLogContext must be used within a GrowLogProvider');
  }
  return context;
}
