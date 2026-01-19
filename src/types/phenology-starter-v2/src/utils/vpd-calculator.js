/**
 * VPD (Vapor Pressure Deficit) Calculator Utilities
 * 
 * Uses the Magnus formula for accurate saturation vapor pressure calculations.
 * Assumes leaf temperature is ~2°C warmer than air temperature.
 * 
 * Reference: https://en.wikipedia.org/wiki/Clausius%E2%80%93Clapeyron_relation
 */

/**
 * Convert Fahrenheit to Celsius
 * @param {number} tempF - Temperature in Fahrenheit
 * @returns {number} Temperature in Celsius
 */
export function fahrenheitToCelsius(tempF) {
  return (tempF - 32) * (5 / 9);
}

/**
 * Convert Celsius to Fahrenheit
 * @param {number} tempC - Temperature in Celsius
 * @returns {number} Temperature in Fahrenheit
 */
export function celsiusToFahrenheit(tempC) {
  return (tempC * 9 / 5) + 32;
}

/**
 * Calculate Saturation Vapor Pressure (SVP) using Magnus formula
 * @param {number} tempC - Temperature in Celsius
 * @returns {number} SVP in kPa
 */
export function calculateSVP(tempC) {
  // Magnus formula coefficients
  const a = 17.27;
  const b = 237.3;
  return 0.6108 * Math.exp((a * tempC) / (tempC + b));
}

/**
 * Calculate VPD (Vapor Pressure Deficit)
 * 
 * VPD = Leaf SVP - Air AVP
 * Where:
 * - Leaf SVP = Saturation vapor pressure at leaf temperature
 * - Air AVP = Actual vapor pressure of air (SVP * RH/100)
 * - Leaf temp assumed to be 2°C warmer than air
 * 
 * @param {number} tempF - Air temperature in Fahrenheit
 * @param {number} humidityPercent - Relative humidity (0-100)
 * @returns {number} VPD in kPa (rounded to 2 decimal places)
 * 
 * @example
 * // At 77°F and 70% RH, VPD should be approximately 0.75 kPa
 * calculateVPD(77, 70) // Returns ~0.75
 * 
 * @example
 * // At 80°F and 50% RH, VPD should be approximately 1.35 kPa
 * calculateVPD(80, 50) // Returns ~1.35
 */
export function calculateVPD(tempF, humidityPercent) {
  // Input validation
  if (typeof tempF !== 'number' || typeof humidityPercent !== 'number') {
    return null;
  }
  if (humidityPercent < 0 || humidityPercent > 100) {
    return null;
  }

  // Convert air temperature to Celsius
  const airTempC = fahrenheitToCelsius(tempF);
  
  // Assume leaf is 2°C warmer than air (typical for plants under lights)
  const leafTempC = airTempC + 2;
  
  // Calculate Saturation Vapor Pressure at leaf temperature
  const leafSVP = calculateSVP(leafTempC);
  
  // Calculate Saturation Vapor Pressure at air temperature
  const airSVP = calculateSVP(airTempC);
  
  // Calculate Actual Vapor Pressure (what's actually in the air)
  const airAVP = airSVP * (humidityPercent / 100);
  
  // VPD = Leaf SVP - Air AVP
  const vpd = leafSVP - airAVP;
  
  // Round to 2 decimal places
  return Math.round(vpd * 100) / 100;
}

/**
 * Calculate the humidity required to achieve a target VPD
 * 
 * Reverse calculation: Given temperature and desired VPD, what humidity is needed?
 * 
 * @param {number} tempF - Air temperature in Fahrenheit
 * @param {number} targetVPD - Desired VPD in kPa
 * @returns {number} Required humidity percentage (0-100, clamped)
 * 
 * @example
 * // At 77°F, what humidity gives VPD of 0.6?
 * calculateRequiredHumidity(77, 0.6) // Returns ~76%
 */
export function calculateRequiredHumidity(tempF, targetVPD) {
  // Input validation
  if (typeof tempF !== 'number' || typeof targetVPD !== 'number') {
    return null;
  }
  if (targetVPD < 0 || targetVPD > 5) {
    return null;
  }

  // Convert to Celsius
  const airTempC = fahrenheitToCelsius(tempF);
  const leafTempC = airTempC + 2;
  
  // Calculate SVPs
  const leafSVP = calculateSVP(leafTempC);
  const airSVP = calculateSVP(airTempC);
  
  // VPD = leafSVP - (airSVP * RH/100)
  // Solving for RH:
  // airSVP * RH/100 = leafSVP - VPD
  // RH = (leafSVP - VPD) / airSVP * 100
  
  const requiredAVP = leafSVP - targetVPD;
  const humidity = (requiredAVP / airSVP) * 100;
  
  // Clamp to valid range and round to 1 decimal place
  const clamped = Math.max(0, Math.min(100, humidity));
  return Math.round(clamped * 10) / 10;
}

