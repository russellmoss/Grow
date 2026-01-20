/**
 * History Service - Fetches sensor history from Home Assistant
 * 
 * Uses the Home Assistant REST API to get historical state data.
 * 
 * @fileoverview Provides functions to fetch and process sensor history
 */

import { ENTITIES } from '../types/entities.js';
import { getEntityHistory } from './ha-api.js';

/**
 * Fetch history for a single entity
 * 
 * @param {string} entityId - The entity ID to fetch history for
 * @param {number} hoursBack - How many hours of history to fetch
 * @returns {Promise<Array>} Array of state objects with timestamps
 */
export async function fetchEntityHistory(entityId, hoursBack = 24) {
  const endTime = new Date();
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
  
  try {
    const history = await getEntityHistory(entityId, startTime, endTime);
    return history;
  } catch (error) {
    console.error(`[HISTORY] Error fetching ${entityId}:`, error);
    return [];
  }
}

/**
 * Fetch all environment sensor history
 * 
 * @param {number} hoursBack - How many hours of history to fetch
 * @returns {Promise<Object>} Object with temperature, humidity, vpd arrays
 */
export async function fetchEnvironmentHistory(hoursBack = 24) {
  console.log(`[HISTORY] Fetching ${hoursBack}h of environment history...`);
  
  const [temperature, humidity, vpd] = await Promise.all([
    fetchEntityHistory(ENTITIES.TEMPERATURE, hoursBack),
    fetchEntityHistory(ENTITIES.HUMIDITY, hoursBack),
    fetchEntityHistory(ENTITIES.VPD, hoursBack),
  ]);
  
  console.log(`[HISTORY] Fetched: ${temperature.length} temp, ${humidity.length} humidity, ${vpd.length} vpd readings`);
  
  return {
    temperature: processHistory(temperature),
    humidity: processHistory(humidity),
    vpd: processHistory(vpd),
  };
}

/**
 * Process raw history into usable format
 * 
 * @param {Array} history - Raw history from HA API
 * @returns {Array} Processed array with { timestamp, value }
 */
function processHistory(history) {
  return history
    .filter(entry => entry.state !== 'unavailable' && entry.state !== 'unknown' && entry.state !== 'None')
    .map(entry => ({
      timestamp: new Date(entry.last_changed).getTime(),
      value: parseFloat(entry.state),
    }))
    .filter(entry => !isNaN(entry.value) && isFinite(entry.value));
}

/**
 * Calculate statistics from history
 * 
 * @param {Object} history - Object with temperature, humidity, vpd arrays
 * @param {Object} targets - Object with target values for comparison
 * @returns {Object} Statistics object
 */
export function calculateHistoryStats(history, targets) {
  const calcStats = (arr) => {
    if (!arr || arr.length === 0) return { avg: 0, min: 0, max: 0 };
    const values = arr.map(e => e.value);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };
  
  const vpdStats = calcStats(history.vpd);
  const tempStats = calcStats(history.temperature);
  const humStats = calcStats(history.humidity);
  
  // Calculate time in target range for VPD
  const vpdInRange = history.vpd.filter(
    e => e.value >= (targets?.vpdMin || 0.4) && e.value <= (targets?.vpdMax || 0.8)
  );
  const timeInRange = history.vpd.length > 0 
    ? Math.round((vpdInRange.length / history.vpd.length) * 100) 
    : 0;
  
  return {
    avgVPD: vpdStats.avg.toFixed(2),
    minVPD: vpdStats.min.toFixed(2),
    maxVPD: vpdStats.max.toFixed(2),
    avgTemp: tempStats.avg.toFixed(1),
    minTemp: tempStats.min.toFixed(1),
    maxTemp: tempStats.max.toFixed(1),
    avgHumidity: humStats.avg.toFixed(1),
    minHumidity: humStats.min.toFixed(1),
    maxHumidity: humStats.max.toFixed(1),
    timeInRange,
    dataPoints: history.vpd.length,
  };
}

/**
 * Format history data for AI prompt (condensed)
 * 
 * @param {Object} history - Object with temperature, humidity, vpd arrays  
 * @returns {string} Formatted string for AI prompt
 */
export function formatHistoryForPrompt(history) {
  // Sample every 15 minutes (instead of all data points)
  const sampleInterval = 15 * 60 * 1000; // 15 minutes in ms
  
  const sampled = {
    vpd: sampleData(history.vpd, sampleInterval),
    temperature: sampleData(history.temperature, sampleInterval),
    humidity: sampleData(history.humidity, sampleInterval),
  };
  
  let output = 'Time | Temp (°F) | Humidity (%) | VPD (kPa)\n';
  output += '--- | --- | --- | ---\n';
  
  // Merge all timestamps and sort
  const allTimestamps = [...new Set([
    ...sampled.vpd.map(e => e.timestamp),
    ...sampled.temperature.map(e => e.timestamp),
    ...sampled.humidity.map(e => e.timestamp),
  ])].sort();
  
  for (const ts of allTimestamps.slice(-96)) { // Last 24h at 15min intervals = 96 points max
    const time = new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const temp = sampled.temperature.find(e => Math.abs(e.timestamp - ts) < sampleInterval)?.value?.toFixed(1) || '-';
    const hum = sampled.humidity.find(e => Math.abs(e.timestamp - ts) < sampleInterval)?.value?.toFixed(1) || '-';
    const vpd = sampled.vpd.find(e => Math.abs(e.timestamp - ts) < sampleInterval)?.value?.toFixed(2) || '-';
    
    output += `${time} | ${temp} | ${hum} | ${vpd}\n`;
  }
  
  return output;
}

/**
 * Sample data at regular intervals
 */
function sampleData(data, intervalMs) {
  if (!data || data.length === 0) return [];
  
  const sampled = [];
  let lastTimestamp = 0;
  
  for (const entry of data) {
    if (entry.timestamp - lastTimestamp >= intervalMs) {
      sampled.push(entry);
      lastTimestamp = entry.timestamp;
    }
  }
  
  return sampled;
}
