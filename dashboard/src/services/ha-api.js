/**
 * Home Assistant REST API Service
 * For history, logbook, and other REST endpoints
 * 
 * NOTE: History fetching now uses WebSocket to avoid CORS issues
 * This file is kept for other REST endpoints that may be needed
 */

import { haWebSocket } from './ha-websocket';

const HA_URL = import.meta.env.VITE_HA_URL || 'http://100.65.202.84:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

const headers = {
  'Authorization': `Bearer ${HA_TOKEN}`,
  'Content-Type': 'application/json',
};

/**
 * Get headers for API requests
 * @returns {Object} Headers object
 */
function getHeaders() {
  return {
    'Authorization': `Bearer ${HA_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Test if Home Assistant is accessible via HTTP
 * @returns {Promise<boolean>}
 */
export async function testConnection() {
  try {
    const response = await fetch(`${HA_URL}/api/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
      },
    });
    return response.ok;
  } catch (err) {
    console.error('[HA-API] Connection test failed:', err);
    return false;
  }
}

/**
 * Fetch entity history
 * Uses Vite proxy in dev mode to avoid CORS, falls back to WebSocket if needed
 * @param {string} entityId - Entity ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time (optional, defaults to now)
 * @returns {Promise<Array>}
 */
export async function getEntityHistory(entityId, startTime, endTime = new Date()) {
  const start = startTime.toISOString();
  const end = endTime.toISOString();
  
  // In dev mode, use Vite proxy (avoids CORS)
  // In production, this will use the full HA_URL
  const apiUrl = import.meta.env.DEV 
    ? '/api'  // Vite proxy in dev
    : `${HA_URL}/api`;  // Direct URL in production
  
  const url = `${apiUrl}/history/period/${start}?filter_entity_id=${entityId}&end_time=${end}`;
  
  try {
    const response = await fetch(url, { 
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`History fetch failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data[0] || []; // Returns array of state changes
  } catch (err) {
    // Log the error but don't spam console - this is expected if history API is unavailable
    if (err.message && err.message.includes('Internal Server Error')) {
      console.warn(`[HA-API] History API unavailable for ${entityId}, trying WebSocket fallback...`);
    } else {
      console.warn('[HA-API] REST API failed, trying WebSocket fallback:', err.message || err);
    }
    
    // Fallback to WebSocket if REST fails
    try {
      const wsHistory = await haWebSocket.getEntityHistory(entityId, startTime, endTime);
      if (wsHistory && wsHistory.length > 0) {
        console.log(`[HA-API] WebSocket fallback successful for ${entityId}: ${wsHistory.length} points`);
      }
      return wsHistory || [];
    } catch (wsErr) {
      // Both methods failed - this is OK, charts will just show no data
      console.warn(`[HA-API] History unavailable for ${entityId} (both REST and WebSocket failed). Charts will show empty.`);
      return []; // Return empty array to allow graceful degradation
    }
  }
}

/**
 * Get VPD history formatted for Recharts
 * @param {number} hours - Number of hours to fetch (if startDate/endDate not provided)
 * @param {Date} startDate - Custom start date (optional)
 * @param {Date} endDate - Custom end date (optional)
 * @returns {Promise<Array>}
 */
export async function getVPDHistory(hours = 24, startDate = null, endDate = null) {
  let startTime, endTime;
  
  if (startDate && endDate) {
    // Use custom date range
    startTime = new Date(startDate);
    endTime = new Date(endDate);
  } else {
    // Use hours-based range
    endTime = new Date();
    startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
  }
  
  const [vpdHistory, tempHistory, humidHistory] = await Promise.all([
    getEntityHistory('sensor.ac_infinity_controller_69_pro_vpd', startTime, endTime),
    getEntityHistory('sensor.ac_infinity_controller_69_pro_temperature', startTime, endTime),
    getEntityHistory('sensor.ac_infinity_controller_69_pro_humidity', startTime, endTime),
  ]);
  
  // Helper function to parse and validate sensor values
  const parseSensorValue = (state, type) => {
    // Filter out unavailable/unknown states
    if (!state || state === 'unavailable' || state === 'unknown' || state === 'None') {
      return null;
    }
    
    const value = parseFloat(state);
    
    // Check for NaN or invalid numbers
    if (isNaN(value) || !isFinite(value)) {
      return null;
    }
    
    // Validate based on sensor type
    switch (type) {
      case 'temperature':
        // Temperature should be between -40°F (extreme cold) and 150°F (extreme hot)
        // Values outside this range are likely sensor errors or unplugging
        if (value < -40 || value > 150) {
          return null;
        }
        return value;
        
      case 'vpd':
        // VPD should be between 0 and 5 kPa (reasonable range for grow environments)
        // Negative values or extremely high values indicate sensor errors
        if (value < 0 || value > 5) {
          return null;
        }
        return value;
        
      case 'humidity':
        // Humidity should be between 0% and 100%
        if (value < 0 || value > 100) {
          return null;
        }
        return value;
        
      default:
        return value;
    }
  };
  
  // Merge and format for Recharts
  const dataMap = new Map();
  
  vpdHistory.forEach(point => {
    const time = new Date(point.last_changed).getTime();
    const vpdValue = parseSensorValue(point.state, 'vpd');
    if (vpdValue !== null) {
      dataMap.set(time, { 
        time, 
        timestamp: point.last_changed,
        vpd: vpdValue
      });
    }
  });
  
  tempHistory.forEach(point => {
    const time = new Date(point.last_changed).getTime();
    const tempValue = parseSensorValue(point.state, 'temperature');
    if (tempValue !== null) {
      const existing = dataMap.get(time) || { time, timestamp: point.last_changed };
      existing.temperature = tempValue;
      dataMap.set(time, existing);
    }
  });
  
  humidHistory.forEach(point => {
    const time = new Date(point.last_changed).getTime();
    const humidValue = parseSensorValue(point.state, 'humidity');
    if (humidValue !== null) {
      const existing = dataMap.get(time) || { time, timestamp: point.last_changed };
      existing.humidity = humidValue;
      dataMap.set(time, existing);
    }
  });
  
  // Convert to array and sort by time
  const sortedData = Array.from(dataMap.values())
    .sort((a, b) => a.time - b.time);
  
  // Additional filtering: Detect and remove sensor unplugging artifacts
  // Look for sudden drops followed by recovery (indicates brief unplugging)
  const filteredData = sortedData.filter((point, index) => {
    // Keep first and last points
    if (index === 0 || index === sortedData.length - 1) {
      return true;
    }
    
    const prev = sortedData[index - 1];
    const next = sortedData[index + 1];
    const timeDiff = (next.time - prev.time) / 1000 / 60; // minutes
    
    // Check for temperature anomalies (sensor unplugging pattern)
    if (point.temperature !== null && prev.temperature !== null && next.temperature !== null) {
      const tempDrop = prev.temperature - point.temperature;
      const tempRecovery = next.temperature - point.temperature;
      const tempDiff = Math.abs(next.temperature - prev.temperature);
      
      // Pattern: Sudden drop (>20°F) followed by recovery within 5 minutes
      // AND next value is close to previous value (sensor reconnected)
      if (tempDrop > 20 && tempRecovery > 15 && timeDiff < 5 && tempDiff < 10) {
        return false; // Filter out this anomalous point
      }
    }
    
    // Check for VPD anomalies (sensor unplugging pattern)
    if (point.vpd !== null && prev.vpd !== null && next.vpd !== null) {
      const vpdDrop = prev.vpd - point.vpd;
      const vpdRecovery = next.vpd - point.vpd;
      const vpdDiff = Math.abs(next.vpd - prev.vpd);
      
      // Pattern: Sudden drop (>1 kPa) followed by recovery within 5 minutes
      // AND next value is close to previous value (sensor reconnected)
      if (vpdDrop > 1 && vpdRecovery > 0.8 && timeDiff < 5 && vpdDiff < 0.5) {
        return false; // Filter out this anomalous point
      }
    }
    
    // Check for humidity anomalies (sensor unplugging pattern)
    if (point.humidity !== null && prev.humidity !== null && next.humidity !== null) {
      const humidDrop = prev.humidity - point.humidity;
      const humidRecovery = next.humidity - point.humidity;
      const humidDiff = Math.abs(next.humidity - prev.humidity);
      
      // Pattern: Sudden drop (>30%) followed by recovery within 5 minutes
      // AND next value is close to previous value (sensor reconnected)
      if (humidDrop > 30 && humidRecovery > 25 && timeDiff < 5 && humidDiff < 15) {
        return false; // Filter out this anomalous point
      }
    }
    
    return true;
  });
  
  // Final filter: only keep points with at least one valid sensor reading
  return filteredData.filter(point => 
    point.vpd !== null || point.temperature !== null || point.humidity !== null
  );
}

/**
 * Add entry to Home Assistant logbook
 * @param {string} message - Log message
 * @param {string} entityId - Related entity (optional)
 */
export async function addLogEntry(message, entityId = null) {
  const url = `${HA_URL}/api/logbook`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      entity_id: entityId,
      domain: 'grow_dashboard',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Log entry failed: ${response.statusText}`);
  }
}

/**
 * Get current states for multiple entities
 * @param {string[]} entityIds
 * @returns {Promise<Object>}
 */
export async function getStates(entityIds) {
  const url = `${HA_URL}/api/states`;
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`States fetch failed: ${response.statusText}`);
  }
  
  const allStates = await response.json();
  
  const filtered = {};
  allStates
    .filter(state => entityIds.includes(state.entity_id))
    .forEach(state => {
      filtered[state.entity_id] = state;
    });
  
  return filtered;
}

