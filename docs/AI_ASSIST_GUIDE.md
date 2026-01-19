# 🧠 GrowOp Brain - AI-Assisted Environmental Analysis & Optimization

> **Document Purpose:** Complete implementation guide for Cursor.ai  
> **Target Location:** `C:\Users\russe\Documents\Grow\docs\BRAIN_IMPLEMENTATION_GUIDE.md`  
> **Codebase Root:** `C:\Users\russe\Documents\Grow\`  
> **Dashboard Root:** `C:\Users\russe\Documents\Grow\dashboard\`

---

## 📋 Executive Summary

This document provides **everything Cursor needs** to implement an AI-powered environmental analysis and optimization system for the GrowOp Dashboard. The system uses **Claude API** to:

1. **Analyze Decision Patterns:** Review how the intelligent EnvironmentController (Phase 2) is making decisions
2. **Understand Variable Relationships:** Deep dive into how temperature, humidity, VPD, fan power, and humidifier interact
3. **Optimize Settings:** Provide recommendations to fine-tune phenology stage targets and automation thresholds
4. **Explain System Behavior:** Help users understand why the system made specific decisions and how variables relate
5. **Predict Outcomes:** Analyze trends to predict how changes will affect the environment

**Key Integration:** This AI system works **alongside** the existing intelligent EnvironmentController (Phase 2), providing human-readable analysis and optimization suggestions rather than replacing the automated control.

### What We're Building

```
┌─────────────────────────────────────────────────────────────┐
│  🧠 AI Analysis & Optimization Panel              [Analyze]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Current State: VPD 2.12 kPa | Fan Power 5 | Humidifier Off│
│                                                             │
│  📊 System Decision Analysis:                              │
│  "The EnvironmentController detected VPD_HIGH (severity:   │
│   100). It's coordinating fan reduction (5→2) with         │
│   humidifier activation. This is correct - the fan at       │
│   power 5 removes 2.3x more air than power 2, allowing      │
│   humidifier to catch up."                                  │
│                                                             │
│  🔗 Variable Relationships:                                │
│  • Temperature ↑1°F → VPD ↑0.05 kPa                       │
│  • Humidity ↓1% → VPD ↑0.03 kPa                            │
│  • Fan Power ↑1 → Humidity ↓0.8% (in this basement)        │
│  • Current: Fan removing moisture faster than humidifier    │
│                                                             │
│  💡 Optimization Suggestions:                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Consider lowering seedling VPD max from 0.8→0.7     │   │
│  │ → Would trigger fan reduction earlier                │   │
│  │                                                      │   │
│  │ Fan power 2 may be too low for airflow               │   │
│  │ → Try power 3 for better balance                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [View Decision History] [Ask: "Why did fan reduce?"]      │
└─────────────────────────────────────────────────────────────┘
```

**Key Features:**
- **Decision Transparency:** Shows what the EnvironmentController decided and why
- **Variable Relationship Analysis:** Explains how changes in one variable affect others
- **Optimization Suggestions:** Recommends fine-tuning targets and thresholds
- **Historical Pattern Analysis:** Learns from past decisions and outcomes
- **Predictive Insights:** Forecasts how changes will affect the environment

---

## 🗂️ Implementation Overview

### Files to Create (in order)

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `dashboard/.env` | Add Anthropic API key |
| 2 | `dashboard/src/prompts/environment-analysis.js` | Claude system prompts |
| 3 | `dashboard/src/services/ai-analysis.js` | Claude API service |
| 4 | `dashboard/src/hooks/useAIAnalysis.js` | React state hook |
| 5 | `dashboard/src/components/AIAnalysisPanel.jsx` | UI component |
| 6 | `dashboard/src/components/index.js` | Update exports |
| 7 | `dashboard/src/App.jsx` | Add panel to layout |

### Dependencies to Install

```bash
cd C:\Users\russe\Documents\Grow\dashboard
npm install @anthropic-ai/sdk
```

---

## 📁 Existing Codebase Reference

Cursor should be aware of these existing files:

```
dashboard/
├── src/
│   ├── services/
│   │   ├── ha-api.js                    # ✅ EXISTS - HA REST API
│   │   ├── ha-websocket.js              # ✅ EXISTS - WebSocket connection
│   │   ├── automation-manager.js        # ✅ EXISTS - Automation builder
│   │   └── environment-controller.js    # ✅ EXISTS (Phase 2) - Decision engine
│   │
│   ├── hooks/
│   │   ├── useHomeAssistant.js          # ✅ EXISTS - Sensor data hook
│   │   ├── usePhenologySchedule.js      # ✅ EXISTS - Growth stage hook
│   │   └── useEnvironmentController.js  # ✅ EXISTS (Phase 2) - Controller hook
│   │
│   ├── components/
│   │   ├── KPICard.jsx                  # ✅ EXISTS - Card styling reference
│   │   ├── StatusBadge.jsx              # ✅ EXISTS - Status indicator
│   │   ├── ToggleSwitch.jsx             # ✅ EXISTS - Toggle component
│   │   ├── SystemThinkingPanel.jsx     # ✅ EXISTS (Phase 3) - Controller UI
│   │   └── index.js                     # ✅ EXISTS - Component exports
│   │
│   ├── context/
│   │   ├── PhenologyContext.jsx         # ✅ EXISTS - Growth stage context
│   │   ├── HomeAssistantContext.jsx     # ✅ EXISTS - HA connection context
│   │   └── GrowLogContext.jsx           # ✅ EXISTS - Grow log context
│   │
│   ├── types/
│   │   └── entities.js            # ✅ EXISTS - HA entity IDs
│   │
│   ├── App.jsx                    # ✅ EXISTS - Main layout
│   ├── index.css                  # ✅ EXISTS - Tailwind styles
│   └── main.jsx                   # ✅ EXISTS - Entry point
│
├── .env                           # ✅ EXISTS - Environment vars
├── .env.example                   # ✅ EXISTS - Template
├── package.json                   # ✅ EXISTS - Dependencies
├── tailwind.config.js             # ✅ EXISTS - Theme colors
└── vite.config.js                 # ✅ EXISTS - Build config
```

### Key Existing Exports to Use

From `src/types/entities.js`:
```javascript
export const ENTITIES = {
  // Climate Sensors
  TEMPERATURE: 'sensor.ac_infinity_controller_69_pro_temperature',
  HUMIDITY: 'sensor.ac_infinity_controller_69_pro_humidity',
  VPD: 'sensor.ac_infinity_controller_69_pro_vpd',
  
  // Control Devices
  LIGHT: 'switch.light',
  HEATER: 'climate.tent_heater',
  HUMIDIFIER_MODE: 'select.cloudforge_t5_active_mode',
  EXHAUST_FAN_MODE: 'select.exhaust_fan_active_mode',
  
  // Fan Power Control (Phase 1 - VERIFIED EXISTS)
  EXHAUST_FAN_ON_POWER: 'number.exhaust_fan_on_power',
  EXHAUST_FAN_CURRENT_POWER: 'sensor.exhaust_fan_current_power',
};
```

From `src/context/HomeAssistantContext.jsx`:
```javascript
// Use hook: useHA()
// Returns: { 
//   temperature, humidity, vpd, 
//   lightState, heaterState, heaterAction,
//   fanMode, fanPower, 
//   humidifierMode, humidifierState,
//   entities, callService, ...
// }
```

From `src/context/PhenologyContext.jsx`:
```javascript
// Use hook: usePhenology()
// Returns: {
//   currentStage, schedule, 
//   deployCurrentStage, deployStageObject,
//   isDeploying, ...
// }
```

From `src/hooks/useEnvironmentController.js` (Phase 2):
```javascript
// Returns: {
//   actionLog, isThinking, isEnabled,
//   latestAction, triggerNow, setEnabled, ...
// }
// latestAction contains: { problems, actionPlan, results, status }
```

From `src/services/environment-controller.js` (Phase 2):
```javascript
// EnvironmentController class with:
// - analyzeState() - Returns problems detected
// - generateActionPlan(problems) - Returns coordinated actions
// - executeActionPlan(actions, callService) - Executes via HA
```

### Tailwind Theme Colors (from tailwind.config.js)

```javascript
colors: {
  'void': '#09090b',        // Darkest background
  'abyss': '#18181b',       // Card background
  'slate-deep': '#27272a',  // Borders
  'optimal': '#22c55e',     // Green - good
  'caution': '#f59e0b',     // Amber - warning
  'critical': '#ef4444',    // Red - bad
  'neon-green': '#4ade80',  // Accent
}
```

---

## 🔧 IMPLEMENTATION STEP 1: Environment Setup

### Cursor Prompt 1.1: Update .env

```
Update the file: dashboard/.env

