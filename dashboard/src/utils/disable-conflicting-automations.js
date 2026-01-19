/**
 * Utility to disable Home Assistant automations that conflict with the dashboard controller
 * 
 * The dashboard controller ("brain") handles:
 * - Humidifier control (On/Off + intensity)
 * - Exhaust fan power control
 * - Heater temperature control
 * 
 * These automations should be disabled to prevent rate limit conflicts:
 * - phenology_vpd_humidifier_on
 * - phenology_vpd_humidifier_off
 * - phenology_vpd_fan_reduce
 * - phenology_vpd_fan_restore
 * 
 * Keep enabled (don't conflict):
 * - phenology_light_on/off (controls lights, not AC Infinity)
 * - phenology_temp_day/night (can coexist, but consider disabling if conflicts occur)
 */

import { disableAutomation } from '../services/ha-api.js';

/**
 * Automation IDs that conflict with dashboard controller
 */
const CONFLICTING_AUTOMATION_IDS = [
  'phenology_vpd_humidifier_on',
  'phenology_vpd_humidifier_off',
  'phenology_vpd_fan_reduce',
  'phenology_vpd_fan_restore',
  // Optional: Uncomment if temperature automations also conflict
  // 'phenology_temp_day',
  // 'phenology_temp_night',
];

/**
 * Disable all automations that conflict with the dashboard controller
 * @returns {Promise<Object>} Result with success/failed arrays
 */
export async function disableConflictingAutomations() {
  const results = {
    success: [],
    failed: [],
  };

  console.log('[AUTO-CONFLICT] Disabling conflicting automations...');
  console.log('[AUTO-CONFLICT] These automations conflict with the dashboard controller:');
  CONFLICTING_AUTOMATION_IDS.forEach(id => {
    console.log(`[AUTO-CONFLICT]   - ${id}`);
  });

  for (const automationId of CONFLICTING_AUTOMATION_IDS) {
    const entityId = `automation.${automationId}`;
    try {
      await disableAutomation(entityId);
      results.success.push(automationId);
      console.log(`[AUTO-CONFLICT] ✓ Disabled: ${automationId}`);
    } catch (error) {
      // 404 is OK (automation doesn't exist)
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.log(`[AUTO-CONFLICT] - Not found (already disabled or doesn't exist): ${automationId}`);
        results.success.push(automationId);
      } else {
        results.failed.push({ id: automationId, error: error.message });
        console.error(`[AUTO-CONFLICT] ✗ Failed to disable ${automationId}:`, error.message);
      }
    }
  }

  console.log(`[AUTO-CONFLICT] Complete: ${results.success.length} disabled, ${results.failed.length} failed`);
  return results;
}

/**
 * Check which conflicting automations are currently enabled
 * @param {Function} getAutomation - Function to get automation state
 * @returns {Promise<Object>} Status of each automation
 */
export async function checkConflictingAutomations(getAutomation) {
  const status = {};

  for (const automationId of CONFLICTING_AUTOMATION_IDS) {
    const entityId = `automation.${automationId}`;
    try {
      const automation = await getAutomation(entityId);
      status[automationId] = {
        exists: true,
        enabled: automation?.state === 'on',
      };
    } catch (error) {
      status[automationId] = {
        exists: false,
        enabled: false,
      };
    }
  }

  return status;
}
