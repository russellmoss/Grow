/**
 * Home Assistant WebSocket Connection Manager
 * Handles authentication, subscription, and reconnection
 */

class HAWebSocket {
  constructor() {
    this.ws = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.stateListeners = new Set();
    this.connectionListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isAuthenticated = false;
  }

  /**
   * Get WebSocket URL from environment
   */
  getWsUrl() {
    const haUrl = import.meta.env.VITE_HA_URL || 'http://100.65.202.84:8123';
    return haUrl.replace('http', 'ws') + '/api/websocket';
  }

  /**
   * Get auth token from environment
   */
  getToken() {
    return import.meta.env.VITE_HA_TOKEN;
  }

  /**
   * Connect to Home Assistant WebSocket
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const wsUrl = this.getWsUrl();
      console.log('[HA-WS] Connecting to:', wsUrl);
      
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[HA-WS] Connection opened');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleMessage(message, resolve, reject);
      };
      
      this.ws.onerror = (error) => {
        console.error('[HA-WS] WebSocket error:', error);
        this.notifyConnectionListeners('error', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('[HA-WS] Connection closed');
        this.isAuthenticated = false;
        this.notifyConnectionListeners('disconnected');
        this.attemptReconnect();
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(message, resolve, reject) {
    switch (message.type) {
      case 'auth_required':
        console.log('[HA-WS] Authentication required');
        this.sendAuth();
        break;
        
      case 'auth_ok':
        console.log('[HA-WS] Authentication successful');
        this.isAuthenticated = true;
        this.notifyConnectionListeners('connected');
        resolve();
        break;
        
      case 'auth_invalid':
        console.error('[HA-WS] Authentication failed:', message.message);
        this.notifyConnectionListeners('auth_failed', message.message);
        reject(new Error(message.message));
        break;
        
      case 'result':
        this.handleResult(message);
        break;
        
      case 'event':
        if (message.event?.event_type === 'state_changed') {
          this.handleStateChange(message.event.data);
        }
        break;
        
      default:
        // Ignore other message types
        break;
    }
  }

  /**
   * Send authentication message
   */
  sendAuth() {
    const token = this.getToken();
    if (!token) {
      console.error('[HA-WS] No token found in VITE_HA_TOKEN');
      return;
    }
    this.ws.send(JSON.stringify({
      type: 'auth',
      access_token: token,
    }));
  }

  /**
   * Send a message and wait for response
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      message.id = id;
      
      this.pendingRequests.set(id, { resolve, reject });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
      
      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Handle result messages
   */
  handleResult(message) {
    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      this.pendingRequests.delete(message.id);
      if (message.success) {
        pending.resolve(message.result);
      } else {
        pending.reject(new Error(message.error?.message || 'Unknown error'));
      }
    }
  }

  /**
   * Handle state change events
   */
  handleStateChange(data) {
    const { entity_id, new_state } = data;
    this.stateListeners.forEach(listener => {
      listener(entity_id, new_state);
    });
  }

  /**
   * Subscribe to state changes
   */
  async subscribeToStates() {
    return this.sendMessage({
      type: 'subscribe_events',
      event_type: 'state_changed',
    });
  }

  /**
   * Get all states
   */
  async getStates() {
    return this.sendMessage({
      type: 'get_states',
    });
  }

  /**
   * Call a service
   */
  async callService(domain, service, data = {}) {
    console.log(`[HA-WS] Calling ${domain}.${service}`, data);
    return this.sendMessage({
      type: 'call_service',
      domain,
      service,
      service_data: data,
    });
  }

  /**
   * Add state change listener
   */
  addStateListener(listener) {
    this.stateListeners.add(listener);
  }

  /**
   * Remove state change listener
   */
  removeStateListener(listener) {
    this.stateListeners.delete(listener);
  }

  /**
   * Add connection status listener
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
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[HA-WS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[HA-WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(err => {
        console.error('[HA-WS] Reconnection failed:', err);
      });
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const haWebSocket = new HAWebSocket();
