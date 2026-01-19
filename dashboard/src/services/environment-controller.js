/**
 * Intelligent Environmental Control System
 * 
 * This controller analyzes the relationship between temperature, humidity,
 * and VPD to make coordinated decisions about which actuators to control.
 * 
 * Unlike simple threshold automations, this system:
 * - Understands variable interdependencies
 * - Makes coordinated multi-device decisions
 * - Prevents devices from working against each other
 * - Shows its reasoning for transparency
 * - Can be overridden manually
 */

import { ENTITIES } from '../types/entities.js';

/**
 * Device cooldowns (ms) - AC Infinity devices have aggressive rate limiting
 */
const DEVICE_COOLDOWNS = {
  humidifier: 120000,   // 2 minutes - AC Infinity rate limits aggressively
  exhaustFan: 60000,    // 1 minute
  heater: 30000,        // 30 seconds
  light: 10000,         // 10 seconds
};

/**
 * Problem severity score (0-100)
 * Higher = more urgent
 */
function calculateSeverity(current, target) {
  const delta = Math.abs(current - target);
  const percentDelta = (delta / target) * 100;
  
  if (percentDelta < 5) return 0;      // Within tolerance
  if (percentDelta < 10) return 25;    // Minor issue
  if (percentDelta < 20) return 50;    // Moderate issue
  if (percentDelta < 30) return 75;    // Serious issue
  return 100;                          // Critical issue
}

/**
 * Main environment controller class
 */
export class EnvironmentController {
  /**
   * @param {Object} currentState - Current sensor readings
   * @param {number} currentState.temp - Temperature (°F)
   * @param {number} currentState.humidity - Humidity (%)
   * @param {number} currentState.vpd - VPD (kPa)
   * @param {Object} targetState - Target values from phenology stage
   * @param {Object} targetState.tempOptimal - Target temperature
   * @param {Object} targetState.humidityOptimal - Target humidity
   * @param {Object} targetState.vpdMin - Min VPD
   * @param {Object} targetState.vpdMax - Max VPD
   * @param {Object} targetState.vpdOptimal - Optimal VPD
   * @param {Object} actuators - Current actuator states
   */
  constructor(currentState, targetState, actuators) {
    this.current = currentState;
    this.target = targetState;
    this.actuators = actuators;
  }