Add the Anthropic API key variable:

# Anthropic API Key for AI Analysis
# Get yours at: https://console.anthropic.com/
VITE_ANTHROPIC_API_KEY=

Keep all existing variables (VITE_HA_URL, VITE_HA_TOKEN, VITE_GROWTH_STAGE).
```

### Cursor Prompt 1.2: Update .env.example

```
Update the file: dashboard/.env.example

Add documentation for the new variable:

# Anthropic API Key for AI-powered environmental analysis
# Create an API key at: https://console.anthropic.com/
# Recommended: Set a $5-10 monthly spending limit for safety
VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

Keep all existing example variables.
```

### Cursor Prompt 1.3: Install Dependency

```bash
# Run this command in terminal:
cd C:\Users\russe\Documents\Grow\dashboard
npm install @anthropic-ai/sdk
```

---

## 🔧 IMPLEMENTATION STEP 2: Create Prompts File

### Cursor Prompt 2.1: Create environment-analysis.js

```
Create new file: dashboard/src/prompts/environment-analysis.js

This file contains the system prompts for Claude environmental analysis and optimization.

Requirements:

1. Export function: buildSystemPrompt(stageTargets, controllerState)
   - Returns the system prompt string for Claude
   - Should explain Claude is a horticultural AI expert AND system analyst
   - Describe the grow tent setup:
     * Location: Basement in Albany, NY (cold/dry climate)
     * Baseline humidity: ~30% (CRITICAL - very dry basement)
     * Equipment: AC Infinity Controller 69 Pro, CloudForge T5 humidifier, 
       exhaust fan (Cloudline T6 with power control 1-10), oil radiator heater
   - Explain the INTELLIGENT CONTROL SYSTEM:
     * Phase 2 EnvironmentController runs every 5 minutes
     * It analyzes problems and generates coordinated action plans
     * It prevents devices from working against each other
     * Your job is to ANALYZE its decisions and suggest optimizations
   - Explain VPD science:
     * VPD = (1 - RH/100) × SVP(temp)
     * HIGH VPD = air too dry = plant stress
     * LOW VPD = air too humid = disease risk
   - Explain key relationships (CRITICAL for optimization):
     * ↑ Temperature → ↑ VPD (approximately +0.05 kPa per 1°F)
     * ↓ Humidity → ↑ VPD (approximately +0.03 kPa per 1% RH)
     * ↑ Exhaust Fan Power → ↓ Humidity (fan removes moist air, brings in dry basement air)
     * Fan Power 5 removes ~2.3x more air than Power 2
     * In 30% baseline humidity basement, fan power has HUGE impact
   - Include current stage targets from parameter
   - Include controller decision history if available
   - Specify JSON response format (see below)

