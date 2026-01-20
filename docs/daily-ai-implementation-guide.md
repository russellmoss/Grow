# 🤖 Daily Agentic AI Review - Step-by-Step Implementation Guide

**Purpose:** This document provides step-by-step instructions for Cursor to implement a daily agentic AI review system that can autonomously optimize AC Infinity VPD settings.

**CRITICAL RULES FOR CURSOR:**
1. **VERIFY BEFORE CODING** - Use hass-mcp to check entities exist before writing code that uses them
2. **READ EXISTING CODE** - Check existing files before creating new ones to avoid duplication
3. **TEST EACH STEP** - Verify each step works before moving to the next
4. **NO HALLUCINATION** - If unsure about an entity or file, use tools to verify

---

## 📋 TABLE OF CONTENTS

1. [Pre-Implementation Verification](#step-1-pre-implementation-verification)
2. [Update entities.js](#step-2-update-entitiesjs)
3. [Create History Service](#step-3-create-history-service)
4. [Create AI Review Prompt](#step-4-create-ai-review-prompt)
5. [Create Daily AI Review Service](#step-5-create-daily-ai-review-service)
6. [Create useAIReview Hook](#step-6-create-useaireview-hook)
7. [Create UI Components](#step-7-create-ui-components)
8. [Integrate into App.jsx](#step-8-integrate-into-appjsx)
9. [Add On-Demand Analysis](#step-9-add-on-demand-analysis)
10. [Final Verification](#step-10-final-verification)

---

## STEP 1: PRE-IMPLEMENTATION VERIFICATION

**Goal:** Verify all required entities exist and understand current codebase state.

### 1.1 Verify AC Infinity VPD Entities Exist

Use hass-mcp to verify these entities are available:

```
ACTION: Use hass-mcp get_entity for each of these:

REQUIRED ENTITIES (must exist):
- number.cloudforge_t5_target_vpd
- number.cloudforge_t5_vpd_high_trigger
- number.cloudforge_t5_vpd_low_trigger
- number.exhaust_fan_vpd_high_trigger
- number.exhaust_fan_vpd_low_trigger
- sensor.ac_infinity_controller_69_pro_temperature
- sensor.ac_infinity_controller_69_pro_humidity
- sensor.ac_infinity_controller_69_pro_vpd
- climate.tent_heater
- switch.light
- switch.third_reality_inc_3rsp02028bz (Vicks humidifier)
```

**Record the current values:**
```
cloudforge_t5_target_vpd: _____ kPa
cloudforge_t5_vpd_high_trigger: _____ kPa
cloudforge_t5_vpd_low_trigger: _____ kPa
exhaust_fan_vpd_high_trigger: _____ kPa
exhaust_fan_vpd_low_trigger: _____ kPa
current_temperature: _____°F
current_humidity: _____%
current_vpd: _____ kPa
```

**SUCCESS CRITERIA:** All entities return valid states (not "unavailable" or "unknown")

---

### 1.2 Verify Existing Codebase Structure

Read these files to understand current implementation:

```
ACTION: Read each file and note key details:

1. dashboard/src/types/entities.js
   - What ENTITIES constants already exist?
   - Are VPD setting entities already defined?

2. dashboard/src/context/HomeAssistantContext.jsx
   - How does callService work?
   - What parameters does it accept?
   - What does it return on success/failure?

3. dashboard/src/services/environment-controller.js
   - Is there existing AI integration?
   - How is the controller structured?
   - What functions are exported?

4. dashboard/src/App.jsx
   - What hooks are currently used?
   - What components are rendered?
   - Where should new components go?

5. dashboard/src/components/index.js
   - What components are exported?
   - How are new components added?

6. Check if these files exist:
   - dashboard/src/services/ai-service.js (may not exist)
   - dashboard/src/hooks/useAIReview.js (may not exist)
   - dashboard/src/prompts/ directory (may not exist)
```

**Record findings:**
```
entities.js has VPD entities: YES / NO
callService signature: _____
AI service exists: YES / NO
prompts directory exists: YES / NO
```

**SUCCESS CRITERIA:** Understand existing code structure before writing new code

---

### 1.3 Verify .env Has Anthropic API Key

```
ACTION: Check dashboard/.env or dashboard/.env.local for:

VITE_ANTHROPIC_API_KEY=sk-ant-...

If not found, check:
- .env in root directory
- .env.example for expected format
```

**SUCCESS CRITERIA:** Anthropic API key is configured

---

## STEP 2: UPDATE ENTITIES.JS

**Goal:** Add all VPD setting entities to the ENTITIES constant.

### 2.1 Read Current entities.js

```
ACTION: Read dashboard/src/types/entities.js completely
```

### 2.2 Add Missing VPD Entities

**Only add entities that don't already exist:**

```javascript
// ADD THESE TO dashboard/src/types/entities.js (if not already present)

// AC Infinity VPD Settings (WRITABLE - confirmed 2026-01-19)
CLOUDFORGE_T5_TARGET_VPD: 'number.cloudforge_t5_target_vpd',
CLOUDFORGE_T5_VPD_HIGH_TRIGGER: 'number.cloudforge_t5_vpd_high_trigger',
CLOUDFORGE_T5_VPD_LOW_TRIGGER: 'number.cloudforge_t5_vpd_low_trigger',
EXHAUST_FAN_TARGET_VPD: 'number.exhaust_fan_target_vpd',
EXHAUST_FAN_VPD_HIGH_TRIGGER: 'number.exhaust_fan_vpd_high_trigger',
EXHAUST_FAN_VPD_LOW_TRIGGER: 'number.exhaust_fan_vpd_low_trigger',

// Vicks Humidifier (if not already present)
VICKS_HUMIDIFIER: 'switch.third_reality_inc_3rsp02028bz',
```

**SUCCESS CRITERIA:** 
- Run `grep "CLOUDFORGE_T5_TARGET_VPD" dashboard/src/types/entities.js` returns a match
- No duplicate entries

---

## STEP 3: CREATE HISTORY SERVICE

**Goal:** Create a service to fetch sensor history from Home Assistant.

### 3.1 Check if History Service Exists

```
ACTION: Check if dashboard/src/services/history-service.js exists
```

### 3.2 Create History Service

```
ACTION: Create dashboard/src/services/history-service.js
```

```javascript
/**
 * History Service - Fetches sensor history from Home Assistant
 * 
 * Uses the Home Assistant REST API to get historical state data.
 * 
 * @fileoverview Provides functions to fetch and process sensor history
 */

import { ENTITIES } from '../types/entities.js';

// Home Assistant connection details from environment
const HA_URL = import.meta.env.VITE_HA_URL || 'http://100.65.202.84:8123';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

/**
 * Fetch history for a single entity
 * 
 * @param {string} entityId - The entity ID to fetch history for
 * @param {number} hoursBack - How many hours of history to fetch
 * @returns {Promise<Array>} Array of state objects with timestamps
 */
export async function fetchEntityHistory(entityId, hoursBack = 24) {
  const endTime = new Date().toISOString();
  const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
  
  try {
    const response = await fetch(
      `${HA_URL}/api/history/period/${startTime}?end_time=${endTime}&filter_entity_id=${entityId}&minimal_response`,
      {
        headers: {
          'Authorization': `Bearer ${HA_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
      console.error(`[HISTORY] Failed to fetch ${entityId}:`, response.status);
      return [];
    }
    
    const data = await response.json();
    // API returns array of arrays, first array is our entity
    return data[0] || [];
  } catch (error) {
    console.error(`[HISTORY] Error fetching ${entityId}:`, error);
    return [];
  }
}

/**
 * Fetch all environment sensor history
 * 
 * @param {number} hoursBack - How many hours of history to fetch
 * @returns {Promise<Object>} Object with temperature, humidity, vpd arrays
 */
export async function fetchEnvironmentHistory(hoursBack = 24) {
  console.log(`[HISTORY] Fetching ${hoursBack}h of environment history...`);
  
  const [temperature, humidity, vpd] = await Promise.all([
    fetchEntityHistory(ENTITIES.TEMPERATURE, hoursBack),
    fetchEntityHistory(ENTITIES.HUMIDITY, hoursBack),
    fetchEntityHistory(ENTITIES.VPD, hoursBack),
  ]);
  
  console.log(`[HISTORY] Fetched: ${temperature.length} temp, ${humidity.length} humidity, ${vpd.length} vpd readings`);
  
  return {
    temperature: processHistory(temperature),
    humidity: processHistory(humidity),
    vpd: processHistory(vpd),
  };
}

/**
 * Process raw history into usable format
 * 
 * @param {Array} history - Raw history from HA API
 * @returns {Array} Processed array with { timestamp, value }
 */
function processHistory(history) {
  return history
    .filter(entry => entry.state !== 'unavailable' && entry.state !== 'unknown')
    .map(entry => ({
      timestamp: new Date(entry.last_changed).getTime(),
      value: parseFloat(entry.state),
    }))
    .filter(entry => !isNaN(entry.value));
}

/**
 * Calculate statistics from history
 * 
 * @param {Object} history - Object with temperature, humidity, vpd arrays
 * @param {Object} targets - Object with target values for comparison
 * @returns {Object} Statistics object
 */
export function calculateHistoryStats(history, targets) {
  const calcStats = (arr) => {
    if (!arr || arr.length === 0) return { avg: 0, min: 0, max: 0 };
    const values = arr.map(e => e.value);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  };
  
  const vpdStats = calcStats(history.vpd);
  const tempStats = calcStats(history.temperature);
  const humStats = calcStats(history.humidity);
  
  // Calculate time in target range for VPD
  const vpdInRange = history.vpd.filter(
    e => e.value >= (targets?.vpdMin || 0.4) && e.value <= (targets?.vpdMax || 0.8)
  );
  const timeInRange = history.vpd.length > 0 
    ? Math.round((vpdInRange.length / history.vpd.length) * 100) 
    : 0;
  
  return {
    avgVPD: vpdStats.avg.toFixed(2),
    minVPD: vpdStats.min.toFixed(2),
    maxVPD: vpdStats.max.toFixed(2),
    avgTemp: tempStats.avg.toFixed(1),
    minTemp: tempStats.min.toFixed(1),
    maxTemp: tempStats.max.toFixed(1),
    avgHumidity: humStats.avg.toFixed(1),
    minHumidity: humStats.min.toFixed(1),
    maxHumidity: humStats.max.toFixed(1),
    timeInRange,
    dataPoints: history.vpd.length,
  };
}

/**
 * Format history data for AI prompt (condensed)
 * 
 * @param {Object} history - Object with temperature, humidity, vpd arrays  
 * @returns {string} Formatted string for AI prompt
 */
export function formatHistoryForPrompt(history) {
  // Sample every 15 minutes (instead of all data points)
  const sampleInterval = 15 * 60 * 1000; // 15 minutes in ms
  
  const sampled = {
    vpd: sampleData(history.vpd, sampleInterval),
    temperature: sampleData(history.temperature, sampleInterval),
    humidity: sampleData(history.humidity, sampleInterval),
  };
  
  let output = 'Time | Temp (°F) | Humidity (%) | VPD (kPa)\n';
  output += '--- | --- | --- | ---\n';
  
  // Merge all timestamps and sort
  const allTimestamps = [...new Set([
    ...sampled.vpd.map(e => e.timestamp),
    ...sampled.temperature.map(e => e.timestamp),
    ...sampled.humidity.map(e => e.timestamp),
  ])].sort();
  
  for (const ts of allTimestamps.slice(-96)) { // Last 24h at 15min intervals = 96 points max
    const time = new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const temp = sampled.temperature.find(e => Math.abs(e.timestamp - ts) < sampleInterval)?.value?.toFixed(1) || '-';
    const hum = sampled.humidity.find(e => Math.abs(e.timestamp - ts) < sampleInterval)?.value?.toFixed(1) || '-';
    const vpd = sampled.vpd.find(e => Math.abs(e.timestamp - ts) < sampleInterval)?.value?.toFixed(2) || '-';
    
    output += `${time} | ${temp} | ${hum} | ${vpd}\n`;
  }
  
  return output;
}

/**
 * Sample data at regular intervals
 */
function sampleData(data, intervalMs) {
  if (!data || data.length === 0) return [];
  
  const sampled = [];
  let lastTimestamp = 0;
  
  for (const entry of data) {
    if (entry.timestamp - lastTimestamp >= intervalMs) {
      sampled.push(entry);
      lastTimestamp = entry.timestamp;
    }
  }
  
  return sampled;
}
```

**SUCCESS CRITERIA:**
- File created at `dashboard/src/services/history-service.js`
- No syntax errors
- Exports: `fetchEntityHistory`, `fetchEnvironmentHistory`, `calculateHistoryStats`, `formatHistoryForPrompt`

---

## STEP 4: CREATE AI REVIEW PROMPT

**Goal:** Create the system prompt that guides AI analysis and decision-making.

### 4.1 Create Prompts Directory (if needed)

```
ACTION: Check if dashboard/src/prompts/ directory exists
If not, create it
```

### 4.2 Create Daily Review Prompt

```
ACTION: Create dashboard/src/prompts/daily-review-prompt.js
```

```javascript
/**
 * Daily AI Review Prompt Builder
 * 
 * Constructs the prompt for the daily agentic AI review.
 * The AI can autonomously adjust VPD settings within defined limits.
 * 
 * @fileoverview Prompt templates for daily AI review
 */

/**
 * Build the daily review prompt with all context
 * 
 * @param {Object} data - All data for the review
 * @returns {string} Complete prompt for Claude
 */
export function buildDailyReviewPrompt(data) {
  return `You are the AI botanist for a precision indoor cannabis grow in Albany, NY. Each morning you review the last 24 hours and make optimization adjustments.

## YOUR AUTHORITY LEVELS

### ✅ AUTONOMOUS ACTIONS (You execute these immediately)
You CAN adjust these AC Infinity VPD settings without user approval:

| Setting | Entity | Max Change | Hard Limits |
|---------|--------|------------|-------------|
| Humidifier VPD Target | number.cloudforge_t5_target_vpd | ±0.15 kPa/day | 0.3 - 1.2 kPa |
| Humidifier VPD High | number.cloudforge_t5_vpd_high_trigger | ±0.15 kPa/day | 0.5 - 1.4 kPa |
| Humidifier VPD Low | number.cloudforge_t5_vpd_low_trigger | ±0.1 kPa/day | 0.1 - 0.8 kPa |
| Fan VPD High | number.exhaust_fan_vpd_high_trigger | ±0.15 kPa/day | 0.6 - 1.5 kPa |
| Fan VPD Low | number.exhaust_fan_vpd_low_trigger | ±0.1 kPa/day | 0.2 - 0.9 kPa |

### 📋 RECOMMENDATIONS ONLY (User must approve)
- Heater temperature target changes
- Phenology stage advancement
- Light schedule changes
- Major strategy changes (> ±0.2 kPa)

## CURRENT PHENOLOGY STAGE
- **Stage:** ${data.phenology?.stage || 'seedling'}
- **Days in Stage:** ${data.phenology?.daysInStage || 0}
- **VPD Target:** ${data.phenology?.targets?.vpdOptimal || 0.6} kPa (range: ${data.phenology?.targets?.vpdMin || 0.4} - ${data.phenology?.targets?.vpdMax || 0.8})
- **Day Temp Target:** ${data.phenology?.targets?.tempDay || 77}°F
- **Night Temp Target:** ${data.phenology?.targets?.tempNight || 71}°F
- **Humidity Target:** ${data.phenology?.targets?.humidityOptimal || 70}%

## CURRENT AC INFINITY SETTINGS
- Humidifier VPD Target: **${data.acInfinitySettings?.humidifierVPDTarget || 'unknown'}** kPa
- Humidifier VPD High Trigger: **${data.acInfinitySettings?.humidifierVPDHigh || 'unknown'}** kPa
- Humidifier VPD Low Trigger: **${data.acInfinitySettings?.humidifierVPDLow || 'unknown'}** kPa
- Fan VPD High Trigger: **${data.acInfinitySettings?.fanVPDHigh || 'unknown'}** kPa
- Fan VPD Low Trigger: **${data.acInfinitySettings?.fanVPDLow || 'unknown'}** kPa
- Humidifier Intensity: ${data.acInfinitySettings?.humidifierIntensity || 'unknown'}/10
- Fan Power: ${data.acInfinitySettings?.fanPower || 'unknown'}/10

## LAST 24 HOURS - STATISTICS
- **Average VPD:** ${data.stats?.avgVPD || 'N/A'} kPa (target: ${data.phenology?.targets?.vpdOptimal || 0.6})
- **VPD Range:** ${data.stats?.minVPD || 'N/A'} - ${data.stats?.maxVPD || 'N/A'} kPa
- **Time in Target Range:** ${data.stats?.timeInRange || 0}%
- **Average Temperature:** ${data.stats?.avgTemp || 'N/A'}°F
- **Temperature Range:** ${data.stats?.minTemp || 'N/A'} - ${data.stats?.maxTemp || 'N/A'}°F
- **Average Humidity:** ${data.stats?.avgHumidity || 'N/A'}%
- **Data Points:** ${data.stats?.dataPoints || 0} readings

## LAST 24 HOURS - SENSOR DATA
${data.historyTable || 'No history data available'}

## PREVIOUS AI ACTIONS (Last 7 Days)
${data.previousActions?.length > 0 
  ? data.previousActions.map(a => `- ${a.date}: ${a.action} → ${a.outcome || 'Pending'}`).join('\n')
  : 'No previous AI actions recorded'}

## ENVIRONMENT CONTEXT
- Location: Basement in Albany, NY (cold/dry climate)
- Baseline Humidity: ~30% (very dry)
- Humidifier: CloudForge T5 at max intensity (10)
- Backup Humidifier: Vicks (Zigbee controlled)
- Heater: Oil radiator (dashboard controlled)
- Light Schedule: 20/4 (6 AM on, 2 AM off)

## YOUR ANALYSIS TASK

Analyze the last 24 hours and decide what adjustments to make. Consider:

1. **Is VPD consistently hitting the target?** If avg VPD differs from target by >0.1, consider adjusting
2. **Is there excessive VPD swing?** High variance suggests trigger adjustments needed
3. **Are there time-of-day patterns?** Night/day transitions often cause spikes
4. **Is the current strategy working?** Compare to previous days
5. **Stability over optimization** - Don't change settings that are working well

## RESPONSE FORMAT

Respond with this exact JSON structure:

{
  "analysis": {
    "overnightSummary": "2-3 sentence summary of how the environment performed",
    "issuesDetected": ["List of any problems identified"],
    "positives": ["List of what went well"],
    "vpdAssessment": "on_target | slightly_high | slightly_low | too_high | too_low",
    "stabilityScore": 1-10
  },
  
  "autonomousActions": [
    {
      "entity": "number.cloudforge_t5_target_vpd",
      "currentValue": 0.6,
      "newValue": 0.55,
      "reason": "Clear explanation of why this change is needed"
    }
  ],
  
  "recommendations": [
    {
      "type": "heater | stage | humidity | other",
      "priority": "low | medium | high",
      "suggestion": "What to do",
      "reason": "Why this would help"
    }
  ],
  
  "predictions": {
    "todayOutlook": "What to expect today based on current settings",
    "potentialConcerns": ["Things to watch for"],
    "confidenceLevel": "low | medium | high"
  },
  
  "learnings": [
    "Insights about this specific grow environment"
  ]
}

## CRITICAL RULES

1. **autonomousActions can be empty []** - Only make changes if clearly beneficial
2. **Prefer stability** - If VPD is within 0.1 of target and stable, don't change
3. **Gradual adjustments** - Never max out the allowed change unless critical
4. **Explain reasoning** - Every action needs a clear "reason"
5. **Consider history** - Check if previous actions helped or hurt
6. **Be conservative** - When uncertain, recommend instead of act
7. **Valid JSON only** - Response must be parseable JSON`;
}

/**
 * Build prompt for on-demand analysis (user-requested)
 * 
 * @param {Object} data - Current state and history
 * @returns {string} Analysis prompt
 */
export function buildOnDemandAnalysisPrompt(data) {
  return `You are analyzing a precision indoor cannabis grow environment. The user has requested your analysis.

## CURRENT STATE
- Temperature: ${data.current?.temperature || 'N/A'}°F
- Humidity: ${data.current?.humidity || 'N/A'}%
- VPD: ${data.current?.vpd || 'N/A'} kPa
- Light: ${data.current?.lightState || 'unknown'}
- Time: ${new Date().toLocaleString()}

## PHENOLOGY STAGE
- Stage: ${data.phenology?.stage || 'seedling'}
- Day ${data.phenology?.daysInStage || 0} of stage
- VPD Target: ${data.phenology?.targets?.vpdOptimal || 0.6} kPa (${data.phenology?.targets?.vpdMin || 0.4}-${data.phenology?.targets?.vpdMax || 0.8})

## AC INFINITY SETTINGS
- Humidifier VPD Target: ${data.acInfinitySettings?.humidifierVPDTarget || 'unknown'} kPa
- Humidifier VPD High: ${data.acInfinitySettings?.humidifierVPDHigh || 'unknown'} kPa
- Fan VPD High: ${data.acInfinitySettings?.fanVPDHigh || 'unknown'} kPa

## RECENT HISTORY (Last 4 Hours)
${data.recentHistory || 'No recent history available'}

## USER QUESTION
${data.userQuestion || 'Please provide a general analysis of current conditions.'}

Provide a helpful, conversational analysis. Include:
1. Assessment of current conditions vs targets
2. Any concerns or issues
3. Specific recommendations if needed
4. Confidence level in your assessment

Keep your response concise but thorough.`;
}
```

**SUCCESS CRITERIA:**
- File created at `dashboard/src/prompts/daily-review-prompt.js`
- Exports: `buildDailyReviewPrompt`, `buildOnDemandAnalysisPrompt`
- No syntax errors

---

## STEP 5: CREATE DAILY AI REVIEW SERVICE

**Goal:** Create the core service that executes daily reviews and applies changes.

### 5.1 Verify Anthropic SDK

```
ACTION: Check if @anthropic-ai/sdk is installed
Look in dashboard/package.json for "@anthropic-ai/sdk"

If not installed:
cd dashboard && npm install @anthropic-ai/sdk
```

### 5.2 Create AI Review Service

```
ACTION: Create dashboard/src/services/daily-ai-review.js
```

```javascript
/**
 * Daily AI Review Service
 * 
 * Runs once per day (5:30 AM) to analyze environment and make autonomous adjustments.
 * Can also be triggered manually for on-demand analysis.
 * 
 * @fileoverview Core AI review logic with safety guardrails
 */

import Anthropic from '@anthropic-ai/sdk';
import { ENTITIES } from '../types/entities.js';
import { fetchEnvironmentHistory, calculateHistoryStats, formatHistoryForPrompt } from './history-service.js';
import { buildDailyReviewPrompt, buildOnDemandAnalysisPrompt } from '../prompts/daily-review-prompt.js';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Required for browser-side usage
});

/**
 * Hard limits for autonomous actions
 * AI cannot exceed these regardless of what it requests
 */
const HARD_LIMITS = {
  'number.cloudforge_t5_target_vpd': { 
    min: 0.3, 
    max: 1.2, 
    maxChange: 0.15,
    description: 'Humidifier VPD Target'
  },
  'number.cloudforge_t5_vpd_high_trigger': { 
    min: 0.5, 
    max: 1.4, 
    maxChange: 0.15,
    description: 'Humidifier VPD High Trigger'
  },
  'number.cloudforge_t5_vpd_low_trigger': { 
    min: 0.1, 
    max: 0.8, 
    maxChange: 0.1,
    description: 'Humidifier VPD Low Trigger'
  },
  'number.exhaust_fan_vpd_high_trigger': { 
    min: 0.6, 
    max: 1.5, 
    maxChange: 0.15,
    description: 'Fan VPD High Trigger'
  },
  'number.exhaust_fan_vpd_low_trigger': { 
    min: 0.2, 
    max: 0.9, 
    maxChange: 0.1,
    description: 'Fan VPD Low Trigger'
  },
};

/**
 * Storage key for reviews in localStorage
 */
const STORAGE_KEY = 'ai_daily_reviews';

/**
 * Get stored reviews from localStorage
 * 
 * @returns {Array} Array of previous reviews
 */
export function getStoredReviews() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Store a review in localStorage
 * 
 * @param {Object} review - The review to store
 */
function storeReview(review) {
  const reviews = getStoredReviews();
  reviews.unshift(review);
  // Keep last 30 days
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews.slice(0, 30)));
}

/**
 * Get previous AI actions for context
 * 
 * @returns {Array} Last 7 days of AI actions
 */
function getPreviousActions() {
  const reviews = getStoredReviews();
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  
  return reviews
    .filter(r => new Date(r.timestamp).getTime() > sevenDaysAgo)
    .flatMap(r => (r.actionsExecuted || []).map(a => ({
      date: new Date(r.timestamp).toLocaleDateString(),
      action: `${a.entity.split('.')[1]}: ${a.currentValue} → ${a.newValue}`,
      outcome: a.executed ? 'Applied' : `Blocked: ${a.reason}`,
    })));
}

/**
 * Gather all data needed for the daily review
 * 
 * @param {Object} haContext - Home Assistant context with entities and callService
 * @param {Object} phenologyStage - Current phenology stage and targets
 * @returns {Promise<Object>} Complete review data
 */
async function gatherReviewData(haContext, phenologyStage) {
  const { entities } = haContext;
  
  // Fetch 24h history
  const history = await fetchEnvironmentHistory(24);
  
  // Calculate statistics
  const stats = calculateHistoryStats(history, phenologyStage?.targets);
  
  // Format history for prompt
  const historyTable = formatHistoryForPrompt(history);
  
  // Get current AC Infinity settings
  const acInfinitySettings = {
    humidifierVPDTarget: parseFloat(entities[ENTITIES.CLOUDFORGE_T5_TARGET_VPD]?.state) || null,
    humidifierVPDHigh: parseFloat(entities[ENTITIES.CLOUDFORGE_T5_VPD_HIGH_TRIGGER]?.state) || null,
    humidifierVPDLow: parseFloat(entities[ENTITIES.CLOUDFORGE_T5_VPD_LOW_TRIGGER]?.state) || null,
    fanVPDHigh: parseFloat(entities[ENTITIES.EXHAUST_FAN_VPD_HIGH_TRIGGER]?.state) || null,
    fanVPDLow: parseFloat(entities[ENTITIES.EXHAUST_FAN_VPD_LOW_TRIGGER]?.state) || null,
    humidifierIntensity: parseFloat(entities[ENTITIES.HUMIDIFIER_ON_POWER]?.state) || null,
    fanPower: parseFloat(entities[ENTITIES.EXHAUST_FAN_ON_POWER]?.state) || null,
  };
  
  // Get previous actions
  const previousActions = getPreviousActions();
  
  return {
    phenology: {
      stage: phenologyStage?.id || 'seedling',
      daysInStage: phenologyStage?.daysInStage || 0,
      targets: phenologyStage?.targets || {
        vpdOptimal: 0.6,
        vpdMin: 0.4,
        vpdMax: 0.8,
        tempDay: 77,
        tempNight: 71,
        humidityOptimal: 70,
      },
    },
    acInfinitySettings,
    stats,
    historyTable,
    previousActions,
    history,
  };
}

/**
 * Validate and execute an autonomous action
 * 
 * @param {Object} action - The action from AI
 * @param {Function} callService - Home Assistant callService function
 * @returns {Promise<Object>} Execution result
 */
async function executeAutonomousAction(action, callService) {
  const limits = HARD_LIMITS[action.entity];
  
  // Check if entity is allowed
  if (!limits) {
    console.warn(`[AI-REVIEW] Entity not in allowed list: ${action.entity}`);
    return { 
      executed: false, 
      reason: `Entity ${action.entity} is not in the allowed list for autonomous changes`,
      blocked: true,
    };
  }
  
  // Validate current value is provided
  if (typeof action.currentValue !== 'number' || typeof action.newValue !== 'number') {
    return { 
      executed: false, 
      reason: 'Invalid current or new value (must be numbers)',
      blocked: true,
    };
  }
  
  // Calculate change
  const change = Math.abs(action.newValue - action.currentValue);
  
  // Validate change is within max allowed
  if (change > limits.maxChange) {
    console.warn(`[AI-REVIEW] Change ${change} exceeds max ${limits.maxChange} for ${action.entity}`);
    return { 
      executed: false, 
      reason: `Change of ${change.toFixed(2)} exceeds maximum allowed change of ${limits.maxChange} per day`,
      blocked: true,
    };
  }
  
  // Validate new value is within hard limits
  if (action.newValue < limits.min || action.newValue > limits.max) {
    console.warn(`[AI-REVIEW] Value ${action.newValue} outside limits [${limits.min}, ${limits.max}]`);
    return { 
      executed: false, 
      reason: `Value ${action.newValue} is outside allowed range [${limits.min}, ${limits.max}]`,
      blocked: true,
    };
  }
  
  // All validations passed - execute the change
  console.log(`[AI-REVIEW] Executing: ${action.entity} = ${action.newValue} (was ${action.currentValue})`);
  
  try {
    const result = await callService('number', 'set_value', {
      entity_id: action.entity,
      value: action.newValue,
    });
    
    if (result?.success) {
      console.log(`[AI-REVIEW] ✅ Successfully set ${action.entity} to ${action.newValue}`);
      return { 
        executed: true, 
        reason: 'Applied successfully',
        blocked: false,
      };
    } else {
      console.error(`[AI-REVIEW] ❌ Failed to set ${action.entity}:`, result?.error);
      return { 
        executed: false, 
        reason: result?.error || 'Unknown error from Home Assistant',
        blocked: false,
      };
    }
  } catch (error) {
    console.error(`[AI-REVIEW] ❌ Exception executing action:`, error);
    return { 
      executed: false, 
      reason: error.message || 'Exception during execution',
      blocked: false,
    };
  }
}

/**
 * Run the daily AI review
 * 
 * @param {Object} haContext - Home Assistant context
 * @param {Object} phenologyStage - Current phenology stage
 * @returns {Promise<Object>} Complete review results
 */
export async function runDailyAIReview(haContext, phenologyStage) {
  console.log('[AI-REVIEW] ========================================');
  console.log('[AI-REVIEW] Starting daily AI review...');
  console.log('[AI-REVIEW] ========================================');
  
  const startTime = Date.now();
  
  try {
    // 1. Gather all data
    console.log('[AI-REVIEW] Step 1: Gathering review data...');
    const reviewData = await gatherReviewData(haContext, phenologyStage);
    console.log('[AI-REVIEW] Data gathered:', {
      dataPoints: reviewData.stats.dataPoints,
      avgVPD: reviewData.stats.avgVPD,
      timeInRange: reviewData.stats.timeInRange,
    });
    
    // 2. Build prompt and call Claude
    console.log('[AI-REVIEW] Step 2: Calling Claude API...');
    const prompt = buildDailyReviewPrompt(reviewData);
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    console.log('[AI-REVIEW] Claude response received:', {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    });
    
    // 3. Parse AI response
    console.log('[AI-REVIEW] Step 3: Parsing AI response...');
    let aiDecision;
    try {
      // Extract JSON from response (handle potential markdown code blocks)
      let jsonText = response.content[0].text;
      const jsonMatch = jsonText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      aiDecision = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[AI-REVIEW] Failed to parse AI response:', parseError);
      console.log('[AI-REVIEW] Raw response:', response.content[0].text);
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // 4. Execute autonomous actions
    console.log('[AI-REVIEW] Step 4: Executing autonomous actions...');
    const executedActions = [];
    
    for (const action of aiDecision.autonomousActions || []) {
      console.log(`[AI-REVIEW] Processing action: ${action.entity} ${action.currentValue} → ${action.newValue}`);
      const result = await executeAutonomousAction(action, haContext.callService);
      executedActions.push({ 
        ...action, 
        ...result,
        timestamp: new Date().toISOString(),
      });
    }
    
    const executedCount = executedActions.filter(a => a.executed).length;
    const blockedCount = executedActions.filter(a => a.blocked).length;
    console.log(`[AI-REVIEW] Actions: ${executedCount} executed, ${blockedCount} blocked`);
    
    // 5. Build and store review
    const review = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      analysis: aiDecision.analysis,
      actionsExecuted: executedActions,
      recommendations: aiDecision.recommendations || [],
      predictions: aiDecision.predictions || {},
      learnings: aiDecision.learnings || [],
      stats: reviewData.stats,
      apiUsage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        estimatedCost: (
          (response.usage?.input_tokens || 0) * 0.003 / 1000 +
          (response.usage?.output_tokens || 0) * 0.015 / 1000
        ).toFixed(4),
      },
    };
    
    storeReview(review);
    
    console.log('[AI-REVIEW] ========================================');
    console.log('[AI-REVIEW] Daily review complete!');
    console.log('[AI-REVIEW] Summary:', aiDecision.analysis?.overnightSummary);
    console.log('[AI-REVIEW] ========================================');
    
    return review;
    
  } catch (error) {
    console.error('[AI-REVIEW] ❌ Daily review failed:', error);
    
    // Store failed review for debugging
    const failedReview = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      error: error.message,
      failed: true,
    };
    storeReview(failedReview);
    
    throw error;
  }
}

/**
 * Run on-demand analysis (user-requested)
 * 
 * @param {Object} haContext - Home Assistant context
 * @param {Object} phenologyStage - Current phenology stage
 * @param {string} userQuestion - Optional specific question from user
 * @returns {Promise<Object>} Analysis results
 */
export async function runOnDemandAnalysis(haContext, phenologyStage, userQuestion = null) {
  console.log('[AI-ANALYSIS] Running on-demand analysis...');
  
  const { entities } = haContext;
  
  // Get recent history (4 hours for on-demand)
  const history = await fetchEnvironmentHistory(4);
  const recentHistory = formatHistoryForPrompt(history);
  
  // Current state
  const current = {
    temperature: parseFloat(entities[ENTITIES.TEMPERATURE]?.state),
    humidity: parseFloat(entities[ENTITIES.HUMIDITY]?.state),
    vpd: parseFloat(entities[ENTITIES.VPD]?.state),
    lightState: entities[ENTITIES.LIGHT]?.state,
  };
  
  // AC Infinity settings
  const acInfinitySettings = {
    humidifierVPDTarget: parseFloat(entities[ENTITIES.CLOUDFORGE_T5_TARGET_VPD]?.state),
    humidifierVPDHigh: parseFloat(entities[ENTITIES.CLOUDFORGE_T5_VPD_HIGH_TRIGGER]?.state),
    fanVPDHigh: parseFloat(entities[ENTITIES.EXHAUST_FAN_VPD_HIGH_TRIGGER]?.state),
  };
  
  const prompt = buildOnDemandAnalysisPrompt({
    current,
    phenology: phenologyStage,
    acInfinitySettings,
    recentHistory,
    userQuestion,
  });
  
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  });
  
  return {
    analysis: response.content[0].text,
    timestamp: new Date().toISOString(),
    apiUsage: {
      inputTokens: response.usage?.input_tokens,
      outputTokens: response.usage?.output_tokens,
    },
  };
}
```

**SUCCESS CRITERIA:**
- File created at `dashboard/src/services/daily-ai-review.js`
- Exports: `runDailyAIReview`, `runOnDemandAnalysis`, `getStoredReviews`
- No syntax errors
- HARD_LIMITS matches entities from Step 1

---

## STEP 6: CREATE useAIReview HOOK

**Goal:** Create React hook that manages the daily review lifecycle.

### 6.1 Create the Hook

```
ACTION: Create dashboard/src/hooks/useAIReview.js
```

```javascript
/**
 * useAIReview Hook
 * 
 * Manages the daily AI review lifecycle:
 * - Schedules daily review at 5:30 AM
 * - Provides manual trigger
 * - Tracks review state and history
 * - Handles on-demand analysis
 * 
 * @fileoverview React hook for AI review functionality
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useHomeAssistant } from '../context/HomeAssistantContext';
import { 
  runDailyAIReview, 
  runOnDemandAnalysis, 
  getStoredReviews 
} from '../services/daily-ai-review.js';

/**
 * Hook for managing AI reviews
 * 
 * @param {Object} options - Hook options
 * @param {Object} options.phenologyStage - Current phenology stage with targets
 * @param {number} options.reviewHour - Hour to run daily review (default: 5)
 * @param {number} options.reviewMinute - Minute to run daily review (default: 30)
 * @returns {Object} Review state and controls
 */
