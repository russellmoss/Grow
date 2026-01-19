/**
 * Phenology Schedule Data Types and Defaults
 * 
 * Defines growth stages with environmental parameters for automated control.
 * 
 * DEFAULT VALUES from user's Northern Lights schedule (phenology_and_environmental_variables.csv)
 * These can be edited in the dashboard and are saved to localStorage.
 */

/**
 * @typedef {Object} TemperatureRange
 * @property {number} min - Minimum acceptable temperature (°F)
 * @property {number} max - Maximum acceptable temperature (°F)
 * @property {number} target - Target temperature (°F) - midpoint of range
 */

/**
 * @typedef {Object} HumidityRange
 * @property {number} min - Minimum acceptable humidity (%)
 * @property {number} max - Maximum acceptable humidity (%)
 * @property {number} optimal - Optimal humidity (%) - midpoint of range
 */

/**
 * @typedef {Object} VPDRange
 * @property {number} min - Minimum acceptable VPD (kPa)
 * @property {number} max - Maximum acceptable VPD (kPa)
 * @property {number} optimal - Optimal VPD (kPa) - midpoint of range
 */

/**
 * @typedef {Object} LightSchedule
 * @property {number} hoursOn - Hours of light per day
 * @property {number} hoursOff - Hours of dark per day
 * @property {string} onTime - Time lights turn on (HH:MM format)
 * @property {string} offTime - Time lights turn off (HH:MM format)
 */

/**
 * @typedef {Object} GrowthStage
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} emoji - Stage emoji
 * @property {string} duration - Duration description
 * @property {LightSchedule} lightSchedule - Light timing
 * @property {Object} temperature - Temperature settings
 * @property {TemperatureRange} temperature.day - Daytime temperature
 * @property {TemperatureRange} temperature.night - Nighttime temperature
 * @property {HumidityRange} humidity - Humidity targets
 * @property {VPDRange} vpd - VPD targets
 * @property {string} rationale - Why these settings (cultivation notes)
 */

/**
 * @typedef {Object} CustomStageParams
 * @property {number} dayTemp - Day temperature in °F (60-90°F range)
 * @property {number} nightTemp - Night temperature in °F (60-90°F range)
 * @property {number} vpdMin - Minimum target VPD in kPa (0.1-2.0 kPa range)
 * @property {number} vpdMax - Maximum target VPD in kPa (0.1-2.0 kPa range)
 * @property {number} vpdOptimal - Optimal VPD in kPa (should be between min and max)
 * @property {number} vpdHighTrigger - VPD threshold to activate humidifier (should be >= vpdMax)
 * @property {number} vpdLowTrigger - VPD threshold to deactivate humidifier (should be <= vpdOptimal)
 * @property {number} humidityTarget - Target humidity percentage (20-90% range)
 * @property {string} lightOnTime - Light ON time in HH:MM format (24-hour)
 * @property {string} lightOffTime - Light OFF time in HH:MM format (24-hour)
 * @property {boolean} [isCustom] - Flag indicating custom values (set automatically)
 */

/**
 * Default phenology stage parameters
 * 
 * These can be customized via the dashboard Schedule Editor.
 * Custom values are saved to localStorage and persist across sessions.
 * 
 * Parameter Ranges:
 * - dayTemp, nightTemp: 60-90°F
 * - vpdMin, vpdMax, vpdOptimal, vpdHighTrigger, vpdLowTrigger: 0.1-2.0 kPa
 * - humidityTarget: 20-90%
 * - lightOnTime, lightOffTime: "HH:MM" format (24-hour)
 * 
 * Triggers:
 * - vpdHighTrigger: Turn ON humidifier when VPD exceeds this value (should be >= vpdMax)
 * - vpdLowTrigger: Turn OFF humidifier when VPD drops below this value (should be <= vpdOptimal)
 * 
 * Source: phenology_and_environmental_variables_-_Sheet1.csv
 * 
 * @type {Object.<string, GrowthStage>}
 */
