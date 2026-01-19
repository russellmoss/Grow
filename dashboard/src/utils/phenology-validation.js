/**
 * Phenology Validation Utilities
 * Helper functions for validating stage parameters
 */

/**
 * Validate temperature value
 * @param {number} temp - Temperature in °F
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTemperature(temp) {
  if (typeof temp !== 'number' || isNaN(temp)) {
    return { valid: false, error: 'Temperature must be a number' };
  }
  if (temp < 60 || temp > 90) {
    return { valid: false, error: 'Temperature must be between 60-90°F' };
  }
  return { valid: true };
}

/**
 * Validate VPD value
 * @param {number} vpd - VPD in kPa
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateVPD(vpd) {
  if (typeof vpd !== 'number' || isNaN(vpd)) {
    return { valid: false, error: 'VPD must be a number' };
  }
  if (vpd < 0.1 || vpd > 2.0) {
    return { valid: false, error: 'VPD must be between 0.1-2.0 kPa' };
  }
  return { valid: true };
}

/**
 * Validate humidity value
 * @param {number} humidity - Humidity in %
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateHumidity(humidity) {
  if (typeof humidity !== 'number' || isNaN(humidity)) {
    return { valid: false, error: 'Humidity must be a number' };
  }
  if (humidity < 20 || humidity > 90) {
    return { valid: false, error: 'Humidity must be between 20-90%' };
  }
  return { valid: true };
}

/**
 * Validate time string format
 * @param {string} timeString - Time in "HH:MM" format
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTime(timeString) {
  if (typeof timeString !== 'string') {
    return { valid: false, error: 'Time must be a string' };
  }
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(timeString)) {
    return { valid: false, error: 'Time must be in HH:MM format (24-hour)' };
  }
  return { valid: true };
}

/**
 * Validate full stage parameters object
 * Checks all fields and logical constraints
 * @param {Object} params - Stage parameters object
 * @param {number} params.temperature?.day?.target - Day temperature
 * @param {number} params.temperature?.night?.target - Night temperature
 * @param {number} params.vpd?.min - VPD minimum
 * @param {number} params.vpd?.max - VPD maximum
 * @param {number} params.vpd?.optimal - VPD optimal
 * @param {number} params.vpd?.highTrigger - VPD high trigger
 * @param {number} params.vpd?.lowTrigger - VPD low trigger
 * @param {number} params.humidity?.optimal - Humidity target
 * @param {string} params.lightSchedule?.onTime - Light on time
 * @param {string} params.lightSchedule?.offTime - Light off time
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStageParams(params) {
  const errors = [];

  // Validate individual fields
  if (params.temperature?.day?.target !== undefined) {
    const tempValidation = validateTemperature(params.temperature.day.target);
    if (!tempValidation.valid) {
      errors.push(`Day temperature: ${tempValidation.error}`);
    }
  }

  if (params.temperature?.night?.target !== undefined) {
    const tempValidation = validateTemperature(params.temperature.night.target);
    if (!tempValidation.valid) {
      errors.push(`Night temperature: ${tempValidation.error}`);
    }
  }

  if (params.vpd?.min !== undefined) {
    const vpdValidation = validateVPD(params.vpd.min);
    if (!vpdValidation.valid) {
      errors.push(`VPD min: ${vpdValidation.error}`);
    }
  }

  if (params.vpd?.max !== undefined) {
    const vpdValidation = validateVPD(params.vpd.max);
    if (!vpdValidation.valid) {
      errors.push(`VPD max: ${vpdValidation.error}`);
    }
  }

  if (params.vpd?.optimal !== undefined) {
    const vpdValidation = validateVPD(params.vpd.optimal);
    if (!vpdValidation.valid) {
      errors.push(`VPD optimal: ${vpdValidation.error}`);
    }
  }

  if (params.vpd?.highTrigger !== undefined) {
    const vpdValidation = validateVPD(params.vpd.highTrigger);
    if (!vpdValidation.valid) {
      errors.push(`VPD high trigger: ${vpdValidation.error}`);
    }
  }

  if (params.vpd?.lowTrigger !== undefined) {
    const vpdValidation = validateVPD(params.vpd.lowTrigger);
    if (!vpdValidation.valid) {
      errors.push(`VPD low trigger: ${vpdValidation.error}`);
    }
  }

  if (params.humidity?.optimal !== undefined) {
    const humidityValidation = validateHumidity(params.humidity.optimal);
    if (!humidityValidation.valid) {
      errors.push(`Humidity: ${humidityValidation.error}`);
    }
  }

  if (params.lightSchedule?.onTime !== undefined) {
    const timeValidation = validateTime(params.lightSchedule.onTime);
    if (!timeValidation.valid) {
      errors.push(`Light on time: ${timeValidation.error}`);
    }
  }

  if (params.lightSchedule?.offTime !== undefined) {
    const timeValidation = validateTime(params.lightSchedule.offTime);
    if (!timeValidation.valid) {
      errors.push(`Light off time: ${timeValidation.error}`);
    }
  }

  // Logical constraints
  if (
    params.temperature?.day?.target !== undefined &&
    params.temperature?.night?.target !== undefined
  ) {
    if (params.temperature.day.target < params.temperature.night.target) {
      errors.push('Day temperature must be >= night temperature');
    }
  }

  if (params.vpd?.min !== undefined && params.vpd?.max !== undefined) {
    if (params.vpd.min >= params.vpd.max) {
      errors.push('VPD min must be < VPD max');
    }
  }

  if (params.vpd?.optimal !== undefined) {
    if (params.vpd?.min !== undefined && params.vpd.optimal < params.vpd.min) {
      errors.push('VPD optimal must be >= VPD min');
    }
    if (params.vpd?.max !== undefined && params.vpd.optimal > params.vpd.max) {
      errors.push('VPD optimal must be <= VPD max');
    }
  }

  if (params.vpd?.highTrigger !== undefined && params.vpd?.max !== undefined) {
    if (params.vpd.highTrigger <= params.vpd.max) {
      errors.push('VPD high trigger must be > VPD max (triggers humidifier ON)');
    }
  }

  if (params.vpd?.lowTrigger !== undefined && params.vpd?.min !== undefined) {
    if (params.vpd.lowTrigger >= params.vpd.min) {
      errors.push('VPD low trigger must be < VPD min (triggers humidifier OFF)');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate photoperiod in hours
 * Handles overnight schedules (e.g., "06:00" to "02:00" = 20 hours)
 * @param {string} lightOnTime - Light on time in "HH:MM" format
 * @param {string} lightOffTime - Light off time in "HH:MM" format
 * @returns {number} Photoperiod in hours
 */
export function calculatePhotoperiod(lightOnTime, lightOffTime) {
  // Validate inputs
  const onTimeValidation = validateTime(lightOnTime);
  const offTimeValidation = validateTime(lightOffTime);
  
  if (!onTimeValidation.valid || !offTimeValidation.valid) {
    console.warn('[PHENOLOGY-VALIDATION] Invalid time format for photoperiod calculation');
    return 0;
  }

  const [onHours, onMinutes] = lightOnTime.split(':').map(Number);
  const [offHours, offMinutes] = lightOffTime.split(':').map(Number);
  
  const onTotalMinutes = onHours * 60 + onMinutes;
  const offTotalMinutes = offHours * 60 + offMinutes;
  
  let diffMinutes = offTotalMinutes - onTotalMinutes;
  if (diffMinutes < 0) {
    // Overnight schedule (e.g., 6 AM to 2 AM next day)
    diffMinutes += 24 * 60; // Add 24 hours
  }
  
  return diffMinutes / 60;
}