// ============================================================================
// Automation Management Functions
// ============================================================================

/**
 * Get API base URL (uses Vite proxy in dev mode to avoid CORS)
 * @returns {string} API base URL
 */
function getApiUrl() {
  return import.meta.env.DEV 
    ? '/api'  // Vite proxy in dev
    : `${HA_URL}/api`;  // Direct URL in production
}

/**
 * List all automations
 * Gets all states and filters for automation entities
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export async function listAutomations() {
  console.log('[HA-API] Listing automations...');
  const url = `${getApiUrl()}/states`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const allStates = await response.json();
    const automations = allStates.filter(state => 
      state.entity_id && state.entity_id.startsWith('automation.')
    );

    console.log('[HA-API] Found', automations.length, 'automations');
    return { success: true, data: automations };
  } catch (error) {
    console.error('[HA-API] listAutomations failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Get a specific automation by entity ID
 * @param {string} entityId - Automation entity ID (e.g., 'automation.light_on')
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getAutomation(entityId) {
  console.log('[HA-API] Getting automation:', entityId);
  const url = `${getApiUrl()}/states/${entityId}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[HA-API] Automation not found:', entityId);
        return { success: true, data: null };
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[HA-API] Automation retrieved:', entityId);
    return { success: true, data };
  } catch (error) {
    console.error('[HA-API] getAutomation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Create or update an automation configuration
 * @param {string} automationId - Automation ID (without 'automation.' prefix, e.g., 'light_on')
 * @param {Object} config - Automation configuration object (YAML structure)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function createOrUpdateAutomation(automationId, config) {
  console.log('[HA-API] Creating/updating automation:', automationId);
  const url = `${getApiUrl()}/config/automation/config/${automationId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const errorMessage = `HTTP ${response.status}: ${response.statusText}${errorText ? ' - ' + errorText : ''}`;
      console.error('[HA-API] createOrUpdateAutomation failed:', errorMessage);
      console.error('[HA-API] Failed config:', JSON.stringify(config, null, 2));
      return { success: false, error: errorMessage };
    }

    const data = await response.json().catch(() => ({})); // Some endpoints return empty body
    console.log('[HA-API] Automation created/updated:', automationId);
    return { success: true, data };
  } catch (error) {
    console.error('[HA-API] createOrUpdateAutomation failed:', error.message);
    console.error('[HA-API] Error details:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete an automation
 * @param {string} automationId - Automation ID (without 'automation.' prefix)
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteAutomation(automationId) {
  console.log('[HA-API] Deleting automation:', automationId);
  const url = `${getApiUrl()}/config/automation/config/${automationId}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log('[HA-API] Automation not found (already deleted):', automationId);
        return { success: true }; // Consider 404 as success (idempotent)
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[HA-API] Automation deleted:', automationId);
    return { success: true };
  } catch (error) {
    console.error('[HA-API] deleteAutomation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Reload all automations in Home Assistant
 * Waits 2 seconds after reload for HA to process
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function reloadAutomations() {
  console.log('[HA-API] Reloading automations...');
  const url = `${getApiUrl()}/services/automation/reload`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[HA-API] Automations reloaded, waiting 2s for processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('[HA-API] Reload complete');
    return { success: true };
  } catch (error) {
    console.error('[HA-API] reloadAutomations failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Disable an automation (turn it off)
 * @param {string} entityId - Automation entity ID (e.g., 'automation.light_on')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function disableAutomation(entityId) {
  console.log('[HA-API] Disabling automation:', entityId);
  const url = `${getApiUrl()}/services/automation/turn_off`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ entity_id: entityId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[HA-API] Automation disabled:', entityId);
    return { success: true };
  } catch (error) {
    console.error('[HA-API] disableAutomation failed:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Enable an automation (turn it on)
 * @param {string} entityId - Automation entity ID (e.g., 'automation.light_on')
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function enableAutomation(entityId) {
  console.log('[HA-API] Enabling automation:', entityId);
  const url = `${getApiUrl()}/services/automation/turn_on`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ entity_id: entityId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    console.log('[HA-API] Automation enabled:', entityId);
    return { success: true };
  } catch (error) {
    console.error('[HA-API] enableAutomation failed:', error.message);
    return { success: false, error: error.message };
  }
}