2. Export function: buildAnalysisPrompt(sensorData, targets, actuatorStates, controllerState, actionHistory)
   - Format current readings: temp, humidity, vpd
   - Calculate deltas from optimal
   - Include current actuator states (fan power, humidifier state, heater action)
   - Include current time context (day/night cycle, lights on/off)
   - Include EnvironmentController's latest decision (if available):
     * What problems it detected
     * What actions it planned
     * What actions it executed
     * Results (success/failure)
   - Include action history (last 10 decisions) for pattern analysis
   - Ask Claude to:
     * Analyze if the controller's decisions were correct
     * Explain variable relationships and interactions
     * Suggest optimizations to targets or thresholds
     * Predict outcomes of potential changes

3. Export function: parseAnalysisResponse(responseText)
   - Extract JSON from Claude's response
   - Handle markdown code blocks (```json)
   - Validate required fields
   - Return fallback if parsing fails

4. Export function: formatRecommendations(recommendations)
   - Add device icons (💧 humidifier, 💨 fan, 🌡️ heater, 💡 light)
   - Add human-readable action labels

Required JSON response schema for Claude:
{
  "status": "optimal" | "caution" | "critical",
  "summary": "1-2 sentence assessment of current state",
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

Use JSDoc comments for all exports.
Log parsing errors with [AI-PROMPTS] prefix.
```

### Full Implementation Reference for environment-analysis.js:

```javascript
/**
 * Environment Analysis Prompts
 * @file src/prompts/environment-analysis.js
 */

/**
 * Build the system prompt for environmental analysis
 * @param {Object} stageTargets - Current growth stage targets
 * @returns {string} System prompt for Claude
 */
export function buildSystemPrompt(stageTargets, controllerState = null) {
  return `You are an expert horticultural environmental control AI AND system analyst for an indoor grow tent with an intelligent automation system.

## Your Environment
- Location: Basement in Albany, NY (cold/dry climate)
- Baseline humidity: ~30% (CRITICAL CONSTRAINT - very dry basement)
- Current growth stage: ${stageTargets?.stageName || 'Seedling'}

## Your Equipment
The system can control these devices via Home Assistant:
1. **Grow Light** (switch.light) - 20/4 schedule (on 6AM, off 2AM)
2. **Heater** (climate.tent_heater) - Oil radiator, target 80°F day / 70°F night
3. **Humidifier** (select.cloudforge_t5_active_mode) - CloudForge T5, options: On/Off/Auto
4. **Exhaust Fan** (number.exhaust_fan_on_power) - AC Infinity Cloudline T6, power 1-10 (VERIFIED EXISTS)

## Intelligent Control System (Phase 2)
An EnvironmentController runs every 5 minutes and:
- Analyzes current state vs targets
- Detects problems (VPD_HIGH, TEMP_LOW, etc.) with severity scores
- Generates coordinated action plans (prevents devices fighting)
- Executes actions via Home Assistant
- Logs all decisions for transparency

**Your Role:** Analyze the controller's decisions, explain variable relationships, and suggest optimizations.

## VPD Science
VPD (Vapor Pressure Deficit) is the driving force for plant transpiration:
- HIGH VPD (>1.0 kPa) = Air too dry = Plant stress, stomata close
- LOW VPD (<0.4 kPa) = Air too humid = Disease risk, poor transpiration
- Seedlings need 0.4-0.8 kPa (high humidity, lower transpiration demand)

## Key Variable Relationships (CRITICAL for Optimization)

**Temperature ↔ VPD:**
- ↑ Temperature 1°F → ↑ VPD ~0.05 kPa
- At 78°F, each 1°F change = significant VPD impact
- Day/night temp swings create VPD fluctuations

**Humidity ↔ VPD:**
- ↓ Humidity 1% → ↑ VPD ~0.03 kPa
- In 30% baseline basement, humidity is the PRIMARY constraint
- Small humidity changes = large VPD changes

**Exhaust Fan Power ↔ Humidity (MOST CRITICAL):**
- Fan Power 5 removes ~2.3x more air than Power 2
- In 30% baseline humidity, fan power 5 brings in VERY dry air
- Fan Power 2 reduces air exchange, allowing humidifier to catch up
- The exhaust fan and humidifier FIGHT each other in this basement!
- **This is why coordinated control is essential**

**Coordinated Control Strategy:**
- When VPD high: Reduce fan (retain moisture) + Turn on humidifier
- When VPD optimal: Restore fan (normal airflow) + Turn off humidifier
- Prevents devices from working against each other

## Current Targets
- Temperature: ${stageTargets?.temp?.min || 75}-${stageTargets?.temp?.max || 82}°F (optimal: ${stageTargets?.temp?.optimal || 78}°F)
- Humidity: ${stageTargets?.humidity?.min || 65}-${stageTargets?.humidity?.max || 75}% (optimal: ${stageTargets?.humidity?.optimal || 70}%)
- VPD: ${stageTargets?.vpd?.min || 0.4}-${stageTargets?.vpd?.max || 0.8} kPa (optimal: ${stageTargets?.vpd?.optimal || 0.6} kPa)

## Response Format
Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "status": "optimal" | "caution" | "critical",
  "summary": "1-2 sentence assessment",
  "controllerAnalysis": {
    "decisionCorrect": true,
    "decisionExplanation": "Why the controller's decision was correct/incorrect",
    "coordinationQuality": "excellent",
    "suggestedImprovements": []
  },
  "variableRelationships": {
    "temperatureToVPD": "Explanation",
    "humidityToVPD": "Explanation",
    "fanPowerToHumidity": "Explanation",
    "interactions": "How variables interact"
  },
  "optimizationSuggestions": [
    {
      "type": "target_adjustment",
      "parameter": "vpd.max",
      "currentValue": "0.8",
      "suggestedValue": "0.7",
      "reason": "Would trigger earlier",
      "expectedImpact": "Faster response to high VPD"
    }
  ],
  "predictions": [
    {
      "scenario": "If fan reduced to 2",
      "predictedOutcome": "VPD drops 0.3 kPa in 2 hours",
      "confidence": "high"
    }
  ],
  "reasoning": "Detailed analysis with variable relationships"
}`;
}

/**
 * Build the user message with current sensor data
 * @param {Object} sensorData - Current readings
 * @param {Object} targets - Target values
 * @param {Object} actuatorStates - Current actuator states
 * @returns {string} Formatted user prompt
 */
export function buildAnalysisPrompt(sensorData, targets, actuatorStates = {}, controllerState = null, actionHistory = []) {
  const tempDelta = sensorData.temp - (targets?.temp?.optimal || 78);
  const humidityDelta = sensorData.humidity - (targets?.humidity?.optimal || 70);
  const vpdDelta = sensorData.vpd - (targets?.vpd?.optimal || 0.6);

  let controllerSection = '';
  if (controllerState?.latestAction) {
    const action = controllerState.latestAction;
    controllerSection = `
