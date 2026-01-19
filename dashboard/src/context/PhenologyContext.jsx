import { createContext, useContext, useState, useCallback } from 'react';
import { usePhenologySchedule } from '../hooks/usePhenologySchedule';
import { deployStageAutomations, removeStageAutomations, AUTOMATION_IDS } from '../services/automation-manager';
import { createOrUpdateAutomation, deleteAutomation, reloadAutomations, disableAutomation } from '../services/ha-api';

/**
 * Phenology Context
 * Combines schedule state management with automation deployment actions
 */
const PhenologyContext = createContext(null);

/**
 * Phenology Provider Component
 * Wraps usePhenologySchedule hook and adds deployment functionality
 */
export function PhenologyProvider({ children }) {
  // Get all schedule state and functions from the hook
  const scheduleHook = usePhenologySchedule();

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentResult, setDeploymentResult] = useState(null);
  const [deploymentError, setDeploymentError] = useState(null);

  /**
   * Deploy automations for the current stage
   * @returns {Promise<Object>} Deployment result
   */
  const deployCurrentStage = useCallback(async () => {
    const currentStage = scheduleHook.getCurrentStage();
    if (!currentStage) {
      const error = 'No current stage selected';
      console.error('[PHENOLOGY] deployCurrentStage failed:', error);
      setDeploymentError(error);
      return { success: false, error };
    }

    console.log('[PHENOLOGY] Deploying automations for current stage:', currentStage.name);
    setIsDeploying(true);
    setDeploymentError(null);
    setDeploymentResult(null);

    try {
      const result = await deployStageAutomations(currentStage, {
        createAutomation: async (automationId, config) => {
          const apiResult = await createOrUpdateAutomation(automationId, config);
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to create automation');
          }
          return apiResult;
        },
        reloadAutomations: async () => {
          const apiResult = await reloadAutomations();
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to reload automations');
          }
          return apiResult;
        },
        disableAutomation: async (entityId) => {
          const apiResult = await disableAutomation(entityId);
          if (!apiResult.success) {
            // Non-fatal - log warning but continue
            console.warn('[PHENOLOGY] Could not disable automation:', entityId, apiResult.error);
          }
          return apiResult;
        },
      });

      // Add timestamp if not present
      if (!result.timestamp) {
        result.timestamp = new Date().toISOString();
      }

      setDeploymentResult(result);
      setIsDeploying(false);

      if (result.success) {
        console.log('[PHENOLOGY] Deployment successful:', result.deployed.length, 'automations deployed');
      } else {
        console.error('[PHENOLOGY] Deployment failed:', result.failed.length, 'automations failed');
        setDeploymentError(`Failed to deploy ${result.failed.length} automation(s)`);
      }

      return result;
    } catch (error) {
      console.error('[PHENOLOGY] Deployment error:', error.message);
      const errorResult = {
        success: false,
        deployed: [],
        failed: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      setDeploymentResult(errorResult);
      setDeploymentError(error.message);
      setIsDeploying(false);
      return errorResult;
    }
  }, [scheduleHook]);

  /**
   * Deploy automations for a specific stage
   * @param {string} stageId - Stage ID to deploy
   * @returns {Promise<Object>} Deployment result
   */
  const deployStage = useCallback(async (stageId) => {
    const stage = scheduleHook.schedule[stageId];
    if (!stage) {
      const error = `Stage not found: ${stageId}`;
      console.error('[PHENOLOGY] deployStage failed:', error);
      setDeploymentError(error);
      return { success: false, error };
    }

    console.log('[PHENOLOGY] Deploying automations for stage:', stage.name);
    setIsDeploying(true);
    setDeploymentError(null);
    setDeploymentResult(null);

    try {
      const result = await deployStageAutomations(stage, {
        createAutomation: async (automationId, config) => {
          const apiResult = await createOrUpdateAutomation(automationId, config);
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to create automation');
          }
          return apiResult;
        },
        reloadAutomations: async () => {
          const apiResult = await reloadAutomations();
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to reload automations');
          }
          return apiResult;
        },
        disableAutomation: async (entityId) => {
          const apiResult = await disableAutomation(entityId);
          if (!apiResult.success) {
            // Non-fatal - log warning but continue
            console.warn('[PHENOLOGY] Could not disable automation:', entityId, apiResult.error);
          }
          return apiResult;
        },
      });

      // Add timestamp if not present
      if (!result.timestamp) {
        result.timestamp = new Date().toISOString();
      }

      setDeploymentResult(result);
      setIsDeploying(false);

      if (result.success) {
        console.log('[PHENOLOGY] Deployment successful:', result.deployed.length, 'automations deployed');
      } else {
        console.error('[PHENOLOGY] Deployment failed:', result.failed.length, 'automations failed');
        setDeploymentError(`Failed to deploy ${result.failed.length} automation(s)`);
      }

      return result;
    } catch (error) {
      console.error('[PHENOLOGY] Deployment error:', error.message);
      const errorResult = {
        success: false,
        deployed: [],
        failed: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      setDeploymentResult(errorResult);
      setDeploymentError(error.message);
      setIsDeploying(false);
      return errorResult;
    }
  }, [scheduleHook]);

  /**
   * Deploy automations using a specific stage object (bypasses state)
   * Useful when deploying immediately after saving custom values
   * @param {Object} stageObject - Stage object to deploy
   * @returns {Promise<Object>} Deployment result
   */
  const deployStageObject = useCallback(async (stageObject) => {
    if (!stageObject) {
      const error = 'No stage object provided';
      console.error('[PHENOLOGY] deployStageObject failed:', error);
      setDeploymentError(error);
      return { success: false, error };
    }

    console.log('[PHENOLOGY] Deploying automations for stage object:', stageObject.name);
    setIsDeploying(true);
    setDeploymentError(null);
    setDeploymentResult(null);

    try {
      const result = await deployStageAutomations(stageObject, {
        createAutomation: async (automationId, config) => {
          const apiResult = await createOrUpdateAutomation(automationId, config);
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to create automation');
          }
          return apiResult;
        },
        reloadAutomations: async () => {
          const apiResult = await reloadAutomations();
          if (!apiResult.success) {
            throw new Error(apiResult.error || 'Failed to reload automations');
          }
          return apiResult;
        },
        disableAutomation: async (entityId) => {
          const apiResult = await disableAutomation(entityId);
          if (!apiResult.success) {
            // Non-fatal - log warning but continue
            console.warn('[PHENOLOGY] Could not disable automation:', entityId, apiResult.error);
          }
          return apiResult;
        },
      });

      // Add timestamp if not present
      if (!result.timestamp) {
        result.timestamp = new Date().toISOString();
      }

      setDeploymentResult(result);
      setIsDeploying(false);

      if (result.success) {
        console.log('[PHENOLOGY] Deployment successful:', result.deployed.length, 'automations deployed');
      } else {
        console.error('[PHENOLOGY] Deployment failed:', result.failed.length, 'automations failed');
        setDeploymentError(`Failed to deploy ${result.failed.length} automation(s)`);
      }

      return result;
    } catch (error) {
      console.error('[PHENOLOGY] Deployment error:', error.message);
      const errorResult = {
        success: false,
        deployed: [],
        failed: [],
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      setDeploymentResult(errorResult);
      setDeploymentError(error.message);
      setIsDeploying(false);
      return errorResult;
    }
  }, []);

  /**
   * Clear deployment result and error
   */
  const clearDeploymentResult = useCallback(() => {
    console.log('[PHENOLOGY] Clearing deployment result');
    setDeploymentResult(null);
    setDeploymentError(null);
  }, []);

  /**
   * Get deployment status information
   * @returns {Object} Deployment status object
   */
  const getDeploymentStatus = useCallback(() => {
    return {
      isDeploying,
      deploymentResult,
      deploymentError,
      isDeployed: deploymentResult?.success === true,
    };
  }, [isDeploying, deploymentResult, deploymentError]);

  // Combine schedule hook state with deployment state and functions
  const value = {
    // Spread all schedule hook properties and functions
    ...scheduleHook,
    
    // Deployment state
    isDeploying,
    deploymentResult,
    deploymentError,
    
    // Deployment functions
    deployCurrentStage,
    deployStage,
    deployStageObject,
    clearDeploymentResult,
    getDeploymentStatus,
  };

  return (
    <PhenologyContext.Provider value={value}>
      {children}
    </PhenologyContext.Provider>
  );
}

/**
 * Hook to access Phenology context
 * @returns {Object} Phenology context value
 * @throws {Error} If used outside PhenologyProvider
 */
export function usePhenology() {
  const context = useContext(PhenologyContext);
  if (!context) {
    throw new Error('usePhenology must be used within a PhenologyProvider');
  }
  return context;
}
