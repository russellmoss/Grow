/**
 * Environment Analysis Prompts
 * @file src/prompts/environment-analysis.js
 * 
 * System prompts and parsing functions for Claude AI environmental analysis
 */

/**
 * Build the system prompt for environmental analysis
 * @param {Object} stageTargets - Current growth stage targets
 * @param {Object} controllerState - Current controller state (optional)
 * @returns {string} System prompt for Claude
 */
export function buildSystemPrompt(stageTargets, controllerState = null) {
  const stageName = stageTargets?.name || stageTargets?.stageName || 'Seedling';
  const tempMin = stageTargets?.temperature?.day?.min || stageTargets?.temp?.min || 75;
  const tempMax = stageTargets?.temperature?.day?.max || stageTargets?.temp?.max || 82;
  const tempOptimal = stageTargets?.temperature?.day?.target || stageTargets?.temp?.optimal || 78;
  const humidityMin = stageTargets?.humidity?.min || 65;
  const humidityMax = stageTargets?.humidity?.max || 75;
  const humidityOptimal = stageTargets?.humidity?.optimal || 70;
  const vpdMin = stageTargets?.vpd?.min || 0.4;
  const vpdMax = stageTargets?.vpd?.max || 0.8;
  const vpdOptimal = stageTargets?.vpd?.optimal || 0.6;

  return `You are an expert horticultural environmental control AI AND system analyst for an indoor grow tent with an intelligent automation system.

## Your Environment
- Location: Basement in Albany, NY (cold/dry climate)
- Baseline humidity: ~30% (CRITICAL CONSTRAINT - very dry basement)
- Current growth stage: ${stageName}

## Your Equipment
The system can control these devices via Home Assistant:
1. **Grow Light** (switch.light) - 20/4 schedule (on 6AM, off 2AM) - Schedule controlled
2. **Heater** (climate.tent_heater) - Oil radiator, controlled by dashboard
3. **Humidifier** (select.cloudforge_t5_active_mode) - CloudForge T5, controlled by AC Infinity app
4. **Exhaust Fan** (select.exhaust_fan_active_mode) - AC Infinity Cloudline T6, controlled by AC Infinity app

## Control Architecture
- **Dashboard Controls:** Heater (temperature), Light (schedule)
- **AC Infinity App Controls:** Humidifier (VPD mode), Exhaust Fan (VPD mode)
- **Dashboard Monitors:** All sensors, provides recommendations for AC Infinity adjustments

When analyzing problems:
- For temperature issues: Suggest specific heater adjustments (dashboard will execute)
- For VPD/humidity issues: Provide recommendations for AC Infinity app adjustments (user must do manually)

## Intelligent Control System
An EnvironmentController runs every 5 minutes and:
- Analyzes current state vs targets
- Detects problems (TEMP_HIGH, TEMP_LOW, VPD_HIGH, VPD_LOW, etc.) with severity scores
- Generates ACTIONS for dashboard-controlled devices (heater)
- Generates RECOMMENDATIONS for AC Infinity-controlled devices (humidifier, exhaust fan)
- Executes heater actions via Home Assistant
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
- Temperature: ${tempMin}-${tempMax}°F (optimal: ${tempOptimal}°F)
- Humidity: ${humidityMin}-${humidityMax}% (optimal: ${humidityOptimal}%)
- VPD: ${vpdMin}-${vpdMax} kPa (optimal: ${vpdOptimal} kPa)

## Response Format
Respond with ONLY valid JSON (no markdown, no explanation outside JSON):
{
  "status": "optimal" | "caution" | "critical",
  "summary": "1-2 sentence assessment",
  "controllerAnalysis": {
    "decisionCorrect": true,
    "decisionExplanation": "Why the controller's decision was correct/incorrect",
    "coordinationQuality": "excellent" | "good" | "needs_improvement",
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
 * @param {Object} sensorData - Current readings { temp, humidity, vpd }
 * @param {Object} targets - Target values from stage
 * @param {Object} actuatorStates - Current actuator states
 * @param {Object} controllerState - Controller state (optional)
 * @param {Array} actionHistory - Action history (optional)
 * @returns {string} Formatted user prompt
 */
export function buildAnalysisPrompt(sensorData, targets, actuatorStates = {}, controllerState = null, actionHistory = []) {
  const tempOptimal = targets?.temperature?.day?.target || targets?.temp?.optimal || 78;
  const humidityOptimal = targets?.humidity?.optimal || 70;
  const vpdOptimal = targets?.vpd?.optimal || 0.6;

  const tempDelta = sensorData.temp - tempOptimal;
  const humidityDelta = sensorData.humidity - humidityOptimal;
  const vpdDelta = sensorData.vpd - vpdOptimal;

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
- Temperature: ${tempDelta > 0 ? '+' : ''}${tempDelta.toFixed(1)}°F (target: ${tempOptimal}°F)
- Humidity: ${humidityDelta > 0 ? '+' : ''}${humidityDelta.toFixed(1)}% (target: ${humidityOptimal}%)
- VPD: ${vpdDelta > 0 ? '+' : ''}${vpdDelta.toFixed(2)} kPa (target: ${vpdOptimal} kPa)

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

    // Validate and return with defaults
    return {
      status: ['optimal', 'caution', 'critical'].includes(parsed.status) ? parsed.status : 'caution',
      summary: parsed.summary || 'Analysis complete',
      controllerAnalysis: parsed.controllerAnalysis || null,
      variableRelationships: parsed.variableRelationships || null,
      optimizationSuggestions: Array.isArray(parsed.optimizationSuggestions) ? parsed.optimizationSuggestions : [],
      predictions: Array.isArray(parsed.predictions) ? parsed.predictions : [],
      reasoning: parsed.reasoning || '',
      problems: Array.isArray(parsed.problems) ? parsed.problems : [],
    };
  } catch (error) {
    console.error('[AI-PROMPTS] Parse error:', error.message);
    return {
      status: 'caution',
      summary: 'Could not parse AI response',
      controllerAnalysis: null,
      variableRelationships: null,
      optimizationSuggestions: [],
      predictions: [],
      reasoning: responseText.slice(0, 500),
      problems: [],
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
