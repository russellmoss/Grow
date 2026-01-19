# CloudForge T5 Intensity Control Implementation

**Date:** January 19, 2026  
**Status:** ✅ Implemented

## Discovery

The CloudForge T5 humidifier has an intensity control entity that was previously unknown:
- **Entity ID:** `number.cloudforge_t5_on_power`
- **Type:** Number entity (writable)
- **Range:** 1-10 (similar to exhaust fan power)
- **Purpose:** Controls humidifier output intensity/level

This allows **modulated humidity control** instead of just On/Off/Auto.

## Changes Made

### 1. Entity Constants (`dashboard/src/types/entities.js`)
- ✅ Added `HUMIDIFIER_ON_POWER: 'number.cloudforge_t5_on_power'`

### 2. Environment Controller (`dashboard/src/services/environment-controller.js`)

#### Action Plan Generation
- ✅ **VPD_HIGH / HUMIDITY_LOW:** Now calculates intensity based on delta:
  - Critical (delta > 10% or VPD > 0.5 kPa): Intensity 8/10
  - Moderate (delta > 5% or VPD > 0.3 kPa): Intensity 6/10
  - Minor (delta < 3% and VPD < 0.2 kPa): Intensity 3/10
  - Default: Intensity 5/10

#### Action Execution
- ✅ Added `set_intensity` action handler
- ✅ Uses `number.set_value` service to set intensity (1-10)
- ✅ Skips if already at target intensity (prevents unnecessary calls)

#### State Tracking
- ✅ Added `currentPower` to humidifier actuator state
- ✅ Tracks current intensity level for decision-making

### 3. Home Assistant Hook (`dashboard/src/hooks/useHomeAssistant.js`)
- ✅ Added `humidifierPower` convenience getter
- ✅ Exposes current intensity level (1-10)

### 4. UI Components

#### SystemThinkingPanel (`dashboard/src/components/SystemThinkingPanel.jsx`)
- ✅ Displays intensity actions with "Intensity: X/10" label
- ✅ Shows intensity icon (💧) for set_intensity actions

### 5. AI Prompts (`dashboard/src/prompts/environment-analysis.js`)
- ✅ Updated system prompt to mention intensity control capability
- ✅ AI now knows humidifier can be modulated, not just On/Off

## How It Works

### Intensity Calculation Logic

```javascript
// Based on humidity/VPD delta
const humidityDelta = target - current;
const vpdDelta = currentVPD - targetVPD;

if (humidityDelta > 10 || vpdDelta > 0.5) {
  intensity = 8; // High - critical issue
} else if (humidityDelta > 5 || vpdDelta > 0.3) {
  intensity = 6; // Medium-high
} else if (humidityDelta < 3 && vpdDelta < 0.2) {
  intensity = 3; // Low - fine-tuning
} else {
  intensity = 5; // Default moderate
}
```

### Action Flow

1. **Controller detects VPD_HIGH or HUMIDITY_LOW**
2. **Calculates required intensity** based on delta
3. **Ensures humidifier is On** (if not already)
4. **Sets intensity** to calculated level (if different from current)
5. **Coordinates with exhaust fan** (reduces fan if needed)

## Benefits

1. **Finer Control:** Can adjust humidity output gradually instead of binary On/Off
2. **Reduced Cycling:** Lower intensity for minor adjustments prevents over-humidification
3. **Better Coordination:** Can run humidifier at lower intensity while exhaust fan is active
4. **Energy Efficiency:** Lower intensity uses less power when less humidity is needed

## Example Scenarios

### Scenario 1: Critical VPD (1.8 kPa, target 0.6)
- Humidity: 58% (target 75%)
- Delta: 17%
- **Action:** Turn on humidifier + Set intensity to 8/10

### Scenario 2: Minor Adjustment (VPD 0.65, target 0.6)
- Humidity: 68% (target 70%)
- Delta: 2%
- **Action:** Set intensity to 3/10 (fine-tuning)

### Scenario 3: Moderate Issue (VPD 1.2, target 0.6)
- Humidity: 62% (target 70%)
- Delta: 8%
- **Action:** Turn on humidifier + Set intensity to 6/10

## Testing Checklist

- [ ] Verify `number.cloudforge_t5_on_power` entity exists in HA
- [ ] Test intensity control via dashboard (manual)
- [ ] Verify controller sets intensity correctly
- [ ] Check SystemThinkingPanel displays intensity actions
- [ ] Verify AI mentions intensity in analysis
- [ ] Test coordination with exhaust fan (humidifier at 8, fan at 2)
- [ ] Monitor for 1 hour to ensure no rapid cycling

## Related Files

- `dashboard/src/types/entities.js` - Entity constants
- `dashboard/src/services/environment-controller.js` - Control logic
- `dashboard/src/hooks/useHomeAssistant.js` - HA integration
- `dashboard/src/components/SystemThinkingPanel.jsx` - UI display
- `dashboard/src/prompts/environment-analysis.js` - AI prompts

## Next Steps

1. Monitor system behavior with intensity control
2. Fine-tune intensity calculation thresholds based on real-world performance
3. Consider adding intensity control to manual override panel
4. Update documentation in `docs/ENTITIES.md` and `docs/MANIFEST.md`

---

**Note:** This feature works alongside the existing On/Off/Auto mode control. The humidifier must be set to "On" mode for intensity control to take effect.