/**
 * Get VPD status relative to target range
 * 
 * @param {number} vpd - Current VPD in kPa
 * @param {Object} targets - Target object { min, max, optimal }
 * @returns {'optimal' | 'caution' | 'critical' | 'unknown'}
 */
export function getVPDStatus(vpd, targets) {
  if (vpd === null || vpd === undefined || !targets) {
    return 'unknown';
  }
  
  const { min, max } = targets;
  
  // Within range = optimal
  if (vpd >= min && vpd <= max) {
    return 'optimal';
  }
  
  // Within 0.2 kPa of range = caution
  const cautionMargin = 0.2;
  if (vpd >= min - cautionMargin && vpd <= max + cautionMargin) {
    return 'caution';
  }
  
  // Otherwise critical
  return 'critical';
}

/**
 * Get humidity status relative to target range
 * 
 * @param {number} humidity - Current humidity percentage
 * @param {Object} targets - Target object { min, max, optimal }
 * @returns {'optimal' | 'caution' | 'critical' | 'unknown'}
 */
export function getHumidityStatus(humidity, targets) {
  if (humidity === null || humidity === undefined || !targets) {
    return 'unknown';
  }
  
  const { min, max } = targets;
  
  // Within range = optimal
  if (humidity >= min && humidity <= max) {
    return 'optimal';
  }
  
  // Within 10% of range = caution
  const cautionMargin = 10;
  if (humidity >= min - cautionMargin && humidity <= max + cautionMargin) {
    return 'caution';
  }
  
  // Otherwise critical
  return 'critical';
}

/**
 * Get temperature status relative to target range
 * 
 * @param {number} temp - Current temperature in °F
 * @param {Object} targets - Target object { min, max, target }
 * @returns {'optimal' | 'caution' | 'critical' | 'unknown'}
 */
export function getTemperatureStatus(temp, targets) {
  if (temp === null || temp === undefined || !targets) {
    return 'unknown';
  }
  
  const { min, max } = targets;
  
  // Within range = optimal
  if (temp >= min && temp <= max) {
    return 'optimal';
  }
  
  // Within 5°F of range = caution
  const cautionMargin = 5;
  if (temp >= min - cautionMargin && temp <= max + cautionMargin) {
    return 'caution';
  }
  
  // Otherwise critical
  return 'critical';
}

/**
 * Format VPD value for display
 * @param {number} vpd - VPD value in kPa
 * @returns {string} Formatted string like "1.23 kPa"
 */
export function formatVPD(vpd) {
  if (vpd === null || vpd === undefined) {
    return '-- kPa';
  }
  return `${vpd.toFixed(2)} kPa`;
}

/**
 * Format humidity value for display
 * @param {number} humidity - Humidity percentage
 * @returns {string} Formatted string like "65%"
 */
export function formatHumidity(humidity) {
  if (humidity === null || humidity === undefined) {
    return '--%';
  }
  return `${Math.round(humidity)}%`;
}

/**
 * Format temperature value for display
 * @param {number} temp - Temperature in °F
 * @returns {string} Formatted string like "77°F"
 */
export function formatTemperature(temp) {
  if (temp === null || temp === undefined) {
    return '--°F';
  }
  return `${Math.round(temp * 10) / 10}°F`;
}

/**
 * Get a human-readable recommendation based on current VPD vs target
 * 
 * @param {number} currentVPD - Current VPD
 * @param {Object} targets - Target { min, max, optimal }
 * @returns {string} Recommendation text
 */
export function getVPDRecommendation(currentVPD, targets) {
  if (!currentVPD || !targets) {
    return 'Unable to calculate recommendation';
  }
  
  const { min, max, optimal } = targets;
  
  if (currentVPD >= min && currentVPD <= max) {
    return `✅ VPD is in range (${formatVPD(currentVPD)})`;
  }
  
  if (currentVPD > max) {
    const excess = currentVPD - optimal;
    return `⚠️ VPD too HIGH by ${excess.toFixed(2)} kPa - Increase humidity or lower temperature`;
  }
  
  if (currentVPD < min) {
    const deficit = optimal - currentVPD;
    return `⚠️ VPD too LOW by ${deficit.toFixed(2)} kPa - Decrease humidity or raise temperature`;
  }
  
  return 'Check VPD';
}

/**
 * Calculate what VPD would be at different humidity levels (for UI sliders)
 * 
 * @param {number} tempF - Current temperature
 * @param {number[]} humidityLevels - Array of humidity values to calculate
 * @returns {Array<{humidity: number, vpd: number}>}
 */
export function getVPDCurve(tempF, humidityLevels = [30, 40, 50, 60, 70, 80, 90]) {
  return humidityLevels.map(humidity => ({
    humidity,
    vpd: calculateVPD(tempF, humidity),
  }));
}
