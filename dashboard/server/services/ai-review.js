/**
 * AI Review Service
 * 
 * Core logic for daily AI reviews with Claude API.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDailyReviewPrompt } from '../prompts/daily-review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Anthropic client lazily (after env vars are loaded)
let anthropicClient = null;
function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('VITE_ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({
      apiKey: apiKey,
    });
  }
  return anthropicClient;
}

// Entity IDs
const ENTITIES = {
  TEMPERATURE: 'sensor.ac_infinity_controller_69_pro_temperature',
  HUMIDITY: 'sensor.ac_infinity_controller_69_pro_humidity',
  VPD: 'sensor.ac_infinity_controller_69_pro_vpd',
  LIGHT: 'switch.light',
  CLOUDFORGE_TARGET_VPD: 'number.cloudforge_t5_target_vpd',
  CLOUDFORGE_VPD_HIGH: 'number.cloudforge_t5_vpd_high_trigger',
  CLOUDFORGE_VPD_LOW: 'number.cloudforge_t5_vpd_low_trigger',
  EXHAUST_FAN_VPD_HIGH: 'number.exhaust_fan_vpd_high_trigger',
  EXHAUST_FAN_VPD_LOW: 'number.exhaust_fan_vpd_low_trigger',
};

// Hard limits for autonomous actions - AI cannot exceed these
const HARD_LIMITS = {
  [ENTITIES.CLOUDFORGE_TARGET_VPD]: { min: 0.3, max: 1.2, maxChange: 0.15 },
  [ENTITIES.CLOUDFORGE_VPD_HIGH]: { min: 0.5, max: 1.4, maxChange: 0.15 },
  [ENTITIES.CLOUDFORGE_VPD_LOW]: { min: 0.1, max: 0.8, maxChange: 0.1 },
  [ENTITIES.EXHAUST_FAN_VPD_HIGH]: { min: 0.6, max: 1.5, maxChange: 0.15 },
  [ENTITIES.EXHAUST_FAN_VPD_LOW]: { min: 0.2, max: 0.9, maxChange: 0.1 },
};

// Phenology stage targets (default to seedling - can be made configurable later)
const PHENOLOGY = {
  stage: 'seedling',
  daysInStage: 0,
  targets: {
    vpdOptimal: 0.6,
    vpdMin: 0.4,
    vpdMax: 0.8,
    tempDay: 77,
    tempNight: 71,
    humidityOptimal: 70,
  },
};

/**
 * Get stored reviews from JSON file
 */
export function getStoredReviews() {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[STORAGE] Error reading reviews:', error.message);
    return [];
  }
}

/**
 * Store a review to JSON file
 */
function storeReview(review) {
  const reviews = getStoredReviews();
  reviews.unshift(review);
  // Keep last 30 days
  const trimmed = reviews.slice(0, 30);
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(trimmed, null, 2));
  console.log(`[STORAGE] Saved review, total stored: ${trimmed.length}`);
}

/**
 * Run the daily AI review
 */
