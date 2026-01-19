# 🌱 Phenology Automation System - Cursor Build Guide
## Add Growth Stage Management to Your Dashboard

**Project Location:** `C:\Users\russe\Documents\Grow\dashboard\`  
**Prerequisites:** Dashboard MVP complete and working locally  
**Estimated Time:** 2-3 hours  
**MCP Required:** Yes - for verifying automations

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    PHENOLOGY SYSTEM FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │   Dashboard  │    │  localStorage │    │ Home Assistant│    │
│   │  Stage Select│───►│   Schedule   │    │  Automations │     │
│   └──────────────┘    │    Data      │    └──────────────┘     │
│          │            └──────────────┘           ▲              │
│          │                   │                   │              │
│          ▼                   ▼                   │              │
│   ┌──────────────┐    ┌──────────────┐          │              │
│   │   Settings   │    │  Automation  │──────────┘              │
│   │    Panel     │───►│   Manager    │                         │
│   └──────────────┘    └──────────────┘                         │
│                              │                                  │
│                              ▼                                  │
│                       ┌──────────────┐                         │
│                       │ VPD Calculator│                         │
│                       │ (RH ↔ VPD)   │                         │
│                       └──────────────┘                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## What You'll Build

| Component | Purpose |
|-----------|---------|
| **Stage Selector** | Dropdown to pick current growth stage |
| **Settings Panel** | Edit parameters for each stage |
| **VPD Calculator** | Convert between VPD ↔ Humidity |
| **Automation Manager** | Create/update HA automations |
| **Apply Button** | Deploy current stage settings to HA |

---

## Pre-Flight: Verify MCP & Existing Automations

Before building, let's check what automations already exist.

### Prompt 0.1: Verify Current State with MCP

```
Using MCP (hass-mcp), run these commands and document the results:

1. List all automations:
   list_automations

2. Get details on light automation:
   get_entity automation.grow_light_control

3. Get details on temperature automation:
   get_entity automation.tent_temperature_modulation

4. Test if we can call automation services:
   call_service automation.trigger entity_id: automation.grow_light_control

Document the response for each. We need to know:
- What automation IDs exist
- What their current configuration is
- Whether we can trigger them programmatically

Save findings to: dashboard/docs/AUTOMATION_AUDIT.md
```

### ✅ Validation 0.1
- [ ] MCP connection works
- [ ] List of existing automations documented
- [ ] Can trigger automations via MCP
- [ ] Created AUTOMATION_AUDIT.md

---

# Phase 1: Data Types & Utilities

## Prompt 1.1: Create Phenology Data Types

```
In C:\Users\russe\Documents\Grow\dashboard\src\types\, create phenology.js:

Define the data structure for growth stages with these requirements:

1. JSDoc type definition for GrowthStage:
   - id: string (e.g., 'seedling', 'early_veg')
   - name: string (display name)
   - duration: string (e.g., 'Weeks 1-2')
   - lightSchedule: { hoursOn: number, hoursOff: number, onTime: string, offTime: string }
   - temperature: { day: { min, max, target }, night: { min, max, target } }
   - humidity: { min: number, max: number, optimal: number }
   - vpd: { min: number, max: number, optimal: number }
   - notes: string (cultivation tips)

