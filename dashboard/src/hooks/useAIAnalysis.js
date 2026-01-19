/**
 * AI Analysis Hook
 * @file src/hooks/useAIAnalysis.js
 * 
 * React hook for managing AI analysis state and interactions
 */

import { useState, useCallback, useRef } from 'react';
import { aiAnalysis } from '../services/ai-analysis.js';
import { useHA } from '../context/HomeAssistantContext.jsx';

/**
 * Hook for AI-powered environmental analysis
 * @param {Object} params - Hook parameters
 * @param {Object} params.sensorData - Current sensor readings { temp, humidity, vpd }
 * @param {Object} params.stageTargets - Current growth stage targets
 * @param {Object} params.actuatorStates - Current actuator states
 * @param {Object} params.controllerState - Controller state (optional)
 * @param {Array} params.actionHistory - Action history (optional)
 * @param {boolean} params.autoAnalyze - Auto-analyze on critical conditions (optional)
 * @returns {Object} Analysis state and functions
 */
export function useAIAnalysis({ 
  sensorData, 
  stageTargets, 
  actuatorStates = {}, 
  controllerState = null,
  actionHistory = [],
  autoAnalyze = false,
  callService = null, // Optional: pass callService from useHA()
}) {
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [followUpResponse, setFollowUpResponse] = useState(null);
  const [isAskingFollowUp, setIsAskingFollowUp] = useState(false);
  
  const lastAnalysisRef = useRef(null);

  /**
   * Run environment analysis
   */
  const runAnalysis = useCallback(async () => {
    // Validate inputs
    if (!sensorData || !sensorData.temp || !sensorData.humidity || !sensorData.vpd) {
      console.warn('[AI-HOOK] Missing sensor data, skipping analysis');
      setError('Missing sensor data');
      return;
    }

    if (!stageTargets) {
      console.warn('[AI-HOOK] Missing stage targets, skipping analysis');
      setError('Missing stage targets');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    console.log('[AI-HOOK] Starting analysis...');
    
    try {
      const result = await aiAnalysis.analyzeEnvironment(
        sensorData,
        stageTargets,
        actuatorStates,
        controllerState,
        actionHistory
      );

      if (result.success) {
        setAnalysis(result);
        setLastAnalyzed(new Date());
        setConversationHistory(prev => [
          {
            role: 'assistant',
            content: result.summary,
            timestamp: new Date(),
            type: 'analysis',
          },
          ...prev.slice(0, 19), // Keep last 20 entries
        ]);
        console.log('[AI-HOOK] Analysis complete:', result.status);
      } else {
        setError(result.error || 'Analysis failed');
        console.error('[AI-HOOK] Analysis failed:', result.error);
      }
    } catch (err) {
      const errorMsg = err.message || 'Analysis failed';
      setError(errorMsg);
      console.error('[AI-HOOK] Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, [sensorData, stageTargets, actuatorStates, controllerState, actionHistory]);

  /**
   * Ask a follow-up question
   */
  const askQuestion = useCallback(async (question) => {
    if (!question || !question.trim()) return;

    setIsAskingFollowUp(true);
    setError(null);

    // Add user question to history
    setConversationHistory(prev => [
      {
        role: 'user',
        content: question,
        timestamp: new Date(),
        type: 'question',
      },
      ...prev,
    ]);

    try {
      const response = await aiAnalysis.askFollowUp(question, sensorData);
      setFollowUpResponse(response);
      
      // Add AI response to history
      setConversationHistory(prev => [
        {
          role: 'assistant',
          content: response,
          timestamp: new Date(),
          type: 'followup',
        },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      setError(err.message || 'Failed to get response');
      console.error('[AI-HOOK] Follow-up question error:', err);
    } finally {
      setIsAskingFollowUp(false);
    }
  }, [sensorData]);

  /**
   * Execute a recommendation
   */
  const executeRecommendation = useCallback(async (index) => {
    if (!analysis || !analysis.optimizationSuggestions) {
      console.warn('[AI-HOOK] No recommendations available');
      return false;
    }

    const recommendation = analysis.optimizationSuggestions[index];
    if (!recommendation) {
      console.warn('[AI-HOOK] Invalid recommendation index');
      return false;
    }

    if (!callService) {
      console.warn('[AI-HOOK] callService not provided, cannot execute recommendation');
      setError('Service call function not available');
      return false;
    }

    // Generate service call
    const serviceCall = aiAnalysis.generateServiceCall(recommendation);
    if (!serviceCall) {
      console.warn('[AI-HOOK] Could not generate service call for recommendation');
      return false;
    }

    try {
      console.log('[AI-HOOK] Executing recommendation:', recommendation);
      
      // Call Home Assistant service
      const [domain, service] = serviceCall.service.split('.');
      const data = {
        ...serviceCall.data,
        ...(serviceCall.target?.entity_id ? { entity_id: serviceCall.target.entity_id } : {}),
      };
      
      const result = await callService(domain, service, data);

      if (result.success) {
        // Add to conversation history
        setConversationHistory(prev => [
          {
            role: 'system',
            content: `Executed: ${recommendation.parameter || recommendation.type}`,
            timestamp: new Date(),
            type: 'action',
          },
          ...prev.slice(0, 19),
        ]);
        
        console.log('[AI-HOOK] Recommendation executed successfully');
        return true;
      } else {
        setError(result.error || 'Service call failed');
        return false;
      }
    } catch (err) {
      setError(err.message || 'Execution failed');
      console.error('[AI-HOOK] Execution error:', err);
      return false;
    }
  }, [analysis, callService]);

  /**
   * Clear analysis state
   */
  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
    setLastAnalyzed(null);
    setConversationHistory([]);
    setFollowUpResponse(null);
    console.log('[AI-HOOK] Analysis cleared');
  }, []);

  return {
    // State
    analysis,
    isAnalyzing,
    error,
    lastAnalyzed,
    conversationHistory,
    followUpResponse,
    isAskingFollowUp,
    isConfigured: aiAnalysis.isReady(),
    
    // Functions
    runAnalysis,
    askQuestion,
    executeRecommendation,
    clearAnalysis,
  };
}