## EnvironmentController Latest Decision
**Problems Detected:** ${action.problems?.length || 0}
${action.problems?.map(p => `- ${p.type} (severity: ${p.severity}): ${p.description}`).join('\n') || 'None'}

**Action Plan Generated:** ${action.actionPlan?.length || 0} actions
${action.actionPlan?.map(a => `- ${a.device}: ${a.action} - ${a.reason}`).join('\n') || 'None'}

**Execution Results:** ${action.results?.every(r => r.success) ? 'All successful' : 'Some failed'}
**Status:** ${action.status}

**Analysis Request:** Was this decision correct? How could it be optimized?`;
  }

  let historySection = '';
  if (actionHistory.length > 0) {
    historySection = `
## Recent Decision History (Last ${Math.min(5, actionHistory.length)})
${actionHistory.slice(0, 5).map((entry, i) => `
${i + 1}. ${entry.timestamp?.toLocaleTimeString() || 'Unknown time'}:
   - Problems: ${entry.problems?.length || 0}
   - Actions: ${entry.actionPlan?.length || 0}
   - Status: ${entry.status}
`).join('\n')}

**Pattern Analysis Request:** What patterns do you see? Are there recurring issues?`;
  }

  return `Analyze my grow tent environment and the intelligent control system's decisions:

## Current Readings
- Temperature: ${sensorData.temp}°F
- Humidity: ${sensorData.humidity}%
- VPD: ${sensorData.vpd} kPa

## Deltas from Optimal
- Temperature: ${tempDelta > 0 ? '+' : ''}${tempDelta.toFixed(1)}°F (target: ${targets?.temp?.optimal || 78}°F)
- Humidity: ${humidityDelta > 0 ? '+' : ''}${humidityDelta.toFixed(1)}% (target: ${targets?.humidity?.optimal || 70}%)
- VPD: ${vpdDelta > 0 ? '+' : ''}${vpdDelta.toFixed(2)} kPa (target: ${targets?.vpd?.optimal || 0.6} kPa)

## Current Actuator States
- Light: ${actuatorStates.light || 'unknown'}
- Heater: ${actuatorStates.heater || 'unknown'} (action: ${actuatorStates.heaterAction || 'unknown'})
- Humidifier: ${actuatorStates.humidifier || 'unknown'}
- Exhaust Fan Power: ${actuatorStates.fanPower || 'unknown'}/10 (mode: ${actuatorStates.fanMode || 'unknown'})

${controllerSection}

${historySection}

## Analysis Tasks
1. **Evaluate Controller Decision:** Was the latest decision correct? Why or why not?
2. **Explain Variable Relationships:** How do temperature, humidity, fan power, and VPD interact in this 30% baseline humidity basement?
3. **Suggest Optimizations:** What target/threshold adjustments would improve performance?
4. **Predict Outcomes:** What will happen if we change X?

Provide your analysis as JSON.`;
}

/**
 * Parse Claude's response into structured format
 * @param {string} responseText - Raw text from Claude
 * @returns {Object} Parsed analysis result
 */
export function parseAnalysisResponse(responseText) {
  try {
    let jsonStr = responseText.trim();
    
    // Remove markdown code blocks
    if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
    else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
    if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
    jsonStr = jsonStr.trim();

    const parsed = JSON.parse(jsonStr);

    return {
      status: ['optimal', 'caution', 'critical'].includes(parsed.status) ? parsed.status : 'caution',
      summary: parsed.summary || 'Analysis complete',
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
      recommendations: (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
        .sort((a, b) => (a.priority || 5) - (b.priority || 5)),
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('[AI-PROMPTS] Parse error:', error.message);
    return {
      status: 'caution',
      summary: 'Could not parse AI response',
      problems: [],
      recommendations: [],
      reasoning: responseText.slice(0, 500),
      parseError: true,
    };
  }
}

/**
 * Format recommendations with icons
 * @param {Array} recommendations
 * @returns {Array} Formatted recommendations
 */
export function formatRecommendations(recommendations) {
  const icons = { humidifier: '💧', exhaustFan: '💨', heater: '🌡️', light: '💡' };
  const labels = { on: 'Turn ON', off: 'Turn OFF', reduce: 'Reduce', increase: 'Increase' };

  return recommendations.map(rec => ({
    ...rec,
    icon: icons[rec.device] || '⚙️',
    actionLabel: labels[rec.action] || rec.action,
  }));
}
```

---

## 🔧 IMPLEMENTATION STEP 3: Create AI Service

### Cursor Prompt 3.1: Create ai-analysis.js