export function useAIReview({ 
  phenologyStage = null,
  reviewHour = 5,
  reviewMinute = 30,
} = {}) {
  const haContext = useHomeAssistant();
  
  // State
  const [lastReview, setLastReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [onDemandResult, setOnDemandResult] = useState(null);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  
  // Track if we've run today
  const hasRunToday = useRef(false);
  const lastCheckDate = useRef(null);
  
  // Load stored reviews on mount
  useEffect(() => {
    const stored = getStoredReviews();
    setReviews(stored);
    
    // Check if we have a review from today
    if (stored.length > 0) {
      const latestReview = stored[0];
      const reviewDate = new Date(latestReview.timestamp).toDateString();
      const today = new Date().toDateString();
      
      if (reviewDate === today && !latestReview.failed) {
        setLastReview(latestReview);
        hasRunToday.current = true;
      }
    }
  }, []);
  
  /**
   * Run the daily review manually
   */
  const triggerDailyReview = useCallback(async () => {
    if (isReviewing) {
      console.log('[useAIReview] Review already in progress');
      return null;
    }
    
    if (!haContext?.entities || !haContext?.callService) {
      setError('Home Assistant not connected');
      return null;
    }
    
    setIsReviewing(true);
    setError(null);
    
    try {
      console.log('[useAIReview] Triggering daily review...');
      const review = await runDailyAIReview(haContext, phenologyStage);
      
      setLastReview(review);
      setReviews(getStoredReviews());
      hasRunToday.current = true;
      
      return review;
    } catch (err) {
      console.error('[useAIReview] Review failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsReviewing(false);
    }
  }, [haContext, phenologyStage, isReviewing]);
  
  /**
   * Run on-demand analysis
   */
  const requestAnalysis = useCallback(async (question = null) => {
    if (isAnalyzing) {
      console.log('[useAIReview] Analysis already in progress');
      return null;
    }
    
    if (!haContext?.entities) {
      setError('Home Assistant not connected');
      return null;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      console.log('[useAIReview] Running on-demand analysis...');
      const result = await runOnDemandAnalysis(haContext, phenologyStage, question);
      
      setOnDemandResult(result);
      return result;
    } catch (err) {
      console.error('[useAIReview] Analysis failed:', err);
      setError(err.message);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [haContext, phenologyStage, isAnalyzing]);
  
  /**
   * Clear on-demand result
   */
  const clearAnalysis = useCallback(() => {
    setOnDemandResult(null);
  }, []);
  
  /**
   * Scheduled daily review check
   */
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const today = now.toDateString();
      
      // Reset hasRunToday at midnight
      if (lastCheckDate.current !== today) {
        lastCheckDate.current = today;
        
        // Check if we have a review from today
        const stored = getStoredReviews();
        if (stored.length > 0) {
          const reviewDate = new Date(stored[0].timestamp).toDateString();
          hasRunToday.current = reviewDate === today && !stored[0].failed;
        } else {
          hasRunToday.current = false;
        }
      }
      
      // Check if it's time for daily review
      const hour = now.getHours();
      const minute = now.getMinutes();
      
      if (
        hour === reviewHour && 
        minute >= reviewMinute && 
        minute < reviewMinute + 5 && 
        !hasRunToday.current &&
        !isReviewing &&
        haContext?.entities
      ) {
        console.log('[useAIReview] Scheduled review time - triggering...');
        triggerDailyReview();
      }
    };
    
    // Check immediately
    checkSchedule();
    
    // Check every minute
    const interval = setInterval(checkSchedule, 60000);
    
    return () => clearInterval(interval);
  }, [reviewHour, reviewMinute, triggerDailyReview, isReviewing, haContext]);
  
  return {
    // State
    lastReview,
    isReviewing,
    isAnalyzing,
    onDemandResult,
    error,
    reviews,
    
    // Actions
    triggerDailyReview,
    requestAnalysis,
    clearAnalysis,
    
    // Computed
    hasReviewToday: hasRunToday.current,
    lastReviewTime: lastReview?.timestamp ? new Date(lastReview.timestamp) : null,
    actionsExecutedToday: lastReview?.actionsExecuted?.filter(a => a.executed)?.length || 0,
  };
}

export default useAIReview;
```

**SUCCESS CRITERIA:**
- File created at `dashboard/src/hooks/useAIReview.js`
- Exports: `useAIReview` (default and named)
- Uses `useHomeAssistant` from existing context
- No syntax errors

---

## STEP 7: CREATE UI COMPONENTS

**Goal:** Create the UI components for displaying AI review status and results.

### 7.1 Create AIReviewBadge Component

```
ACTION: Create dashboard/src/components/AIReviewBadge.jsx
```

```jsx
/**
 * AI Review Badge
 * 
 * Small status indicator showing AI review state.
 * Displays in header to show if daily review has run.
 */

import React from 'react';
import { Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function AIReviewBadge({ 
  lastReview, 
  isReviewing, 
  hasReviewToday,
  error 
}) {
  // Currently reviewing
  if (isReviewing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
        <span className="text-xs text-purple-400">AI Reviewing...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span className="text-xs text-red-400">AI Error</span>
      </div>
    );
  }
  
  // Has review today
  if (hasReviewToday && lastReview) {
    const actionsCount = lastReview.actionsExecuted?.filter(a => a.executed)?.length || 0;
    const hoursAgo = Math.floor((Date.now() - new Date(lastReview.timestamp).getTime()) / 3600000);
    
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
        <CheckCircle className="w-3 h-3 text-green-400" />
        <span className="text-xs text-green-400">
          AI: {hoursAgo}h ago
          {actionsCount > 0 && ` • ${actionsCount} changes`}
        </span>
      </div>
    );
  }
  
  // No review yet today
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-700/50 border border-zinc-600/30 rounded-full">
      <Brain className="w-3 h-3 text-zinc-400" />
      <span className="text-xs text-zinc-400">AI: Pending</span>
    </div>
  );
}

