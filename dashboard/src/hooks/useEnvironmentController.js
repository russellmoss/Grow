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
import { useHA } from '../context/HomeAssistantContext.jsx';  // Use context hook, not direct hook
import { usePhenology } from '../context/PhenologyContext.jsx';  // Use context hook for phenology

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
  const { entities, callService, temperature, humidity, vpd } = useHA();  // From HomeAssistantContext
  const { currentStage } = usePhenology();  // From PhenologyContext
  
  const [actionLog, setActionLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [isEnabled, setIsEnabled] = useState(enabled);
  
  // Use refs to avoid recreating interval on every state change
  const enabledRef = useRef(enabled);
  enabledRef.current = isEnabled;
  const isRunningRef = useRef(false);
  const intervalRef = useRef(null);
  const serviceCallCooldownRef = useRef({ current: {} }); // For service call cooldown tracking

  /**
   * Run the controller analysis and execution
   */
  const runController = useCallback(async () => {
    // Prevent overlapping runs
    if (isRunningRef.current) {
      console.log('[ENV-CTRL] Controller already running, skipping duplicate call');
      return;
    }

    if (!enabledRef.current) {
      console.log('[ENV-CTRL] Controller is disabled, skipping run');
      return;
    }
    
    // Skip if sensor data not yet loaded (race condition fix)
    if (!temperature || temperature === 0 || !humidity || humidity === 0 || !vpd || vpd === 0) {
      console.log('[ENV-CTRL] Waiting for sensor data to load...', { temperature, humidity, vpd });
      return;
    }
    
    if (!currentStage) {
      console.warn('[ENV-CTRL] No phenology stage selected, skipping run');
      return;
    }
    
    isRunningRef.current = true;
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
      
      // Create a helper function to get entity state
      const getEntityState = (entityId) => {
        const entity = entities[entityId];
        return entity?.state || null;
      };
      
      // Execute actions (pass cooldown ref to prevent rapid calls)
      const results = await controller.executeActionPlan(actionPlan, callService, getEntityState, serviceCallCooldownRef);
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
      isRunningRef.current = false;
    }
  }, [entities, currentStage, callService, temperature, humidity, vpd]);

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

  // Store runController in a ref so useEffect can access latest version
  const runControllerRef = useRef(runController);
  runControllerRef.current = runController;

  // Set up periodic execution (fixed rapid cycling)
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    console.log(`[ENV-CTRL] Starting controller with ${intervalMinutes}min interval`);
    
    // Run once on mount (with delay to let WebSocket data load)
    const initialTimeout = setTimeout(() => {
      if (!isRunningRef.current) {
        runControllerRef.current();
      }
    }, 5000); // 5 second delay for WebSocket to connect
    
    // Then run on interval
    intervalRef.current = setInterval(() => {
      if (!isRunningRef.current) {
        runControllerRef.current();
      }
    }, intervalMinutes * 60 * 1000);

    return () => {
      console.log('[ENV-CTRL] Cleaning up controller interval');
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMinutes]); // Minimal dependencies - only enabled and intervalMinutes

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
