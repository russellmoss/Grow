# 🧠 Intelligent Environmental Control System - Implementation Guide

**Project:** GrowOp Dashboard  
**Goal:** Build a coordinated multi-variable control system for VPD, temperature, and humidity  
**Created:** January 19, 2026  
**Last Updated:** January 19, 2026  
**Status:** ✅ Updated & Verified Against Codebase

---

## 🔍 ENTITY VERIFICATION SUMMARY

**Verification Date:** January 19, 2026  
**Verification Method:** Home Assistant History Logs + MCP Direct Query  
**Home Assistant Version:** Not specified (accessed via Tailscale at 100.65.202.84:8123)

### Findings:

**Critical Entity: `number.exhaust_fan_on_power`**
- Status: ✅ **EXISTS - VERIFIED**
- Entity ID: `number.exhaust_fan_on_power`
- Verification: Confirmed via Home Assistant history logs showing entity being set to different values
- Type: `number` entity (writable via `number.set_value` service)
- Current Value: Variable (set via automations)

**Related Entities:**
- ✅ `sensor.exhaust_fan_current_power` - EXISTS (read-only sensor, current value: 5)
- ✅ `select.exhaust_fan_active_mode` - EXISTS (On/Off/Auto control)

**Decision:** **SCENARIO A** - Primary Entity Exists ✅

**Implementation Approach:** **STANDARD** (Full Coordinated Control with Fan Power Management)

**Ready to Implement:** **YES** - Proceed with Phase 1 as written

---

**✅ CRITICAL PREREQUISITE:** Verification complete - `number.exhaust_fan_on_power` entity EXISTS in Home Assistant. This guide has been updated to reflect **Scenario A: Standard Implementation** (see Phase 1 below).

**✅ Codebase Alignment:**
- All entity IDs match your documented setup (`docs/ENTITIES.md`)
- Hook names updated to use context hooks (`useHA`, `usePhenology`)
- Component structure matches your `App.jsx` / `Dashboard` pattern
- Integration points verified against existing phenology system
- Automation structure aligns with your `automation-manager.js` patterns

---

## 📋 Table of Contents