```
Create new file: dashboard/src/services/ai-analysis.js

This service handles Claude API integration for environmental analysis.

Requirements:

1. Import Anthropic SDK: import Anthropic from '@anthropic-ai/sdk'
2. Import prompt functions from '../prompts/environment-analysis'
3. Import ENTITIES from '../types/entities'
4. Get API key from: import.meta.env.VITE_ANTHROPIC_API_KEY

5. Create AIAnalysisService class:

   constructor():
   - Check if API key exists
   - If no key, set isConfigured = false and log error
   - If key exists, create Anthropic client with dangerouslyAllowBrowser: true
   - Set model = 'claude-sonnet-4-20250514'
   - Set maxTokens = 1024

   isReady():
   - Return boolean if service is configured

   async analyzeEnvironment(sensorData, stageTargets, actuatorStates):
   - Check isReady(), return error result if not
   - Build system prompt with stageTargets
   - Build user prompt with sensorData, stageTargets, actuatorStates
   - Call Claude API: client.messages.create({...})
   - Parse response with parseAnalysisResponse()
   - Add timestamp to result
   - Handle errors gracefully, return error object instead of throwing
   - Log all steps with [AI-ANALYSIS] prefix

   async askFollowUp(question, context):
   - For follow-up questions about the environment
   - Use simpler system prompt with current context
   - Return text response

   generateServiceCall(recommendation):
   - Map recommendation to Home Assistant service call
   - Return object with: { service, target, data }
   - Support these actions:
     * humidifier_on: select.select_option on select.cloudforge_t5_active_mode (option: "On")
     * humidifier_off: select.select_option (option: "Off")
     * fan_reduce: number.set_value on number.exhaust_fan_on_power (value: 2)
     * fan_restore: number.set_value (value: 5)
     * fan_increase: number.set_value (value: 7)
     * heater_reduce: climate.set_temperature on climate.tent_heater (temp: 78)
     * heater_increase: climate.set_temperature (temp: 80)
   
   Note: Most actions should be executed by the EnvironmentController, not directly.
   This function is for manual overrides or testing optimization suggestions.

6. Export singleton instance: export const aiAnalysis = new AIAnalysisService()
7. Export default class for testing

Use JSDoc for all methods.
Error handling: NEVER throw, always return error objects.
```

---

## 🔧 IMPLEMENTATION STEP 4: Create React Hook

### Cursor Prompt 4.1: Create useAIAnalysis.js

```
Create new file: dashboard/src/hooks/useAIAnalysis.js

This hook manages AI analysis state and triggers for React components.

Requirements:

1. Import from react: useState, useCallback, useEffect, useRef
2. Import aiAnalysis singleton from '../services/ai-analysis'
3. Import callService from '../services/ha-api'

4. Export function useAIAnalysis({ sensorData, stageTargets, actuatorStates, controllerState, actionHistory, autoAnalyze }):

   State to manage:
   - analysis: AnalysisResult | null
   - isAnalyzing: boolean
   - error: string | null
   - lastAnalyzed: Date | null
   - conversationHistory: Array<{role, content, timestamp, type}>
   - followUpResponse: string | null
   - isAskingFollowUp: boolean
   
   Parameters:
   - sensorData: { temp, humidity, vpd } from useHA()
   - stageTargets: currentStage from usePhenology()
   - actuatorStates: { light, heater, heaterAction, humidifier, fanMode, fanPower } from useHA()
   - controllerState: { latestAction, actionLog } from useEnvironmentController()
   - actionHistory: actionLog.slice(0, 10) from useEnvironmentController()

   Functions to expose:

   runAnalysis():
   - Validate sensorData and stageTargets exist
   - Set isAnalyzing = true
   - Call aiAnalysis.analyzeEnvironment(sensorData, stageTargets, actuatorStates, controllerState, actionHistory)
   - Update analysis state
   - Add to conversationHistory
   - Set lastAnalyzed timestamp
   - Log with [AI-HOOK] prefix
   - Include controllerState and actionHistory in analysis for decision pattern analysis

   askQuestion(question):
   - Add user question to conversationHistory
   - Call aiAnalysis.askFollowUp()
   - Add AI response to conversationHistory
   - Set followUpResponse

   executeRecommendation(index):
   - Get recommendation from analysis.recommendations[index]
   - Generate service call with aiAnalysis.generateServiceCall()
   - Call HA service with callService()
   - Add action to conversationHistory
   - Return success boolean

   clearAnalysis():
   - Reset all state to initial values

   Optional auto-analysis effect:
   - If autoAnalyze=true and VPD > stageTargets.vpd.max * 1.5
   - Trigger runAnalysis() with 5 minute cooldown
   - Use useRef for cooldown tracking

   Return object:
   {
     analysis,
     isAnalyzing,
     error,
     lastAnalyzed,
     conversationHistory,
     followUpResponse,
     isAskingFollowUp,
     isConfigured: aiAnalysis.isReady(),
     runAnalysis,
     askQuestion,
     executeRecommendation,
     clearAnalysis,
   }

Use useCallback for all function definitions.
```

---

## 🔧 IMPLEMENTATION STEP 5: Create UI Component

### Cursor Prompt 5.1: Create AIAnalysisPanel.jsx