2. DEFAULT_SCHEDULE constant with these 8 stages pre-populated:

   SEEDLING (Current Stage - Weeks 1-2):
   - Light: 20/4 (on 06:00, off 02:00)
   - Day Temp: 75-78°F (target 77)
   - Night Temp: 68-72°F (target 70)
   - Humidity: 65-75% (optimal 70)
   - VPD: 0.4-0.8 kPa (optimal 0.6)

   EARLY_VEG (Weeks 3-4):
   - Light: 18/6 (on 06:00, off 00:00)
   - Day Temp: 75-82°F (target 79)
   - Night Temp: 65-72°F (target 68)
   - Humidity: 55-70% (optimal 60)
   - VPD: 0.8-1.1 kPa (optimal 0.95)

   LATE_VEG (Weeks 5-6):
   - Light: 18/6 (on 06:00, off 00:00)
   - Day Temp: 75-82°F (target 80)
   - Night Temp: 65-72°F (target 68)
   - Humidity: 50-65% (optimal 55)
   - VPD: 1.0-1.3 kPa (optimal 1.15)

   TRANSITION (Week 7):
   - Light: 12/12 (on 06:00, off 18:00)
   - Day Temp: 75-82°F (target 79)
   - Night Temp: 64-70°F (target 67)
   - Humidity: 50-60% (optimal 55)
   - VPD: 1.0-1.4 kPa (optimal 1.2)

   EARLY_FLOWER (Weeks 8-10):
   - Light: 12/12 (on 06:00, off 18:00)
   - Day Temp: 75-82°F (target 78)
   - Night Temp: 64-70°F (target 66)
   - Humidity: 45-55% (optimal 50)
   - VPD: 1.0-1.5 kPa (optimal 1.25)

   MID_FLOWER (Weeks 11-14):
   - Light: 12/12 (on 06:00, off 18:00)
   - Day Temp: 72-80°F (target 76)
   - Night Temp: 62-68°F (target 65)
   - Humidity: 40-50% (optimal 45)
   - VPD: 1.2-1.5 kPa (optimal 1.35)

   LATE_FLOWER (Weeks 15-17):
   - Light: 12/12 (on 06:00, off 18:00)
   - Day Temp: 70-78°F (target 74)
   - Night Temp: 60-66°F (target 63)
   - Humidity: 35-45% (optimal 40)
   - VPD: 1.3-1.6 kPa (optimal 1.45)

   HARVEST_DRY (Week 18+):
   - Light: 0/24 (lights off)
   - Day Temp: 65-70°F (target 68)
   - Night Temp: 60-65°F (target 62)
   - Humidity: 55-65% (optimal 60)
   - VPD: N/A (drying mode)
   - Notes: "Lights off, exhaust on low for air circulation"

3. Helper functions:
   - getStageById(id) - returns stage object
   - getStageIds() - returns array of stage IDs
   - validateStage(stage) - validates stage data structure

Export: DEFAULT_SCHEDULE, getStageById, getStageIds, validateStage
```

### ✅ Validation 1.1
```javascript
// Test in browser console after npm run dev:
import { DEFAULT_SCHEDULE, getStageById } from './types/phenology';
console.log(DEFAULT_SCHEDULE.seedling);
console.log(getStageById('early_veg'));
```
- [ ] File created at src/types/phenology.js
- [ ] All 8 stages defined with complete data
- [ ] Helper functions work

---

## Prompt 1.2: Create VPD Calculator Utility

```
In C:\Users\russe\Documents\Grow\dashboard\src\utils\, create vpd-calculator.js:

Create VPD calculation utilities using the Magnus formula:

1. calculateVPD(tempF, humidityPercent):
   - Convert Fahrenheit to Celsius
   - Calculate Saturated Vapor Pressure (SVP) using Magnus formula:
     SVP = 0.6108 * exp((17.27 * tempC) / (tempC + 237.3))
   - Calculate Actual Vapor Pressure (AVP):
     AVP = SVP * (humidity / 100)
   - Calculate Leaf Vapor Pressure (LVP) assuming leaf is 2°C warmer:
     leafTempC = tempC + 2
     LVP = 0.6108 * exp((17.27 * leafTempC) / (leafTempC + 237.3))
   - VPD = LVP - AVP
   - Return VPD in kPa (rounded to 2 decimal places)

2. calculateRequiredHumidity(tempF, targetVPD):
   - Reverse calculation: given temp and desired VPD, what humidity needed?
   - Return humidity percentage (rounded to 1 decimal place)
   - Clamp result between 0-100%

3. getVPDStatus(vpd, targets):
   - Takes current VPD and target object { min, max, optimal }
   - Returns: 'optimal' | 'caution' | 'critical'
   - optimal: within min-max range
   - caution: within 0.2 kPa of range
   - critical: more than 0.2 kPa outside range

4. formatVPD(vpd):
   - Returns formatted string like "1.23 kPa"

Include JSDoc comments with examples for each function.

Test values to verify:
- 77°F at 70% RH should give VPD ≈ 0.75 kPa
- 80°F at 50% RH should give VPD ≈ 1.35 kPa
```

### ✅ Validation 1.2
```javascript
// Test calculations:
import { calculateVPD, calculateRequiredHumidity } from './utils/vpd-calculator';

// Should be approximately 0.75
console.log('77°F @ 70% RH:', calculateVPD(77, 70));