export async function runDailyReview(haClient) {
  console.log('[AI-REVIEW] Starting daily review...');
  const startTime = Date.now();
  
  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: GATHER DATA
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 1: Gathering 24h sensor history...');
    
    // Ensure HA client is connected
    if (!haClient.isConnected()) {
      await haClient.connect();
    }
    
    const entities = haClient.getEntities();
    
    // Fetch 24h history for each sensor
    const [tempHistory, humHistory, vpdHistory] = await Promise.all([
      haClient.fetchHistory(ENTITIES.TEMPERATURE, 24),
      haClient.fetchHistory(ENTITIES.HUMIDITY, 24),
      haClient.fetchHistory(ENTITIES.VPD, 24),
    ]);
    
    // Process history into usable format
    const processHistory = (data) => data
      .filter(e => e.state !== 'unavailable' && e.state !== 'unknown' && e.state !== 'None')
      .map(e => ({
        timestamp: new Date(e.last_changed).getTime(),
        value: parseFloat(e.state),
      }))
      .filter(e => !isNaN(e.value) && isFinite(e.value));
    
    const history = {
      temperature: processHistory(tempHistory),
      humidity: processHistory(humHistory),
      vpd: processHistory(vpdHistory),
    };
    
    console.log(`[AI-REVIEW] History: ${history.vpd.length} VPD, ${history.temperature.length} temp, ${history.humidity.length} humidity readings`);
    
    // Calculate statistics
    const calcStats = (arr) => {
      if (!arr.length) return { avg: 0, min: 0, max: 0 };
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
    
    // Calculate time in target range
    const vpdInRange = history.vpd.filter(
      e => e.value >= PHENOLOGY.targets.vpdMin && e.value <= PHENOLOGY.targets.vpdMax
    );
    const timeInRange = history.vpd.length > 0
      ? Math.round((vpdInRange.length / history.vpd.length) * 100)
      : 0;
    
    const stats = {
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
    
    console.log('[AI-REVIEW] Stats:', stats);
    
    // Get current AC Infinity VPD settings
    const acInfinitySettings = {
      humidifierVPDTarget: parseFloat(entities[ENTITIES.CLOUDFORGE_TARGET_VPD]?.state) || null,
      humidifierVPDHigh: parseFloat(entities[ENTITIES.CLOUDFORGE_VPD_HIGH]?.state) || null,
      humidifierVPDLow: parseFloat(entities[ENTITIES.CLOUDFORGE_VPD_LOW]?.state) || null,
      fanVPDHigh: parseFloat(entities[ENTITIES.EXHAUST_FAN_VPD_HIGH]?.state) || null,
      fanVPDLow: parseFloat(entities[ENTITIES.EXHAUST_FAN_VPD_LOW]?.state) || null,
    };
    
    console.log('[AI-REVIEW] AC Infinity settings:', acInfinitySettings);
    
    // Get previous actions for context
    const previousActions = getStoredReviews()
      .slice(0, 7)
      .flatMap(r => (r.actionsExecuted || []).map(a => ({
        date: new Date(r.timestamp).toLocaleDateString(),
        action: `${a.entity?.split('.')[1]}: ${a.currentValue} → ${a.newValue}`,
        outcome: a.executed ? 'Applied' : `Blocked: ${a.reason}`,
      })));
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: CALL CLAUDE API
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 2: Calling Claude API...');
    
    const prompt = buildDailyReviewPrompt({
      phenology: PHENOLOGY,
      acInfinitySettings,
      stats,
      historyTable: formatHistoryTable(history),
      previousActions,
    });
    
    const anthropic = getAnthropicClient();
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    console.log(`[AI-REVIEW] Claude response: ${response.usage?.input_tokens} in, ${response.usage?.output_tokens} out tokens`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: PARSE AI RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 3: Parsing AI response...');
    
    let aiDecision;
    try {
      let jsonText = response.content[0].text;
      
      // Handle potential markdown code blocks
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      aiDecision = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[AI-REVIEW] ❌ Failed to parse AI response as JSON');
      console.error('[AI-REVIEW] Raw response:', response.content[0].text.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
    
    console.log('[AI-REVIEW] AI analysis:', aiDecision.analysis?.overnightSummary);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 4: EXECUTE AUTONOMOUS ACTIONS
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 4: Executing autonomous actions...');
    
    const executedActions = [];
    
    for (const action of aiDecision.autonomousActions || []) {
      console.log(`[AI-REVIEW] Processing: ${action.entity} (${action.currentValue} → ${action.newValue})`);
      const result = await executeAutonomousAction(action, haClient);
      executedActions.push({
        ...action,
        ...result,
        timestamp: new Date().toISOString(),
      });
    }
    
    const successCount = executedActions.filter(a => a.executed).length;
    const blockedCount = executedActions.filter(a => a.blocked).length;
    console.log(`[AI-REVIEW] Actions: ${successCount} executed, ${blockedCount} blocked, ${executedActions.length - successCount - blockedCount} failed`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: STORE AND RETURN REVIEW
    // ═══════════════════════════════════════════════════════════════
    
    const review = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      analysis: aiDecision.analysis,
      actionsExecuted: executedActions,
      recommendations: aiDecision.recommendations || [],
      predictions: aiDecision.predictions || {},
      learnings: aiDecision.learnings || [],
      stats,
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
    
    return review;
    
  } catch (error) {
    console.error('[AI-REVIEW] ❌ Review failed:', error.message);
    
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
 * Execute a single autonomous action with validation
 */
async function executeAutonomousAction(action, haClient) {
  const limits = HARD_LIMITS[action.entity];
  
  // Validate entity is in allowed list
  if (!limits) {
    console.log(`[AI-REVIEW] ⚠️ Entity not allowed: ${action.entity}`);
    return {
      executed: false,
      reason: `Entity ${action.entity} is not in the allowed list`,
      blocked: true,
    };
  }
  
  // Validate values are numbers
  if (typeof action.currentValue !== 'number' || typeof action.newValue !== 'number') {
    return {
      executed: false,
      reason: 'Invalid current or new value (must be numbers)',
      blocked: true,
    };
  }
  
  // Validate change size
  const change = Math.abs(action.newValue - action.currentValue);
  if (change > limits.maxChange) {
    console.log(`[AI-REVIEW] ⚠️ Change too large: ${change} > ${limits.maxChange}`);
    return {
      executed: false,
      reason: `Change of ${change.toFixed(2)} kPa exceeds max allowed ${limits.maxChange} kPa per day`,
      blocked: true,
    };
  }
  
  // Validate new value is within hard limits
  if (action.newValue < limits.min || action.newValue > limits.max) {
    console.log(`[AI-REVIEW] ⚠️ Value out of range: ${action.newValue} not in [${limits.min}, ${limits.max}]`);
    return {
      executed: false,
      reason: `Value ${action.newValue} is outside allowed range [${limits.min}, ${limits.max}]`,
      blocked: true,
    };
  }
  
  // All validations passed - execute!
  console.log(`[AI-REVIEW] ✅ Executing: ${action.entity} = ${action.newValue}`);
  
  const result = await haClient.callService('number', 'set_value', {
    entity_id: action.entity,
    value: action.newValue,
  });
  
  return {
    executed: result.success,
    reason: result.success ? 'Applied successfully' : result.error,
    blocked: false,
  };
}

/**
 * Format history data as markdown table for AI prompt
 */
function formatHistoryTable(history) {
  // Sample every 30 minutes to keep prompt size reasonable
  const intervalMs = 30 * 60 * 1000;
  
  let output = 'Time | Temp (°F) | Humidity (%) | VPD (kPa)\n';
  output += '--- | --- | --- | ---\n';
  
  // Get unique timestamps (rounded to interval)
  const allTimestamps = [...new Set([
    ...history.vpd.map(e => Math.floor(e.timestamp / intervalMs) * intervalMs),
  ])].sort();
  
  // Limit to last 48 entries (24 hours at 30-min intervals)
  const recentTimestamps = allTimestamps.slice(-48);
  
  for (const ts of recentTimestamps) {
    const time = new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    const findNearest = (arr) => arr.find(e => Math.abs(e.timestamp - ts) < intervalMs);
    
    const temp = findNearest(history.temperature)?.value?.toFixed(1) || '-';
    const hum = findNearest(history.humidity)?.value?.toFixed(1) || '-';
    const vpd = findNearest(history.vpd)?.value?.toFixed(2) || '-';
    
    output += `${time} | ${temp} | ${hum} | ${vpd}\n`;
  }
  
  return output;
}
