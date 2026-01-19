import { createContext, useContext } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';

const HomeAssistantContext = createContext(null);

/**
 * Provider component for Home Assistant state
 */
export function HomeAssistantProvider({ children }) {
  const ha = useHomeAssistant();

  return (
    <HomeAssistantContext.Provider value={ha}>
      {children}
    </HomeAssistantContext.Provider>
  );
}

/**
 * Hook to access Home Assistant context
 */
export function useHA() {
  const context = useContext(HomeAssistantContext);
  if (!context) {
    throw new Error('useHA must be used within a HomeAssistantProvider');
  }
  return context;
}
