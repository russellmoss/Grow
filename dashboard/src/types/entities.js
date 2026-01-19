/**
 * Entity type definitions for the Grow Dashboard
 * Based on MANIFEST.md entity registry
 */

/**
 * @typedef {Object} ClimateEntity
 * @property {string} entity_id
 * @property {string} state - 'heat' | 'off'
 * @property {Object} attributes
 * @property {number} attributes.temperature - Target temperature
 * @property {number} attributes.current_temperature
 * @property {string[]} attributes.hvac_modes
 * @property {string} attributes.hvac_action - 'heating' | 'idle'
 */

/**
 * @typedef {Object} SwitchEntity
 * @property {string} entity_id
 * @property {string} state - 'on' | 'off'
 * @property {Object} attributes
 * @property {string} attributes.friendly_name
 */

/**
 * @typedef {Object} SensorEntity
 * @property {string} entity_id
 * @property {string} state - Numeric value as string
 * @property {Object} attributes
 * @property {string} attributes.unit_of_measurement
 * @property {string} attributes.friendly_name
 */

/**
 * @typedef {Object} SelectEntity
 * @property {string} entity_id
 * @property {string} state - Current option
 * @property {Object} attributes
 * @property {string[]} attributes.options
 */

// Entity ID constants for type safety
export const ENTITIES = {
  // Climate Sensors
  TEMPERATURE: 'sensor.ac_infinity_controller_69_pro_temperature',
  HUMIDITY: 'sensor.ac_infinity_controller_69_pro_humidity',
  VPD: 'sensor.ac_infinity_controller_69_pro_vpd',
  
  // Control Devices
  LIGHT: 'switch.light',
  INTAKE_FAN: 'switch.intake_air',
  HEATER: 'climate.tent_heater',
  EXHAUST_FAN_MODE: 'select.exhaust_fan_active_mode',
  HUMIDIFIER_MODE: 'select.cloudforge_t5_active_mode',  // CloudForge T5
  
  // Power Monitoring
  LIGHT_POWER: 'sensor.light_power',
  INTAKE_POWER: 'sensor.intake_air_power',
  HEATER_POWER: 'sensor.space_heater_power',
  
  // Safety
  LEAK_SENSOR: 'binary_sensor.leak_sensor_1',
  LEAK_BATTERY: 'sensor.leak_sensor_1_battery',
  
  // Secondary Sensors (optional)
  GROW_ROOM_TEMP: 'sensor.sensor_grow_room_temperature_and_humidity_temperature',
  GROW_ROOM_HUMIDITY: 'sensor.sensor_grow_room_temperature_and_humidity_humidity',
  
  // Humidifier Status
  HUMIDIFIER_STATE: 'binary_sensor.cloudforge_t5_state',
  HUMIDIFIER_STATUS: 'binary_sensor.cloudforge_t5_status',
};

// VPD Target zones by growth stage
export const VPD_TARGETS = {
  seedling: { min: 0.4, max: 0.8, optimal: 0.6 },
  early_veg: { min: 0.8, max: 1.0, optimal: 0.9 },
  late_veg: { min: 1.0, max: 1.2, optimal: 1.1 },
  early_flower: { min: 1.0, max: 1.4, optimal: 1.2 },
  late_flower: { min: 1.2, max: 1.5, optimal: 1.35 },
};

// Temperature targets (verified from automation)
export const TEMP_TARGETS = {
  day: { min: 75, max: 82, target: 80 },  // Lights on: 6 AM - 2 AM
  night: { min: 68, max: 72, target: 70 },  // Lights off: 2 AM - 6 AM
};

// Humidity targets (seedling)
export const HUMIDITY_TARGETS = {
  seedling: { min: 65, max: 75, optimal: 70 },
};