  /**
   * Analyze current state vs targets
   * Returns priority-ordered list of problems
   * 
   * @returns {Array<Object>} List of problems, sorted by severity
   */
  analyzeState() {
    const problems = [];
    
    // Check VPD (highest priority for plant health)
    if (this.current.vpd > this.target.vpdMax) {
      problems.push({
        type: 'VPD_HIGH',
        severity: calculateSeverity(this.current.vpd, this.target.vpdMax),
        currentValue: this.current.vpd,
        targetValue: this.target.vpdOptimal,
        delta: this.current.vpd - this.target.vpdMax,
        description: `VPD too high (${this.current.vpd.toFixed(2)} kPa) - Air is too dry`,
      });
    } else if (this.current.vpd < this.target.vpdMin) {
      problems.push({
        type: 'VPD_LOW',
        severity: calculateSeverity(this.target.vpdMin, this.current.vpd),
        currentValue: this.current.vpd,
        targetValue: this.target.vpdOptimal,
        delta: this.target.vpdMin - this.current.vpd,
        description: `VPD too low (${this.current.vpd.toFixed(2)} kPa) - Air is too humid`,
      });
    }
    
    // Check temperature
    if (this.current.temp > this.target.tempMax) {
      problems.push({
        type: 'TEMP_HIGH',
        severity: calculateSeverity(this.current.temp, this.target.tempMax),
        currentValue: this.current.temp,
        targetValue: this.target.tempOptimal,
        delta: this.current.temp - this.target.tempMax,
        description: `Temperature too high (${this.current.temp.toFixed(1)}°F)`,
      });
    } else if (this.current.temp < this.target.tempMin) {
      problems.push({
        type: 'TEMP_LOW',
        severity: calculateSeverity(this.target.tempMin, this.current.temp),
        currentValue: this.current.temp,
        targetValue: this.target.tempOptimal,
        delta: this.target.tempMin - this.current.temp,
        description: `Temperature too low (${this.current.temp.toFixed(1)}°F)`,
      });
    }
    
    // Check humidity
    if (this.current.humidity < this.target.humidityMin) {
      problems.push({
        type: 'HUMIDITY_LOW',
        severity: calculateSeverity(this.target.humidityMin, this.current.humidity),
        currentValue: this.current.humidity,
        targetValue: this.target.humidityOptimal,
        delta: this.target.humidityMin - this.current.humidity,
        description: `Humidity too low (${this.current.humidity.toFixed(1)}%)`,
      });
    } else if (this.current.humidity > this.target.humidityMax) {
      problems.push({
        type: 'HUMIDITY_HIGH',
        severity: calculateSeverity(this.current.humidity, this.target.humidityMax),
        currentValue: this.current.humidity,
        targetValue: this.target.humidityOptimal,
        delta: this.current.humidity - this.target.humidityMax,
        description: `Humidity too high (${this.current.humidity.toFixed(1)}%)`,
      });
    }
    
    // Sort by severity (most severe first)
    return problems.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Generate coordinated action plan to fix problems
   * Considers actuator interactions and prevents conflicts
   * 
   * @param {Array<Object>} problems - List of problems from analyzeState()
   * @returns {Array<Object>} List of actions to take
   */
  generateActionPlan(problems) {
    const actions = [];
    
    // Process each problem in priority order
    for (const problem of problems) {
      switch (problem.type) {
        case 'VPD_HIGH':
          // VPD too high = air too dry
          // Root causes: low humidity OR high temperature
          
          if (this.current.humidity < this.target.humidityOptimal) {
            // Problem is primarily low humidity - use MAX intensity (10)
            const currentIntensity = this.actuators.humidifier?.currentPower || 0;
            const currentMode = this.actuators.humidifier?.mode;
            
            // Skip if already at max intensity and ON
            if (currentMode === 'On' && currentIntensity === 10) {
              console.log('[ENV-CTRL] Humidifier already at max (10), skipping');
            } else {
              actions.push({
                device: 'humidifier',
                action: 'set_max_intensity',
                targetIntensity: 10,
                currentIntensity: currentIntensity,
                currentMode: currentMode,
                reason: `Set humidifier to MAX (humidity ${this.current.humidity.toFixed(1)}%, VPD ${this.current.vpd.toFixed(2)} kPa)`,
                priority: 1,
              });
            }
            
            // Check if exhaust fan is working against humidifier
            if (this.actuators.exhaustFan?.currentPower > 3) {
              actions.push({
                device: 'exhaustFan',
                action: 'reduce_power',
                fromPower: this.actuators.exhaustFan.currentPower,
                toPower: 2,
                reason: 'Reduce air exchange to retain moisture (coordinated with humidifier)',
                priority: 2,
              });
            }
          } else if (this.current.temp > this.target.tempOptimal) {
            // Problem is primarily high temperature
            actions.push({
              device: 'heater',
              action: 'reduce_temp',
              fromTemp: this.current.temp,
              toTemp: this.target.tempOptimal - 1,
              reason: `Lower temperature to reduce VPD (currently ${this.current.temp.toFixed(1)}°F, target ${this.target.tempOptimal}°F)`,
              priority: 1,
            });
          }
          break;
          
        case 'VPD_LOW':
          // VPD too low = air too humid
          // Solutions: increase exhaust, reduce humidifier, increase temp
          
          actions.push({
            device: 'humidifier',
            action: 'turn_off',
            reason: 'Stop adding moisture (VPD too low)',
            priority: 1,
          });
          
          // Increase air exchange if safe (won't overcool)
          if (this.current.temp > this.target.tempMin + 2) {
            actions.push({
              device: 'exhaustFan',
              action: 'increase_power',
              toPower: Math.min((this.actuators.exhaustFan?.currentPower || 5) + 2, 10),
              reason: 'Increase air exchange to remove excess moisture',
              priority: 2,
            });
          }
          break;
          
        case 'TEMP_HIGH':
          // Temperature too high
          
          // Can we increase exhaust without hurting VPD?
          if (this.current.vpd < this.target.vpdMax - 0.1) {
            actions.push({
              device: 'exhaustFan',
              action: 'increase_power',
              toPower: Math.min((this.actuators.exhaustFan?.currentPower || 5) + 2, 10),
              reason: 'Increase air exchange to cool tent (VPD has headroom)',
              priority: 1,
            });
          } else {
            // Can't increase exhaust (would worsen VPD)
            actions.push({
              device: 'heater',
              action: 'reduce_temp',
              toTemp: this.target.tempOptimal,
              reason: 'Direct temperature reduction (can\'t increase exhaust due to VPD)',
              priority: 1,
            });
          }
          break;
          
        case 'TEMP_LOW':
          // Temperature too low
          actions.push({
            device: 'heater',
            action: 'increase_temp',
            toTemp: this.target.tempOptimal,
            reason: `Increase heater setpoint (currently ${this.current.temp.toFixed(1)}°F, target ${this.target.tempOptimal}°F)`,
            priority: 1,
          });
          break;
          
        case 'HUMIDITY_LOW':
          // Humidity too low - use MAX intensity (10)
          const currentIntensity = this.actuators.humidifier?.currentPower || 0;
          const currentMode = this.actuators.humidifier?.mode;
          
          // Skip if already at max intensity and ON
          if (currentMode === 'On' && currentIntensity === 10) {
            console.log('[ENV-CTRL] Humidifier already at max (10), skipping');
          } else {
            actions.push({
              device: 'humidifier',
              action: 'set_max_intensity',
              targetIntensity: 10,
              currentIntensity: currentIntensity,
              currentMode: currentMode,
              reason: `Set humidifier to MAX (humidity ${this.current.humidity.toFixed(1)}%)`,
              priority: 1,
            });
          }
          
          // Reduce exhaust if removing moisture too fast
          if (this.actuators.exhaustFan?.currentPower > 3) {
            actions.push({
              device: 'exhaustFan',
              action: 'reduce_power',
              toPower: 2,
              reason: 'Retain moisture in tent',
              priority: 2,
            });
          }
          break;
          
        case 'HUMIDITY_HIGH':
          // Humidity too high - turn OFF (only if way too high, +10% over max)
          if (this.current.humidity > this.target.humidityMax + 10) {
            actions.push({
              device: 'humidifier',
              action: 'turn_off',
              reason: `Humidity ${this.current.humidity.toFixed(1)}% exceeds max by 10%+`,
              priority: 1,
            });
          }
          
          actions.push({
            device: 'exhaustFan',
            action: 'increase_power',
            toPower: Math.min((this.actuators.exhaustFan?.currentPower || 5) + 2, 10),
            reason: 'Increase air exchange to remove excess moisture',
            priority: 2,
          });
          break;
      }
    }
    
    // Remove duplicate actions (keep highest priority)
    return this._deduplicateActions(actions);
  }

  /**
   * Remove duplicate device actions, keeping highest priority
   * @private
   */
  _deduplicateActions(actions) {
    const seen = new Map();
    
    for (const action of actions) {
      // For intensity actions, use device-action-intensity as key
      // For other actions, use device-action
      const key = (action.action === 'set_intensity' || action.action === 'set_max_intensity')
        ? `${action.device}-${action.action}-${action.targetIntensity || action.intensity || 10}`
        : `${action.device}-${action.action}`;
      
      if (!seen.has(key) || action.priority < seen.get(key).priority) {
        seen.set(key, action);
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Check if an entity exists and is available
   * @private
   */
  async checkEntityExists(entityId, getEntityState) {
    try {
      const state = getEntityState?.(entityId);
      // getEntityState returns the state string directly, not an object
      return state !== null && state !== undefined && state !== 'unavailable';
    } catch {
      return false;
    }
  }

  /**
   * Execute action plan via Home Assistant
   * 
   * @param {Array<Object>} actions - Actions from generateActionPlan()
   * @param {Function} callService - Home Assistant service call function (returns {success, data})
   * @param {Function} getEntityState - Function to get entity state
   * @param {Object} cooldownRef - Ref object to track last service call times
   * @returns {Promise<Array<Object>>} Execution results
   */
  async executeActionPlan(actions, callService, getEntityState, cooldownRef = { current: {} }) {
    const results = [];
    const SERVICE_CALL_COOLDOWN = 30000; // 30 seconds between same calls (fallback)
    
    for (const action of actions) {
      // Check cooldown before executing
      // Use device-specific cooldown (longer for AC Infinity devices)
      const actionKey = `${action.device}_${action.action}`;
      
      // Special handling for humidifier intensity changes
      if (action.device === 'humidifier' && action.action === 'set_max_intensity') {
        // Check both the action-specific cooldown and the general intensity cooldown
        const intensityCooldown = cooldownRef.current['humidifier_intensity'];
        const actionCooldown = cooldownRef.current[actionKey];
        
        // Use the longer of the two cooldowns (intensity cooldown can be extended to 30 min on rate limit)
        if (intensityCooldown && intensityCooldown > Date.now()) {
          const remaining = Math.round((intensityCooldown - Date.now()) / 1000);
          console.log(`[ENV-CTRL] Skipping ${actionKey} - intensity cooldown active (${remaining}s remaining)`);
          results.push({
            action,
            success: false,
            error: 'Intensity cooldown active - too soon since last call',
            skipped: true,
          });
          continue;
        }
        
        if (actionCooldown) {
          const cooldownDuration = 5 * 60 * 1000; // 5 minutes for normal intensity changes
          if (Date.now() - actionCooldown < cooldownDuration) {
            const remaining = Math.round((cooldownDuration - (Date.now() - actionCooldown)) / 1000);
            console.log(`[ENV-CTRL] Skipping ${actionKey} - cooldown active (${remaining}s remaining)`);
            results.push({
              action,
              success: false,
              error: 'Cooldown active - too soon since last call',
              skipped: true,
            });
            continue;
          }
        }
      } else {
        // Normal cooldown check for other actions
        const cooldownDuration = DEVICE_COOLDOWNS[action.device] || SERVICE_CALL_COOLDOWN;
        const lastCall = cooldownRef.current[actionKey];
        if (lastCall && Date.now() - lastCall < cooldownDuration) {
          const remaining = Math.round((cooldownDuration - (Date.now() - lastCall)) / 1000);
          console.log(`[ENV-CTRL] Skipping ${actionKey} - cooldown active (${remaining}s remaining)`);
          results.push({
            action,
            success: false,
            error: 'Cooldown active - too soon since last call',
            skipped: true,
          });
          continue;
        }
      }
      
      console.log(`[ENV-CTRL] Executing: ${action.reason}`);
      console.log(`[ENV-CTRL]   Device: ${action.device}, Action: ${action.action}`);
      
      try {
        let serviceResult;
        
        switch (action.device) {
          case 'humidifier':
            // Set max intensity (10) with fallback to On/Off
            if (action.action === 'set_max_intensity') {
              // First, check current state BEFORE making any API calls
              const currentIntensity = parseFloat(getEntityState?.(ENTITIES.HUMIDIFIER_ON_POWER) || 0);
              const currentMode = getEntityState?.(ENTITIES.HUMIDIFIER_MODE);
              
              // If already at max intensity and ON, skip entirely (no API call needed)
              if (currentMode === 'On' && currentIntensity === 10) {
                console.log('[ENV-CTRL] Humidifier already at max intensity (10) and ON, skipping API call');
                results.push({
                  action,
                  success: true,
                  skipped: true,
                  reason: 'Already at max intensity (10)',
                });
                continue;
              }
              
              // If not at 10, try to set it
              console.log(`[ENV-CTRL] Setting humidifier to MAX intensity (10)`);
              console.log(`[ENV-CTRL] Current: mode=${currentMode}, intensity=${currentIntensity}`);
              
              // Try to set intensity to 10
              serviceResult = await callService('number', 'set_value', {
                entity_id: ENTITIES.HUMIDIFIER_ON_POWER,
                value: 10,
              });
              
              if (serviceResult?.success) {
                console.log('[ENV-CTRL] ✓ Humidifier set to intensity 10');
                
                // Also ensure it's ON (mode might be Off or Auto)
                if (currentMode !== 'On') {
                  console.log('[ENV-CTRL] Also setting mode to ON');
                  const modeResult = await callService('select', 'select_option', {
                    entity_id: ENTITIES.HUMIDIFIER_MODE,
                    option: 'On',
                  });
                  if (modeResult?.success) {
                    console.log('[ENV-CTRL] ✓ Humidifier mode set to ON');
                  }
                }
                
                // Set cooldown after successful intensity change (5 minutes)
                cooldownRef.current[actionKey] = Date.now();
                cooldownRef.current['humidifier_intensity'] = Date.now();
                console.log(`[ENV-CTRL] Humidifier cooldown set to 5 minutes after intensity change`);
              } else {
                // FALLBACK: If intensity control failed, check for rate limit
                const errorCode = serviceResult?.errorCode;
                const errorMsg = serviceResult?.error || '';
                const isACInfinityError = errorCode === 100001 || 
                                         errorCode === '100001' || 
                                         (errorMsg.includes('code') && errorMsg.includes('100001')) ||
                                         errorMsg.includes('Something went wrong');
                
                if (isACInfinityError) {
                  console.log('[ENV-CTRL] AC Infinity rate limit (code 100001) - device is rate limited');
                  
                  // Check if it's already ON (even if not at intensity 10)
                  const checkMode = getEntityState?.(ENTITIES.HUMIDIFIER_MODE);
                  if (checkMode === 'On') {
                    console.log('[ENV-CTRL] Humidifier is ON (intensity may not be 10 due to rate limit, but device is running)');
                    console.log('[ENV-CTRL] Setting extended cooldown (30 min) to avoid repeated rate limit errors');
                    serviceResult = { success: true, partial: true, reason: 'Already ON, intensity rate limited - will retry later' };
                    
                    // Set EXTENDED cooldown (30 minutes) for intensity changes when rate limited
                    // This prevents constant retries that keep hitting rate limits
                    const extendedCooldown = 30 * 60 * 1000; // 30 minutes
                    cooldownRef.current[actionKey] = Date.now();
                    cooldownRef.current['humidifier_intensity'] = Date.now() + extendedCooldown;
                    console.log(`[ENV-CTRL] Extended cooldown set to 30 minutes to avoid rate limit`);
                  } else {
                    // Not ON - try simple ON command (less likely to be rate limited)
                    console.log('[ENV-CTRL] Trying simple ON command (fallback, less likely to hit rate limit)');
                    const fallbackResult = await callService('select', 'select_option', {
                      entity_id: ENTITIES.HUMIDIFIER_MODE,
                      option: 'On',
                    });
                    
                    if (fallbackResult?.success) {
                      console.log('[ENV-CTRL] ✓ Humidifier turned ON (fallback)');
                      serviceResult = { success: true, partial: true, reason: 'Turned ON via fallback (intensity rate limited)' };
                      cooldownRef.current[actionKey] = Date.now();
                      // Still set extended cooldown for intensity changes
                      cooldownRef.current['humidifier_intensity'] = Date.now() + (30 * 60 * 1000);
                    } else {
                      // Fallback also failed, keep original error
                      console.warn('[ENV-CTRL] Fallback ON command also failed');
                      // Set extended cooldown anyway to prevent rapid retries
                      cooldownRef.current['humidifier_intensity'] = Date.now() + (30 * 60 * 1000);
                    }
                  }
                } else {
                  // Non-rate-limit error - set normal cooldown
                  cooldownRef.current[actionKey] = Date.now();
                }
              }
            }
            // Turn on/off (used for VPD_LOW or HUMIDITY_HIGH cases)
            else if (action.action === 'turn_on') {
              // Simple ON - also try to set intensity to 10
              console.log('[ENV-CTRL] Turning humidifier ON at max intensity');
              
              // First set intensity
              try {
                const intensityResult = await callService('number', 'set_value', {
                  entity_id: ENTITIES.HUMIDIFIER_ON_POWER,
                  value: 10,
                });
                if (intensityResult?.success) {
                  console.log('[ENV-CTRL] ✓ Intensity set to 10');
                }
              } catch (e) {
                console.warn('[ENV-CTRL] Could not set intensity, continuing with ON');
              }
              
              // Then turn ON
              const currentHumidifierState = getEntityState?.(ENTITIES.HUMIDIFIER_MODE);
              if (currentHumidifierState === 'On') {
                console.log(`[ENV-CTRL] Humidifier already ON, skipping service call`);
                results.push({ 
                  action, 
                  success: true,
                  skipped: true,
                  reason: 'Already On',
                });
                continue;
              }
              
              serviceResult = await callService('select', 'select_option', {
                entity_id: ENTITIES.HUMIDIFIER_MODE,
                option: 'On',
              });
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
              }
            }
            else if (action.action === 'turn_off') {
              const currentHumidifierState = getEntityState?.(ENTITIES.HUMIDIFIER_MODE);
              if (currentHumidifierState === 'Off') {
                console.log(`[ENV-CTRL] Humidifier already OFF, skipping service call`);
                results.push({ 
                  action, 
                  success: true,
                  skipped: true,
                  reason: 'Already Off',
                });
                continue;
              }
              
              console.log('[ENV-CTRL] Turning humidifier OFF');
              serviceResult = await callService('select', 'select_option', {
                entity_id: ENTITIES.HUMIDIFIER_MODE,
                option: 'Off',
              });
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
              }
            }
            break;
            
          case 'exhaustFan':
            if (action.action === 'reduce_power' || action.action === 'increase_power') {
              serviceResult = await callService('number', 'set_value', {
                entity_id: ENTITIES.EXHAUST_FAN_ON_POWER,
                value: action.toPower,
              });
              // Update cooldown only on success
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
              }
            }
            break;
            
          case 'heater':
            if (action.action === 'reduce_temp' || action.action === 'increase_temp') {
              serviceResult = await callService('climate', 'set_temperature', {
                entity_id: ENTITIES.HEATER,
                temperature: action.toTemp,
              });
              // Update cooldown only on success
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
              }
            }
            break;
        }
        
        // callService returns {success: true, data} on success
        // On error, it may return {success: false, error} or throw
        if (!serviceResult) {
          throw new Error('No result returned from service call');
        }
        
        const success = serviceResult.success === true;
        if (!success) {
          // Extract error message from various possible formats
          const errorObj = serviceResult.errorObject || serviceResult;
          let errorMsg = serviceResult.error;
          const errorCode = serviceResult.errorCode || errorObj?.code;
          
          // If no error message, try to extract from error object
          if (!errorMsg) {
            if (errorObj?.msg) {
              errorMsg = errorObj.msg;
            } else if (errorObj?.message) {
              errorMsg = errorObj.message;
              // Try to parse JSON from message if it looks like JSON
              if (errorMsg.trim().startsWith('{') || errorMsg.trim().startsWith('[')) {
                try {
                  const parsed = JSON.parse(errorMsg);
                  if (parsed.msg) {
                    errorMsg = parsed.msg;
                  }
                } catch (parseErr) {
                  // Keep original message if parsing fails
                }
              }
            } else if (serviceResult.data?.message) {
              errorMsg = serviceResult.data.message;
            } else if (serviceResult.data?.msg) {
              errorMsg = serviceResult.data.msg;
            }
          }
          
          // If still no message, try to stringify
          if (!errorMsg && errorObj) {
            try {
              errorMsg = JSON.stringify(errorObj);
            } catch (e) {
              errorMsg = String(errorObj);
            }
          }
          
          if (!errorMsg) {
            errorMsg = 'Unknown error - check console for details';
          }
          
          // Log with full details for debugging (log as separate lines for better visibility)
          console.error(`[ENV-CTRL] Service call failed for ${action.device}:`);
          console.error('  Device:', action.device);
          console.error('  Action:', action.action);
          console.error('  Error Message:', errorMsg);
          console.error('  Error Code:', errorCode);
          console.error('  Error Object:', errorObj);
          console.error('  Full Result:', serviceResult);
          
          // Special handling for AC Infinity API errors (code 100001)
          // Check error code (may be number or string) or error message
          const isACInfinityError = errorCode === 100001 || 
                                   errorCode === '100001' || 
                                   (errorMsg.includes('code') && errorMsg.includes('100001')) ||
                                   errorMsg.includes('Something went wrong');
          
          if (isACInfinityError) {
            console.warn('[ENV-CTRL] AC Infinity API error detected (code 100001)');
            console.warn('  This is likely rate limiting or device state conflict.');
            console.warn('  The device may already be in the requested state.');
            console.warn('  Cooldown will be extended to prevent further errors.');
            
            // Extend cooldown for AC Infinity errors to prevent rapid retries
            if (action.device === 'humidifier' || action.device === 'exhaustFan') {
              const extendedCooldown = (DEVICE_COOLDOWNS[action.device] || SERVICE_CALL_COOLDOWN) * 2;
              cooldownRef.current[actionKey] = Date.now() + extendedCooldown;
              console.warn(`[ENV-CTRL] Extended cooldown for ${action.device} to ${extendedCooldown / 1000}s`);
            }
          }
          
          results.push({ 
            action, 
            success: false,
            error: errorMsg,
            errorCode: serviceResult.errorCode || errorObj?.code,
            result: serviceResult,
          });
        } else {
          results.push({ 
            action, 
            success: true,
            result: serviceResult.data || serviceResult,
          });
        }
      } catch (error) {
        console.error(`[ENV-CTRL] Failed to execute action:`, {
          device: action.device,
          action: action.action,
          error: error.message || String(error),
          errorObject: error,
        });
        results.push({ 
          action, 
          success: false, 
          error: error.message || String(error),
        });
      }
    }
    
    return results;
  }
}