export const DEFAULT_SCHEDULE = {
  seedling: {
    id: 'seedling',
    name: 'Seedling',
    emoji: '🌱',
    duration: 'Weeks 0-3',
    lightSchedule: {
      hoursOn: 20,
      hoursOff: 4,
      onTime: '06:00',
      offTime: '02:00',
    },
    temperature: {
      day: { min: 75, max: 80, target: 77 },
      night: { min: 70, max: 72, target: 71 },
    },
    humidity: { min: 65, max: 75, optimal: 70 },
    vpd: { min: 0.4, max: 0.8, optimal: 0.6 },
    rationale: 'Roots are weak; plants "drink" moisture from the air through leaves.',
  },

  early_veg: {
    id: 'early_veg',
    name: 'Early Veg',
    emoji: '🌿',
    duration: 'Weeks 3-6',
    lightSchedule: {
      hoursOn: 20,  // USER SPECIFIES 20/4 FOR ALL VEG
      hoursOff: 4,
      onTime: '06:00',
      offTime: '02:00',
    },
    temperature: {
      day: { min: 78, max: 82, target: 80 },
      night: { min: 70, max: 75, target: 72 },
    },
    humidity: { min: 60, max: 70, optimal: 65 },
    vpd: { min: 0.8, max: 1.0, optimal: 0.9 },
    rationale: 'Rapid leaf growth; high nitrogen demand; stronger roots allow lower humidity.',
  },

  late_veg: {
    id: 'late_veg',
    name: 'Late Veg',
    emoji: '🪴',
    duration: 'Weeks 6-8',
    lightSchedule: {
      hoursOn: 20,  // USER SPECIFIES 20/4 FOR ALL VEG
      hoursOff: 4,
      onTime: '06:00',
      offTime: '02:00',
    },
    temperature: {
      day: { min: 78, max: 85, target: 81 },
      night: { min: 70, max: 75, target: 72 },
    },
    humidity: { min: 55, max: 65, optimal: 60 },
    vpd: { min: 1.0, max: 1.2, optimal: 1.1 },
    rationale: 'Max metabolism; preparing structure to hold heavy buds.',
  },

  transition: {
    id: 'transition',
    name: 'Transition (FLIP)',
    emoji: '🔄',
    duration: 'FLIP Week',
    lightSchedule: {
      hoursOn: 12,
      hoursOff: 12,
      onTime: '06:00',
      offTime: '18:00',
    },
    temperature: {
      day: { min: 78, max: 82, target: 80 },
      night: { min: 68, max: 72, target: 70 },
    },
    humidity: { min: 55, max: 60, optimal: 57 },
    vpd: { min: 1.0, max: 1.2, optimal: 1.1 },
    rationale: '"The Stretch." Mimics summer solstice to trigger flowering hormones.',
  },

  early_flower: {
    id: 'early_flower',
    name: 'Early Flower',
    emoji: '🌸',
    duration: 'Flower Weeks 1-3',
    lightSchedule: {
      hoursOn: 12,
      hoursOff: 12,
      onTime: '06:00',
      offTime: '18:00',
    },
    temperature: {
      day: { min: 78, max: 82, target: 80 },
      night: { min: 68, max: 72, target: 70 },
    },
    humidity: { min: 50, max: 60, optimal: 55 },
    vpd: { min: 1.2, max: 1.4, optimal: 1.3 },
    rationale: 'Bud sites form. Lower humidity prevents early mold issues.',
  },

  mid_flower: {
    id: 'mid_flower',
    name: 'Mid Flower',
    emoji: '💮',
    duration: 'Flower Weeks 4-6',
    lightSchedule: {
      hoursOn: 12,
      hoursOff: 12,
      onTime: '06:00',
      offTime: '18:00',
    },
    temperature: {
      day: { min: 75, max: 80, target: 77 },
      night: { min: 65, max: 70, target: 67 },
    },
    humidity: { min: 45, max: 50, optimal: 47 },
    vpd: { min: 1.3, max: 1.5, optimal: 1.4 },
    rationale: '"Bulking." Max phosphorus uptake. Lower humidity forces resin production.',
  },

  late_flower: {
    id: 'late_flower',
    name: 'Late Flower',
    emoji: '🌺',
    duration: 'Flower Weeks 7-9',
    lightSchedule: {
      hoursOn: 12,
      hoursOff: 12,
      onTime: '06:00',
      offTime: '18:00',
    },
    temperature: {
      day: { min: 68, max: 75, target: 71 },
      night: { min: 60, max: 65, target: 62 },
    },
    humidity: { min: 35, max: 45, optimal: 40 },
    vpd: { min: 1.4, max: 1.6, optimal: 1.5 },
    rationale: '"Ripening." Cold nights trigger anthocyanin (purple colors) & harden buds.',
  },

  harvest_dry: {
    id: 'harvest_dry',
    name: 'Harvest/Dry',
    emoji: '✂️',
    duration: '7-14 Days',
    lightSchedule: {
      hoursOn: 0,
      hoursOff: 24,
      onTime: '00:00',
      offTime: '00:00',
    },
    temperature: {
      // The "60/60 Rule" - both day and night at 60°F
      day: { min: 58, max: 62, target: 60 },
      night: { min: 58, max: 62, target: 60 },
    },
    humidity: { min: 58, max: 62, optimal: 60 },
    vpd: { min: 0.7, max: 0.9, optimal: 0.8 },  // User specified 0.8
    rationale: 'The "60/60 Rule" for slow drying to preserve terpenes.',
  },
};

