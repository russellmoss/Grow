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
  const stats = calculateHistoryStats(history, phenologyStage?.vpd);
  
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
  
  // Extract phenology targets
  const phenologyTargets = {
    vpdOptimal: phenologyStage?.vpd?.optimal || 0.6,
    vpdMin: phenologyStage?.vpd?.min || 0.4,
    vpdMax: phenologyStage?.vpd?.max || 0.8,
    tempDay: phenologyStage?.temperature?.day?.target || 77,
    tempNight: phenologyStage?.temperature?.night?.target || 71,
    humidityOptimal: phenologyStage?.humidity?.optimal || 70,
  };
  
  return {
    phenology: {
      stage: phenologyStage?.id || 'seedling',
      daysInStage: phenologyStage?.daysInStage || 0,
      targets: phenologyTargets,
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
  
  // Phenology data
  const phenologyData = {
    stage: phenologyStage?.id || 'seedling',
    daysInStage: phenologyStage?.daysInStage || 0,
    targets: {
      vpdOptimal: phenologyStage?.vpd?.optimal || 0.6,
      vpdMin: phenologyStage?.vpd?.min || 0.4,
      vpdMax: phenologyStage?.vpd?.max || 0.8,
    },
  };
  
  const prompt = buildOnDemandAnalysisPrompt({
    current,
    phenology: phenologyData,
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