/**
 * Create a controller instance from current HA state
 * 
 * @param {Object} entities - Entity states from useHomeAssistant hook
 * @param {Object} stage - Current phenology stage
 * @returns {EnvironmentController}
 */
export function createControllerFromState(entities, stage) {
  // Extract current state
  const currentState = {
    temp: parseFloat(entities[ENTITIES.TEMPERATURE]?.state || 0),
    humidity: parseFloat(entities[ENTITIES.HUMIDITY]?.state || 0),
    vpd: parseFloat(entities[ENTITIES.VPD]?.state || 0),
  };
  
  // Extract target state from stage
  const targetState = {
    tempMin: stage.temperature?.day?.min || 75,
    tempMax: stage.temperature?.day?.max || 82,
    tempOptimal: stage.temperature?.day?.target || 77,
    humidityMin: stage.humidity?.min || 65,
    humidityMax: stage.humidity?.max || 75,
    humidityOptimal: stage.humidity?.optimal || 70,
    vpdMin: stage.vpd?.min || 0.4,
    vpdMax: stage.vpd?.max || 0.8,
    vpdOptimal: stage.vpd?.optimal || 0.6,
  };
  
  // Extract actuator states
  const actuators = {
    exhaustFan: {
      mode: entities[ENTITIES.EXHAUST_FAN_MODE]?.state,
      currentPower: parseFloat(entities[ENTITIES.EXHAUST_FAN_CURRENT_POWER]?.state || 5),
    },
    humidifier: {
      mode: entities[ENTITIES.HUMIDIFIER_MODE]?.state,
      currentPower: parseFloat(entities[ENTITIES.HUMIDIFIER_ON_POWER]?.state || 0),
    },
    heater: {
      currentTemp: parseFloat(entities[ENTITIES.HEATER]?.attributes?.current_temperature || 0),
      targetTemp: parseFloat(entities[ENTITIES.HEATER]?.attributes?.temperature || 0),
    },
  };
  
  return new EnvironmentController(currentState, targetState, actuators);
}