/**
 * Stage IDs in chronological order
 */
export const STAGE_ORDER = [
  'seedling',
  'early_veg',
  'late_veg',
  'transition',
  'early_flower',
  'mid_flower',
  'late_flower',
  'harvest_dry',
];

/**
 * Get a stage by ID
 * @param {string} id - Stage ID
 * @returns {GrowthStage|null}
 */
export function getStageById(id) {
  return DEFAULT_SCHEDULE[id] || null;
}

/**
 * Get all stage IDs
 * @returns {string[]}
 */
export function getStageIds() {
  return STAGE_ORDER;
}

/**
 * Get the next stage in sequence
 * @param {string} currentId - Current stage ID
 * @returns {string|null} - Next stage ID or null if at end
 */
export function getNextStage(currentId) {
  const currentIndex = STAGE_ORDER.indexOf(currentId);
  if (currentIndex === -1 || currentIndex === STAGE_ORDER.length - 1) {
    return null;
  }
  return STAGE_ORDER[currentIndex + 1];
}

/**
 * Get the previous stage in sequence
 * @param {string} currentId - Current stage ID
 * @returns {string|null} - Previous stage ID or null if at start
 */
export function getPreviousStage(currentId) {
  const currentIndex = STAGE_ORDER.indexOf(currentId);
  if (currentIndex <= 0) {
    return null;
  }
  return STAGE_ORDER[currentIndex - 1];
}

/**
 * Validate a stage object
 * @param {GrowthStage} stage - Stage to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStage(stage) {
  const errors = [];

  if (!stage.id || typeof stage.id !== 'string') {
    errors.push('Stage must have a valid ID');
  }

  if (!stage.name || typeof stage.name !== 'string') {
    errors.push('Stage must have a name');
  }

  // Validate light schedule
  if (!stage.lightSchedule) {
    errors.push('Stage must have a light schedule');
  } else {
    const { hoursOn, hoursOff, onTime, offTime } = stage.lightSchedule;
    if (hoursOn + hoursOff !== 24) {
      errors.push('Light hours must total 24');
    }
    if (!/^\d{2}:\d{2}$/.test(onTime)) {
      errors.push('Invalid on time format (use HH:MM)');
    }
    if (!/^\d{2}:\d{2}$/.test(offTime)) {
      errors.push('Invalid off time format (use HH:MM)');
    }
  }

  // Validate temperature
  if (!stage.temperature?.day || !stage.temperature?.night) {
    errors.push('Stage must have day and night temperature settings');
  } else {
    const { day, night } = stage.temperature;
    if (day.min > day.max || day.target < day.min || day.target > day.max) {
      errors.push('Invalid day temperature range');
    }
    if (night.min > night.max || night.target < night.min || night.target > night.max) {
      errors.push('Invalid night temperature range');
    }
    if (day.min < 50 || day.max > 100) {
      errors.push('Day temperature must be between 50-100°F');
    }
    if (night.min < 50 || night.max > 100) {
      errors.push('Night temperature must be between 50-100°F');
    }
  }

  // Validate humidity
  if (!stage.humidity) {
    errors.push('Stage must have humidity settings');
  } else {
    const { min, max, optimal } = stage.humidity;
    if (min < 0 || max > 100) {
      errors.push('Humidity must be between 0-100%');
    }
    if (min > max || optimal < min || optimal > max) {
      errors.push('Invalid humidity range');
    }
  }

  // Validate VPD
  if (!stage.vpd) {
    errors.push('Stage must have VPD settings');
  } else {
    const { min, max, optimal } = stage.vpd;
    if (min < 0 || max > 3) {
      errors.push('VPD must be between 0-3 kPa');
    }
    if (min > max || optimal < min || optimal > max) {
      errors.push('Invalid VPD range');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Merge user schedule with defaults (preserves new stages added in updates)
 * IMPORTANT: Custom values (isCustom: true) are preserved - defaults do NOT overwrite them
 * @param {Object} userSchedule - User's saved schedule from localStorage
 * @returns {Object} - Merged schedule
 */
