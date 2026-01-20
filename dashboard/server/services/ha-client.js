/**
 * Home Assistant WebSocket Client
 * 
 * Provides persistent connection to HA for entity states and service calls.
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
} from 'home-assistant-js-websocket';
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environment
global.WebSocket = WebSocket;

// Polyfill fetch for Node.js (Node 18+ has fetch, but ensure compatibility)
if (typeof global.fetch === 'undefined') {
  // For Node.js < 18, would need to install node-fetch
  // For Node.js 18+, fetch is built-in
  console.warn('[HA-CLIENT] fetch not available - Node.js 18+ required');
}

export class HAClient {
  constructor({ url, token }) {
    this.httpUrl = url;
    this.wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';
    this.token = token;
    this.connection = null;
    this.entities = {};
    this._connectionPromise = null;
  }
  
  async connect() {
    if (this.connection) return;
    if (this._connectionPromise) return this._connectionPromise;
    
    this._connectionPromise = this._doConnect();
    return this._connectionPromise;
  }
  
  async _doConnect() {
    console.log(`[HA-CLIENT] Connecting to ${this.wsUrl}`);
    
    const auth = createLongLivedTokenAuth(this.httpUrl, this.token);
    
    this.connection = await createConnection({ auth });
    
    // Subscribe to all entity state changes
    subscribeEntities(this.connection, (entities) => {
      this.entities = entities;
    });
    
    // Wait a moment for initial entity sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`[HA-CLIENT] Connected, tracking ${Object.keys(this.entities).length} entities`);
  }
  
  isConnected() {
    return this.connection !== null;
  }
  
  getEntities() {
    return this.entities;
  }
  
  getEntity(entityId) {
    return this.entities[entityId] || null;
  }
  
  getEntityState(entityId) {
    return this.entities[entityId]?.state || null;
  }
  
  async callService(domain, service, data = {}) {
    if (!this.connection) {
      await this.connect();
    }
    
    try {
      console.log(`[HA-CLIENT] Calling ${domain}.${service}:`, JSON.stringify(data));
      const result = await callService(this.connection, domain, service, data);
      console.log(`[HA-CLIENT] ✅ Service call successful`);
      return { success: true, data: result };
    } catch (error) {
      console.error(`[HA-CLIENT] ❌ Service call failed:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Fetch entity history via REST API
   */
  async fetchHistory(entityId, hoursBack = 24) {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    const url = `${this.httpUrl}/api/history/period/${startTime}?end_time=${endTime}&filter_entity_id=${entityId}&minimal_response`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data[0] || [];
    } catch (error) {
      console.error(`[HA-CLIENT] History fetch failed for ${entityId}:`, error.message);
      return [];
    }
  }
}