// Should be approximately 1.35  
console.log('80°F @ 50% RH:', calculateVPD(80, 50));

// Given 77°F, what humidity for VPD of 0.6?
console.log('Humidity for 0.6 VPD at 77°F:', calculateRequiredHumidity(77, 0.6));
```
- [ ] File created at src/utils/vpd-calculator.js
- [ ] Test values produce expected results (within ±0.1)
- [ ] All functions exported

---

# Phase 2: Schedule State Management

## Prompt 2.1: Create Schedule Storage Hook

```
In C:\Users\russe\Documents\Grow\dashboard\src\hooks\, create usePhenologySchedule.js:

Create a React hook for managing phenology schedule state:

1. State:
   - schedule: object (all stages, loaded from localStorage or defaults)
   - currentStageId: string (active stage ID)
   - isLoading: boolean
   - error: string | null
   - isDirty: boolean (unsaved changes)

2. localStorage keys:
   - 'grow-phenology-schedule' - full schedule data
   - 'grow-current-stage' - current stage ID

3. Functions:

   loadSchedule():
   - Load from localStorage
   - Merge with DEFAULT_SCHEDULE (to handle new stages added later)
   - Set isLoading false

   saveSchedule(newSchedule):
   - Validate with validateStage for each stage
   - Save to localStorage
   - Set isDirty false

   getCurrentStage():
   - Returns the full stage object for currentStageId

   setCurrentStageId(stageId):
   - Updates currentStageId
   - Saves to localStorage
   - Does NOT deploy automations (that's separate)

   updateStageParameter(stageId, path, value):
   - Updates a specific parameter (e.g., 'temperature.day.target')
   - Sets isDirty true
   - Example: updateStageParameter('seedling', 'vpd.optimal', 0.65)

   resetToDefaults():
   - Confirms with user
   - Resets schedule to DEFAULT_SCHEDULE
   - Clears localStorage

4. useEffect on mount:
   - Call loadSchedule()
   - Default currentStageId to 'seedling' if not set

5. Return object with all state and functions

Import DEFAULT_SCHEDULE and helpers from '../types/phenology'
```

### ✅ Validation 2.1
```javascript
// Test in a component:
const { 
  schedule, 
  currentStageId, 
  getCurrentStage,
  setCurrentStageId 
} = usePhenologySchedule();

console.log('Current stage:', getCurrentStage());
console.log('All stages:', Object.keys(schedule));
```
- [ ] File created at src/hooks/usePhenologySchedule.js
- [ ] Data persists after page refresh
- [ ] Can change current stage
- [ ] isDirty flag works

---

# Phase 3: Automation Manager

## Prompt 3.1: Extend HA API Service

```
In C:\Users\russe\Documents\Grow\dashboard\src\services\ha-api.js:

Add or create functions for automation management:

1. listAutomations():
   - GET /api/states
   - Filter for entities starting with 'automation.'
   - Return array of automation entities

2. getAutomationConfig(automationId):
   - GET /api/config/automation/config/{automationId}
   - Returns the YAML config for an automation
   - Handle 404 (automation doesn't exist)

3. createOrUpdateAutomation(automationId, config):
   - POST /api/config/automation/config/{automationId}
   - Body is the automation config object (will be converted to YAML by HA)
   - Returns success/failure

4. deleteAutomation(automationId):
   - DELETE /api/config/automation/config/{automationId}
   - Returns success/failure

5. reloadAutomations():
   - POST /api/services/automation/reload
   - Required after creating/updating automations
   - Wait 2 seconds after call for HA to process

6. triggerAutomation(automationId):
   - POST /api/services/automation/trigger
   - Body: { entity_id: automationId }

Error handling:
- Wrap all calls in try/catch
- Return { success: boolean, data?: any, error?: string }
- Log errors with [HA-API] prefix

All functions should use the token from VITE_HA_TOKEN environment variable.
```

### ✅ Validation 3.1
```javascript
// Test API calls (in browser console or component):
import { listAutomations, reloadAutomations } from './services/ha-api';

const automations = await listAutomations();
console.log('Found automations:', automations);
```
- [ ] Can list existing automations
- [ ] API calls use correct authentication
- [ ] Error handling works

---

## Prompt 3.2: Create Automation Manager Service

```
In C:\Users\russe\Documents\Grow\dashboard\src\services\, create automation-manager.js:

Create the core automation deployment logic:

1. Import:
   - HA API functions from './ha-api'
   - ENTITIES from '../types/entities'
   - calculateRequiredHumidity from '../utils/vpd-calculator'

2. Constants for automation IDs (we'll use consistent naming):
   AUTOMATION_IDS = {
     LIGHT_ON: 'phenology_light_on',
     LIGHT_OFF: 'phenology_light_off', 
     TEMP_DAY: 'phenology_temp_day',
     TEMP_NIGHT: 'phenology_temp_night',
     VPD_HUMID_ON: 'phenology_vpd_humidifier_on',
     VPD_HUMID_OFF: 'phenology_vpd_humidifier_off',
   }

3. buildLightOnAutomation(stage):
   Returns automation config object:
   {
     alias: `Phenology: Lights ON (${stage.name})`,
     description: `Turn on grow light at ${stage.lightSchedule.onTime} for ${stage.name} stage`,
     trigger: [{ platform: 'time', at: stage.lightSchedule.onTime }],
     condition: [],
     action: [{ 
       service: 'switch.turn_on', 
       target: { entity_id: 'switch.light' } 
     }],
     mode: 'single'
   }

4. buildLightOffAutomation(stage):
   Similar to above but turn_off at offTime
   Handle special case: HARVEST_DRY stage keeps lights off always

5. buildDayTempAutomation(stage):
   Returns config for setting heater to day temperature:
   {
     alias: `Phenology: Day Temp (${stage.name})`,
     description: `Set heater to ${stage.temperature.day.target}°F at lights on`,
     trigger: [{ platform: 'time', at: stage.lightSchedule.onTime }],
     condition: [],
     action: [{
       service: 'climate.set_temperature',
       target: { entity_id: 'climate.tent_heater' },
       data: { temperature: stage.temperature.day.target, hvac_mode: 'heat' }
     }],
     mode: 'single'
   }

6. buildNightTempAutomation(stage):
   Similar but triggers at offTime with night temperature

7. buildVPDHumidifierOnAutomation(stage):
   Turns humidifier ON when VPD exceeds max:
   {
     alias: `Phenology: VPD High - Humidifier ON (${stage.name})`,
     description: `Turn on humidifier when VPD > ${stage.vpd.max} kPa`,
     trigger: [{
       platform: 'numeric_state',
       entity_id: 'sensor.ac_infinity_controller_69_pro_vpd',
       above: stage.vpd.max,
       for: { minutes: 5 }
     }],
     condition: [{
       condition: 'state',
       entity_id: 'switch.light',
       state: 'on'  // Only during day
     }],
     action: [{
       service: 'select.select_option',
       target: { entity_id: 'select.cloudforge_t5_active_mode' },
       data: { option: 'On' }
     }],
     mode: 'single'
   }

8. buildVPDHumidifierOffAutomation(stage):
   Turns humidifier OFF when VPD drops below optimal:
   {
     alias: `Phenology: VPD OK - Humidifier OFF (${stage.name})`,
     trigger: [{
       platform: 'numeric_state',
       entity_id: 'sensor.ac_infinity_controller_69_pro_vpd',
       below: stage.vpd.optimal,
       for: { minutes: 10 }
     }],
     action: [{
       service: 'select.select_option',
       target: { entity_id: 'select.cloudforge_t5_active_mode' },
       data: { option: 'Off' }
     }],
     mode: 'single'
   }

9. deployStageAutomations(stage, options = {}):
   Main deployment function:
   - options.dryRun: if true, just return configs without deploying
   - options.skipExisting: if true, don't overwrite existing automations
   
   Steps:
   a. Build all 6 automation configs
   b. For each automation:
      - Call createOrUpdateAutomation()
      - Track success/failure
   c. Call reloadAutomations()
   d. Return { success: boolean, deployed: [], failed: [], configs: [] }

10. removeStageAutomations():
    Removes all phenology automations (for cleanup or stage change)

11. getDeployedAutomations():
    Returns list of currently deployed phenology automations

Add console logging with [AUTO-MGR] prefix for debugging.
```

### ✅ Validation 3.2
```javascript
// Test building configs (dry run):
import { deployStageAutomations } from './services/automation-manager';
import { getStageById } from './types/phenology';

const seedling = getStageById('seedling');
const result = await deployStageAutomations(seedling, { dryRun: true });
console.log('Would deploy:', result.configs);
```
- [ ] File created at src/services/automation-manager.js
- [ ] Dry run returns valid automation configs
- [ ] All 6 automation builders work

---

## Prompt 3.3: Test Automation Deployment with MCP

```
IMPORTANT: Before we wire up the UI, let's test that automation deployment 
actually works using MCP.

Using Cursor's MCP connection to Home Assistant:

1. First, check if the automation config API is accessible:
   - Try: GET /api/config/automation/config
   - This should return a list or error

2. If step 1 works, try creating a TEST automation:
   
   Create automation with this config:
   {
     "alias": "TEST - Phenology System Check",
     "description": "Test automation - safe to delete",
     "trigger": [{"platform": "time", "at": "23:59:00"}],
     "condition": [],
     "action": [{"service": "logger.log", "data": {"message": "Phenology test"}}],
     "mode": "single"
   }
   
   Automation ID: phenology_test_delete_me

3. Call automation.reload service

4. Verify with: list_automations (should see phenology_test_delete_me)

5. Delete the test automation

Document results:
- Did creation work? 
- Did reload work?
- Did delete work?
- Any errors?

If automation config API doesn't work, we'll need to use a different approach
(webhook-based or editing automations.yaml directly).
```

### ✅ Validation 3.3
- [ ] Can create automation via API
- [ ] Can reload automations
- [ ] Can delete automation
- [ ] Document any permission issues

**If API doesn't work:** We'll create a fallback that generates YAML for manual paste into HA.

---

# Phase 4: UI Components

## Prompt 4.1: Create Stage Selector Component

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create StageSelector.jsx:

A prominent dropdown for selecting the current growth stage:

Props:
- currentStageId: string
- onStageChange: (stageId) => void
- stages: object (the schedule)
- isDeploying: boolean (disable during deployment)

Features:

1. Large, prominent dropdown styled for dark theme
   - Full width on mobile, fixed width on desktop
   - Shows stage name + duration
   - Current stage highlighted with neon-green

2. Stage option display:
   - Stage name (bold)
   - Duration (lighter text)
   - Small VPD badge showing target range

3. Visual indicator of current stage:
   - Large badge showing "🌱 SEEDLING" or similar emoji per stage
   - Emojis: 🌱 Seedling, 🌿 Early Veg, 🪴 Late Veg, 🔄 Transition, 
             🌸 Early Flower, 💮 Mid Flower, 🌺 Late Flower, ✂️ Harvest

4. Confirmation dialog when changing stages:
   - "Change to {new_stage}?"
   - "This will update all automations for the new stage."
   - "Current: {old_stage} → New: {new_stage}"
   - Cancel / Confirm buttons

5. Loading state during stage change

Styling:
- bg-abyss with border
- Dropdown options: hover:bg-zinc-800
- Selected: bg-neon-green/10 border-neon-green/30
```

### ✅ Validation 4.1
- [ ] File created at src/components/StageSelector.jsx
- [ ] Dropdown shows all 8 stages
- [ ] Confirmation dialog appears on change
- [ ] Styling matches dashboard theme

---

## Prompt 4.2: Create Stage Settings Panel Component

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create StageSettingsPanel.jsx:

An expandable panel for viewing/editing current stage parameters:

Props:
- stage: object (current stage data)
- onUpdateParameter: (path, value) => void
- onApplyToHA: () => Promise<void>
- isDeploying: boolean
- lastDeployed: Date | null

Features:

1. Collapsible panel (starts collapsed, expand to edit)
   - Header shows: "⚙️ Stage Settings" + expand/collapse icon
   - Badge showing if there are unsaved changes

2. When expanded, show sections:

   LIGHT SCHEDULE:
   - Hours On / Hours Off display (e.g., "18h ON / 6h OFF")
   - Time inputs for ON time and OFF time
   - Visual timeline bar (reuse ScheduleDisplay logic)

   TEMPERATURE:
   - Day section: Min / Max / Target inputs (°F)
   - Night section: Min / Max / Target inputs (°F)
   - Visual showing day/night cycle

   HUMIDITY & VPD:
   - VPD section: Min / Max / Optimal inputs (kPa)
   - Humidity section: Min / Max / Optimal inputs (%)
   - Live calculation: "At current temp ({current}°F), VPD {optimal} needs {calculated}% RH"
   - Use calculateRequiredHumidity for this

   NOTES:
   - Textarea for cultivation notes
   - Pre-filled with stage-specific tips

3. Action buttons at bottom:
   - "Reset to Defaults" (secondary style)
   - "Apply to Home Assistant" (primary style, prominent)
   
4. Deploy status:
   - Show spinner during deployment
   - Show success message with timestamp
   - Show error message if failed

5. Input validation:
   - Temperature: 50-100°F
   - Humidity: 0-100%
   - VPD: 0.1-3.0 kPa
   - Times: valid 24h format
   - Show red border on invalid inputs

Use Lucide icons: Settings, ChevronDown, ChevronUp, Sun, Moon, Droplets, Thermometer
```

### ✅ Validation 4.2
- [ ] File created at src/components/StageSettingsPanel.jsx
- [ ] Panel expands/collapses
- [ ] All inputs editable
- [ ] Validation prevents invalid values
- [ ] VPD↔Humidity calculation shows

---

## Prompt 4.3: Create Deployment Status Component

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create DeploymentStatus.jsx:

Shows the current state of automation deployment:

Props:
- isDeploying: boolean
- deploymentResult: { success, deployed, failed, timestamp } | null
- onRetry: () => void

Features:

1. Compact status bar (always visible):
   - Idle: "✅ Automations synced" (green text)
   - Deploying: "⏳ Deploying automations..." (amber text + spinner)
   - Success: "✅ Deployed 6 automations at {time}" (green)
   - Partial: "⚠️ 4/6 automations deployed" (amber)
   - Failed: "❌ Deployment failed" (red)

2. Expandable details (click to expand):
   - List each automation with status icon
   - Light ON: ✅ or ❌
   - Light OFF: ✅ or ❌
   - Day Temp: ✅ or ❌
   - Night Temp: ✅ or ❌
   - VPD Humid ON: ✅ or ❌
   - VPD Humid OFF: ✅ or ❌

3. Error details:
   - If any failed, show error message
   - "Retry Failed" button

4. Link to HA:
   - "View in Home Assistant →" link
   - Opens http://100.65.202.84:8123/config/automation/dashboard

Styling:
- Subtle background (bg-zinc-900)
- Status-appropriate border color
- Compact by default, expands on click
```

### ✅ Validation 4.3
- [ ] File created at src/components/DeploymentStatus.jsx
- [ ] Shows correct status states
- [ ] Expands to show details
- [ ] Retry button works

---

## Prompt 4.4: Update Component Index

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\index.js:

Add exports for new components:
- StageSelector
- StageSettingsPanel  
- DeploymentStatus

Keep all existing exports.
```

### ✅ Validation 4.4
- [ ] All new components exported
- [ ] No import errors

---

# Phase 5: Integration

## Prompt 5.1: Create Phenology Context

```
In C:\Users\russe\Documents\Grow\dashboard\src\context\, create PhenologyContext.jsx:

Create a context that combines schedule state with deployment actions:

1. PhenologyProvider component:
   
   Uses:
   - usePhenologySchedule hook (for schedule state)
   - useState for deployment state (isDeploying, result)
   
   Provides:
   - All schedule state (schedule, currentStageId, etc.)
   - All schedule functions (setCurrentStageId, updateStageParameter, etc.)
   - deployCurrentStage() - deploys automations for current stage
   - deploymentStatus - { isDeploying, result }

2. deployCurrentStage function:
   - Sets isDeploying true
   - Gets current stage from schedule
   - Calls deployStageAutomations(stage)
   - Sets result
   - Sets isDeploying false
   - Returns result

3. usePhenology hook:
   - Gets context
   - Throws if used outside provider

Export: PhenologyProvider, usePhenology
```

### ✅ Validation 5.1
- [ ] File created at src/context/PhenologyContext.jsx
- [ ] Can wrap app in provider
- [ ] usePhenology hook works

---

## Prompt 5.2: Integrate into App.jsx

```
Update C:\Users\russe\Documents\Grow\dashboard\src\App.jsx:

Add the Phenology system to your existing dashboard:

1. Import new components and context:
   - PhenologyProvider, usePhenology from context
   - StageSelector, StageSettingsPanel, DeploymentStatus from components

2. Wrap the app in PhenologyProvider (inside HomeAssistantProvider):
   <HomeAssistantProvider>
     <PhenologyProvider>
       <Dashboard />
     </PhenologyProvider>
   </HomeAssistantProvider>

3. In Dashboard component, add a new section ABOVE the KPI cards:

   PHENOLOGY CONTROL SECTION (full width):
   ┌────────────────────────────────────────────────────────────┐
   │ 🌱 Growth Stage Control                                    │
   │ ┌──────────────────────────────┐  ┌───────────────────────┐│
   │ │   [Stage Selector Dropdown]  │  │  [Deployment Status]  ││
   │ └──────────────────────────────┘  └───────────────────────┘│
   │                                                            │
   │ [Stage Settings Panel - collapsed by default]              │
   └────────────────────────────────────────────────────────────┘

4. Update KPI cards to use current stage targets:
   - Get currentStage from usePhenology()
   - Pass stage VPD/temp/humidity targets to KPICard components
   - This makes the "optimal" range dynamic based on stage

5. Update HumidifierControl to show stage-appropriate targets:
   - Get targets from current stage
   - Display "Stage: Seedling | VPD Target: 0.4-0.8 kPa"

Layout:
- Phenology section: lg:col-span-3 (full width)
- Use grid inside for selector + status side by side
- Settings panel below, also full width
```

### ✅ Validation 5.2
```bash
npm run dev
```
- [ ] Dashboard loads without errors
- [ ] Stage selector appears at top
- [ ] Can select different stages
- [ ] Settings panel expands/collapses
- [ ] KPI card targets update when stage changes

---

## Prompt 5.3: Wire Up Deployment

```
Now let's test the full deployment flow:

1. In the browser, select "Seedling" stage (if not already)

2. Expand the Stage Settings Panel

3. Click "Apply to Home Assistant"

4. Watch the deployment status

5. Using MCP or HA UI, verify automations were created:
   - Should see 6 new automations starting with "Phenology:"
   - Phenology: Lights ON (Seedling)
   - Phenology: Lights OFF (Seedling)
   - Phenology: Day Temp (Seedling)
   - Phenology: Night Temp (Seedling)
   - Phenology: VPD High - Humidifier ON (Seedling)
   - Phenology: VPD OK - Humidifier OFF (Seedling)

6. Test one automation manually:
   - Trigger "Phenology: VPD High - Humidifier ON" manually
   - Verify humidifier turns on

If deployment fails:
- Check browser console for errors
- Check HA logs via MCP: get_error_log
- Verify API token has correct permissions
```

### ✅ Validation 5.3
- [ ] Deployment completes without errors
- [ ] 6 automations created in HA
- [ ] Manual trigger test works
- [ ] Dashboard shows "Automations synced"

---

# Phase 6: Polish & Edge Cases

## Prompt 6.1: Handle Existing Automations

```
Update automation-manager.js to handle the user's existing automations:

The user already has:
- automation.grow_light_control
- automation.tent_temperature_modulation
- automation.leak_alert

Options:

1. RECOMMENDED: Disable existing automations when deploying phenology:
   
   In deployStageAutomations():
   - Before deploying, call turnOffExistingAutomations()
   - This disables (not deletes) the old automations
   - Add automation.turn_off service call for each

   Add function: turnOffExistingAutomations():
   - Disable automation.grow_light_control
   - Disable automation.tent_temperature_modulation
   - Log that these were disabled

2. Add to deployment status:
   - "ℹ️ Disabled 2 existing automations to prevent conflicts"
   - List which ones were disabled

3. Add "Restore Original Automations" function:
   - Re-enables the original automations
   - Removes phenology automations
   - For if user wants to go back to original setup
```

### ✅ Validation 6.1
- [ ] Existing automations disabled during deploy
- [ ] User informed of disabled automations
- [ ] Restore function works

---

## Prompt 6.2: Add Stage Change Automation Cleanup

```
When user changes growth stage, we need to:

1. Remove OLD stage automations (or update them)
2. Deploy NEW stage automations

Update PhenologyContext.jsx:

changeStage(newStageId) function:
1. Show confirmation dialog (already have this)
2. If confirmed:
   a. Set isDeploying true
   b. Call removeStageAutomations() - removes current phenology automations
   c. Update currentStageId in state
   d. Call deployStageAutomations(newStage)
   e. Set isDeploying false
   f. Show success/failure

This ensures clean transitions between stages without automation conflicts.
```

### ✅ Validation 6.2
- [ ] Stage change removes old automations
- [ ] New stage automations deployed
- [ ] No duplicate automations in HA

---

## Prompt 6.3: Add Offline/Error Fallback

```
Create a fallback for when HA API automation creation doesn't work:

In C:\Users\russe\Documents\Grow\dashboard\src\components\, create YAMLExport.jsx:

A modal/panel that shows automation YAML for manual copy-paste:

Props:
- stage: current stage object
- isOpen: boolean
- onClose: () => void

Features:

1. Generates YAML for all 6 automations

2. Display in a code block with syntax highlighting (use <pre> with mono font)

3. "Copy All" button - copies all YAML to clipboard

4. Instructions:
   "If automatic deployment fails, you can manually add these automations:
    1. Open Home Assistant
    2. Go to Settings → Automations & Scenes
    3. Click ⋮ menu → Edit in YAML
    4. Paste the YAML below
    5. Save and reload automations"

5. Show this automatically if deployment fails

This ensures users can ALWAYS get their automations deployed, even if API fails.
```

### ✅ Validation 6.3
- [ ] YAML export modal works
- [ ] Copy button copies to clipboard
- [ ] YAML is valid (test by pasting into HA)

---

## Prompt 6.4: Final Testing Checklist

```
Create dashboard/PHENOLOGY_TESTING.md with this checklist:

## Phenology System Testing Checklist

### Stage Selection
- [ ] Can select each of the 8 stages
- [ ] Confirmation dialog appears
- [ ] Stage change persists after refresh
- [ ] KPI card targets update with stage

### Settings Panel
- [ ] Panel expands/collapses
- [ ] Can edit all parameters
- [ ] Invalid values show error
- [ ] VPD↔Humidity calculation displays
- [ ] Reset to defaults works

### Automation Deployment
- [ ] "Apply to Home Assistant" button works
- [ ] Deployment status shows progress
- [ ] Success state shows correctly
- [ ] Error state shows with retry option
- [ ] YAML export fallback available

### HA Integration
- [ ] 6 automations created in HA
- [ ] Light ON automation fires at correct time
- [ ] Light OFF automation fires at correct time
- [ ] Day temp automation sets correct temperature
- [ ] Night temp automation sets correct temperature
- [ ] VPD high triggers humidifier ON
- [ ] VPD low triggers humidifier OFF

### Stage Transitions
- [ ] Changing stage updates automations
- [ ] Old automations removed
- [ ] New automations deployed
- [ ] Existing user automations disabled

### Edge Cases
- [ ] Works after page refresh
- [ ] Works after browser close/reopen
- [ ] Handles HA disconnect gracefully
- [ ] Handles API errors gracefully
```

---

# Quick Reference

## File Structure After Implementation

```
dashboard/src/
├── types/
│   ├── entities.js (existing)
│   └── phenology.js (NEW)
├── utils/
│   └── vpd-calculator.js (NEW)
├── hooks/
│   ├── useHomeAssistant.js (existing)
│   └── usePhenologySchedule.js (NEW)
├── services/
│   ├── ha-websocket.js (existing)
│   ├── ha-api.js (MODIFIED)
│   └── automation-manager.js (NEW)
├── context/
│   ├── HomeAssistantContext.jsx (existing)
│   └── PhenologyContext.jsx (NEW)
├── components/
│   ├── (existing components)
│   ├── StageSelector.jsx (NEW)
│   ├── StageSettingsPanel.jsx (NEW)
│   ├── DeploymentStatus.jsx (NEW)
│   └── YAMLExport.jsx (NEW)
└── App.jsx (MODIFIED)
```

## Key Commands

```bash
# Development
npm run dev

# Test MCP connection (in Cursor)
# Use MCP: list_automations

# Verify deployment (in Cursor)
# Use MCP: get_entity automation.phenology_light_on
```

## Automation IDs Reference

| Automation | ID |
|------------|-----|
| Light ON | phenology_light_on |
| Light OFF | phenology_light_off |
| Day Temp | phenology_temp_day |
| Night Temp | phenology_temp_night |
| VPD Humid ON | phenology_vpd_humidifier_on |
| VPD Humid OFF | phenology_vpd_humidifier_off |

---

*Work through each prompt sequentially. Validate before moving on. Use MCP to verify HA state!*
