/**
 * Home Assistant WebSocket Connection Manager
 * Uses home-assistant-js-websocket library for robust connection handling
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
  ERR_CANNOT_CONNECT,
  ERR_INVALID_AUTH,
} from 'home-assistant-js-websocket';

const HA_URL = import.meta.env.VITE_HA_URL;
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

// Debug: Log environment variables (without exposing token)
if (!HA_URL || !HA_TOKEN) {
  console.error('[HA-WS] Missing environment variables:', {
    hasUrl: !!HA_URL,
    hasToken: !!HA_TOKEN,
    url: HA_URL || 'MISSING',
  });
  console.error('[HA-WS] Make sure .env file exists with VITE_HA_URL and VITE_HA_TOKEN');
  console.error('[HA-WS] Restart dev server after creating/updating .env file');
}

class HAWebSocket {
  constructor() {
    this.connection = null;
    this.entities = {}; // Store current entity states
    this.stateListeners = new Set();
    this.connectionListeners = new Set();
    this.isAuthenticated = false;
    this.unsubscribeEntities = null;
  }

  /**
   * Connect to Home Assistant WebSocket using the official library
   * @returns {Promise<void>}
   */
  async connect() {
    if (!HA_URL || !HA_TOKEN) {
      const errorMsg = 'Missing VITE_HA_URL or VITE_HA_TOKEN in environment variables.\n' +
        'Please check your .env file and restart the dev server.';
      console.error('[HA-WS]', errorMsg);
      throw new Error(errorMsg);
    }

    // Validate URL format
    if (typeof HA_URL !== 'string' || (!HA_URL.startsWith('http://') && !HA_URL.startsWith('https://'))) {
      throw new Error(`Invalid VITE_HA_URL format: ${HA_URL}. Expected http:// or https:// URL.`);
    }

    console.log('[HA-WS] Connecting to:', HA_URL);
    console.log('[HA-WS] Using home-assistant-js-websocket library');

    try {
      // Validate URL and token before passing to library
      if (!HA_URL || typeof HA_URL !== 'string') {
        throw new Error('VITE_HA_URL is not a valid string');
      }
      if (!HA_TOKEN || typeof HA_TOKEN !== 'string') {
        throw new Error('VITE_HA_TOKEN is not a valid string');
      }

      console.log('[HA-WS] Creating auth with URL:', HA_URL);
      console.log('[HA-WS] Token length:', HA_TOKEN.length);

      // Create auth object using the library's helper
      // This handles URL parsing and token validation
      let auth;
      try {
        auth = createLongLivedTokenAuth(HA_URL, HA_TOKEN);
      } catch (authError) {
        console.error('[HA-WS] Auth creation failed:', authError);
        throw new Error(`Failed to create auth: ${authError.message}`);
      }
      
      // Use the official library which handles all connection edge cases
      this.connection = await createConnection({ auth });

      console.log('[HA-WS] Connection established and authenticated');
      this.isAuthenticated = true;
      this.notifyConnectionListeners('connected');

      // Subscribe to entity state changes
      this.unsubscribeEntities = subscribeEntities(this.connection, (entities) => {
        // Store entities for getStates()
        this.entities = entities;
        
        // Notify listeners of state changes
        // Entities object is keyed by entity_id, values are entity objects
        Object.keys(entities).forEach(entityId => {
          const entity = entities[entityId];
          // Ensure entity has entity_id for consistency
          if (entity && !entity.entity_id) {
            entity.entity_id = entityId;
          }
          this.stateListeners.forEach(listener => {
            listener(entityId, entity);
          });
        });
      });

    } catch (err) {
      console.error('[HA-WS] Connection error:', err);
      this.isAuthenticated = false;
      
      if (err === ERR_CANNOT_CONNECT) {
        throw new Error('Cannot connect to Home Assistant. Check:\n' +
          '1. Tailscale is connected\n' +
          '2. HA is running at ' + HA_URL + '\n' +
          '3. Network/firewall allows WebSocket connections');
      } else if (err === ERR_INVALID_AUTH) {
        this.notifyConnectionListeners('auth_failed', 'Invalid access token');
        throw new Error('Invalid access token. Please check your VITE_HA_TOKEN in .env file.');
      } else {
        throw new Error(`Connection failed: ${err.message || err}`);
      }
    }
  }

  /**
   * Get all states
   * @returns {Promise<Object[]>}
   */
  async getStates() {
    if (!this.connection) {
      throw new Error('Not connected to Home Assistant');
    }
    
    // Return entities as array of state objects
    // Ensure each entity has entity_id property
    return Object.keys(this.entities).map(entityId => {
      const entity = this.entities[entityId];
      return {
        entity_id: entityId,
        ...entity,
      };
    });
  }

  /**
   * Call a service
   * @param {string} domain - e.g., 'switch', 'climate', 'select', 'number'
   * @param {string} service - e.g., 'turn_on', 'set_temperature', 'select_option', 'set_value'
   * @param {Object} data - Service data
   * @returns {Promise<any>}
   */
  async callService(domain, service, data = {}) {
    if (!this.connection) {
      throw new Error('Not connected to Home Assistant');
    }
    
    try {
      // Use the callService function from the library
      // It takes (connection, domain, service, data)
      const result = await callService(this.connection, domain, service, data);
      return result;
    } catch (err) {
      // Format error messages from Home Assistant
      // HA errors often come as objects with 'msg' and 'code' properties
      if (err && typeof err === 'object') {
        if (err.msg) {
          const errorMsg = new Error(err.msg);
          errorMsg.code = err.code;
          errorMsg.originalError = err;
          throw errorMsg;
        }
        // If it's an Error object, preserve it
        if (err instanceof Error) {
          throw err;
        }
        // Otherwise, convert to Error
        throw new Error(err.message || JSON.stringify(err));
      }
      throw err;
    }
  }

  /**
   * Get entity history via WebSocket (avoids CORS issues)
   * @param {string} entityId - Entity ID
   * @param {Date} startTime - Start time
   * @param {Date} endTime - End time (optional, defaults to now)
   * @returns {Promise<Array>}
   */
  async getEntityHistory(entityId, startTime, endTime = new Date()) {
    if (!this.connection) {
      throw new Error('Not connected to Home Assistant');
    }

    const start = startTime.toISOString();
    const end = endTime.toISOString();

    try {
      // Use the connection's sendMessagePromise if available
      // Otherwise, we'll need to handle the message manually
      if (typeof this.connection.sendMessagePromise === 'function') {
        const result = await this.connection.sendMessagePromise({
          type: 'history/history_during_period',
          start_time: start,
          end_time: end,
          entity_ids: [entityId],
          minimal_response: false,
          significant_changes_only: false,
          include_start_time_state: true,
        });
        
        // Result is an array of arrays: [entityHistory1, entityHistory2, ...]
        // For a single entity, return the first array
        return Array.isArray(result) && result.length > 0 ? result[0] : [];
      }

      // Fallback: if sendMessagePromise doesn't exist, return empty array
      // This is a graceful degradation - charts will show "no data"
      console.warn('[HA-WS] sendMessagePromise not available, history fetch disabled');
      return [];
    } catch (err) {
      console.error('[HA-WS] History fetch error:', err);
      // Return empty array instead of throwing - allows UI to show "no data" message
      return [];
    }
  }

  /**
   * Add state change listener
   * @param {Function} listener - Called with (entityId, newState)
   */
  addStateListener(listener) {
    this.stateListeners.add(listener);
  }

  /**
   * Remove state change listener
   * @param {Function} listener
   */
  removeStateListener(listener) {
    this.stateListeners.delete(listener);
  }

  /**
   * Add connection status listener
   * @param {Function} listener
   */
  addConnectionListener(listener) {
    this.connectionListeners.add(listener);
  }

  /**
   * Notify connection listeners
   */
  notifyConnectionListeners(status, data = null) {
    this.connectionListeners.forEach(listener => {
      listener(status, data);
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.unsubscribeEntities) {
      this.unsubscribeEntities();
      this.unsubscribeEntities = null;
    }
    if (this.connection) {
      this.connection.close();
      this.connection = null;
    }
    this.isAuthenticated = false;
    this.notifyConnectionListeners('disconnected');
  }
}

// Singleton instance
export const haWebSocket = new HAWebSocket();