export function mergeWithDefaults(userSchedule) {
  const merged = { ...DEFAULT_SCHEDULE };
  
  for (const [stageId, stageData] of Object.entries(userSchedule)) {
    if (merged[stageId]) {
      // If stage is customized, preserve all custom values
      // Otherwise, deep merge user data with defaults (defaults fill missing fields)
      if (stageData.isCustom) {
        // Custom stage: use user data as-is, but ensure all required fields exist
        merged[stageId] = {
          ...merged[stageId], // Start with defaults for structure
          ...stageData, // Overwrite with custom values (preserves isCustom flag)
          // Ensure nested objects are properly merged
          lightSchedule: stageData.lightSchedule || merged[stageId].lightSchedule,
          temperature: stageData.temperature || merged[stageId].temperature,
          humidity: stageData.humidity || merged[stageId].humidity,
          vpd: stageData.vpd || merged[stageId].vpd,
        };
      } else {
        // Non-custom stage: deep merge user data with defaults (defaults fill missing fields)
        merged[stageId] = {
          ...merged[stageId],
          ...stageData,
          lightSchedule: { ...merged[stageId].lightSchedule, ...stageData.lightSchedule },
          temperature: {
            day: { ...merged[stageId].temperature.day, ...stageData.temperature?.day },
            night: { ...merged[stageId].temperature.night, ...stageData.temperature?.night },
          },
          humidity: { ...merged[stageId].humidity, ...stageData.humidity },
          vpd: { ...merged[stageId].vpd, ...stageData.vpd },
        };
      }
    }
  }
  
  return merged;
}

/**
 * Calculate off time based on on time and light hours
 * @param {string} onTime - Light on time (HH:MM)
 * @param {number} hoursOn - Hours of light
 * @returns {string} Off time (HH:MM)
 */
export function calculateOffTime(onTime, hoursOn) {
  const [hours, minutes] = onTime.split(':').map(Number);
  let offHour = (hours + hoursOn) % 24;
  return `${offHour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Format stage for display in dropdowns/lists
 * @param {GrowthStage} stage 
 * @returns {string}
 */
export function formatStageOption(stage) {
  return `${stage.emoji} ${stage.name} (${stage.duration})`;
}

/**
 * Get summary of stage settings for display
 * @param {GrowthStage} stage
 * @returns {Object}
 */
export function getStageSummary(stage) {
  return {
    light: `${stage.lightSchedule.hoursOn}/${stage.lightSchedule.hoursOff}`,
    lightTimes: `${stage.lightSchedule.onTime} - ${stage.lightSchedule.offTime}`,
    dayTemp: `${stage.temperature.day.min}-${stage.temperature.day.max}°F`,
    nightTemp: `${stage.temperature.night.min}-${stage.temperature.night.max}°F`,
    humidity: `${stage.humidity.min}-${stage.humidity.max}%`,
    vpd: `${stage.vpd.min}-${stage.vpd.max} kPa`,
  };
}