```
Create new file: dashboard/src/components/AIAnalysisPanel.jsx

This component displays AI analysis and allows user interaction.

Requirements:

1. Import from react: useState
2. Import from lucide-react: Brain, RefreshCw, AlertTriangle, CheckCircle, XCircle, 
   ChevronDown, ChevronUp, Send, Loader2, Zap, MessageSquare
3. Import useAIAnalysis from '../hooks/useAIAnalysis'
4. Import formatRecommendations from '../prompts/environment-analysis'

5. Create StatusBadge sub-component:
   - Props: { status }
   - Render appropriate icon and color based on status
   - optimal: green, CheckCircle
   - caution: amber, AlertTriangle
   - critical: red, XCircle
   - Use Tailwind classes from existing theme

6. Create RecommendationCard sub-component:
   - Props: { recommendation, index, onExecute, isExecuting }
   - Show device icon (💧💨🌡️💡)
   - Show action and reason
   - Include [Execute] button
   - Disable button while executing

7. Main AIAnalysisPanel component:
   - Props: { sensorData, stageTargets, actuatorStates }
   - Use useAIAnalysis hook with props
   - State for: showReasoning, followUpInput, executingIndex

   Layout sections:
   
   a) Header:
      - 🧠 AI Analysis title
      - Brain icon (animate-pulse while analyzing)
      - Refresh/Analyze button

   b) Not Configured State:
      - Show if !isConfigured
      - Message about missing API key
      - Link to Anthropic console

   c) Empty State:
      - Show if no analysis and not analyzing
      - "Click Analyze to get AI insights"
      - Large Analyze button

   d) Loading State:
      - Show while isAnalyzing
      - Loader2 spinner with animate-spin
      - "Analyzing environment..."

   e) Error State:
      - Show if error exists
      - Red alert box with error message
      - Retry button

   f) Analysis Results (when analysis exists):
      - StatusBadge showing status
      - Summary text (larger, prominent)
      - Problems list (if any, with severity colors)
      - Recommendations section with RecommendationCards
      - "Execute All" button (optional)
      - Collapsible reasoning section (click to expand)

   g) Follow-up Section:
      - Input field for questions
      - Send button
      - Display followUpResponse if exists
      - Show conversation history

   h) Footer:
      - Last analyzed timestamp
      - Clear button

Styling:
- Use 'card' class from index.css for container
- Use existing Tailwind color classes (optimal, caution, critical, neon-green)
- Responsive: stack on mobile, columns on desktop
- Match existing dashboard aesthetic (dark theme, subtle borders)
```

### Full Component Reference:

```jsx
/**
 * AI Analysis Panel Component
 * @file src/components/AIAnalysisPanel.jsx
 */

import { useState } from 'react';
import { 
  Brain, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Send, Loader2, Zap
} from 'lucide-react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';
import { formatRecommendations } from '../prompts/environment-analysis';

function StatusBadge({ status }) {
  const config = {
    optimal: { bg: 'bg-optimal/20', border: 'border-optimal/50', text: 'text-optimal', icon: CheckCircle, label: 'Optimal' },
    caution: { bg: 'bg-caution/20', border: 'border-caution/50', text: 'text-caution', icon: AlertTriangle, label: 'Caution' },
    critical: { bg: 'bg-critical/20', border: 'border-critical/50', text: 'text-critical', icon: XCircle, label: 'Critical' },
  };
  const { bg, border, text, icon: Icon, label } = config[status] || config.caution;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${border} border`}>
      <Icon className={`w-3.5 h-3.5 ${text}`} />
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  );
}

