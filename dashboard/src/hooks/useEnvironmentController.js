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
import { createControllerFromState, updateACInfinityVPDSettings } from '../services/environment-controller.js';
import { ENTITIES } from '../types/entities.js';
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
  intervalMinutes = 10,  // Increased from 5 to 10 minutes to reduce AC Infinity API call frequency
  enabled = true 
} = {}) {
  // Use context hooks (matches your existing codebase structure)
  const { entities, callService, temperature, humidity, vpd } = useHA();  // From HomeAssistantContext
  const { currentStage } = usePhenology();  // From PhenologyContext
  
  const [actionLog, setActionLog] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [lastRun, setLastRun] = useState(null);
  const [isEnabled, setIsEnabled] = useState(enabled); // Use enabled parameter
  const [recommendations, setRecommendations] = useState([]);
  const [vpdSyncStatus, setVpdSyncStatus] = useState(null); // Track VPD settings sync status
  
  // Use refs to avoid recreating interval on every state change
  const enabledRef = useRef(enabled);
  enabledRef.current = isEnabled;
  const isRunningRef = useRef(false);
  const intervalRef = useRef(null);
  const serviceCallCooldownRef = useRef({ current: {} }); // For service call cooldown tracking
  const previousStageRef = useRef(null); // Track previous stage for change detection

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
    
    // Log the stage targets being used
    if (currentStage) {
      console.log('[ENV-CTRL] Using stage targets:', {
        stage: currentStage.name,
        temp: {
          day: currentStage.temperature?.day || {},
          night: currentStage.temperature?.night || {},
        },
        humidity: currentStage.humidity || {},
        vpd: currentStage.vpd || {},
      });
    }
    
    try {
      // Determine day/night based on light state
      const isDayTime = entities[ENTITIES.LIGHT]?.state === 'on';
      
      // Create controller from current state (with day/night logic)
      const controller = createControllerFromState(entities, currentStage, isDayTime);
      
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
          recommendations: [],
          results: [],
          status: 'optimal',
        }, ...prev.slice(0, 99)]); // Keep last 100 entries
        
        setRecommendations([]);
        setLastRun(startTime);
        setIsThinking(false);
        return;
      }
      
      // Generate action plan (returns { actions, recommendations })
      const plan = controller.generateActionPlan(problems);
      const actionPlan = plan.actions || [];
      const newRecommendations = plan.recommendations || [];
      
      console.log('[ENV-CTRL] Action plan generated:', actionPlan.length, 'actions (dashboard-controlled devices only)');
      console.log('[ENV-CTRL] Recommendations generated:', newRecommendations.length, 'recommendations (AC Infinity devices)');
      if (actionPlan.length > 0) {
        console.log('[ENV-CTRL] Actions:', actionPlan.map(a => `${a.device}: ${a.action}`));
      }
      if (newRecommendations.length > 0) {
        console.log('[ENV-CTRL] Recommendations:', newRecommendations.map(r => `${r.device}: ${r.action}`));
      }
      
      // Update recommendations state
      setRecommendations(newRecommendations);
      
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
   * Detect stage changes and update AC Infinity VPD settings
   */
  useEffect(() => {
    // Skip if no stage or entities not loaded
    if (!currentStage || !entities || Object.keys(entities).length === 0) {
      return;
    }
    
    // Check if stage has changed
    const previousStageId = previousStageRef.current?.id;
    const currentStageId = currentStage.id;
    
    if (previousStageId && previousStageId !== currentStageId) {
      console.log(`[ENV-CTRL] Stage change detected: ${previousStageRef.current?.name} → ${currentStage.name}`);
      console.log(`[ENV-CTRL] Updating AC Infinity VPD settings for new stage: ${currentStage.name}`);
      
      // Create a helper function to get entity state
      const getEntityState = (entityId) => {
        const entity = entities[entityId];
        return entity?.state || null;
      };
      
      // Update VPD settings
      updateACInfinityVPDSettings(currentStage, callService, getEntityState, serviceCallCooldownRef)
        .then((result) => {
          if (result.success && result.changes && result.changes.length > 0) {
            console.log(`[ENV-CTRL] ✓ VPD settings updated successfully for ${currentStage.name}`);
            setVpdSyncStatus({
              stage: currentStage.name,
              timestamp: new Date(),
              changes: result.changes,
              skipped: result.skipped || [],
            });
          } else if (result.skipped) {
            console.log(`[ENV-CTRL] VPD settings update skipped: ${result.reason || 'No changes needed'}`);
            setVpdSyncStatus({
              stage: currentStage.name,
              timestamp: new Date(),
              skipped: true,
              reason: result.reason || 'No changes needed',
            });
          } else {
            console.warn(`[ENV-CTRL] VPD settings update failed:`, result.error || 'Unknown error');
            setVpdSyncStatus({
              stage: currentStage.name,
              timestamp: new Date(),
              error: result.error || 'Unknown error',
            });
          }
        })
        .catch((error) => {
          console.error('[ENV-CTRL] Error updating VPD settings:', error);
          setVpdSyncStatus({
            stage: currentStage.name,
            timestamp: new Date(),
            error: error.message || String(error),
          });
        });
    }
    
    // Update previous stage ref
    previousStageRef.current = currentStage;
  }, [currentStage?.id, entities, callService]);

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
    
    // Run once on mount (with delay to let rate limits clear and WebSocket data load)
    const initialTimeout = setTimeout(() => {
      if (!isRunningRef.current && enabled) {
        runControllerRef.current();
      }
    }, 30000); // 30 second delay to avoid rate limits on page refresh
    
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

  // Calculate control status
  const controlStatus = {
    dashboard: {
      heater: true, // Dashboard controls heater
      light: false, // Light is schedule-controlled
    },
    acInfinity: {
      humidifier: true, // AC Infinity app controls humidifier
      exhaustFan: true, // AC Infinity app controls exhaust fan
    },
  };

  return {
    // State
    actionLog,
    isThinking,
    lastRun,
    isEnabled,
    latestAction: actionLog[0] || null,
    recommendations,
    vpdSyncStatus, // VPD settings sync status for UI
    controlStatus,
    
    // Controls
    triggerNow,
    setEnabled,
    clearLog,
  };
}