export default AIReviewBadge;
```

### 7.2 Create AIReviewPanel Component

```
ACTION: Create dashboard/src/components/AIReviewPanel.jsx
```

```jsx
/**
 * AI Review Panel
 * 
 * Full panel showing daily review results, actions taken,
 * recommendations, and on-demand analysis interface.
 */

import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  Lightbulb, 
  TrendingUp, 
  BookOpen,
  Play,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export function AIReviewPanel({ 
  lastReview, 
  isReviewing,
  isAnalyzing,
  onDemandResult,
  onTriggerReview,
  onRequestAnalysis,
  onClearAnalysis,
  error,
  reviews = []
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [question, setQuestion] = useState('');
  
  const handleAskAI = () => {
    if (question.trim()) {
      onRequestAnalysis(question.trim());
      setQuestion('');
    } else {
      onRequestAnalysis(null);
    }
  };
  
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium">AI Grow Advisor</h3>
        </div>
        
        <button
          onClick={onTriggerReview}
          disabled={isReviewing}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-lg text-sm transition-colors"
        >
          {isReviewing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reviewing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Review
            </>
          )}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/30">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}
      
      {/* On-Demand Analysis Section */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Ask about your grow... (or leave blank for general analysis)"
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleAskAI}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-lg text-sm transition-colors"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Ask AI
          </button>
        </div>
        
        {/* On-Demand Result */}
        {onDemandResult && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-blue-400">
                {new Date(onDemandResult.timestamp).toLocaleTimeString()}
              </span>
              <button 
                onClick={onClearAnalysis}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
              {onDemandResult.analysis}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Tokens: {onDemandResult.apiUsage?.inputTokens + onDemandResult.apiUsage?.outputTokens}
            </p>
          </div>
        )}
      </div>
      
      {/* Main Content - Last Review */}
      {lastReview && !lastReview.failed ? (
        <div className="p-4 space-y-4">
          {/* Review Timestamp */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lastReview.timestamp).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ~${lastReview.apiUsage?.estimatedCost || '0.00'}
            </div>
          </div>
          
          {/* Summary */}
          <div className="p-3 bg-slate-700/50 rounded-lg">
            <p className="text-sm text-zinc-300">
              {lastReview.analysis?.overnightSummary || 'No summary available'}
            </p>
            {lastReview.analysis?.stabilityScore && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-zinc-500">Stability:</span>
                <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${lastReview.analysis.stabilityScore * 10}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400">
                  {lastReview.analysis.stabilityScore}/10
                </span>
              </div>
            )}
          </div>
          
          {/* Actions Executed */}
          {lastReview.actionsExecuted?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium">Actions Taken</h4>
              </div>
              <div className="space-y-2">
                {lastReview.actionsExecuted.map((action, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded-lg text-xs ${
                      action.executed 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {action.entity?.split('.')[1]?.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {action.executed ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span className={action.executed ? 'text-green-400' : 'text-red-400'}>
                          {action.currentValue} → {action.newValue}
                        </span>
                      </div>
                    </div>
                    <p className="text-zinc-400 mt-1">{action.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {lastReview.recommendations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-medium">Recommendations</h4>
              </div>
              <div className="space-y-2">
                {lastReview.recommendations.map((rec, i) => (
                  <div key={i} className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-yellow-400">{rec.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-zinc-300">{rec.suggestion}</p>
                    <p className="text-zinc-500 mt-1">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Predictions */}
          {lastReview.predictions?.todayOutlook && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium">Today's Outlook</h4>
              </div>
              <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs">
                <p className="text-zinc-300">{lastReview.predictions.todayOutlook}</p>
                {lastReview.predictions.potentialConcerns?.length > 0 && (
                  <div className="mt-2">
                    {lastReview.predictions.potentialConcerns.map((concern, i) => (
                      <p key={i} className="text-yellow-400">⚠️ {concern}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Learnings */}
          {lastReview.learnings?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-medium">AI Learnings</h4>
              </div>
              <div className="space-y-1">
                {lastReview.learnings.map((learning, i) => (
                  <p key={i} className="text-xs text-zinc-400">• {learning}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Stats */}
          {lastReview.stats && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-700">
              <div className="text-center p-2 bg-slate-700/30 rounded">
                <p className="text-lg font-medium">{lastReview.stats.avgVPD}</p>
                <p className="text-xs text-zinc-500">Avg VPD</p>
              </div>
              <div className="text-center p-2 bg-slate-700/30 rounded">
                <p className="text-lg font-medium">{lastReview.stats.timeInRange}%</p>
                <p className="text-xs text-zinc-500">In Range</p>
              </div>
              <div className="text-center p-2 bg-slate-700/30 rounded">
                <p className="text-lg font-medium">{lastReview.stats.dataPoints}</p>
                <p className="text-xs text-zinc-500">Readings</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No review yet today</p>
          <p className="text-xs text-zinc-500 mt-1">
            Daily review runs at 5:30 AM, or click "Run Review" above
          </p>
        </div>
      )}
      
      {/* Review History Toggle */}
      {reviews.length > 1 && (
        <div className="border-t border-slate-700">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-3 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-300 hover:bg-slate-700/30 transition-colors"
          >
            <span>Previous Reviews ({reviews.length - 1})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showHistory && (
            <div className="p-4 pt-0 max-h-64 overflow-y-auto space-y-2">
              {reviews.slice(1, 8).map((review, i) => (
                <div key={i} className="p-2 bg-slate-700/30 rounded text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>{new Date(review.timestamp).toLocaleDateString()}</span>
                    <span>{review.actionsExecuted?.filter(a => a.executed)?.length || 0} actions</span>
                  </div>
                  {review.analysis?.overnightSummary && (
                    <p className="text-zinc-400 mt-1 line-clamp-2">
                      {review.analysis.overnightSummary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIReviewPanel;
```

### 7.3 Export Components

```
ACTION: Update dashboard/src/components/index.js to export new components

Add these lines:
export { AIReviewBadge } from './AIReviewBadge';
export { AIReviewPanel } from './AIReviewPanel';
```

**SUCCESS CRITERIA:**
- Both component files created
- Components exported from index.js
- No syntax errors
- Lucide-react icons used (verify lucide-react is in package.json)

---

## STEP 8: INTEGRATE INTO APP.JSX

**Goal:** Add AI review components to the main dashboard.

### 8.1 Read Current App.jsx

```
ACTION: Read dashboard/src/App.jsx to understand current structure
```

### 8.2 Add AI Review Hook and Components

```
ACTION: Update dashboard/src/App.jsx with the following changes:

1. Add import at top:
```jsx
import { useAIReview } from './hooks/useAIReview';
import { AIReviewBadge, AIReviewPanel } from './components';
```

2. Inside the App component, add the hook (after other hooks):
```jsx
// AI Review
const {
  lastReview,
  isReviewing,
  isAnalyzing,
  onDemandResult,
  error: aiError,
  reviews,
  triggerDailyReview,
  requestAnalysis,
  clearAnalysis,
  hasReviewToday,
} = useAIReview({
  phenologyStage: currentStage,
  reviewHour: 5,
  reviewMinute: 30,
});
```

3. Add AIReviewBadge to header (near connection status):
```jsx
<AIReviewBadge 
  lastReview={lastReview}
  isReviewing={isReviewing}
  hasReviewToday={hasReviewToday}
  error={aiError}
/>
```

4. Add AIReviewPanel to the main content (suggest adding as a new section):
```jsx
{/* AI Review Panel */}
<div className="lg:col-span-3">
  <AIReviewPanel
    lastReview={lastReview}
    isReviewing={isReviewing}
    isAnalyzing={isAnalyzing}
    onDemandResult={onDemandResult}
    onTriggerReview={triggerDailyReview}
    onRequestAnalysis={requestAnalysis}
    onClearAnalysis={clearAnalysis}
    error={aiError}
    reviews={reviews}
  />
</div>
```
```

**SUCCESS CRITERIA:**
- App.jsx updated without breaking existing functionality
- AI Review badge appears in header
- AI Review panel appears in dashboard
- No console errors on load

---

## STEP 9: ADD ON-DEMAND ANALYSIS

**Goal:** Verify on-demand analysis works correctly.

### 9.1 Test On-Demand Analysis

```
ACTION: With the app running:

1. Open browser console
2. Click "Ask AI" button without entering a question
3. Verify:
   - Loading state shows
   - Response appears
   - No errors in console
   - Token count displays

4. Enter a specific question like "Is my VPD stable?"
5. Verify:
   - Question-specific response
   - Clear button works
```

### 9.2 Verify Environment Variables

```
ACTION: Check that these environment variables are set in .env:

VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_HA_URL=http://100.65.202.84:8123
VITE_HA_TOKEN=eyJ...
```

**SUCCESS CRITERIA:**
- On-demand analysis returns meaningful response
- API key is being used (check network tab for Anthropic requests)
- No authentication errors

---

## STEP 10: FINAL VERIFICATION

**Goal:** Complete end-to-end verification of the implementation.

### 10.1 Verify Using hass-mcp

```
ACTION: Use hass-mcp to verify current entity states:

1. Get current VPD settings:
   - number.cloudforge_t5_target_vpd
   - number.cloudforge_t5_vpd_high_trigger
   
2. Record values

3. Run a daily review (click "Run Review")

4. Check if any autonomous actions were taken

5. Verify entities again - did values change if AI made changes?
```

### 10.2 Verify Safety Guardrails

```
ACTION: Check that hard limits are enforced:

1. In browser console, check stored reviews:
   localStorage.getItem('ai_daily_reviews')

2. Look for any "blocked" actions with reasons

3. Verify that blocked actions show:
   - "Change exceeds maximum" if too large
   - "Outside allowed range" if beyond limits
```

### 10.3 Verify Cost Tracking

```
ACTION: Check API usage is being tracked:

1. Look at the AI Review Panel
2. Find the cost estimate (should show ~$0.01-0.02 per review)
3. Verify token counts are displayed
```

### 10.4 Final Checklist

```
[ ] All entities from Step 1 are accessible
[ ] entities.js has all VPD entities
[ ] History service fetches data successfully
[ ] Daily review prompt is well-formed
[ ] AI service executes and parses responses
[ ] Hook schedules reviews at 5:30 AM
[ ] Manual trigger works
[ ] On-demand analysis works
[ ] UI components render correctly
[ ] Actions are logged with reasons
[ ] Hard limits prevent excessive changes
[ ] Cost is tracked and displayed
[ ] Previous reviews are stored (localStorage)
[ ] No console errors
```

---

## 📁 FILES CREATED/MODIFIED

### New Files:
1. `dashboard/src/services/history-service.js`
2. `dashboard/src/prompts/daily-review-prompt.js`
3. `dashboard/src/services/daily-ai-review.js`
4. `dashboard/src/hooks/useAIReview.js`
5. `dashboard/src/components/AIReviewBadge.jsx`
6. `dashboard/src/components/AIReviewPanel.jsx`

### Modified Files:
1. `dashboard/src/types/entities.js` (add VPD entities)
2. `dashboard/src/components/index.js` (export new components)
3. `dashboard/src/App.jsx` (integrate hook and components)

---

## 🎯 SUCCESS CRITERIA SUMMARY

| Feature | Verification |
|---------|--------------|
| Daily review runs at 5:30 AM | Check hasRunToday flag after scheduled time |
| Manual trigger works | Click "Run Review", see response |
| On-demand analysis works | Click "Ask AI", see response |
| AI can modify VPD settings | Check entity values after review with changes |
| Hard limits enforced | Attempt large change, verify blocked |
| Actions logged | Check localStorage for ai_daily_reviews |
| Cost tracked | See ~$0.01-0.02 per review |
| UI shows status | Badge and panel render correctly |

---

## ⚠️ TROUBLESHOOTING

### "Entity not found" errors
→ Use hass-mcp to verify entity IDs match exactly

### "Failed to parse AI response"
→ Check Claude API response in console, may need prompt adjustment

### "Home Assistant not connected"
→ Verify VITE_HA_URL and VITE_HA_TOKEN in .env

### "API key invalid"
→ Verify VITE_ANTHROPIC_API_KEY in .env

### Actions blocked unexpectedly
→ Check HARD_LIMITS in daily-ai-review.js match intended ranges

---

**END OF IMPLEMENTATION GUIDE**
