/**
 * Entity type definitions for the Grow Dashboard
 * Based on MANIFEST.md entity registry - VERIFIED 2026-01-18
 */

// Entity ID constants - THESE MUST BE EXACT
export const ENTITIES = {
  // Climate Sensors (AC Infinity Controller 69 Pro)
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
  
  // Secondary Sensors
  GROW_ROOM_TEMP: 'sensor.sensor_grow_room_temperature_and_humidity_temperature',
  GROW_ROOM_HUMIDITY: 'sensor.sensor_grow_room_temperature_and_humidity_humidity',
};

// VPD targets by growth stage (kPa)
export const VPD_TARGETS = {
  seedling: { min: 0.4, max: 0.8, optimal: 0.6 },
  early_veg: { min: 0.8, max: 1.0, optimal: 0.9 },
  late_veg: { min: 1.0, max: 1.2, optimal: 1.1 },
  early_flower: { min: 1.0, max: 1.4, optimal: 1.2 },
  late_flower: { min: 1.2, max: 1.5, optimal: 1.35 },
};

// Temperature targets (°F)
export const TEMP_TARGETS = {
  day: { min: 75, max: 82, target: 80 },    // 6 AM - 2 AM
  night: { min: 68, max: 72, target: 70 },  // 2 AM - 6 AM
};

// Humidity targets by stage (%)
export const HUMIDITY_TARGETS = {
  seedling: { min: 65, max: 75, optimal: 70 },
  veg: { min: 55, max: 65, optimal: 60 },
  flower: { min: 45, max: 55, optimal: 50 },
};

// Schedule times (verified from automations)
export const SCHEDULE = {
  LIGHTS_ON: '06:00',
  LIGHTS_OFF: '02:00',
  DAY_TEMP: 80,
  NIGHT_TEMP: 70,
};

// Humidifier modes
export const HUMIDIFIER_MODES = ['On', 'Off', 'Auto'];

// Fan modes
export const FAN_MODES = ['On', 'Off', 'Auto'];