1. [Prerequisites & Setup](#prerequisites--setup)
2. [Phase 1: Fan Power Coordination (Immediate Fix)](#phase-1-fan-power-coordination-immediate-fix)
3. [Phase 2: Smart Decision Engine](#phase-2-smart-decision-engine)
4. [Phase 3: Visualization & UI](#phase-3-visualization--ui)
5. [Phase 4: AI-Assisted Analysis & Optimization](#phase-4-ai-assisted-analysis--optimization)
6. [Testing & Validation](#testing--validation)
7. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites & Setup

### ✅ Pre-Implementation Checklist

Before starting, verify these conditions:

- [ ] Home Assistant is accessible at `http://100.65.202.84:8123`
- [ ] MCP connection is working (test with `hass-mcp` tool)
- [ ] Dashboard dev server can start (`cd dashboard && npm run dev`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Current VPD value confirmed via MCP
- [ ] **CRITICAL:** Exhaust fan power control entity verified (see verification below)
- [ ] Git repository has no uncommitted changes (commit current work first)

### 🔍 Verification Commands

**IMPORTANT:** Before implementing, you MUST verify the exhaust fan power control entity exists.

```bash
# Test MCP connection
# Run this via Cursor's MCP tools
get_entity sensor.ac_infinity_controller_69_pro_vpd

# Expected output: Current VPD value (check against target for current stage)

# CRITICAL: Verify exhaust fan power control entity
# The AC Infinity Controller may expose fan power control differently
# Try these entity IDs to find the correct one:

get_entity number.exhaust_fan_on_power
# OR
get_entity number.exhaust_fan_power
# OR  
get_entity number.exhaust_fan_level
# OR check if AC Infinity uses a different service

# Also verify the sensor exists (read-only):
get_entity sensor.exhaust_fan_current_power

# Expected: Should return current power level (1-10)

# Check dashboard build
cd dashboard
npm run lint
npm run dev
```

**✅ Entity Verification Complete:**

**VERIFICATION RESULTS (January 19, 2026 - UPDATED):**

1. **`number.exhaust_fan_on_power`:** ✅ **EXISTS - VERIFIED**
   - Entity ID: `number.exhaust_fan_on_power`
   - Verification: Confirmed via Home Assistant history logs
   - Type: `number` entity (writable)
   - Service: `number.set_value` can be used to set power level (1-10)
   - Status: READY TO IMPLEMENT

2. **`sensor.exhaust_fan_current_power`:** ✅ EXISTS (read-only)
   - Current value: 5 (power level 1-10)
   - Documented in `docs/ENTITIES.md`
   - Used in `useHomeAssistant.js` hook
   - Purpose: Monitor actual fan power for automation conditions

3. **`select.exhaust_fan_active_mode`:** ✅ EXISTS (control method)
   - Options: [On, Off, Auto]
   - Used for enabling/disabling fan
   - Power level is controlled separately via `number.exhaust_fan_on_power`

**CONCLUSION:** 
- **Scenario A applies** - Direct fan power control via Home Assistant entity IS available
- Entity `number.exhaust_fan_on_power` can be used to set fan power levels (1-10)
- **Recommended Approach:** Proceed with full coordinated control (Phase 1 as originally written)
- Home Assistant automations can control both humidifier AND fan power

---

## ✅ VERIFIED IMPLEMENTATION PATH

**Verification Complete:** All required entities exist and are accessible.

**Implementation Path:** Standard Phase 1-3 implementation
- Phase 1: Fan Power Coordination (30-60 min)
- Phase 2: Smart Decision Engine (2-3 hours)
- Phase 3: Visualization & UI (1-2 hours)

**Entity Details:**
- Fan Power Control: `number.exhaust_fan_on_power` ✅
- Fan Power Sensor: `sensor.exhaust_fan_current_power` ✅
- Humidifier Control: `select.cloudforge_t5_active_mode` ✅

**Proceed to Phase 1.**

---

## Phase 1: Fan Power Coordination (Immediate Fix)

**Goal:** Reduce exhaust fan power when VPD is high to help humidifier catch up  
**Time Estimate:** 30 minutes  
**Impact:** Should reduce VPD from 2.65 kPa to <0.8 kPa within 24-48 hours

### Step 1.1: Add Fan Power Entities to Constants

**File:** `dashboard/src/types/entities.js`

**Action:** Add two new entity constants for exhaust fan power control.

**Code to Add:**

```javascript
// Add these to the ENTITIES constant (around line 50)
  
  // Exhaust Fan Power Control (for dynamic VPD management)
  EXHAUST_FAN_ON_POWER: 'number.exhaust_fan_on_power',
  EXHAUST_FAN_CURRENT_POWER: 'sensor.exhaust_fan_current_power',
```

**Verification:**

```bash
# Run linter
npm run lint

# Expected: No errors

# Check the file manually
cat src/types/entities.js | grep EXHAUST_FAN
```

**Expected Output:**
```
EXHAUST_FAN_MODE: 'select.exhaust_fan_active_mode',
EXHAUST_FAN_ON_POWER: 'number.exhaust_fan_on_power',
EXHAUST_FAN_CURRENT_POWER: 'sensor.exhaust_fan_current_power',
```

---

### Step 1.2: Add Automation IDs

**File:** `dashboard/src/services/automation-manager.js`

**Action:** Add two new automation ID constants.

**Code to Add:**

```javascript
// Add to AUTOMATION_IDS object (around line 15)
  VPD_FAN_REDUCE: 'phenology_vpd_fan_reduce',
  VPD_FAN_RESTORE: 'phenology_vpd_fan_restore',
```

**Verification:**

```bash
npm run lint

# Check the constant
cat src/services/automation-manager.js | grep VPD_FAN
```

**Expected Output:**
```
VPD_FAN_REDUCE: 'phenology_vpd_fan_reduce',
VPD_FAN_RESTORE: 'phenology_vpd_fan_restore',
```

---

### Step 1.3: Create Fan Power Reduction Automation Builder

**File:** `dashboard/src/services/automation-manager.js`

**Action:** Add function to build automation that reduces fan power when VPD is too high.

**Code to Add (insert before `buildAllAutomations` function):**

```javascript
/**
 * Build automation: Reduce exhaust fan power when VPD is too high
 * 
 * Strategy: When VPD exceeds target, the humidifier is working against
 * the exhaust fan. By reducing fan power, we retain more moisture in
 * the tent, allowing the humidifier to catch up.
 * 
 * @param {Object} stage - Growth stage object from phenology
 * @returns {Object|null} Automation config or null if not applicable
 */
export function buildVPDFanReduceAutomation(stage) {
  // Skip for harvest stage (no active plants to transpire)
  if (stage.id === 'harvest_dry') return null;

  const reducedPower = 2; // Low power (1-10 scale)
  
  return {
    id: AUTOMATION_IDS.VPD_FAN_REDUCE,
    alias: `Phenology: VPD High - Reduce Exhaust Fan (${stage.name})`,
    description: `Reduce exhaust fan power to ${reducedPower} when VPD > ${stage.vpd.max} kPa to help humidifier catch up. This retains moisture in the tent while the humidifier works to increase humidity. Auto-generated by GrowOp Dashboard.`,
    trigger: [
      {
        platform: 'numeric_state',
        entity_id: ENTITIES.VPD,
        above: stage.vpd.max, // Stage-specific (0.8 for seedling)
        for: { minutes: 5 }, // Prevent rapid cycling
      },
    ],
    condition: [
      {
        condition: 'state',
        entity_id: ENTITIES.LIGHT,
        state: 'on', // Only during day period (active transpiration)
      },
      {
        condition: 'state',
        entity_id: ENTITIES.EXHAUST_FAN_MODE,
        state: 'On', // Only if fan is currently on
      },
      {
        condition: 'numeric_state',
        entity_id: ENTITIES.EXHAUST_FAN_CURRENT_POWER,  // ✅ Verified exists (sensor, read-only)
        above: reducedPower, // Only reduce if currently higher
      },
    ],
    action: [
      {
        service: 'number.set_value',
        target: { entity_id: ENTITIES.EXHAUST_FAN_ON_POWER },
        data: { value: reducedPower },
      },
    ],
    mode: 'single',
  };
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 1.4: Create Fan Power Restoration Automation Builder

**File:** `dashboard/src/services/automation-manager.js`

**Action:** Add function to build automation that restores fan power when VPD returns to target.

**Code to Add (insert after the previous function):**

```javascript
/**
 * Build automation: Restore exhaust fan power when VPD is optimal
 * 
 * Strategy: Once VPD drops below the optimal threshold, we can safely
 * restore the fan to normal power without fighting the humidifier.
 * Longer delay ensures VPD has stabilized before restoring.
 * 
 * @param {Object} stage - Growth stage object from phenology
 * @returns {Object|null} Automation config or null if not applicable
 */
export function buildVPDFanRestoreAutomation(stage) {
  // Skip for harvest stage
  if (stage.id === 'harvest_dry') return null;

  const normalPower = 5; // Normal power level
  
  return {
    id: AUTOMATION_IDS.VPD_FAN_RESTORE,
    alias: `Phenology: VPD OK - Restore Exhaust Fan (${stage.name})`,
    description: `Restore exhaust fan power to ${normalPower} when VPD < ${stage.vpd.optimal} kPa. Longer delay ensures VPD has stabilized. Auto-generated by GrowOp Dashboard.`,
    trigger: [
      {
        platform: 'numeric_state',
        entity_id: ENTITIES.VPD,
        below: stage.vpd.optimal, // Stage-specific (0.6 for seedling)
        for: { minutes: 10 }, // Longer delay to ensure stability
      },
    ],
    condition: [
      {
        condition: 'numeric_state',
        entity_id: ENTITIES.EXHAUST_FAN_CURRENT_POWER,
        below: normalPower, // Only restore if currently lower
      },
    ],
    action: [
      {
        service: 'number.set_value',
        target: { entity_id: ENTITIES.EXHAUST_FAN_ON_POWER },
        data: { value: normalPower },
      },
    ],
    mode: 'single',
  };
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 1.5: Add Functions to Build Pipeline

**File:** `dashboard/src/services/automation-manager.js`

**Action:** Add the two new functions to the `buildAllAutomations` array.

**Find this function (around line 200):**

```javascript
export function buildAllAutomations(stage) {
  const automations = [
    buildLightOnAutomation(stage),
    buildLightOffAutomation(stage),
    buildDayTempAutomation(stage),
    buildNightTempAutomation(stage),
    buildVPDHumidifierOnAutomation(stage),
    buildVPDHumidifierOffAutomation(stage),
  ];

  return automations.filter(Boolean);
}
```

**Change to:**

```javascript
export function buildAllAutomations(stage) {
  const automations = [
    buildLightOnAutomation(stage),
    buildLightOffAutomation(stage),
    buildDayTempAutomation(stage),
    buildNightTempAutomation(stage),
    buildVPDHumidifierOnAutomation(stage),
    buildVPDHumidifierOffAutomation(stage),
    buildVPDFanReduceAutomation(stage),    // NEW: Coordinated fan control
    buildVPDFanRestoreAutomation(stage),   // NEW: Coordinated fan control
  ];

  // Filter out nulls (harvest_dry skips some automations)
  return automations.filter(Boolean);
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors

# Count the functions
cat src/services/automation-manager.js | grep "buildVPD" | wc -l

# Expected: 4 (two for humidifier, two for fan)
```

**⚠️ CRITICAL:** Without this step, the new automation functions won't be called and Phase 1 will not work!

---

### Step 1.6: Test Automation Generation

**Action:** Start the dev server and verify the automations generate correctly.

```bash
npm run dev
```

**In Browser:**

1. Navigate to `http://localhost:5173`
2. Open browser DevTools (F12)
3. Check Console for logs
4. Look for `[AUTO-MGR]` logs showing 8 automations built

**Expected Console Output:**

```
[AUTO-MGR] Building automations for stage: Seedling
[AUTO-MGR] Built 8 automation configs: [
  "phenology_light_on",
  "phenology_light_off",
  "phenology_day_temp",
  "phenology_night_temp",
  "phenology_vpd_humidifier_on",
  "phenology_vpd_humidifier_off",
  "phenology_vpd_fan_reduce",     ← NEW
  "phenology_vpd_fan_restore"     ← NEW
]
```

**If you see this:** ✅ Phase 1 code is correct  
**If you don't:** ❌ Check previous steps for errors

---

### Step 1.7: Deploy to Home Assistant

**Action:** Use the dashboard's deployment feature to push automations to HA.

**Steps:**

1. In the dashboard, navigate to the "Schedule Editor" or "Automation Manager" component
2. Verify current stage is "Seedling"
3. Click "Deploy Automations" button
4. Wait for deployment confirmation

**Verification via MCP:**

```bash
# List all automations
list_entities --domain automation | grep phenology

# Expected: 8 automations including:
# - automation.phenology_vpd_fan_reduce
# - automation.phenology_vpd_fan_restore
```

**Alternative Verification (Home Assistant UI):**

1. Navigate to `http://100.65.202.84:8123`
2. Go to Settings → Automations & Scenes → Automations
3. Search for "phenology"
4. Verify 8 automations exist (6 old + 2 new)

---

### Step 1.8: Monitor Initial Behavior

**Action:** Monitor VPD and fan power for the next hour to verify automations trigger.

**Monitoring via MCP (run every 5 minutes):**

```bash
get_entity sensor.ac_infinity_controller_69_pro_vpd
get_entity number.exhaust_fan_on_power
get_entity number.exhaust_fan_current_power
```

**Expected Behavior:**

| Time | VPD | Fan Power | Status |
|------|-----|-----------|--------|
| T+0 min | 2.65 kPa | 5 | Waiting for trigger |
| T+5 min | 2.60 kPa | 2 | ✅ Fan reduced! |
| T+30 min | 1.2 kPa | 2 | VPD decreasing |
| T+60 min | 0.9 kPa | 2 | Still decreasing |
| T+4 hours | 0.6 kPa | 5 | ✅ Fan restored! |

**Success Criteria:**

- [ ] Within 10 minutes, fan power drops to 2
- [ ] VPD starts decreasing
- [ ] No rapid cycling (fan should stay at 2 for at least 30 minutes)
- [ ] When VPD < 0.6 kPa, fan restores to 5

---

### Step 1.9: Document Changes

**File:** `docs/CHANGELOG.md`

**Action:** Add entry documenting this implementation.

**Code to Add:**

```markdown
## [Phase 1] - 2026-01-19

### Added - Coordinated Fan Power Control for VPD Management

**Problem:** VPD was critically high (2.65 kPa) because exhaust fan (power 5) was removing moisture faster than humidifier could add it.

**Verification Results:**
- ✅ `number.exhaust_fan_on_power` entity EXISTS in Home Assistant (verified via history logs)
- ✅ `sensor.exhaust_fan_current_power` exists (read-only sensor)
- ✅ `select.exhaust_fan_active_mode` exists (On/Off/Auto control)

**Solution:** Implemented coordinated automations that dynamically adjust exhaust fan power based on VPD:

- **VPD > 0.8 kPa:** Reduce exhaust fan to power 2 (retain moisture)
- **VPD < 0.6 kPa:** Restore exhaust fan to power 5 (normal operation)

**Implementation:**

- Added `EXHAUST_FAN_ON_POWER` and `EXHAUST_FAN_CURRENT_POWER` to `entities.js`
- Added `buildVPDFanReduceAutomation()` to `automation-manager.js`
- Added `buildVPDFanRestoreAutomation()` to `automation-manager.js`
- Updated `buildAllAutomations()` to include new automations
- Total automations per stage: 8 (was 6)

**Expected Impact:** VPD should decrease from 2.65 kPa to target range (0.4-0.8 kPa) within 24-48 hours.

**Files Modified:**
- `dashboard/src/types/entities.js`
- `dashboard/src/services/automation-manager.js`
- `docs/CHANGELOG.md` (this file)

**Deployed:** 2026-01-19
**Status:** ✅ Active - Monitoring for 24 hours
```

---

### ✅ Phase 1 Complete Checklist

- [x] **CRITICAL:** Verified `number.exhaust_fan_on_power` entity exists via MCP (Scenario A confirmed)
- [ ] Fan power entities added to `entities.js` (with correct entity IDs)
- [ ] Automation IDs added to `automation-manager.js`
- [ ] `buildVPDFanReduceAutomation()` function created
- [ ] `buildVPDFanRestoreAutomation()` function created
- [ ] Functions added to `buildAllAutomations()` array
- [ ] `npm run lint` passes with no errors
- [ ] Dev server starts and shows 8 automations in console
- [ ] Automations deployed to Home Assistant successfully
- [ ] 8 automations visible in HA UI (verify via MCP or HA UI)
- [ ] **Test:** Manually triggered high VPD condition (or wait for natural trigger)
- [ ] **Test:** Fan power reduced to 2 within automation delay period (5-10 minutes)
- [ ] **Test:** VPD trend confirmed decreasing (monitor for 1-2 hours)
- [ ] No rapid cycling observed (fan should not change every few minutes)
- [ ] CHANGELOG.md updated with implementation details

**If all boxes checked:** ✅ **Phase 1 is complete!** Proceed to Phase 2 after 24 hours of monitoring.

**If any boxes unchecked:** ❌ Review the corresponding step and fix before proceeding.

**⚠️ Common Issues:**
- If `number.exhaust_fan_on_power` doesn't exist, verify entity ID is correct
- If automations don't trigger, check trigger conditions and delays
- If fan power doesn't change, verify service call permissions and entity accessibility

---

## Phase 2: Smart Decision Engine

**Goal:** Build an intelligent controller that analyzes environmental state and makes coordinated decisions  
**Time Estimate:** 2-3 hours  
**Impact:** True multi-variable control with reasoning and override capabilities

### Prerequisites for Phase 2

- [ ] Phase 1 completed successfully
- [ ] 24 hours of monitoring data collected
- [ ] VPD has improved (trending toward target)
- [ ] No rapid cycling observed
- [ ] Git commit: "Phase 1: Fan power coordination implemented"

---

### Step 2.1: Create Environment Controller Service

**File:** `dashboard/src/services/environment-controller.js` (NEW FILE)

**Action:** Create a new service that implements the decision engine.

**Full Code:**

```javascript
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
            // Problem is primarily low humidity
            actions.push({
              device: 'humidifier',
              action: 'turn_on',
              reason: `Increase humidity to reduce VPD (currently ${this.current.humidity.toFixed(1)}%, target ${this.target.humidityOptimal}%)`,
              priority: 1,
            });
            
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
          // Humidity too low (often related to VPD_HIGH)
          actions.push({
            device: 'humidifier',
            action: 'turn_on',
            reason: `Increase humidity to target range (currently ${this.current.humidity.toFixed(1)}%, target ${this.target.humidityOptimal}%)`,
            priority: 1,
          });
          
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
          // Humidity too high
          actions.push({
            device: 'humidifier',
            action: 'turn_off',
            reason: 'Stop adding moisture',
            priority: 1,
          });
          
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
      const key = `${action.device}-${action.action}`;
      
      if (!seen.has(key) || action.priority < seen.get(key).priority) {
        seen.set(key, action);
      }
    }
    
    return Array.from(seen.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute action plan via Home Assistant
   * 
   * @param {Array<Object>} actions - Actions from generateActionPlan()
   * @param {Function} callService - Home Assistant service call function
   * @returns {Promise<Array<Object>>} Execution results
   */
  async executeActionPlan(actions, callService) {
    const results = [];
    
    for (const action of actions) {
      console.log(`[ENV-CTRL] Executing: ${action.reason}`);
      console.log(`[ENV-CTRL]   Device: ${action.device}, Action: ${action.action}`);
      
      try {
        let result;
        
        switch (action.device) {
          case 'humidifier':
            result = await callService('select', 'select_option', {
              entity_id: ENTITIES.HUMIDIFIER_MODE,
              option: action.action === 'turn_on' ? 'On' : 'Off',
            });
            break;
            
          case 'exhaustFan':
            if (action.action === 'reduce_power' || action.action === 'increase_power') {
              result = await callService('number', 'set_value', {
                entity_id: ENTITIES.EXHAUST_FAN_ON_POWER,
                value: action.toPower,
              });
            }
            break;
            
          case 'heater':
            if (action.action === 'reduce_temp' || action.action === 'increase_temp') {
              result = await callService('climate', 'set_temperature', {
                entity_id: ENTITIES.HEATER,
                temperature: action.toTemp,
              });
            }
            break;
        }
        
        results.push({ 
          action, 
          success: true,
          result,
        });
      } catch (error) {
        console.error(`[ENV-CTRL] Failed to execute action:`, error);
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
    },
    heater: {
      currentTemp: parseFloat(entities[ENTITIES.HEATER]?.attributes?.current_temperature || 0),
      targetTemp: parseFloat(entities[ENTITIES.HEATER]?.attributes?.temperature || 0),
    },
  };
  
  return new EnvironmentController(currentState, targetState, actuators);
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 2.2: Create React Hook for Environment Control

**File:** `dashboard/src/hooks/useEnvironmentController.js` (NEW FILE)

**Action:** Create a React hook that runs the controller periodically.

**Full Code:**

```javascript
/**
 * React hook for intelligent environmental control
 * 
 * This hook:
 * - Runs the environment controller every 5 minutes
 * - Analyzes current state vs targets
 * - Generates and executes action plans
 * - Logs all decisions for transparency
 * - Provides override controls
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createControllerFromState } from '../services/environment-controller.js';
import { useHA } from '../context/HomeAssistantContext.js';  // Use context hook, not direct hook
import { usePhenology } from '../context/PhenologyContext.js';  // Use context hook for phenology

/**
 * Hook for running the intelligent environment controller
 * 
 * @param {Object} options - Configuration options
 * @param {number} options.intervalMinutes - How often to run (default: 5)
 * @param {boolean} options.enabled - Whether controller is active (default: true)
 * @returns {Object} Controller state and controls
 */
export function useEnvironmentController({ 
  intervalMinutes = 5, 
  enabled = true 
} = {}) {
  // Use context hooks (matches your existing codebase structure)
  const { entities, callService } = useHA();  // From HomeAssistantContext
  const { currentStage } = usePhenology();  // From PhenologyContext
  
  const [actionLog, setActionLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [isEnabled, setIsEnabled] = useState(enabled);
  
  // Use ref to avoid recreating interval on every state change
  const enabledRef = useRef(enabled);
  enabledRef.current = isEnabled;

  /**
   * Run the controller analysis and execution
   */
  const runController = useCallback(async () => {
    if (!enabledRef.current) {
      console.log('[ENV-CTRL] Controller is disabled, skipping run');
      return;
    }
    
    if (!currentStage) {
      console.warn('[ENV-CTRL] No phenology stage selected, skipping run');
      return;
    }
    
    setIsThinking(true);
    const startTime = new Date();
    
    console.log('[ENV-CTRL] Starting environment analysis...');
    
    try {
      // Create controller from current state
      const controller = createControllerFromState(entities, currentStage);
      
      // Analyze problems
      const problems = controller.analyzeState();
      console.log('[ENV-CTRL] Problems detected:', problems);
      
      // If no problems, we're done
      if (problems.length === 0) {
        console.log('[ENV-CTRL] No problems detected - environment is optimal ✅');
        setActionLog(prev => [{
          timestamp: startTime,
          problems: [],
          actionPlan: [],
          results: [],
          status: 'optimal',
        }, ...prev.slice(0, 99)]); // Keep last 100 entries
        
        setLastRun(startTime);
        setIsThinking(false);
        return;
      }
      
      // Generate action plan
      const actionPlan = controller.generateActionPlan(problems);
      console.log('[ENV-CTRL] Action plan generated:', actionPlan);
      
      // Execute actions
      const results = await controller.executeActionPlan(actionPlan, callService);
      console.log('[ENV-CTRL] Execution results:', results);
      
      // Log the run
      const logEntry = {
        timestamp: startTime,
        problems,
        actionPlan,
        results,
        status: results.every(r => r.success) ? 'success' : 'partial_failure',
      };
      
      setActionLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries
      setLastRun(startTime);
      
      console.log('[ENV-CTRL] Controller run complete');
    } catch (error) {
      console.error('[ENV-CTRL] Controller run failed:', error);
      
      setActionLog(prev => [{
        timestamp: startTime,
        problems: [],
        actionPlan: [],
        results: [],
        status: 'error',
        error: error.message || String(error),
      }, ...prev.slice(0, 99)]);
      
      setLastRun(startTime);
    } finally {
      setIsThinking(false);
    }
  }, [entities, currentStage, callService]);

  /**
   * Manual trigger (for testing or manual intervention)
   */
  const triggerNow = useCallback(() => {
    console.log('[ENV-CTRL] Manual trigger requested');
    runController();
  }, [runController]);

  /**
   * Enable/disable controller
   */
  const setEnabled = useCallback((value) => {
    console.log('[ENV-CTRL] Controller', value ? 'enabled' : 'disabled');
    setIsEnabled(value);
  }, []);

  /**
   * Clear action log
   */
  const clearLog = useCallback(() => {
    console.log('[ENV-CTRL] Clearing action log');
    setActionLog([]);
  }, []);

  // Set up periodic execution
  useEffect(() => {
    if (!enabledRef.current) {
      console.log('[ENV-CTRL] Controller disabled, not starting interval');
      return;
    }
    
    console.log(`[ENV-CTRL] Starting controller with ${intervalMinutes}min interval`);
    
    // Run immediately on mount
    runController();
    
    // Then run periodically
    const interval = setInterval(runController, intervalMinutes * 60 * 1000);
    
    return () => {
      console.log('[ENV-CTRL] Cleaning up controller interval');
      clearInterval(interval);
    };
  }, [intervalMinutes, runController]);

  return {
    // State
    actionLog,
    isThinking,
    lastRun,
    isEnabled,
    latestAction: actionLog[0] || null,
    
    // Controls
    triggerNow,
    setEnabled,
    clearLog,
  };
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 2.3: Test the Controller (Dry Run)

**Action:** Create a test component to verify the controller logic without executing actions.

**File:** `dashboard/src/components/ControllerTest.jsx` (TEMPORARY TEST FILE)

**Full Code:**

```jsx
/**
 * TEMPORARY: Controller test component
 * This will be removed after Phase 2 testing
 */

import { useEnvironmentController } from '../hooks/useEnvironmentController';

export function ControllerTest() {
  const { 
    actionLog, 
    isThinking, 
    lastRun, 
    isEnabled,
    latestAction,
    triggerNow,
    setEnabled,
  } = useEnvironmentController({ 
    intervalMinutes: 1, // Test every 1 minute
    enabled: false,     // Start disabled for safety
  });

  return (
    <div className="p-4 bg-zinc-900 rounded-lg">
      <h2 className="text-xl font-bold mb-4">🧪 Controller Test Panel</h2>
      
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded ${isEnabled ? 'bg-optimal' : 'bg-zinc-700'}`}>
            {isEnabled ? '🟢 ENABLED' : '⚪ DISABLED'}
          </span>
          
          {isThinking && (
            <span className="px-3 py-1 bg-neon-green rounded animate-pulse">
              🧠 THINKING...
            </span>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={() => setEnabled(!isEnabled)}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 rounded"
          >
            {isEnabled ? 'Disable' : 'Enable'} Controller
          </button>
          
          <button
            onClick={triggerNow}
            className="px-4 py-2 bg-neon-green text-black hover:bg-green-400 rounded"
            disabled={isThinking}
          >
            Trigger Now
          </button>
        </div>
        
        {/* Last Run */}
        {lastRun && (
          <div className="text-sm text-zinc-400">
            Last run: {lastRun.toLocaleTimeString()}
          </div>
        )}
        
        {/* Latest Action */}
        {latestAction && (
          <div className="bg-zinc-800 p-4 rounded">
            <h3 className="font-semibold mb-2">Latest Decision:</h3>
            
            {/* Problems */}
            {latestAction.problems.length > 0 ? (
              <div className="mb-3">
                <p className="text-sm text-zinc-500 mb-1">Problems Detected:</p>
                <ul className="space-y-1">
                  {latestAction.problems.map((problem, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-caution">⚠️</span>
                      <span>{problem.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-optimal mb-3">✅ No problems - environment is optimal!</p>
            )}
            
            {/* Action Plan */}
            {latestAction.actionPlan.length > 0 && (
              <div className="mb-3">
                <p className="text-sm text-zinc-500 mb-1">Action Plan:</p>
                <ul className="space-y-2">
                  {latestAction.actionPlan.map((action, i) => (
                    <li key={i} className="text-sm bg-zinc-900 p-2 rounded">
                      <div className="font-medium">{action.device}</div>
                      <div className="text-zinc-400">{action.reason}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Results */}
            {latestAction.results.length > 0 && (
              <div>
                <p className="text-sm text-zinc-500 mb-1">Results:</p>
                <div className="flex items-center gap-2">
                  {latestAction.results.every(r => r.success) ? (
                    <>
                      <span className="text-optimal">✅</span>
                      <span className="text-sm">All actions executed successfully</span>
                    </>
                  ) : (
                    <>
                      <span className="text-critical">❌</span>
                      <span className="text-sm">Some actions failed</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Action Log */}
        <div>
          <h3 className="font-semibold mb-2">Action History ({actionLog.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {actionLog.slice(0, 10).map((entry, i) => (
              <div key={i} className="bg-zinc-800 p-2 rounded text-sm">
                <div className="text-zinc-400">
                  {entry.timestamp.toLocaleTimeString()} - 
                  {entry.status === 'optimal' && ' ✅ Optimal'}
                  {entry.status === 'success' && ' ✅ Actions taken'}
                  {entry.status === 'partial_failure' && ' ⚠️ Partial failure'}
                  {entry.status === 'error' && ' ❌ Error'}
                </div>
                {entry.problems.length > 0 && (
                  <div className="mt-1">
                    {entry.problems.length} problem(s), {entry.actionPlan.length} action(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 2.4: Add Test Component to Dashboard

**File:** `dashboard/src/App.jsx`

**Action:** Temporarily add the test component to verify functionality.

**Find the main return statement and add:**

```jsx
import { ControllerTest } from './components/ControllerTest';

// ... in the return statement ...

{/* TEMPORARY: Phase 2 Testing */}
<div className="mb-8">
  <ControllerTest />
</div>
```

**Verification:**

```bash
npm run dev

# Open browser to http://localhost:5173
# You should see the test panel
```

---

### Step 2.5: Test Controller Logic

**Action:** Use the test panel to verify the controller makes correct decisions.

**Test Scenarios:**

1. **Click "Trigger Now"** (with controller disabled initially)
2. **Verify console logs** show problem analysis
3. **Check action plan** makes sense for current VPD
4. **Enable controller** and monitor for 10 minutes
5. **Verify no crashes** or infinite loops

**Expected Console Output:**

```
[ENV-CTRL] Starting environment analysis...
[ENV-CTRL] Problems detected: [
  {
    type: "VPD_HIGH",
    severity: 100,
    currentValue: 2.09,
    targetValue: 0.6,
    ...
  }
]
[ENV-CTRL] Action plan generated: [
  {
    device: "humidifier",
    action: "turn_on",
    reason: "Increase humidity to reduce VPD...",
    ...
  },
  {
    device: "exhaustFan",
    action: "reduce_power",
    toPower: 2,
    reason: "Reduce air exchange to retain moisture...",
    ...
  }
]
```

**Success Criteria:**

- [ ] Controller analyzes problems correctly
- [ ] Action plan is logical and coordinated
- [ ] No TypeScript/lint errors
- [ ] No infinite loops or crashes
- [ ] Console logs show clear reasoning

---

### Step 2.6: Remove Test Component

**Action:** Once testing is complete, remove the temporary test component.

**File:** `dashboard/src/App.jsx`

**Remove the import and component usage:**

```jsx
// DELETE THIS:
import { ControllerTest } from './components/ControllerTest';

// DELETE THIS FROM RETURN:
<div className="mb-8">
  <ControllerTest />
</div>
```

**File:** `dashboard/src/components/ControllerTest.jsx`

**Action:** Delete this entire file (it was temporary).

```bash
rm src/components/ControllerTest.jsx
```

**Verification:**

```bash
npm run lint
npm run dev

# Dashboard should work without test component
```

---

### ✅ Phase 2 Complete Checklist

- [ ] `environment-controller.js` created with all methods
- [ ] `useEnvironmentController.js` hook created
- [ ] Test component created and verified
- [ ] Controller logic tested and confirmed correct
- [ ] Test component removed
- [ ] `npm run lint` passes with no errors
- [ ] No console errors or warnings
- [ ] Git commit: "Phase 2: Smart decision engine implemented"

**If all boxes checked:** ✅ **Phase 2 is complete!** Proceed to Phase 3.

---

## Phase 3: Visualization & UI

**Goal:** Create a user-friendly interface showing what the controller is thinking  
**Time Estimate:** 1-2 hours  
**Impact:** Transparency and user confidence in automated decisions

### Prerequisites for Phase 3

- [ ] Phase 2 completed successfully
- [ ] Controller tested and working
- [ ] Git commit: "Phase 2 complete"

---

### Step 3.1: Create System Thinking Panel Component

**File:** `dashboard/src/components/SystemThinkingPanel.jsx` (NEW FILE)

**Action:** Create a visual component that shows the controller's decision-making.

**Full Code:**

```jsx
/**
 * System Thinking Panel
 * 
 * Displays the intelligent controller's analysis, decisions, and actions
 * in a user-friendly format.
 */

import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Brain } from 'lucide-react';
import { format } from 'date-fns';

/**
 * @param {Object} props
 * @param {Array} props.actionLog - Controller action history
 * @param {boolean} props.isThinking - Whether controller is currently analyzing
 * @param {boolean} props.isEnabled - Whether controller is enabled
 */
export function SystemThinkingPanel({ actionLog, isThinking, isEnabled }) {
  const latestAction = actionLog[0];

  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-neon-green" />
          <h3 className="text-xl font-semibold">System Thinking</h3>
        </div>
        
        {isThinking && (
          <span className="px-3 py-1 bg-neon-green text-black rounded-full text-sm font-medium animate-pulse">
            Analyzing...
          </span>
        )}
        
        {!isEnabled && (
          <span className="px-3 py-1 bg-zinc-700 text-zinc-400 rounded-full text-sm font-medium">
            Inactive
          </span>
        )}
      </div>
      
      {/* Latest Decision */}
      {latestAction ? (
        <div className="space-y-6">
          {/* Problems Detected */}
          <div>
            <p className="text-sm text-zinc-500 font-medium mb-3">Problems Detected:</p>
            {latestAction.problems.length > 0 ? (
              <div className="space-y-2">
                {latestAction.problems.map((problem, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-3 bg-zinc-800 p-3 rounded-lg"
                  >
                    <AlertTriangle 
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{
                        color: problem.severity > 75 ? '#ef4444' : 
                               problem.severity > 50 ? '#f59e0b' : '#fbbf24'
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{problem.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Severity: {problem.severity}/100 • 
                        Delta: {problem.delta > 0 ? '+' : ''}{problem.delta.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-optimal">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Environment is optimal - no problems detected</span>
              </div>
            )}
          </div>
          
          {/* Action Plan */}
          {latestAction.actionPlan.length > 0 && (
            <div>
              <p className="text-sm text-zinc-500 font-medium mb-3">Action Plan:</p>
              <div className="space-y-2">
                {latestAction.actionPlan.map((action, i) => (
                  <div 
                    key={i} 
                    className="bg-zinc-800 p-3 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">
                          {action.device.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">{action.reason}</p>
                        {action.toPower && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Power: {action.fromPower || '?'} → {action.toPower}
                          </p>
                        )}
                        {action.toTemp && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Temp: {action.fromTemp ? `${action.fromTemp.toFixed(1)}°F` : '?'} → {action.toTemp.toFixed(1)}°F
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Execution Results */}
          {latestAction.results.length > 0 && (
            <div>
              <p className="text-sm text-zinc-500 font-medium mb-3">Results:</p>
              <div className="bg-zinc-800 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  {latestAction.results.every(r => r.success) ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-optimal" />
                      <span className="text-sm text-optimal">All actions executed successfully</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-critical" />
                      <span className="text-sm text-critical">
                        {latestAction.results.filter(r => !r.success).length} action(s) failed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Timestamp */}
          <p className="text-xs text-zinc-600">
            Last analysis: {format(latestAction.timestamp, 'MMM d, h:mm:ss a')}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No analysis history yet. Controller will run automatically every 5 minutes.
        </p>
      )}
    </div>
  );
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 3.2: Create Manual Control Panel Component

**File:** `dashboard/src/components/ManualControlPanel.jsx` (NEW FILE)

**Action:** Create a component for manual override controls.

**Full Code:**

```jsx
/**
 * Manual Control Panel
 * 
 * Allows users to:
 * - Enable/disable the intelligent controller
 * - Manually trigger an analysis
 * - View override mode status
 */

import { Power, PlayCircle, StopCircle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {boolean} props.isEnabled - Whether controller is enabled
 * @param {boolean} props.isThinking - Whether controller is currently running
 * @param {Function} props.onToggleEnabled - Callback to enable/disable
 * @param {Function} props.onTriggerNow - Callback to manually trigger
 */
export function ManualControlPanel({ 
  isEnabled, 
  isThinking, 
  onToggleEnabled, 
  onTriggerNow 
}) {
  return (
    <div className="bg-zinc-900 rounded-lg p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Power className="w-6 h-6 text-neon-green" />
        <h3 className="text-xl font-semibold">Controller Status</h3>
      </div>
      
      {/* Status Display */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-optimal animate-pulse' : 'bg-zinc-600'}`} />
          <span className="font-medium">
            {isEnabled ? 'Active - Auto Mode' : 'Inactive - Manual Mode'}
          </span>
        </div>
        {isEnabled && (
          <p className="text-sm text-zinc-500 mt-2">
            System is analyzing environment every 5 minutes and making automated adjustments.
          </p>
        )}
        {!isEnabled && (
          <p className="text-sm text-zinc-500 mt-2">
            Controller is paused. Manual control of all devices is active.
          </p>
        )}
      </div>
      
      {/* Controls */}
      <div className="space-y-3">
        {/* Enable/Disable Button */}
        <button
          onClick={onToggleEnabled}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isEnabled 
              ? 'bg-caution hover:bg-amber-600 text-black' 
              : 'bg-optimal hover:bg-green-600 text-black'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isEnabled ? (
              <>
                <StopCircle className="w-5 h-5" />
                <span>Disable Auto Mode</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>Enable Auto Mode</span>
              </>
            )}
          </div>
        </button>
        
        {/* Manual Trigger Button */}
        <button
          onClick={onTriggerNow}
          disabled={isThinking}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isThinking
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-700 hover:bg-zinc-600 text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            <span>{isThinking ? 'Analyzing...' : 'Analyze Now'}</span>
          </div>
        </button>
      </div>
      
      {/* Warning */}
      {!isEnabled && (
        <div className="mt-4 p-3 bg-caution/10 border border-caution/30 rounded-lg">
          <p className="text-xs text-caution">
            ⚠️ <strong>Warning:</strong> When auto mode is disabled, you are responsible 
            for manually adjusting all environmental controls. VPD, temperature, and humidity 
            targets will not be maintained automatically.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Verification:**

```bash
npm run lint

# Expected: No errors
```

---

### Step 3.3: Integrate Components into Dashboard

**File:** `dashboard/src/App.jsx`

**Action:** Add the new panels to the main dashboard view.

**Add imports:**

```jsx
import { SystemThinkingPanel } from './components/SystemThinkingPanel';
import { ManualControlPanel } from './components/ManualControlPanel';
import { useEnvironmentController } from './hooks/useEnvironmentController';
```

**Add hook in component:**

```jsx
function App() {
  // ... existing hooks ...
  
  // Add this:
  const {
    actionLog,
    isThinking,
    isEnabled,
    setEnabled,
    triggerNow,
  } = useEnvironmentController({
    intervalMinutes: 5,
    enabled: true, // Start enabled by default
  });
  
  // ... rest of component ...
}
```

**Add to return statement (choose good location in layout):**

```jsx
{/* Environment Controller Section */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
  <ManualControlPanel
    isEnabled={isEnabled}
    isThinking={isThinking}
    onToggleEnabled={() => setEnabled(!isEnabled)}
    onTriggerNow={triggerNow}
  />
  
  <SystemThinkingPanel
    actionLog={actionLog}
    isThinking={isThinking}
    isEnabled={isEnabled}
  />
</div>
```

**Verification:**

```bash
npm run dev

# Open http://localhost:5173
# Verify panels appear and function correctly
```

---

### Step 3.4: Test UI Functionality

**Action:** Verify all UI interactions work correctly.

**Test Cases:**

1. **Enable/Disable Toggle:**
   - Click "Disable Auto Mode" → Controller should stop running
   - Verify warning message appears
   - Click "Enable Auto Mode" → Controller should resume
   - Verify status light changes color

2. **Manual Trigger:**
   - Click "Analyze Now"
   - Verify "Analyzing..." appears
   - Verify System Thinking Panel updates with new analysis
   - Verify timestamp updates

3. **System Thinking Display:**
   - Verify problems are listed with severity colors
   - Verify action plan shows device names and reasons
   - Verify execution results show success/failure
   - Verify timestamp is human-readable

**Success Criteria:**

- [ ] All buttons responsive and functional
- [ ] Status indicators update correctly
- [ ] No console errors
- [ ] UI updates reflect controller state
- [ ] Panels are visually consistent with existing dashboard

---

### Step 3.5: Style Polish (Optional)

**Action:** Fine-tune colors, spacing, and animations for production quality.

**File:** `dashboard/src/components/SystemThinkingPanel.jsx`

**Optional improvements:**

- Add subtle entrance animations
- Improve color contrast for accessibility
- Add loading skeleton states
- Improve mobile responsiveness

**Verification:**

```bash
npm run lint
npm run dev

# Visual inspection in browser
```

---

### ✅ Phase 3 Complete Checklist

- [ ] `SystemThinkingPanel.jsx` created
- [ ] `ManualControlPanel.jsx` created
- [ ] Components integrated into `App.jsx`
- [ ] Enable/disable toggle works
- [ ] Manual trigger button works
- [ ] System thinking panel displays correctly
- [ ] All UI tests passed
- [ ] No console errors or warnings
- [ ] `npm run lint` passes
- [ ] Git commit: "Phase 3: Visualization and UI complete"

**If all boxes checked:** ✅ **Phase 3 is complete!** Proceed to Phase 4.

---

## Phase 4: AI-Assisted Analysis & Optimization

**Goal:** Add human-readable AI analysis of the intelligent control system  
**Time Estimate:** 2-3 hours  
**Prerequisites:** Phase 2 (Smart Decision Engine) must be complete  
**Impact:** Provides intelligent insights, optimization suggestions, and explains system behavior

### Overview

Phase 4 adds an AI-powered analysis layer that works **alongside** the EnvironmentController (Phase 2):

- **Phase 2** makes automated decisions every 5 minutes
- **Phase 4** explains those decisions and suggests optimizations
- They use the same hooks and contexts (`useHA()`, `usePhenology()`, `useEnvironmentController()`)

**Key Features:**
- **Decision Transparency:** Shows what the EnvironmentController decided and why
- **Variable Relationship Analysis:** Explains how temperature, humidity, fan power, and VPD interact
- **Optimization Suggestions:** Recommends fine-tuning targets and thresholds
- **Predictive Insights:** Forecasts how changes will affect the environment
- **Historical Pattern Analysis:** Learns from past decisions and outcomes

### Prerequisites for Phase 4

- [ ] Phase 2 completed successfully (EnvironmentController working)
- [ ] Phase 3 completed (UI components in place)
- [ ] Anthropic API account created (free tier available)
- [ ] Git commit: "Phase 3 complete"

---

### Step 4.1: Environment Setup

**File:** `dashboard/.env` (UPDATE)

**Action:** Add Anthropic API key for Claude API access.

```bash
# Add to dashboard/.env
# Anthropic API Key for AI Analysis
# Get yours at: https://console.anthropic.com/
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

**Also update:** `dashboard/.env.example`

```bash
# Anthropic API Key for AI-powered environmental analysis
# Create an API key at: https://console.anthropic.com/
# Recommended: Set a $5-10 monthly spending limit for safety
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

**Install Dependency:**

```bash
cd dashboard
npm install @anthropic-ai/sdk
```

**Get API Key:**
1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new key named "GrowOp Dashboard"
5. **IMPORTANT:** Set monthly spending limit ($5-10 recommended)
6. Copy key to `.env` file

---

### Step 4.2: Create Prompts File

**File:** `dashboard/src/prompts/environment-analysis.js` (NEW FILE)

**Action:** Create system prompts for Claude environmental analysis.

**Full Implementation:**

See `docs/AI_ASSIST_GUIDE.md` Section "IMPLEMENTATION STEP 2" for complete code.

**Key Functions:**
- `buildSystemPrompt(stageTargets, controllerState)` - System prompt explaining the grow setup and controller
- `buildAnalysisPrompt(sensorData, targets, actuatorStates, controllerState, actionHistory)` - User prompt with current state
- `parseAnalysisResponse(responseText)` - Parse Claude's JSON response
- `formatRecommendations(recommendations)` - Format recommendations with icons

**Response Schema:**
```javascript
{
  "status": "optimal" | "caution" | "critical",
  "summary": "1-2 sentence assessment",
  "controllerAnalysis": {
    "decisionCorrect": boolean,
    "decisionExplanation": "Why the controller made this decision",
    "coordinationQuality": "excellent" | "good" | "needs_improvement",
    "suggestedImprovements": ["suggestion 1", "suggestion 2"]
  },
  "variableRelationships": {
    "temperatureToVPD": "How temp changes affect VPD",
    "humidityToVPD": "How humidity changes affect VPD",
    "fanPowerToHumidity": "How fan power affects humidity in this basement",
    "interactions": "How multiple variables interact"
  },
  "optimizationSuggestions": [
    {
      "type": "target_adjustment" | "threshold_tuning" | "timing_adjustment",
      "parameter": "vpd.max" | "fanPower.reduced" | "triggerDelay",
      "currentValue": "current value",
      "suggestedValue": "suggested value",
      "reason": "Why this optimization helps",
      "expectedImpact": "What improvement to expect"
    }
  ],
  "predictions": [
    {
      "scenario": "If we reduce fan power to 2",
      "predictedOutcome": "VPD should drop by ~0.3 kPa within 2 hours",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "reasoning": "Detailed analysis explanation with variable relationships"
}
```

**Verification:**
```bash
# Check file exists
ls dashboard/src/prompts/environment-analysis.js

# Check exports
grep "export function" dashboard/src/prompts/environment-analysis.js
# Expected: buildSystemPrompt, buildAnalysisPrompt, parseAnalysisResponse, formatRecommendations
```

---

### Step 4.3: Create AI Service

**File:** `dashboard/src/services/ai-analysis.js` (NEW FILE)

**Action:** Create service for Claude API integration.

**Full Implementation:**

See `docs/AI_ASSIST_GUIDE.md` Section "IMPLEMENTATION STEP 3" for complete code.

**Key Features:**
- `AIAnalysisService` class with `analyzeEnvironment()` method
- Uses Anthropic SDK with `claude-sonnet-4-20250514` model
- Handles errors gracefully (never throws, returns error objects)
- Exports singleton instance: `export const aiAnalysis = new AIAnalysisService()`

**Verification:**
```bash
# Check file exists
ls dashboard/src/services/ai-analysis.js

# Check singleton export
grep "export const aiAnalysis" dashboard/src/services/ai-analysis.js
```

---

### Step 4.4: Create React Hook

**File:** `dashboard/src/hooks/useAIAnalysis.js` (NEW FILE)

**Action:** Create React hook for AI analysis state management.

**Full Implementation:**

See `docs/AI_ASSIST_GUIDE.md` Section "IMPLEMENTATION STEP 4" for complete code.

**Key Features:**
- Manages analysis state, loading, errors
- Integrates with `useHA()`, `usePhenology()`, `useEnvironmentController()`
- Provides `runAnalysis()`, `askQuestion()`, `executeRecommendation()`, `clearAnalysis()`
- Optional auto-analysis when VPD is critically high

**Hook Signature:**
```javascript
const {
  analysis, isAnalyzing, error, lastAnalyzed,
  isConfigured, runAnalysis, askQuestion, executeRecommendation, clearAnalysis
} = useAIAnalysis({ 
  sensorData, 
  stageTargets, 
  actuatorStates, 
  controllerState, 
  actionHistory 
});
```

**Verification:**
```bash
# Check file exists
ls dashboard/src/hooks/useAIAnalysis.js

# Check hook export
grep "export function useAIAnalysis" dashboard/src/hooks/useAIAnalysis.js
```

---

### Step 4.5: Create UI Component

**File:** `dashboard/src/components/AIAnalysisPanel.jsx` (NEW FILE)

**Action:** Create visual component for AI analysis display.

**Full Implementation:**

See `docs/AI_ASSIST_GUIDE.md` Section "IMPLEMENTATION STEP 5" for complete code.

**Key Sections:**
- Header with Analyze button
- Status badge (optimal/caution/critical)
- Controller Decision Analysis section
- Variable Relationships section
- Optimization Suggestions section
- Predictions section
- Follow-up question input
- Collapsible reasoning section

**Component Props:**
```javascript
<AIAnalysisPanel 
  sensorData={{ temp, humidity, vpd }}
  stageTargets={currentStage}
  actuatorStates={{ 
    light, heater, heaterAction, 
    humidifier, fanMode, fanPower 
  }}
  controllerState={{ latestAction, actionLog }}
  actionHistory={actionLog.slice(0, 10)}
/>
```

**Verification:**
```bash
# Check file exists
ls dashboard/src/components/AIAnalysisPanel.jsx

# Check component export
grep "export.*AIAnalysisPanel" dashboard/src/components/AIAnalysisPanel.jsx
```

---

### Step 4.6: Update Component Exports

**File:** `dashboard/src/components/index.js` (UPDATE)

**Action:** Add AIAnalysisPanel to exports.

```javascript
export { AIAnalysisPanel } from './AIAnalysisPanel';
```

**Verification:**
```bash
# Check export added
grep "AIAnalysisPanel" dashboard/src/components/index.js
```

---

### Step 4.7: Integrate into Dashboard

**File:** `dashboard/src/App.jsx` (UPDATE)

**Action:** Add AIAnalysisPanel to dashboard layout.

**Integration Points:**

1. **Import AIAnalysisPanel:**
```javascript
import { AIAnalysisPanel } from './components/AIAnalysisPanel';
```

2. **Get data from existing hooks:**
```javascript
// In Dashboard component
const { 
  temperature, humidity, vpd,
  lightState, heaterState, heaterAction,
  humidifierState, fanMode, fanPower 
} = useHA();

const { currentStage } = usePhenology();

const { latestAction, actionLog } = useEnvironmentController();
```

3. **Add to layout (after KPI cards, before charts):**
```jsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
  <AIAnalysisPanel 
    sensorData={{ temp: temperature, humidity, vpd }}
    stageTargets={currentStage}
    actuatorStates={{ 
      light: lightState, 
      heater: heaterState,
      heaterAction: heaterAction,
      humidifier: humidifierState,
      fanMode: fanMode,
      fanPower: fanPower 
    }}
    controllerState={{ latestAction, actionLog }}
    actionHistory={actionLog.slice(0, 10)}
  />
  {/* Other panels like SystemThinkingPanel */}
</div>
```

**Verification:**
```bash
# Check import added
grep "AIAnalysisPanel" dashboard/src/App.jsx

# Check component rendered
grep "<AIAnalysisPanel" dashboard/src/App.jsx
```

---

### Step 4.8: Testing Checklist

**Phase 4 Completion Checklist:**

- [ ] `.env` updated with `VITE_ANTHROPIC_API_KEY`
- [ ] `.env.example` updated with documentation
- [ ] `@anthropic-ai/sdk` installed
- [ ] `environment-analysis.js` created with all functions
- [ ] `ai-analysis.js` service created and working
- [ ] `useAIAnalysis.js` hook created and tested
- [ ] `AIAnalysisPanel.jsx` component created
- [ ] Component exports updated
- [ ] `App.jsx` updated with AIAnalysisPanel
- [ ] "Not configured" state shows if no API key
- [ ] Empty state shows "Click Analyze" button
- [ ] Loading state shows during analysis
- [ ] Analysis completes and displays results
- [ ] Controller Decision Analysis section shows
- [ ] Variable Relationships section displays
- [ ] Optimization Suggestions show with expected impact
- [ ] Predictions section displays with confidence
- [ ] Follow-up questions work
- [ ] Error handling works (API failures)
- [ ] Responsive layout works on mobile
- [ ] Integration with `useEnvironmentController()` works
- [ ] Action history passed correctly
- [ ] `npm run lint` passes
- [ ] No console errors or warnings
- [ ] Git commit: "Phase 4: AI-Assisted Analysis & Optimization complete"

**If all boxes checked:** ✅ **Phase 4 is complete!** Proceed to final testing and validation.

---

## Testing & Validation

### Final System Tests

**Duration:** 24-48 hours of monitoring

---

### Test 1: End-to-End VPD Control

**Goal:** Verify the complete system maintains VPD within target range.

**Setup:**

1. Ensure current VPD is high (should be ~2.09 kPa from Phase 1)
2. Enable auto mode in dashboard
3. Monitor for 24 hours

**Monitoring Checklist:**

- [ ] Initial state recorded (VPD, temp, humidity, fan power)
- [ ] Controller triggers within 5 minutes
- [ ] Fan power reduces when VPD high
- [ ] Humidifier activates when needed
- [ ] VPD begins decreasing
- [ ] System stabilizes in target range (0.4-0.8 kPa)
- [ ] No rapid cycling (>10 changes per hour)

**Data Collection:**

Create a simple log file to track changes:

```
Time       | VPD   | Temp  | Humid | Fan | Humidifier | Status
-----------|-------|-------|-------|-----|------------|-------
12:00 PM   | 2.09  | 78.1  | 35.1  | 5   | Off        | High
12:05 PM   | 2.05  | 78.2  | 36.0  | 2   | On         | Reducing
12:30 PM   | 1.85  | 78.0  | 38.5  | 2   | On         | Reducing
...
```

**Success Criteria:**

- VPD reaches target range within 12 hours
- System maintains VPD in target for ≥80% of time
- No device conflicts or oscillations

---

### Test 2: Stage Transition

**Goal:** Verify automation regeneration when changing phenology stages.

**Steps:**

1. Current stage: Seedling (VPD target 0.4-0.8)
2. Change to Early Veg (VPD target 0.8-1.0)
3. Verify automations update
4. Monitor controller adapts to new targets

**Verification:**

```bash
# Via MCP after stage change
list_entities --domain automation | grep phenology

# Should show 8 automations with updated thresholds
```

**Success Criteria:**

- [ ] Automations regenerate with new stage targets
- [ ] Controller adopts new VPD range
- [ ] Temperature targets update
- [ ] No errors during transition

---

### Test 3: Manual Override

**Goal:** Verify manual control works when auto mode is disabled.

**Steps:**

1. Disable auto mode
2. Manually adjust fan power via HA UI
3. Verify controller does not interfere
4. Re-enable auto mode
5. Verify controller resumes

**Success Criteria:**

- [ ] Controller stops when disabled
- [ ] Manual changes persist
- [ ] Controller resumes when enabled
- [ ] No conflicts between manual and auto

---

### Test 4: Error Handling

**Goal:** Verify system handles failures gracefully.

**Test Scenarios:**

1. **HA Connection Lost:**
   - Disconnect network
   - Verify dashboard shows connection error
   - Reconnect
   - Verify controller resumes

2. **Invalid Entity State:**
   - Temporarily disable a sensor in HA
   - Verify controller handles gracefully
   - Re-enable sensor
   - Verify recovery

3. **Service Call Failure:**
   - Call a non-existent service
   - Verify error is logged but system continues

**Success Criteria:**

- [ ] No crashes on connection loss
- [ ] Errors logged to console
- [ ] System recovers automatically
- [ ] User notified of issues

---

### Test 5: Performance

**Goal:** Verify system runs efficiently without performance issues.

**Metrics to Monitor:**

- CPU usage (should be minimal)
- Memory usage (should be stable)
- Network traffic (reasonable)
- Browser responsiveness

**Tools:**

- Browser DevTools Performance tab
- React DevTools Profiler

**Success Criteria:**

- [ ] CPU usage <5% average
- [ ] Memory stable (no leaks)
- [ ] UI remains responsive
- [ ] No excessive re-renders

---

### Linting & Type Checking

**Action:** Run all code quality tools.

```bash
cd dashboard

# Run linter
npm run lint

# Expected: No errors, no warnings

# Check for unused dependencies
npm outdated

# Build production bundle
npm run build

# Expected: Successful build
```

**Success Criteria:**

- [ ] `npm run lint` passes with 0 errors
- [ ] `npm run build` succeeds
- [ ] Bundle size reasonable (<500KB)
- [ ] No console warnings in production build

---

### Documentation Updates

**Files to Update:**

1. **docs/CHANGELOG.md** (already done in Phase 1)

2. **docs/AUTOMATIONS.md**

   Add section documenting the new fan power automations:

   ```markdown
   ### VPD Fan Power Coordination
   
   **Automation:** `phenology_vpd_fan_reduce`
   - **Trigger:** VPD > stage.vpd.max for 5 minutes
   - **Conditions:** Light on, fan on, current power > 2
   - **Action:** Set fan power to 2
   - **Rationale:** Reduce air exchange to help humidifier catch up
   
   **Automation:** `phenology_vpd_fan_restore`
   - **Trigger:** VPD < stage.vpd.optimal for 10 minutes
   - **Conditions:** Current fan power < 5
   - **Action:** Set fan power to 5
   - **Rationale:** Restore normal air exchange when VPD is optimal
   ```

3. **docs/MANIFEST.md**

   Add to entity registry:

   ```markdown
   ### Exhaust Fan Power Control
   
   **Entity:** `number.exhaust_fan_on_power`
   - **Type:** number
   - **Range:** 1-10
   - **Current Value:** Variable (2-5)
   - **Purpose:** Dynamic fan speed control for VPD management
   - **Automation:** Yes (coordinated with humidifier)
   
   **Entity:** `sensor.exhaust_fan_current_power`
   - **Type:** sensor
   - **Unit:** Power level (1-10)
   - **Purpose:** Monitor actual fan power for automation logic
   ```

4. **README.md** (if exists in dashboard folder)

   Add section about the intelligent controller:

   ```markdown
   ## Intelligent Environmental Control
   
   This dashboard includes a smart environmental controller that:
   
   - Analyzes VPD, temperature, and humidity in relation to phenology targets
   - Makes coordinated decisions about device control
   - Prevents devices from working against each other
   - Shows its reasoning transparently
   - Can be enabled/disabled manually
   
   See `src/services/environment-controller.js` for implementation details.
   ```

---

### Final Deployment Checklist

Before considering this complete:

- [ ] All phases (1, 2, 3) completed successfully
- [ ] 24+ hours of monitoring data collected
- [ ] VPD consistently in target range
- [ ] No rapid cycling or conflicts
- [ ] All tests passed
- [ ] All linting passed
- [ ] Documentation updated
- [ ] Git commits organized and clear
- [ ] README updated with new features

---

## Rollback Procedures

### If Phase 1 Causes Issues

**Symptoms:**
- VPD not improving
- Rapid fan cycling
- Temperature instability

**Rollback Steps:**

1. **Disable new automations in HA:**

   ```
   Navigate to HA UI → Automations
   Disable: phenology_vpd_fan_reduce
   Disable: phenology_vpd_fan_restore
   ```

2. **Revert code changes:**

   ```bash
   git log --oneline  # Find commit before Phase 1
   git revert <commit-hash>
   ```

3. **Manually set fan power:**

   Via HA UI or MCP:
   ```
   Set number.exhaust_fan_on_power to 5
   ```

4. **Monitor for stability:**

   Wait 30 minutes, verify VPD stabilizes at previous level

---

### If Phase 2 Causes Issues

**Symptoms:**
- Console errors
- Excessive service calls
- Device conflicts
- Performance degradation

**Rollback Steps:**

1. **Disable controller in UI:**

   Click "Disable Auto Mode" in dashboard

2. **Remove controller hook:**

   Edit `src/App.jsx`, comment out:
   ```jsx
   // const { ... } = useEnvironmentController({ ... });
   ```

3. **Remove from build:**

   Delete or rename files:
   ```bash
   mv src/services/environment-controller.js src/services/environment-controller.js.disabled
   mv src/hooks/useEnvironmentController.js src/hooks/useEnvironmentController.js.disabled
   ```

4. **Rebuild:**

   ```bash
   npm run build
   ```

---

### If Phase 3 Causes Issues

**Symptoms:**
- UI rendering errors
- Layout problems
- Component crashes

**Rollback Steps:**

1. **Remove components from App.jsx:**

   Comment out:
   ```jsx
   // <ManualControlPanel ... />
   // <SystemThinkingPanel ... />
   ```

2. **Hide components:**

   ```bash
   mv src/components/SystemThinkingPanel.jsx src/components/SystemThinkingPanel.jsx.disabled
   mv src/components/ManualControlPanel.jsx src/components/ManualControlPanel.jsx.disabled
   ```

3. **Rebuild:**

   ```bash
   npm run build
   ```

---

### Emergency Full Rollback

**If everything breaks:**

1. **Stop dashboard:**
   ```bash
   # Kill dev server
   Ctrl+C
   ```

2. **Revert all changes:**
   ```bash
   git log --oneline
   git reset --hard <last-known-good-commit>
   ```

3. **Disable ALL phenology automations:**
   ```
   Via HA UI, disable all automations starting with "Phenology:"
   ```

4. **Manual control:**
   - Set fan power to 5
   - Set humidifier to On
   - Set heater to 80°F day / 70°F night
   - Monitor manually until system is stable

5. **Investigate:**
   - Check console logs
   - Review error messages
   - Identify root cause before re-attempting

---

## Success Metrics

**After full implementation, you should see:**

✅ **VPD Control:**
- VPD consistently 0.4-0.8 kPa (seedling stage)
- <5% time outside target range
- No rapid cycling (device changes <10/hour)

✅ **System Intelligence:**
- Controller makes logical decisions
- Devices work in coordination
- Reasoning is transparent and understandable

✅ **User Experience:**
- Dashboard loads quickly (<2 seconds)
- UI is responsive and intuitive
- Manual override works smoothly
- No errors or warnings in console

✅ **Code Quality:**
- No linting errors
- No TypeScript errors
- Clean console logs
- Production build succeeds

✅ **Documentation:**
- All changes documented in CHANGELOG
- MANIFEST updated with new entities
- README explains new features

---

## Next Steps After Implementation

**Once all phases are complete:**

1. **Monitor for 1 week** to ensure stability
2. **Collect performance data** for optimization
3. **Use AI Analysis (Phase 4)** to:
   - Review EnvironmentController decisions
   - Understand variable relationships
   - Apply optimization suggestions
   - Ask questions about system behavior
4. **Consider additional features:**
   - Historical data visualization
   - Predictive control (anticipate problems)
   - Mobile app notifications
   - Integration with additional sensors
   - AI-powered trend analysis over time

5. **Optimization opportunities:**
   - Apply AI suggestions to fine-tune targets
   - Seasonal adjustments based on AI insights
   - Energy usage optimization
   - Machine learning for optimal settings (future)

---

## Support & Troubleshooting

**Common Issues:**

1. **"Controller not running"**
   - Check `isEnabled` state
   - Verify interval is set correctly
   - Check console for errors

2. **"Actions not executing"**
   - Verify HA connection
   - Check entity IDs are correct
   - Test service calls manually

3. **"Rapid cycling"**
   - Increase trigger delays
   - Add hysteresis to thresholds
   - Check for sensor noise

4. **"VPD not improving"**
   - Verify humidifier is working
   - Check fan power is actually changing
   - Inspect automation logic

**Getting Help:**

- Check console logs (`[ENV-CTRL]` prefix)
- Review action log in UI
- Test components individually
- Use MCP tools to verify entity states

---

## Conclusion

This implementation guide provides a complete, step-by-step path to building an intelligent environmental control system for your grow operation.

**Key Benefits:**

- **Coordinated Control:** Devices work together, not against each other
- **Transparency:** See what the system is thinking and why
- **Flexibility:** Manual override when needed
- **Reliability:** Runs 24/7 on Home Assistant
- **Maintainability:** Well-documented, modular code
- **Smart Decision Making:** Analyzes multiple variables and makes coordinated adjustments

**Time Investment:**

- Phase 1: ~30-60 minutes (immediate VPD fix, includes entity verification)
- Phase 2: ~2-3 hours (decision engine)
- Phase 3: ~1-2 hours (visualization)
- Phase 4: ~2-3 hours (AI-assisted analysis & optimization)
- Testing: ~2-4 hours (validation)

**Total:** ~8-13 hours of focused development

**Expected Outcome:**

A production-ready intelligent environmental controller that maintains optimal VPD, temperature, and humidity automatically while providing full visibility and control to the user. The system includes AI-powered analysis to explain decisions, suggest optimizations, and help users understand how environmental variables interact.

**⚠️ Before Starting:**

1. ✅ **Entity verification complete** - `number.exhaust_fan_on_power` EXISTS (Scenario A confirmed)
2. **Understand your setup** - Review current automations and entity structure
3. **Test incrementally** - Deploy Phase 1 first, monitor, then proceed to Phase 2
4. **Have rollback plan** - Know how to disable automations if issues arise

**Implementation Notes:**

- ✅ This guide has been updated to align with your current codebase structure
- ✅ All entity IDs match your documented setup (`docs/ENTITIES.md`)
- ✅ Automation structure matches your existing phenology system
- ✅ Phase 2 decision engine integrates with your `PhenologyContext` and `HomeAssistantContext`
- ✅ Phase 3 UI components follow your existing dashboard design patterns
- ✅ Phase 4 AI analysis integrates with Phase 2 EnvironmentController for decision analysis
- ✅ Hook names corrected to use `useHA()` and `usePhenology()` from contexts
- ✅ Component structure matches your `Dashboard` component pattern
- ⚠️ **Entity verification required** - `number.exhaust_fan_on_power` must be verified before Phase 1

**Key Updates Made:**

1. ✅ **Entity Verification Complete:** Confirmed `number.exhaust_fan_on_power` EXISTS (January 19, 2026 - UPDATED)
2. ✅ **Scenario A Implemented:** Updated guide to reflect standard coordinated control approach
3. ✅ **Phase 1 Restored:** Full Phase 1 implementation with fan power coordination restored
4. **Codebase Alignment:** Updated all hook imports to use context hooks (`useHA`, `usePhenology`)
5. **Component Structure:** Corrected component names to match your `Dashboard` structure
6. **Integration Points:** Verified all integration points with existing phenology system
7. **Error Handling:** Enhanced error handling and troubleshooting sections
8. **Deployment Steps:** Updated to match your actual deployment workflow via StageSelector
9. **Phase 2 Verified:** Confirmed Phase 2 code includes fan power control in decision engine

**Before Starting Implementation:**

1. ✅ Read through the entire guide once
2. ✅ **VERIFIED:** `number.exhaust_fan_on_power` entity EXISTS (Scenario A - January 19, 2026)
3. ✅ Review your current automation structure in `automation-manager.js`
4. ✅ Understand your phenology stage structure in `phenology.js`
5. ✅ Test MCP connection and entity access
6. ✅ Have a rollback plan ready

Good luck with your implementation! 🌱🧠
