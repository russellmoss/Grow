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
 * AC Infinity cloud API has ~3-5 minute rate limits per device
 */
const DEVICE_COOLDOWNS = {
  humidifier: 300000,   // 5 minutes - AC Infinity rate limit safe
  exhaustFan: 300000,   // 5 minutes - AC Infinity rate limit safe
  heater: 60000,        // 1 minute - Not AC Infinity, can be faster
  light: 10000,         // 10 seconds - Zigbee, very fast
  vicksHumidifier: 30000, // 30 seconds - Zigbee, no rate limits but avoid rapid toggling
};

/**
 * AC Infinity devices that share the same rate limit pool
 */
const AC_INFINITY_DEVICES = ['humidifier', 'exhaustFan'];
const AC_INFINITY_GLOBAL_COOLDOWN = 120000; // 2 minutes between ANY AC Infinity calls

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
 * Calculate optimal exhaust fan power based on environmental conditions
 * 
 * @param {Object} params
 * @param {number} params.currentVPD - Current VPD (kPa)
 * @param {number} params.targetVPD - Target VPD (kPa)
 * @param {number} params.currentHumidity - Current humidity (%)
 * @param {number} params.targetHumidity - Target humidity (%)
 * @param {number} params.currentTemp - Current temperature (°F)
 * @param {number} params.targetTemp - Target temperature (°F)
 * @param {number} params.currentFanPower - Current fan power (0-10)
 * @returns {number} Optimal fan power (1-10, minimum 1 for air exchange)
 */