function RecommendationCard({ recommendation, index, onExecute, isExecuting }) {
  const icons = { humidifier: '💧', exhaustFan: '💨', heater: '🌡️', light: '💡' };
  const icon = icons[recommendation.device] || '⚙️';

  return (
    <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <span className="text-lg">{icon}</span>
          <div>
            <p className="text-sm font-medium text-zinc-200">
              {recommendation.action.charAt(0).toUpperCase() + recommendation.action.slice(1)} {recommendation.device}
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">{recommendation.reason}</p>
          </div>
        </div>
        <button
          onClick={() => onExecute(index)}
          disabled={isExecuting}
          className="px-2.5 py-1 text-xs font-medium rounded bg-neon-green/20 text-neon-green 
                     hover:bg-neon-green/30 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center gap-1"
        >
          {isExecuting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Execute
        </button>
      </div>
    </div>
  );
}

export function AIAnalysisPanel({ sensorData, stageTargets, actuatorStates, controllerState, actionHistory }) {
  const {
    analysis, isAnalyzing, error, lastAnalyzed,
    isConfigured, runAnalysis, askQuestion, executeRecommendation, clearAnalysis
  } = useAIAnalysis({ sensorData, stageTargets, actuatorStates, controllerState, actionHistory });

  const [showReasoning, setShowReasoning] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [executingIndex, setExecutingIndex] = useState(null);

  const handleExecute = async (index) => {
    setExecutingIndex(index);
    await executeRecommendation(index);
    setExecutingIndex(null);
  };

  const handleAskQuestion = async () => {
    if (!followUpInput.trim()) return;
    await askQuestion(followUpInput);
    setFollowUpInput('');
  };

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-zinc-500" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-sm text-zinc-400 mb-2">API key not configured</p>
          <p className="text-xs text-zinc-500">
            Add VITE_ANTHROPIC_API_KEY to your .env file.
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer"
               className="text-neon-green hover:underline ml-1">
              Get API key →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className={`w-5 h-5 ${isAnalyzing ? 'text-neon-green animate-pulse' : 'text-zinc-400'}`} />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-neon-green animate-spin mr-2" />
          <span className="text-zinc-400">Analyzing environment...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isAnalyzing && (
        <div className="bg-critical/10 border border-critical/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-critical">{error}</p>
          <button onClick={runAnalysis} className="text-xs text-zinc-400 hover:text-white mt-2">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && !error && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 mb-4">Click Analyze to get AI insights</p>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-colors"
          >
            Analyze Environment
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <div className="space-y-4">
          {/* Status & Summary */}
          <div>
            <StatusBadge status={analysis.status} />
            <p className="mt-2 text-zinc-200">{analysis.summary}</p>
          </div>

          {/* Problems */}
          {analysis.problems.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Problems Detected</p>
              <div className="space-y-1">
                {analysis.problems.map((problem, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <AlertTriangle className={`w-4 h-4 ${problem.severity > 7 ? 'text-critical' : 'text-caution'}`} />
                    <span className="text-zinc-300">{problem.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controller Decision Analysis */}
          {analysis.controllerAnalysis && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Controller Decision Analysis</p>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  {analysis.controllerAnalysis.decisionCorrect ? (
                    <CheckCircle className="w-4 h-4 text-optimal" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-caution" />
                  )}
                  <span className="text-sm font-medium">
                    Decision: {analysis.controllerAnalysis.decisionCorrect ? 'Correct' : 'Needs Review'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{analysis.controllerAnalysis.decisionExplanation}</p>
                <p className="text-xs text-zinc-500">
                  Coordination Quality: <span className="text-zinc-300">{analysis.controllerAnalysis.coordinationQuality}</span>
                </p>
                {analysis.controllerAnalysis.suggestedImprovements?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-zinc-500 mb-1">Suggested Improvements:</p>
                    <ul className="text-xs text-zinc-400 space-y-1">
                      {analysis.controllerAnalysis.suggestedImprovements.map((improvement, i) => (
                        <li key={i}>• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variable Relationships */}
          {analysis.variableRelationships && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Variable Relationships</p>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 space-y-2 text-xs">
                {analysis.variableRelationships.temperatureToVPD && (
                  <div>
                    <span className="text-zinc-300 font-medium">Temperature ↔ VPD:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.temperatureToVPD}</span>
                  </div>
                )}
                {analysis.variableRelationships.humidityToVPD && (
                  <div>
                    <span className="text-zinc-300 font-medium">Humidity ↔ VPD:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.humidityToVPD}</span>
                  </div>
                )}
                {analysis.variableRelationships.fanPowerToHumidity && (
                  <div>
                    <span className="text-zinc-300 font-medium">Fan Power ↔ Humidity:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.fanPowerToHumidity}</span>
                  </div>
                )}
                {analysis.variableRelationships.interactions && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-zinc-300 font-medium">Interactions:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.interactions}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {analysis.optimizationSuggestions?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Optimization Suggestions</p>
              <div className="space-y-2">
                {analysis.optimizationSuggestions.map((suggestion, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {suggestion.type === 'target_adjustment' && '🎯 Target Adjustment'}
                          {suggestion.type === 'threshold_tuning' && '⚙️ Threshold Tuning'}
                          {suggestion.type === 'timing_adjustment' && '⏱️ Timing Adjustment'}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {suggestion.parameter}: {suggestion.currentValue} → {suggestion.suggestedValue}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">{suggestion.reason}</p>
                    <p className="text-xs text-neon-green">Expected Impact: {suggestion.expectedImpact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions */}
          {analysis.predictions?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Predictions</p>
              <div className="space-y-2">
                {analysis.predictions.map((prediction, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                    <p className="text-sm font-medium text-zinc-200 mb-1">{prediction.scenario}</p>
                    <p className="text-xs text-zinc-400 mb-1">{prediction.predictedOutcome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      prediction.confidence === 'high' ? 'bg-optimal/20 text-optimal' :
                      prediction.confidence === 'medium' ? 'bg-caution/20 text-caution' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      Confidence: {prediction.confidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning (collapsible) */}
          {analysis.reasoning && (
            <div>
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showReasoning ? 'Hide' : 'Show'} AI Reasoning
              </button>
              {showReasoning && (
                <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400">
                  {analysis.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Question */}
          <div className="pt-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Ask a follow-up question..."
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm
                           placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
              />
              <button
                onClick={handleAskQuestion}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Last analyzed: {lastAnalyzed?.toLocaleTimeString()}</span>
            <button onClick={clearAnalysis} className="hover:text-zinc-400">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAnalysisPanel;
```

---

## 🔧 IMPLEMENTATION STEP 6: Update Exports

### Cursor Prompt 6.1: Update component exports

```
Update file: dashboard/src/components/index.js

Add the new AIAnalysisPanel export:

export { AIAnalysisPanel } from './AIAnalysisPanel';

Keep all existing exports.
```

---

## 🔧 IMPLEMENTATION STEP 7: Add to Dashboard Layout

### Cursor Prompt 7.1: Update App.jsx

```
Update file: dashboard/src/App.jsx

Add the AIAnalysisPanel to the dashboard layout.

Requirements:

1. Import AIAnalysisPanel from './components/AIAnalysisPanel'

2. Get sensor data from existing useHomeAssistant hook or context:
   - temperature, humidity, vpd

3. Get stage targets from PhenologyContext or usePhenologySchedule:
   - currentStage with temp, humidity, vpd targets

4. Get actuator states (if available):
   - lightState, heaterState, humidifierState, fanPower

5. Add AIAnalysisPanel to the layout:
   - Position prominently (after KPI cards, before charts)
   - Get data from existing hooks:
     * useHA() for sensorData and actuatorStates
     * usePhenology() for stageTargets (currentStage)
     * useEnvironmentController() for controllerState and actionHistory
   - Pass all props to AIAnalysisPanel
   - Wrap in ErrorBoundary for safety

Example placement:
{/* After KPI Cards */}
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

Make it responsive:
- Full width on mobile
- 1/2 width on large screens (lg:col-span-1)
```

---

## 🚀 DEPLOYMENT

### Local Development

```bash
# 1. Navigate to dashboard
cd C:\Users\russe\Documents\Grow\dashboard

# 2. Install dependencies
npm install @anthropic-ai/sdk

# 3. Add API key to .env
# Edit .env and add: VITE_ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# 4. Start dev server
npm run dev

# 5. Open http://localhost:5173
# 6. Click "Analyze" button in AI Analysis panel
```

### Production Build

```bash
# Build
npm run build

# Preview locally
npm run preview

# Deploy to Home Assistant (optional)
# Copy dist/ folder to HA config/www/grow-dashboard/
```

### Get Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys
4. Create new key named "GrowOp Dashboard"
5. **IMPORTANT:** Set monthly spending limit ($5-10 recommended)
6. Copy key to .env file

---

## 🧪 TESTING CHECKLIST

```
□ API key loads from .env (check console for [AI-ANALYSIS] init message)
□ "Not configured" state shows if no API key
□ Empty state shows "Click Analyze" button
□ Loading state shows spinner during analysis
□ Analysis completes and shows status badge
□ Summary text displays correctly
□ Controller Decision Analysis section shows (if controllerState provided)
□ Variable Relationships section displays correctly
□ Optimization Suggestions show with expected impact
□ Predictions section displays with confidence levels
□ Reasoning section expands/collapses
□ Follow-up question sends and receives response
□ Error state shows on API failure
□ Clear button resets state
□ Responsive layout works on mobile
□ Integration with useEnvironmentController works
□ Action history is passed correctly for pattern analysis
```

---

## 🔒 SECURITY NOTES

**API Key Exposure:**
- The API key IS visible in browser DevTools
- This is acceptable for personal use
- Set spending limits in Anthropic console
- Consider backend proxy for production/shared use

**Cost Estimation:**
- ~$0.006 per analysis (Claude Sonnet)
- 10 analyses/day = ~$2/month
- Set alerts at $5 and $10

---

## 📚 RELATED DOCUMENTS

- `docs/MANIFEST.md` - Entity registry and targets
- `docs/DASHBOARD_MASTERPLAN.md` - Overall dashboard architecture
- `docs/AUTOMATIONS.md` - Existing automation logic
- `docs/BRAIN_IMPLEMENTATION_GUIDE.md` - Intelligent control system (Phase 1-3)
- `docs/CHANGELOG.md` - Change history
- `docs/ENTITIES.md` - Complete entity documentation
- `vpd automation issue.md` - Original problem analysis

## 🔗 INTEGRATION WITH EXISTING SYSTEM

**This AI Analysis system works ALONGSIDE the intelligent EnvironmentController:**

1. **EnvironmentController (Phase 2)** makes automated decisions every 5 minutes
2. **AI Analysis** provides human-readable analysis and optimization suggestions
3. **AI can analyze** the controller's decision patterns and suggest improvements
4. **AI explains** variable relationships and predicts outcomes
5. **Users can ask questions** like "Why did the fan reduce?" or "What if we lower VPD max?"

**Key Integration Points:**
- `useEnvironmentController()` provides `latestAction` and `actionLog`
- `useHA()` provides current sensor and actuator states
- `usePhenology()` provides current stage targets
- AI analyzes controller decisions and suggests optimizations
- Optimizations can be applied by adjusting phenology stage targets

---

## 🎯 QUICK REFERENCE: Cursor Prompt Sequence

Copy these prompts to Cursor in order:

1. **Install:** `npm install @anthropic-ai/sdk`
2. **Create:** `src/prompts/environment-analysis.js` (prompts file)
3. **Create:** `src/services/ai-analysis.js` (API service)
4. **Create:** `src/hooks/useAIAnalysis.js` (React hook)
5. **Create:** `src/components/AIAnalysisPanel.jsx` (UI component)
6. **Update:** `src/components/index.js` (add export)
7. **Update:** `src/App.jsx` (add to layout, integrate with useEnvironmentController)
8. **Update:** `.env` (add API key)

**Integration Notes:**
- AI Analysis works ALONGSIDE EnvironmentController (Phase 2), not replacing it
- AI provides human-readable analysis and optimization suggestions
- EnvironmentController continues to make automated decisions
- AI can analyze controller's decision patterns and suggest improvements

---

---

## 🔄 INTEGRATION WITH BRAIN_IMPLEMENTATION_GUIDE

**This AI Analysis feature should be added as Phase 4 to the BRAIN_IMPLEMENTATION_GUIDE.md:**

### Phase 4: AI-Powered Analysis & Optimization

**Goal:** Add human-readable AI analysis of the intelligent control system  
**Time Estimate:** 2-3 hours  
**Prerequisites:** Phase 2 (Smart Decision Engine) must be complete

**What This Adds:**
- AI analysis of EnvironmentController decisions
- Variable relationship explanations
- Optimization suggestions for phenology targets
- Predictive analysis of potential changes
- Human-readable explanations of system behavior

**Integration Points:**
- Uses `useEnvironmentController()` to get decision history
- Uses `useHA()` for current sensor/actuator states
- Uses `usePhenology()` for current stage targets
- Provides suggestions that can be applied via ScheduleEditor

**Key Difference from Phase 2:**
- Phase 2: Automated decision-making and execution
- Phase 4: Human-readable analysis and optimization suggestions
- They work together: Phase 2 makes decisions, Phase 4 explains and optimizes them

---

## 📝 SUMMARY OF UPDATES

**Updated to align with current system:**

1. ✅ **Integrated with Phase 2 EnvironmentController** - AI analyzes controller decisions
2. ✅ **Added variable relationship analysis** - Explains how temp/humidity/fan/VPD interact
3. ✅ **Added optimization suggestions** - Recommends target/threshold adjustments
4. ✅ **Added predictive analysis** - Forecasts outcomes of changes
5. ✅ **Updated entity references** - Includes verified `number.exhaust_fan_on_power`
6. ✅ **Updated hook references** - Uses `useHA()`, `usePhenology()`, `useEnvironmentController()`
7. ✅ **Added controller state integration** - Passes decision history to AI
8. ✅ **Enhanced prompt structure** - Focuses on decision analysis and optimization
9. ✅ **Updated component examples** - Shows controller analysis, variable relationships, optimizations
10. ✅ **Added integration section** - Explains how this works with existing system

**Ready for implementation as Phase 4 of BRAIN_IMPLEMENTATION_GUIDE.md**

---

*Document Version: 2.0*  
*Target: Cursor.ai Implementation*  
*Codebase: C:\Users\russe\Documents\Grow\*  
*Last Updated: January 19, 2026*  
*Status: ✅ Updated for integration with Phase 2 EnvironmentController*
