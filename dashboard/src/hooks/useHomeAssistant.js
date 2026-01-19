import { useState, useEffect, useCallback, useRef } from 'react';
import { haWebSocket } from '../services/ha-websocket';
import { testConnection } from '../services/ha-api';
import { ENTITIES } from '../types/entities';

/**
 * Custom hook for Home Assistant connection and state management
 * @returns {Object} HA connection state and methods
 */
export function useHomeAssistant() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [entities, setEntities] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // Initialize connection
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // Note: HTTP test may fail due to CORS in browser, but WebSocket should still work
        // We'll attempt WebSocket connection regardless
        console.log('[useHomeAssistant] Attempting WebSocket connection...');

        // Add connection listener
        haWebSocket.addConnectionListener((status, data) => {
          setConnectionStatus(status);
          if (status === 'auth_failed') {
            setError(new Error(data || 'Authentication failed'));
          } else if (status === 'connected') {
            // Clear any previous errors when successfully connected
            setError(null);
          }
        });

        // Add state listener
        haWebSocket.addStateListener((entityId, newState) => {
          setEntities(prev => ({
            ...prev,
            [entityId]: newState,
          }));
        });

        // Connect (library automatically subscribes to entities)
        await haWebSocket.connect();
        console.log('[useHomeAssistant] WebSocket connected and authenticated');

        // Get initial states (entities are already loaded via subscribeEntities)
        const states = await haWebSocket.getStates();
        console.log('[useHomeAssistant] Got initial states:', states.length, 'entities');
        const stateMap = {};
        states.forEach(state => {
          stateMap[state.entity_id] = state;
        });
        setEntities(stateMap);
        setError(null); // Clear any errors on successful initialization
        setIsLoading(false);
        console.log('[useHomeAssistant] Initialization complete');

      } catch (err) {
        console.error('[useHomeAssistant] Initialization error:', err);
        const errorMessage = err.message || 'Failed to connect to Home Assistant';
        setError(new Error(errorMessage));
        setIsLoading(false);
      }
    };

    init();

    return () => {
      haWebSocket.disconnect();
    };
  }, []);

  /**
   * Call a Home Assistant service
   * Note: Service call errors are logged but don't affect connection status
   */
  const callService = useCallback(async (domain, service, data = {}) => {
    try {
      const result = await haWebSocket.callService(domain, service, data);
      return { success: true, data: result };
    } catch (err) {
      // Log the error but don't set connection error state
      // Service call failures are separate from connection issues
      console.error('[useHomeAssistant] Service call error:', {
        domain,
        service,
        data,
        error: err.message || err,
        errorObject: err,
      });
      
      // Only set connection error if it's actually a connection issue
      if (err.message && err.message.includes('Not connected')) {
        setError(err);
      }
      
      // Return error result instead of throwing to allow components to handle gracefully
      return { 
        success: false, 
        error: err.message || 'Service call failed',
        errorObject: err 
      };
    }
  }, []);

  /**
   * Toggle a switch entity
   */
  const toggleSwitch = useCallback(async (entityId) => {
    const entity = entities[entityId];
    if (!entity) return;
    
    const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
    await callService('switch', service, { entity_id: entityId });
  }, [entities, callService]);

  /**
   * Set heater temperature
   */
  const setHeaterTemp = useCallback(async (temperature) => {
    await callService('climate', 'set_temperature', {
      entity_id: ENTITIES.HEATER,
      temperature,
      hvac_mode: 'heat',
    });
  }, [callService]);

  /**
   * Set exhaust fan mode
   */
  const setFanMode = useCallback(async (mode) => {
    const result = await callService('select', 'select_option', {
      entity_id: ENTITIES.EXHAUST_FAN_MODE,
      option: mode,
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to set fan mode');
    }
    return result;
  }, [callService]);

  /**
   * Set humidifier mode (CloudForge T5)
   */
  const setHumidifierMode = useCallback(async (mode) => {
    await callService('select', 'select_option', {
      entity_id: ENTITIES.HUMIDIFIER_MODE,
      option: mode,
    });
  }, [callService]);

  // Convenience getters for specific entities
  const getEntityValue = useCallback((entityId) => {
    const entity = entities[entityId];
    if (!entity) return null;
    return parseFloat(entity.state) || entity.state;
  }, [entities]);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isLoading,
    error,

    // Entity state
    entities,
    getEntityValue,

    // Convenience accessors
    temperature: getEntityValue(ENTITIES.TEMPERATURE),
    humidity: getEntityValue(ENTITIES.HUMIDITY),
    vpd: getEntityValue(ENTITIES.VPD),
    lightState: entities[ENTITIES.LIGHT]?.state,
    heaterState: entities[ENTITIES.HEATER]?.state,
    heaterAction: entities[ENTITIES.HEATER]?.attributes?.hvac_action, // 'heating' | 'idle'
    fanMode: entities[ENTITIES.EXHAUST_FAN_MODE]?.state,
    fanPower: getEntityValue('sensor.exhaust_fan_current_power'), // Power level 1-10
    humidifierMode: entities[ENTITIES.HUMIDIFIER_MODE]?.state,
    humidifierState: entities[ENTITIES.HUMIDIFIER_STATE]?.state, // 'on' | 'off'

    // Actions
    callService,
    toggleSwitch,
    setHeaterTemp,
    setFanMode,
    setHumidifierMode,
  };
}
