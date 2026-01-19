/**
 * AI Analysis Service
 * @file src/services/ai-analysis.js
 * 
 * Claude API integration for environmental analysis and optimization
 */

import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt, buildAnalysisPrompt, parseAnalysisResponse } from '../prompts/environment-analysis.js';
import { ENTITIES } from '../types/entities.js';

/**
 * AI Analysis Service for environmental control optimization
 */
export class AIAnalysisService {
  constructor() {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    
    if (!apiKey || apiKey.trim() === '') {
      console.warn('[AI-ANALYSIS] API key not configured. AI analysis will be disabled.');
      this.isConfigured = false;
      this.client = null;
    } else {
      this.isConfigured = true;
      this.client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true, // Required for browser usage
      });
      this.model = 'claude-sonnet-4-20250514';
      this.maxTokens = 2048;
      console.log('[AI-ANALYSIS] Service initialized with Claude Sonnet 4');
    }
  }

  /**
   * Check if service is ready to use
   * @returns {boolean}
   */
  isReady() {
    return this.isConfigured && this.client !== null;
  }

  /**
   * Analyze environment and controller decisions
   * @param {Object} sensorData - Current sensor readings { temp, humidity, vpd }
   * @param {Object} stageTargets - Current growth stage targets
   * @param {Object} actuatorStates - Current actuator states
   * @param {Object} controllerState - Controller state (optional)
   * @param {Array} actionHistory - Action history (optional)
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeEnvironment(sensorData, stageTargets, actuatorStates = {}, controllerState = null, actionHistory = []) {
    if (!this.isReady()) {
      return {
        success: false,
        error: 'AI service not configured. Add VITE_ANTHROPIC_API_KEY to .env',
      };
    }

    try {
      console.log('[AI-ANALYSIS] Starting environment analysis...');
      
      // Build prompts
      const systemPrompt = buildSystemPrompt(stageTargets, controllerState);
      const userPrompt = buildAnalysisPrompt(sensorData, stageTargets, actuatorStates, controllerState, actionHistory);
      
      console.log('[AI-ANALYSIS] Calling Claude API...');
      
      // Call Claude API
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extract text from response
      const responseText = message.content[0].type === 'text' 
        ? message.content[0].text 
        : JSON.stringify(message.content[0]);

      console.log('[AI-ANALYSIS] Response received, parsing...');
      
      // Parse response
      const analysis = parseAnalysisResponse(responseText);
      
      // Add metadata
      analysis.timestamp = new Date();
      analysis.success = true;
      
      console.log('[AI-ANALYSIS] Analysis complete:', analysis.status);
      
      return analysis;
    } catch (error) {
      console.error('[AI-ANALYSIS] Analysis failed:', error);
      return {
        success: false,
        error: error.message || 'Analysis failed',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Ask a follow-up question about the environment
   * @param {string} question - User's question
   * @param {Object} context - Current context (sensor data, etc.)
   * @returns {Promise<string>} AI response text
   */
  async askFollowUp(question, context = {}) {
    if (!this.isReady()) {
      return 'AI service not configured.';
    }

    try {
      const systemPrompt = `You are a horticultural expert helping optimize an indoor grow tent environment. Answer questions clearly and concisely.`;
      
      const userPrompt = `Context:
- Temperature: ${context.temp || 'unknown'}°F
- Humidity: ${context.humidity || 'unknown'}%
- VPD: ${context.vpd || 'unknown'} kPa

Question: ${question}`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 512,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      return message.content[0].type === 'text' 
        ? message.content[0].text 
        : 'Could not parse response';
    } catch (error) {
      console.error('[AI-ANALYSIS] Follow-up question failed:', error);
      return `Error: ${error.message}`;
    }
  }

  /**
   * Generate Home Assistant service call from recommendation
   * @param {Object} recommendation - Recommendation object
   * @returns {Object} Service call configuration
   */
  generateServiceCall(recommendation) {
    const { device, action } = recommendation;

    switch (device) {
      case 'humidifier':
        if (action === 'turn_on' || action === 'on') {
          return {
            service: 'select.select_option',
            target: { entity_id: ENTITIES.HUMIDIFIER_MODE },
            data: { option: 'On' },
          };
        } else if (action === 'turn_off' || action === 'off') {
          return {
            service: 'select.select_option',
            target: { entity_id: ENTITIES.HUMIDIFIER_MODE },
            data: { option: 'Off' },
          };
        }
        break;

      case 'exhaustFan':
      case 'fan':
        if (action === 'reduce_power' || action === 'reduce') {
          return {
            service: 'number.set_value',
            target: { entity_id: ENTITIES.EXHAUST_FAN_ON_POWER },
            data: { value: 2 },
          };
        } else if (action === 'restore_power' || action === 'restore') {
          return {
            service: 'number.set_value',
            target: { entity_id: ENTITIES.EXHAUST_FAN_ON_POWER },
            data: { value: 5 },
          };
        } else if (action === 'increase_power' || action === 'increase') {
          return {
            service: 'number.set_value',
            target: { entity_id: ENTITIES.EXHAUST_FAN_ON_POWER },
            data: { value: 7 },
          };
        }
        break;

      case 'heater':
        if (action === 'reduce_temp' || action === 'reduce') {
          return {
            service: 'climate.set_temperature',
            target: { entity_id: ENTITIES.HEATER },
            data: { temperature: 78, hvac_mode: 'heat' },
          };
        } else if (action === 'increase_temp' || action === 'increase') {
          return {
            service: 'climate.set_temperature',
            target: { entity_id: ENTITIES.HEATER },
            data: { temperature: 80, hvac_mode: 'heat' },
          };
        }
        break;
    }

    return null;
  }
}

// Export singleton instance
export const aiAnalysis = new AIAnalysisService();

// Export class for testing
export default AIAnalysisService;