function calculateOptimalFanPower({ currentVPD, targetVPD, currentHumidity, targetHumidity, currentTemp, targetTemp, currentFanPower }) {
  const MIN_FAN_POWER = 1; // Minimum for air exchange (prevent stagnant air)
  const MAX_FAN_POWER = 10;
  const BASE_FAN_POWER = 2; // Baseline for normal operation
  
  // Calculate deltas
  const vpdDelta = currentVPD - targetVPD; // Positive = too high (dry), Negative = too low (humid)
  const humidityDelta = currentHumidity - targetHumidity; // Positive = too high, Negative = too low
  const tempDelta = currentTemp - targetTemp; // Positive = too high, Negative = too low
  
  // Start with baseline
  let targetPower = BASE_FAN_POWER;
  
  // VPD-based adjustments (highest priority for plant health)
  if (vpdDelta > 0.3) {
    // VPD too high (air too dry) - reduce fan to retain moisture
    // Each 0.1 kPa over target = reduce by 0.5 power
    const reduction = Math.min(vpdDelta * 5, 3); // Max reduction of 3
    targetPower = Math.max(BASE_FAN_POWER - reduction, MIN_FAN_POWER);
  } else if (vpdDelta < -0.2) {
    // VPD too low (air too humid) - increase fan to remove moisture
    // Each 0.1 kPa under target = increase by 1 power
    const increase = Math.min(Math.abs(vpdDelta) * 10, 5); // Max increase of 5
    targetPower = Math.min(BASE_FAN_POWER + increase, MAX_FAN_POWER);
  }
  
  // Humidity-based adjustments (secondary priority)
  if (Math.abs(vpdDelta) < 0.2) {
    // Only adjust for humidity if VPD is close to target
    if (humidityDelta > 10) {
      // Humidity way too high - increase fan
      const increase = Math.min((humidityDelta - 10) / 5, 3); // Max increase of 3
      targetPower = Math.min(targetPower + increase, MAX_FAN_POWER);
    } else if (humidityDelta < -10) {
      // Humidity way too low - reduce fan
      const reduction = Math.min(Math.abs(humidityDelta - 10) / 5, 2); // Max reduction of 2
      targetPower = Math.max(targetPower - reduction, MIN_FAN_POWER);
    }
  }
  
  // Temperature-based adjustments (only if VPD allows)
  if (Math.abs(vpdDelta) < 0.15) {
    // VPD is good, can use fan for temperature control
    if (tempDelta > 3) {
      // Temperature too high - increase fan for cooling
      const increase = Math.min(tempDelta / 2, 3); // Max increase of 3
      targetPower = Math.min(targetPower + increase, MAX_FAN_POWER);
    } else if (tempDelta < -2) {
      // Temperature too low - reduce fan to retain heat
      const reduction = Math.min(Math.abs(tempDelta) / 2, 2); // Max reduction of 2
      targetPower = Math.max(targetPower - reduction, MIN_FAN_POWER);
    }
  }
  
  // Round to nearest integer
  targetPower = Math.round(targetPower);
  
  // Ensure within bounds
  targetPower = Math.max(MIN_FAN_POWER, Math.min(MAX_FAN_POWER, targetPower));
  
  // Only change if difference is significant (avoid micro-adjustments)
  const powerDelta = Math.abs(targetPower - currentFanPower);
  if (powerDelta < 1) {
    // Keep current power if change is less than 1 level
    return currentFanPower;
  }
  
  return targetPower;
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
   * Returns priority-ordered list of problems with control assignment
   * 
   * @returns {Array<Object>} List of problems, sorted by severity
   */
  analyzeState() {
    const problems = [];
    
    // Check VPD (highest priority for plant health)
    // VPD is controlled by AC Infinity app (humidifier + exhaust fan)
    if (this.current.vpd > this.target.vpdMax) {
      problems.push({
        type: 'VPD_HIGH',
        severity: calculateSeverity(this.current.vpd, this.target.vpdMax),
        currentValue: this.current.vpd,
        targetValue: this.target.vpdOptimal,
        delta: this.current.vpd - this.target.vpdMax,
        description: `VPD too high (${this.current.vpd.toFixed(2)} kPa) - Air is too dry`,
        controlledBy: 'AC_INFINITY', // AC Infinity app controls VPD
      });
    } else if (this.current.vpd < this.target.vpdMin) {
      problems.push({
        type: 'VPD_LOW',
        severity: calculateSeverity(this.target.vpdMin, this.current.vpd),
        currentValue: this.current.vpd,
        targetValue: this.target.vpdOptimal,
        delta: this.target.vpdMin - this.current.vpd,
        description: `VPD too low (${this.current.vpd.toFixed(2)} kPa) - Air is too humid`,
        controlledBy: 'AC_INFINITY', // AC Infinity app controls VPD
      });
    }
    
    // Check temperature
    // Temperature is controlled by Dashboard (heater)
    if (this.current.temp > this.target.tempMax) {
      problems.push({
        type: 'TEMP_HIGH',
        severity: calculateSeverity(this.current.temp, this.target.tempMax),
        currentValue: this.current.temp,
        targetValue: this.target.tempOptimal,
        delta: this.current.temp - this.target.tempMax,
        description: `Temperature too high (${this.current.temp.toFixed(1)}°F)`,
        controlledBy: 'DASHBOARD', // Dashboard controls heater
      });
    } else if (this.current.temp < this.target.tempMin) {
      problems.push({
        type: 'TEMP_LOW',
        severity: calculateSeverity(this.target.tempMin, this.current.temp),
        currentValue: this.current.temp,
        targetValue: this.target.tempOptimal,
        delta: this.target.tempMin - this.current.temp,
        description: `Temperature too low (${this.current.temp.toFixed(1)}°F)`,
        controlledBy: 'DASHBOARD', // Dashboard controls heater
      });
    }
    
    // Check humidity
    // Humidity is controlled by AC Infinity app (humidifier)
    if (this.current.humidity < this.target.humidityMin) {
      problems.push({
        type: 'HUMIDITY_LOW',
        severity: calculateSeverity(this.target.humidityMin, this.current.humidity),
        currentValue: this.current.humidity,
        targetValue: this.target.humidityOptimal,
        delta: this.target.humidityMin - this.current.humidity,
        description: `Humidity too low (${this.current.humidity.toFixed(1)}%)`,
        controlledBy: 'AC_INFINITY', // AC Infinity app controls humidifier
      });
    } else if (this.current.humidity > this.target.humidityMax) {
      problems.push({
        type: 'HUMIDITY_HIGH',
        severity: calculateSeverity(this.current.humidity, this.target.humidityMax),
        currentValue: this.current.humidity,
        targetValue: this.target.humidityOptimal,
        delta: this.current.humidity - this.target.humidityMax,
        description: `Humidity too high (${this.current.humidity.toFixed(1)}%)`,
        controlledBy: 'AC_INFINITY', // AC Infinity app controls humidifier
      });
    }
    
    // Sort by severity (most severe first)
    return problems.sort((a, b) => b.severity - a.severity);
  }

  /**
   * Generate coordinated action plan to fix problems
   * Considers actuator interactions and prevents conflicts
   * 
   * Hybrid Architecture:
   * - DASHBOARD controls: Heater (temperature)
   * - AC_INFINITY controls: Humidifier, Exhaust Fan (VPD/humidity)
   * 
   * @param {Array<Object>} problems - List of problems from analyzeState()
   * @returns {Object} { actions: Array<Object>, recommendations: Array<Object> }
   */
  generateActionPlan(problems) {
    const actions = []; // Actions for dashboard-controlled devices (heater)
    const recommendations = []; // Recommendations for AC Infinity-controlled devices
    
    // Process each problem in priority order
    for (const problem of problems) {
      switch (problem.type) {
        case 'VPD_HIGH': {
          // VPD too high = air too dry
          // Root causes: low humidity OR high temperature
          // VPD is controlled by AC Infinity app
          
          if (this.current.humidity < this.target.humidityOptimal) {
            // Problem is primarily low humidity - recommend AC Infinity adjustment
            const currentIntensity = this.actuators.humidifier?.currentPower || 0;
            const currentMode = this.actuators.humidifier?.mode;
            // CloudForge is at max if: (On mode AND intensity >= 10) OR (VPD mode AND intensity >= 10)
            const cloudForgeAtMax = (currentMode === 'On' || currentMode === 'VPD') && currentIntensity >= 10;
            
            if (currentMode !== 'On' && currentMode !== 'VPD') {
              recommendations.push({
                device: 'humidifier',
                type: 'VPD_HIGH',
                severity: problem.severity,
                action: 'set_vpd_mode',
                currentValue: currentMode,
                recommendedValue: 'VPD',
                reason: `VPD is too high (${this.current.vpd.toFixed(2)} kPa). Set CloudForge to VPD mode in AC Infinity app.`,
                priority: 1,
              });
            } else if (currentIntensity < 10) {
              recommendations.push({
                device: 'humidifier',
                type: 'VPD_HIGH',
                severity: problem.severity,
                action: 'increase_intensity',
                currentValue: currentIntensity,
                recommendedValue: 10,
                reason: `VPD is too high (${this.current.vpd.toFixed(2)} kPa). Increase humidifier intensity to maximum (10) to add moisture.`,
                priority: 1,
              });
            }
            
            // Vicks Bridge Logic: Turn ON if CloudForge at max AND humidity still low
            const vicksState = this.actuators.vicksHumidifier?.state || 'off';
            if (cloudForgeAtMax && vicksState === 'off' && this.current.humidity < this.target.humidityMin) {
              actions.push({
                device: 'vicksHumidifier',
                action: 'turn_on',
                reason: `VPD high (${this.current.vpd.toFixed(2)} kPa) and humidity low (${this.current.humidity.toFixed(1)}%). CloudForge at max (10). Activating Vicks humidifier bridge for additional capacity.`,
                priority: 1,
              });
            }
            
            // Calculate optimal fan power
            const currentFanPower = this.actuators.exhaustFan?.currentPower || 2;
            const optimalFanPower = calculateOptimalFanPower({
              currentVPD: this.current.vpd,
              targetVPD: this.target.vpdOptimal,
              currentHumidity: this.current.humidity,
              targetHumidity: this.target.humidityOptimal,
              currentTemp: this.current.temp,
              targetTemp: this.target.tempOptimal,
              currentFanPower: currentFanPower,
            });
            
            if (optimalFanPower !== currentFanPower) {
              recommendations.push({
                device: 'exhaustFan',
                type: 'VPD_HIGH',
                severity: problem.severity,
                action: optimalFanPower > currentFanPower ? 'increase_power' : 'reduce_power',
                currentValue: currentFanPower,
                recommendedValue: optimalFanPower,
                reason: `Reduce exhaust fan power to ${optimalFanPower} to retain moisture (VPD: ${this.current.vpd.toFixed(2)}→${this.target.vpdOptimal.toFixed(2)} kPa)`,
                priority: 2,
              });
            }
          } else if (this.current.temp > this.target.tempOptimal) {
            // Problem is primarily high temperature - Dashboard can control heater
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
        }
          
        case 'VPD_LOW': {
          // VPD too low = air too humid
          // Solutions: increase exhaust, reduce humidifier, increase temp
          // VPD is controlled by AC Infinity app
          
          // Turn OFF Vicks if it's on (VPD too low means too much humidity)
          const vicksState = this.actuators.vicksHumidifier?.state || 'off';
          if (vicksState === 'on') {
            actions.push({
              device: 'vicksHumidifier',
              action: 'turn_off',
              reason: `VPD too low (${this.current.vpd.toFixed(2)} kPa). Turning off Vicks humidifier to reduce moisture.`,
              priority: 1,
            });
          }
          
          // Recommend turning off humidifier
          const vpdLowCurrentMode = this.actuators.humidifier?.mode;
          if (vpdLowCurrentMode !== 'Off') {
            recommendations.push({
              device: 'humidifier',
              type: 'VPD_LOW',
              severity: problem.severity,
              action: 'turn_off',
              currentValue: vpdLowCurrentMode,
              recommendedValue: 'Off',
              reason: `VPD is too low (${this.current.vpd.toFixed(2)} kPa). Turn off humidifier to stop adding moisture.`,
              priority: 1,
            });
          }
          
          // Calculate optimal fan power
          const currentFanPower = this.actuators.exhaustFan?.currentPower || 2;
          const optimalFanPower = calculateOptimalFanPower({
            currentVPD: this.current.vpd,
            targetVPD: this.target.vpdOptimal,
            currentHumidity: this.current.humidity,
            targetHumidity: this.target.humidityOptimal,
            currentTemp: this.current.temp,
            targetTemp: this.target.tempOptimal,
            currentFanPower: currentFanPower,
          });
          
          if (optimalFanPower !== currentFanPower) {
            recommendations.push({
              device: 'exhaustFan',
              type: 'VPD_LOW',
              severity: problem.severity,
              action: optimalFanPower > currentFanPower ? 'increase_power' : 'reduce_power',
              currentValue: currentFanPower,
              recommendedValue: optimalFanPower,
              reason: `Adjust exhaust fan to ${optimalFanPower} to remove excess moisture (VPD: ${this.current.vpd.toFixed(2)}→${this.target.vpdOptimal.toFixed(2)} kPa, Humidity: ${this.current.humidity.toFixed(1)}%)`,
              priority: 2,
            });
          }
          break;
        }
          
        case 'TEMP_HIGH': {
          // Temperature too high
          // Dashboard controls heater directly
          
          // Calculate optimal fan power (for recommendation if VPD allows)
          const currentFanPower = this.actuators.exhaustFan?.currentPower || 2;
          const optimalFanPower = calculateOptimalFanPower({
            currentVPD: this.current.vpd,
            targetVPD: this.target.vpdOptimal,
            currentHumidity: this.current.humidity,
            targetHumidity: this.target.humidityOptimal,
            currentTemp: this.current.temp,
            targetTemp: this.target.tempOptimal,
            currentFanPower: currentFanPower,
          });
          
          if (optimalFanPower !== currentFanPower && this.current.vpd < this.target.vpdMax) {
            // VPD allows fan increase - recommend it
            recommendations.push({
              device: 'exhaustFan',
              type: 'TEMP_HIGH',
              severity: problem.severity,
              action: 'increase_power',
              currentValue: currentFanPower,
              recommendedValue: optimalFanPower,
              reason: `Temperature is high (${this.current.temp.toFixed(1)}°F). Increase exhaust fan to ${optimalFanPower} for cooling (VPD allows: ${this.current.vpd.toFixed(2)} kPa)`,
              priority: 2,
            });
          }
          
          // Dashboard can directly reduce heater temperature
          actions.push({
            device: 'heater',
            action: 'reduce_temp',
            toTemp: this.target.tempOptimal,
            reason: `Reduce heater setpoint to ${this.target.tempOptimal}°F (currently ${this.current.temp.toFixed(1)}°F)`,
            priority: 1,
          });
          break;
        }
          
        case 'TEMP_LOW': {
          // Temperature too low
          actions.push({
            device: 'heater',
            action: 'increase_temp',
            toTemp: this.target.tempOptimal,
            reason: `Increase heater setpoint (currently ${this.current.temp.toFixed(1)}°F, target ${this.target.tempOptimal}°F)`,
            priority: 1,
          });
          break;
        }
          
        case 'HUMIDITY_LOW': {
          // Humidity too low - recommend AC Infinity adjustment
          const currentIntensity = this.actuators.humidifier?.currentPower || 0;
          const currentMode = this.actuators.humidifier?.mode;
          // CloudForge is at max if: (On mode AND intensity >= 10) OR (VPD mode AND intensity >= 10)
          const cloudForgeAtMax = (currentMode === 'On' || currentMode === 'VPD') && currentIntensity >= 10;
          
          if (currentMode !== 'On' && currentMode !== 'VPD') {
            recommendations.push({
              device: 'humidifier',
              type: 'HUMIDITY_LOW',
              severity: problem.severity,
              action: 'set_vpd_mode',
              currentValue: currentMode,
              recommendedValue: 'VPD',
              reason: `Humidity is too low (${this.current.humidity.toFixed(1)}%). Set CloudForge to VPD mode in AC Infinity app.`,
              priority: 1,
            });
          } else if (currentIntensity < 10) {
            recommendations.push({
              device: 'humidifier',
              type: 'HUMIDITY_LOW',
              severity: problem.severity,
              action: 'increase_intensity',
              currentValue: currentIntensity,
              recommendedValue: 10,
              reason: `Humidity is too low (${this.current.humidity.toFixed(1)}%). Increase humidifier intensity to maximum (10) in AC Infinity app.`,
              priority: 1,
            });
          }
          
          // Vicks Bridge Logic: Turn ON if CloudForge at max AND humidity still low
          const vicksState = this.actuators.vicksHumidifier?.state || 'off';
          if (cloudForgeAtMax && vicksState === 'off' && this.current.humidity < this.target.humidityMin) {
            actions.push({
              device: 'vicksHumidifier',
              action: 'turn_on',
              reason: `Humidity low (${this.current.humidity.toFixed(1)}%, target ${this.target.humidityOptimal}%). CloudForge at max (10). Activating Vicks humidifier bridge for additional capacity.`,
              priority: 1,
            });
          }
          
          // Calculate optimal fan power
          const currentFanPower = this.actuators.exhaustFan?.currentPower || 2;
          const optimalFanPower = calculateOptimalFanPower({
            currentVPD: this.current.vpd,
            targetVPD: this.target.vpdOptimal,
            currentHumidity: this.current.humidity,
            targetHumidity: this.target.humidityOptimal,
            currentTemp: this.current.temp,
            targetTemp: this.target.tempOptimal,
            currentFanPower: currentFanPower,
          });
          
          if (optimalFanPower !== currentFanPower) {
            recommendations.push({
              device: 'exhaustFan',
              type: 'HUMIDITY_LOW',
              severity: problem.severity,
              action: optimalFanPower > currentFanPower ? 'increase_power' : 'reduce_power',
              currentValue: currentFanPower,
              recommendedValue: optimalFanPower,
              reason: `Adjust exhaust fan to ${optimalFanPower} to balance moisture retention (VPD: ${this.current.vpd.toFixed(2)} kPa, Humidity: ${this.current.humidity.toFixed(1)}%)`,
              priority: 2,
            });
          }
          break;
        }
          
        case 'HUMIDITY_HIGH': {
          // Humidity too high - recommend AC Infinity adjustment
          // Vicks is a VPD bridge, so only turn it off if VPD is also low (too much moisture overall)
          // Don't turn off Vicks based on humidity alone - VPD is the primary metric
          const vicksState = this.actuators.vicksHumidifier?.state || 'off';
          const vpdTooLow = this.current.vpd < this.target.vpdMin;
          
          if (vicksState === 'on' && vpdTooLow) {
            // Only turn off Vicks if VPD is too low (indicates too much moisture overall)
            // This means both humidity AND VPD indicate excess moisture
            actions.push({
              device: 'vicksHumidifier',
              action: 'turn_off',
              reason: `VPD too low (${this.current.vpd.toFixed(2)} kPa) and humidity high (${this.current.humidity.toFixed(1)}%). Turning off Vicks humidifier to reduce moisture.`,
              priority: 1,
            });
          }
          
          if (this.current.humidity > this.target.humidityMax + 10) {
            const humidityHighCurrentMode = this.actuators.humidifier?.mode;
            if (humidityHighCurrentMode !== 'Off') {
              recommendations.push({
                device: 'humidifier',
                type: 'HUMIDITY_HIGH',
                severity: problem.severity,
                action: 'turn_off',
                currentValue: humidityHighCurrentMode,
                recommendedValue: 'Off',
                reason: `Humidity ${this.current.humidity.toFixed(1)}% exceeds max by 10%+. Turn off humidifier in AC Infinity app.`,
                priority: 1,
              });
            }
          }
          
          // Calculate optimal fan power
          const currentFanPower = this.actuators.exhaustFan?.currentPower || 2;
          const optimalFanPower = calculateOptimalFanPower({
            currentVPD: this.current.vpd,
            targetVPD: this.target.vpdOptimal,
            currentHumidity: this.current.humidity,
            targetHumidity: this.target.humidityOptimal,
            currentTemp: this.current.temp,
            targetTemp: this.target.tempOptimal,
            currentFanPower: currentFanPower,
          });
          
          if (optimalFanPower !== currentFanPower) {
            recommendations.push({
              device: 'exhaustFan',
              type: 'HUMIDITY_HIGH',
              severity: problem.severity,
              action: optimalFanPower > currentFanPower ? 'increase_power' : 'reduce_power',
              currentValue: currentFanPower,
              recommendedValue: optimalFanPower,
              reason: `Adjust exhaust fan to ${optimalFanPower} to remove excess moisture (Humidity: ${this.current.humidity.toFixed(1)}%, VPD: ${this.current.vpd.toFixed(2)} kPa)`,
              priority: 2,
            });
          }
          break;
        }
      }
    }
    
    // Remove duplicate actions (keep highest priority)
    const deduplicatedActions = this._deduplicateActions(actions);
    const deduplicatedRecommendations = this._deduplicateActions(recommendations);
    
    // Additional logic: Turn OFF Vicks if VPD reaches optimal range (even if no problem detected)
    // Vicks is a VPD bridge - primary control should be based on VPD, not humidity
    // This ensures Vicks turns off when VPD conditions improve
    // BUT: Only if VPD is well within optimal range (not just barely in range) to respect manual control
    const vicksState = this.actuators.vicksHumidifier?.state || 'off';
    if (vicksState === 'on') {
      // Check if VPD is well within optimal range
      const vpdInRange = this.current.vpd >= this.target.vpdMin && this.current.vpd <= this.target.vpdMax;
      const vpdNearOptimal = Math.abs(this.current.vpd - this.target.vpdOptimal) <= 0.15; // Within 0.15 kPa of optimal (tighter than before)
      
      // Only auto-turn-off if VPD is well within optimal range
      // This respects manual control - if user turned it on, don't immediately turn it off
      // We focus on VPD because that's what Vicks is helping with (VPD bridge)
      if (vpdInRange && vpdNearOptimal) {
        // VPD is well within optimal range - turn off Vicks to let CloudForge handle it alone
        deduplicatedActions.push({
          device: 'vicksHumidifier',
          action: 'turn_off',
          reason: `VPD (${this.current.vpd.toFixed(2)} kPa) is well within optimal range. Turning off Vicks humidifier bridge.`,
          priority: 2,
        });
      }
    }
    
    return {
      actions: deduplicatedActions,
      recommendations: deduplicatedRecommendations,
    };
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
    // SAFETY: Block all AC Infinity device calls
    const AC_INFINITY_DEVICES = ['humidifier', 'exhaustFan'];
    const blockedActions = actions.filter(a => AC_INFINITY_DEVICES.includes(a.device));
    
    if (blockedActions.length > 0) {
      console.warn('[ENV-CTRL] BLOCKED: AC Infinity device calls disabled. Use AC Infinity app directly.');
      console.warn('[ENV-CTRL] Blocked actions:', blockedActions.map(a => `${a.device}: ${a.action}`));
      return blockedActions.map(a => ({
        action: a,
        success: false,
        skipped: true,
        error: 'AC Infinity control disabled - use app directly'
      }));
    }
    
    const results = [];
    const SERVICE_CALL_COOLDOWN = 30000; // 30 seconds between same calls (fallback)
    
    for (const action of actions) {
      // GLOBAL AC INFINITY COOLDOWN - only one AC Infinity call per cycle
      // This prevents multiple AC Infinity devices from being called in the same cycle
      if (AC_INFINITY_DEVICES.includes(action.device)) {
        const lastACCall = cooldownRef.current['_ac_infinity_global'];
        if (lastACCall && Date.now() - lastACCall < AC_INFINITY_GLOBAL_COOLDOWN) {
          const remaining = Math.round((AC_INFINITY_GLOBAL_COOLDOWN - (Date.now() - lastACCall)) / 1000);
          console.log(`[ENV-CTRL] Skipping ${action.device} ${action.action} - global AC Infinity cooldown (${remaining}s remaining)`);
          results.push({
            action,
            success: false,
            skipped: true,
            error: `AC Infinity global cooldown active (${remaining}s remaining)`,
          });
          continue;
        }
      }
      
      // Check cooldown before executing
      // Use device-specific cooldown (longer for AC Infinity devices)
      const actionKey = `${action.device}_${action.action}`;
      
      // Check device-specific cooldown (with support for extended durations from rate limit errors)
      const extendedDuration = cooldownRef.current[`${actionKey}_duration`];
      const cooldownDuration = extendedDuration || DEVICE_COOLDOWNS[action.device] || SERVICE_CALL_COOLDOWN;
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
      
      // Special handling for humidifier intensity (now simplified to just On/Off)
      if (action.device === 'humidifier' && action.action === 'set_max_intensity') {
        // Check if there's an extended intensity cooldown from previous rate limit
        const intensityLastCall = cooldownRef.current['humidifier_intensity'];
        const intensityDuration = cooldownRef.current['humidifier_intensity_duration'] || (5 * 60 * 1000);
        if (intensityLastCall && Date.now() - intensityLastCall < intensityDuration) {
          const remaining = Math.round((intensityDuration - (Date.now() - intensityLastCall)) / 1000);
          console.log(`[ENV-CTRL] Skipping ${actionKey} - intensity cooldown active (${remaining}s remaining)`);
          results.push({
            action,
            success: false,
            error: 'Intensity cooldown active - too soon since last call',
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
            // SIMPLIFIED: Just turn On/Off - no intensity API calls
            // AC Infinity devices can use their existing intensity setting
            if (action.action === 'set_max_intensity') {
              // SIMPLIFIED: Just ensure it's ON, don't try to set intensity
              // This reduces API calls from 2-4 down to just 1
              const currentMode = getEntityState?.(ENTITIES.HUMIDIFIER_MODE);
              
              if (currentMode === 'On') {
                console.log('[ENV-CTRL] Humidifier already ON, skipping API call');
                results.push({
                  action,
                  success: true,
                  skipped: true,
                  reason: 'Already ON (intensity will use existing setting)',
                });
                // Update global AC Infinity cooldown even on skip
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
                continue;
              }
              
              // Not ON - just turn it ON (single API call)
              console.log('[ENV-CTRL] Turning humidifier ON (simplified - no intensity call)');
              serviceResult = await callService('select', 'select_option', {
                entity_id: ENTITIES.HUMIDIFIER_MODE,
                option: 'On',
              });
              
              if (serviceResult?.success) {
                console.log('[ENV-CTRL] ✓ Humidifier turned ON');
                cooldownRef.current[actionKey] = Date.now();
                // Update global AC Infinity cooldown
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
              }
            }
            // Turn on/off (used for VPD_LOW or HUMIDITY_HIGH cases)
            else if (action.action === 'turn_on') {
              // Check current state FIRST to avoid unnecessary API calls
              const currentHumidifierState = getEntityState?.(ENTITIES.HUMIDIFIER_MODE);
              if (currentHumidifierState === 'On') {
                console.log(`[ENV-CTRL] Humidifier already ON, skipping service call`);
                results.push({ 
                  action, 
                  success: true,
                  skipped: true,
                  reason: 'Already On',
                });
                // Update global AC Infinity cooldown even on skip
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
                continue;
              }
              
              // Not already On - just turn it ON (single API call, no intensity)
              console.log('[ENV-CTRL] Turning humidifier ON');
              serviceResult = await callService('select', 'select_option', {
                entity_id: ENTITIES.HUMIDIFIER_MODE,
                option: 'On',
              });
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
                // Update global AC Infinity cooldown
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
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
                // Update global AC Infinity cooldown even on skip
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
                continue;
              }
              
              console.log('[ENV-CTRL] Turning humidifier OFF');
              serviceResult = await callService('select', 'select_option', {
                entity_id: ENTITIES.HUMIDIFIER_MODE,
                option: 'Off',
              });
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
                // Update global AC Infinity cooldown
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
              }
            }
            break;
            
          case 'exhaustFan':
            if (action.action === 'reduce_power' || action.action === 'increase_power') {
              // Check current fan mode - power control only works when mode is "On"
              const currentFanMode = getEntityState?.(ENTITIES.EXHAUST_FAN_MODE);
              const currentFanPower = parseFloat(getEntityState?.(ENTITIES.EXHAUST_FAN_CURRENT_POWER) || 0);
              
              // If fan is in Auto or Off mode, we need to turn it On first
              if (currentFanMode !== 'On') {
                console.log(`[ENV-CTRL] Exhaust fan is in "${currentFanMode}" mode, changing to "On" first`);
                const modeResult = await callService('select', 'select_option', {
                  entity_id: ENTITIES.EXHAUST_FAN_MODE,
                  option: 'On',
                });
                
                if (!modeResult?.success) {
                  console.error(`[ENV-CTRL] Failed to set exhaust fan mode to On: ${modeResult?.error || 'Unknown error'}`);
                  results.push({
                    action,
                    success: false,
                    error: `Cannot set power: ${modeResult?.error || 'Failed to turn fan On'}`,
                  });
                  continue;
                }
                
                // Wait a moment for the device to register the On state
                console.log(`[ENV-CTRL] Waiting 2s for fan to register On state...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
              
              // Check if already at target power (skip if close)
              // Re-check current power right before making the call (state may have changed)
              const recheckedFanPower = parseFloat(getEntityState?.(ENTITIES.EXHAUST_FAN_CURRENT_POWER) || 0);
              if (Math.abs(recheckedFanPower - action.toPower) < 1) {
                console.log(`[ENV-CTRL] Exhaust fan already at power ${recheckedFanPower} (target ${action.toPower}), skipping API call`);
                results.push({
                  action,
                  success: true,
                  skipped: true,
                  reason: `Already at power ${recheckedFanPower}`,
                });
                continue;
              }
              
              console.log(`[ENV-CTRL] Setting exhaust fan power: ${recheckedFanPower} → ${action.toPower}`);
              serviceResult = await callService('number', 'set_value', {
                entity_id: ENTITIES.EXHAUST_FAN_ON_POWER,
                value: action.toPower,
              });
              
              // Update cooldown only on success
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
                // Update global AC Infinity cooldown
                if (AC_INFINITY_DEVICES.includes(action.device)) {
                  cooldownRef.current['_ac_infinity_global'] = Date.now();
                }
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
            
          case 'vicksHumidifier':
            // Vicks humidifier is a Zigbee switch - no rate limits, can toggle freely
            if (action.action === 'turn_on') {
              const currentVicksState = getEntityState?.(ENTITIES.VICKS_HUMIDIFIER);
              if (currentVicksState === 'on') {
                console.log('[ENV-CTRL] Vicks humidifier already ON, skipping service call');
                results.push({
                  action,
                  success: true,
                  skipped: true,
                  reason: 'Already On',
                });
                continue;
              }
              
              console.log('[ENV-CTRL] Turning Vicks humidifier ON');
              serviceResult = await callService('switch', 'turn_on', {
                entity_id: ENTITIES.VICKS_HUMIDIFIER,
              });
              
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
                console.log('[ENV-CTRL] ✓ Vicks humidifier turned ON');
              }
            } else if (action.action === 'turn_off') {
              const currentVicksState = getEntityState?.(ENTITIES.VICKS_HUMIDIFIER);
              if (currentVicksState === 'off') {
                console.log('[ENV-CTRL] Vicks humidifier already OFF, skipping service call');
                results.push({
                  action,
                  success: true,
                  skipped: true,
                  reason: 'Already Off',
                });
                continue;
              }
              
              console.log('[ENV-CTRL] Turning Vicks humidifier OFF');
              serviceResult = await callService('switch', 'turn_off', {
                entity_id: ENTITIES.VICKS_HUMIDIFIER,
              });
              
              if (serviceResult?.success === true) {
                cooldownRef.current[actionKey] = Date.now();
                console.log('[ENV-CTRL] ✓ Vicks humidifier turned OFF');
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
            
            // For exhaust fan, check if already at target state
            if (action.device === 'exhaustFan' && (action.action === 'reduce_power' || action.action === 'increase_power')) {
              // Wait a moment and re-check actual state
              await new Promise(resolve => setTimeout(resolve, 1000));
              const finalFanPower = parseFloat(getEntityState?.(ENTITIES.EXHAUST_FAN_CURRENT_POWER) || 0);
              
              // If device is already at or very close to target, treat as success
              if (Math.abs(finalFanPower - action.toPower) <= 1) {
                console.log(`[ENV-CTRL] AC Infinity error, but fan is at power ${finalFanPower} (target ${action.toPower}) - treating as success`);
                results.push({
                  action,
                  success: true,
                  wasAlreadyAtTarget: true,
                  reason: `Device already at power ${finalFanPower}`,
                });
                // Set cooldown to prevent retries
                cooldownRef.current[actionKey] = Date.now();
                continue; // Skip the error result
              }
            }
            
            console.warn('  Cooldown will be extended to prevent further errors.');
            
            // Extend cooldown for AC Infinity errors to prevent rapid retries
            // Store call time (not expiration time) for consistency
            if (AC_INFINITY_DEVICES.includes(action.device)) {
              const extendedCooldown = (DEVICE_COOLDOWNS[action.device] || SERVICE_CALL_COOLDOWN) * 2;
              cooldownRef.current[actionKey] = Date.now(); // Store call time
              cooldownRef.current[`${actionKey}_duration`] = extendedCooldown; // Store duration separately
              cooldownRef.current['_ac_infinity_global'] = Date.now(); // Update global cooldown
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
 * @param {boolean} isDayTime - Whether it's day time (lights on)
 * @returns {EnvironmentController}
 */
/**
 * Update AC Infinity VPD settings based on phenology stage
 * 
 * This function writes VPD target, high trigger, and low trigger values to AC Infinity devices
 * when the phenology stage changes. Only updates if values have changed by at least 0.1 kPa
 * (AC Infinity step size requirement).
 * 
 * @param {Object} stage - Current phenology stage with VPD targets
 * @param {Function} callService - Home Assistant service call function
 * @param {Function} getEntityState - Function to get current entity state
 * @param {Object} cooldownRef - Ref object to track last update time
 * @returns {Promise<Object>} Update results with success status and changes made
 */
export async function updateACInfinityVPDSettings(stage, callService, getEntityState, cooldownRef = { current: {} }) {
  const VPD_SETTINGS_COOLDOWN = 60 * 60 * 1000; // 1 hour minimum between updates
  const lastUpdate = cooldownRef.current['_vpd_settings_update'];
  
  // Check cooldown
  if (lastUpdate && Date.now() - lastUpdate < VPD_SETTINGS_COOLDOWN) {
    const remaining = Math.round((VPD_SETTINGS_COOLDOWN - (Date.now() - lastUpdate)) / 1000 / 60);
    console.log(`[ENV-CTRL] VPD settings update skipped - cooldown active (${remaining} minutes remaining)`);
    return {
      success: false,
      skipped: true,
      reason: `Cooldown active (${remaining} minutes remaining)`,
    };
  }
  
  if (!stage || !stage.vpd) {
    console.warn('[ENV-CTRL] No stage or VPD targets provided for VPD settings update');
    return {
      success: false,
      error: 'No stage or VPD targets provided',
    };
  }
  
  const vpdTargets = stage.vpd;
  const results = {
    success: true,
    changes: [],
    skipped: [],
  };
  
  // Calculate VPD trigger values based on stage targets
  // High trigger should be slightly above max (when to activate)
  // Low trigger should be slightly below optimal (when to deactivate)
  const targetVPD = vpdTargets.optimal || ((vpdTargets.min + vpdTargets.max) / 2);
  const highTrigger = vpdTargets.max + 0.1; // Slightly above max
  const lowTrigger = Math.max(0.1, vpdTargets.min - 0.1); // Slightly below min, but not less than 0.1
  
  console.log(`[ENV-CTRL] Updating AC Infinity VPD settings for stage: ${stage.name}`);
  console.log(`[ENV-CTRL] Target VPD: ${targetVPD.toFixed(2)} kPa, High Trigger: ${highTrigger.toFixed(2)} kPa, Low Trigger: ${lowTrigger.toFixed(2)} kPa`);
  
  // Update CloudForge T5 VPD settings
  const cloudforgeUpdates = [
    {
      entity: ENTITIES.CLOUDFORGE_T5_TARGET_VPD,
      value: targetVPD,
      name: 'CloudForge Target VPD',
    },
    {
      entity: ENTITIES.CLOUDFORGE_T5_VPD_HIGH_TRIGGER,
      value: highTrigger,
      name: 'CloudForge VPD High Trigger',
    },
    {
      entity: ENTITIES.CLOUDFORGE_T5_VPD_LOW_TRIGGER,
      value: lowTrigger,
      name: 'CloudForge VPD Low Trigger',
    },
  ];
  
  for (const update of cloudforgeUpdates) {
    try {
      const currentValue = parseFloat(getEntityState?.(update.entity) || 0);
      const change = Math.abs(currentValue - update.value);
      
      // Only update if change is >= 0.1 (AC Infinity step size requirement)
      if (change < 0.1) {
        console.log(`[ENV-CTRL] Skipping ${update.name}: current ${currentValue.toFixed(2)}, target ${update.value.toFixed(2)} (change ${change.toFixed(2)} < 0.1)`);
        results.skipped.push({
          entity: update.entity,
          reason: `Change too small (${change.toFixed(2)} < 0.1)`,
        });
        continue;
      }
      
      console.log(`[ENV-CTRL] Updating ${update.name}: ${currentValue.toFixed(2)} → ${update.value.toFixed(2)} kPa`);
      const serviceResult = await callService('number', 'set_value', {
        entity_id: update.entity,
        value: update.value,
      });
      
      if (serviceResult?.success === true) {
        results.changes.push({
          entity: update.entity,
          name: update.name,
          from: currentValue,
          to: update.value,
        });
        console.log(`[ENV-CTRL] ✓ ${update.name} updated successfully`);
      } else {
        console.error(`[ENV-CTRL] Failed to update ${update.name}:`, serviceResult?.error || 'Unknown error');
        results.success = false;
        results.errors = results.errors || [];
        results.errors.push({
          entity: update.entity,
          error: serviceResult?.error || 'Unknown error',
        });
      }
      
      // Small delay between updates to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[ENV-CTRL] Error updating ${update.name}:`, error);
      results.success = false;
      results.errors = results.errors || [];
      results.errors.push({
        entity: update.entity,
        error: error.message,
      });
    }
  }
  
  // Update cooldown on success
  if (results.success && results.changes.length > 0) {
    cooldownRef.current['_vpd_settings_update'] = Date.now();
    console.log(`[ENV-CTRL] VPD settings update complete: ${results.changes.length} changes, ${results.skipped.length} skipped`);
  }
  
  return results;
}

export function createControllerFromState(entities, stage, isDayTime = true) {
  if (!stage) {
    console.warn('[ENV-CTRL] No stage provided, using default targets');
  }
  
  // Extract current state
  const currentState = {
    temp: parseFloat(entities[ENTITIES.TEMPERATURE]?.state || 0),
    humidity: parseFloat(entities[ENTITIES.HUMIDITY]?.state || 0),
    vpd: parseFloat(entities[ENTITIES.VPD]?.state || 0),
  };
  
  // Determine day/night based on light state or explicit parameter
  const lightState = entities[ENTITIES.LIGHT]?.state;
  const isDay = isDayTime !== undefined ? isDayTime : (lightState === 'on');
  
  // Extract target state from stage (with day/night logic for temperature)
  const tempTargets = isDay 
    ? (stage?.temperature?.day || { min: 75, max: 82, target: 77 })
    : (stage?.temperature?.night || { min: 68, max: 72, target: 70 });
  
  const targetState = {
    tempMin: tempTargets.min,
    tempMax: tempTargets.max,
    tempOptimal: tempTargets.target,
    humidityMin: stage?.humidity?.min || 65,
    humidityMax: stage?.humidity?.max || 75,
    humidityOptimal: stage?.humidity?.optimal || 70,
    vpdMin: stage?.vpd?.min || 0.4,
    vpdMax: stage?.vpd?.max || 0.8,
    vpdOptimal: stage?.vpd?.optimal || 0.6,
  };
  
  // Log targets for debugging
  if (stage) {
    console.log(`[ENV-CTRL] Stage targets (${stage.name || 'unknown'}, ${isDay ? 'DAY' : 'NIGHT'}):`, {
      temp: `${targetState.tempMin}-${targetState.tempMax}°F (target: ${targetState.tempOptimal}°F)`,
      humidity: `${targetState.humidityMin}-${targetState.humidityMax}% (optimal: ${targetState.humidityOptimal}%)`,
      vpd: `${targetState.vpdMin}-${targetState.vpdMax} kPa (optimal: ${targetState.vpdOptimal} kPa)`,
    });
  }
  
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
    vicksHumidifier: {
      state: entities[ENTITIES.VICKS_HUMIDIFIER]?.state || 'off',
    },
    heater: {
      currentTemp: parseFloat(entities[ENTITIES.HEATER]?.attributes?.current_temperature || 0),
      targetTemp: parseFloat(entities[ENTITIES.HEATER]?.attributes?.temperature || 0),
    },
  };
  
  return new EnvironmentController(currentState, targetState, actuators);
}
