import { useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_SCHEDULE, mergeWithDefaults, validateStage } from '../types/phenology';

const STORAGE_KEY_SCHEDULE = 'grow-phenology-schedule';
const STORAGE_KEY_CURRENT_STAGE = 'grow-current-stage';

/**
 * React hook for managing phenology schedule state
 * Handles localStorage persistence, validation, and parameter updates
 * 
 * @returns {Object} Schedule state and management functions
 */
export function usePhenologySchedule() {
  const [schedule, setSchedule] = useState({});
  const [currentStageId, setCurrentStageIdState] = useState('seedling');
  const [isLoading, setIsLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const initialized = useRef(false);

  /**
   * Load schedule from localStorage and merge with defaults
   */
  const loadSchedule = useCallback(() => {
    console.log('[PHENOLOGY] Loading schedule from localStorage...');
    
    try {
      // Load schedule
      const savedScheduleJson = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      let loadedSchedule = {};
      
      if (savedScheduleJson) {
        try {
          loadedSchedule = JSON.parse(savedScheduleJson);
          console.log('[PHENOLOGY] Found saved schedule in localStorage');
        } catch (parseError) {
          console.warn('[PHENOLOGY] Failed to parse saved schedule, using defaults:', parseError);
          loadedSchedule = {};
        }
      } else {
        console.log('[PHENOLOGY] No saved schedule found, using defaults');
      }

      // Merge with defaults (handles new stages added in updates)
      // Custom values are preserved - defaults only fill in missing fields
      const mergedSchedule = mergeWithDefaults(loadedSchedule);
      setSchedule(mergedSchedule);
      console.log('[PHENOLOGY] Schedule loaded:', Object.keys(mergedSchedule).length, 'stages');

      // Load current stage
      const savedStageId = localStorage.getItem(STORAGE_KEY_CURRENT_STAGE);
      if (savedStageId && mergedSchedule[savedStageId]) {
        setCurrentStageIdState(savedStageId);
        console.log('[PHENOLOGY] Current stage loaded:', savedStageId);
      } else {
        // Default to first stage if saved stage doesn't exist
        const firstStageId = Object.keys(mergedSchedule)[0] || 'seedling';
        setCurrentStageIdState(firstStageId);
        console.log('[PHENOLOGY] Using default stage:', firstStageId);
      }

      setIsDirty(false);
      setIsLoading(false);
    } catch (error) {
      console.error('[PHENOLOGY] Error loading schedule:', error);
      // Fallback to defaults on error
      setSchedule(DEFAULT_SCHEDULE);
      setCurrentStageIdState('seedling');
      setIsDirty(false);
      setIsLoading(false);
    }
  }, []);

  /**
   * Save schedule to localStorage
   * Validates all stages before saving
   */
  const saveSchedule = useCallback(() => {
    console.log('[PHENOLOGY] Saving schedule to localStorage...');

    // Validate all stages
    const validationErrors = [];
    for (const [stageId, stage] of Object.entries(schedule)) {
      const validation = validateStage(stage);
      if (!validation.valid) {
        validationErrors.push({
          stageId,
          errors: validation.errors,
        });
      }
    }

    if (validationErrors.length > 0) {
      console.error('[PHENOLOGY] Validation errors, not saving:', validationErrors);
      throw new Error(
        `Cannot save: ${validationErrors.length} stage(s) have validation errors. ` +
        validationErrors.map(e => `${e.stageId}: ${e.errors.join(', ')}`).join('; ')
      );
    }

    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
      setIsDirty(false);
      console.log('[PHENOLOGY] Schedule saved successfully');
    } catch (error) {
      console.error('[PHENOLOGY] Error saving schedule:', error);
      throw new Error(`Failed to save schedule: ${error.message}`);
    }
  }, [schedule]);

  /**
   * Get the full stage object for current stage ID
   * @returns {Object|null} Current stage object or null if not found
   */
  const getCurrentStage = useCallback(() => {
    return schedule[currentStageId] || null;
  }, [schedule, currentStageId]);

  /**
   * Set current stage ID and save to localStorage
   * @param {string} stageId - Stage ID to set as current
   */
  const setCurrentStageId = useCallback((stageId) => {
    if (!schedule[stageId]) {
      console.warn('[PHENOLOGY] Attempted to set invalid stage ID:', stageId);
      return;
    }

    console.log('[PHENOLOGY] Setting current stage:', stageId);
    setCurrentStageIdState(stageId);
    
    try {
      localStorage.setItem(STORAGE_KEY_CURRENT_STAGE, stageId);
      console.log('[PHENOLOGY] Current stage saved to localStorage');
    } catch (error) {
      console.error('[PHENOLOGY] Error saving current stage:', error);
    }
  }, [schedule]);

  /**
   * Update a nested parameter in a stage
   * Supports dot-notation paths like 'temperature.day.target' or 'vpd.optimal'
   * 
   * @param {string} stageId - Stage ID to update
   * @param {string} path - Dot-notation path to the parameter (e.g., 'temperature.day.target')
   * @param {any} value - New value
   */
  const updateStageParameter = useCallback((stageId, path, value) => {
    if (!schedule[stageId]) {
      console.warn('[PHENOLOGY] Attempted to update invalid stage ID:', stageId);
      return;
    }

    console.log('[PHENOLOGY] Updating parameter:', stageId, path, '=', value);

    setSchedule(prevSchedule => {
      const updatedSchedule = { ...prevSchedule };
      const stage = { ...updatedSchedule[stageId] };

      // Navigate the path and update the value
      const pathParts = path.split('.');
      let current = stage;

      // Navigate to the parent of the target property
      for (let i = 0; i < pathParts.length - 1; i++) {
        const key = pathParts[i];
        if (!current[key] || typeof current[key] !== 'object') {
          console.warn('[PHENOLOGY] Invalid path, creating nested object:', path);
          current[key] = {};
        }
        // Create a new object to maintain immutability
        current[key] = { ...current[key] };
        current = current[key];
      }

      // Set the final value
      const finalKey = pathParts[pathParts.length - 1];
      current[finalKey] = value;

      // Reconstruct the stage with updated nested object
      updatedSchedule[stageId] = stage;
      
      setIsDirty(true);
      return updatedSchedule;
    });
  }, [schedule]);

  /**
   * Save custom stage parameters
   * Merges customParams into the stage and marks it as customized
   * @param {string} stageId - Stage ID to update
   * @param {Object} customParams - Custom parameters to merge
   * @returns {Object} Updated stage object
   */
  const saveCustomStage = useCallback((stageId, customParams) => {
    if (!schedule[stageId]) {
      console.warn('[PHENOLOGY] Attempted to save custom values for invalid stage ID:', stageId);
      return null;
    }

    console.log('[PHENOLOGY] Saving custom parameters for stage:', stageId);

    let updatedStage = null;

    setSchedule(prevSchedule => {
      const updatedSchedule = { ...prevSchedule };
      const stage = { ...updatedSchedule[stageId] };

      // Deep merge custom parameters
      // IMPORTANT: customParams takes precedence, but we need to preserve existing nested structure
      updatedStage = {
        ...stage,
        isCustom: true,
        // Deep merge nested objects - customParams values override stage values
        temperature: customParams.temperature ? {
          day: { ...stage.temperature?.day, ...customParams.temperature.day },
          night: { ...stage.temperature?.night, ...customParams.temperature.night },
        } : stage.temperature,
        humidity: customParams.humidity ? {
          ...stage.humidity,
          ...customParams.humidity,
        } : stage.humidity,
        vpd: customParams.vpd ? {
          ...stage.vpd,
          ...customParams.vpd,
        } : stage.vpd,
        lightSchedule: customParams.lightSchedule ? {
          ...stage.lightSchedule,
          ...customParams.lightSchedule,
        } : stage.lightSchedule,
      };
      
      console.log('[PHENOLOGY] Merged stage:', {
        id: updatedStage.id,
        name: updatedStage.name,
        lightSchedule: updatedStage.lightSchedule,
        temperature: updatedStage.temperature,
        vpd: updatedStage.vpd,
      });

      updatedSchedule[stageId] = updatedStage;
      setIsDirty(true);

      // Auto-save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(updatedSchedule));
        console.log('[PHENOLOGY] Custom stage saved to localStorage');
      } catch (error) {
        console.error('[PHENOLOGY] Error saving custom stage:', error);
      }

      return updatedSchedule;
    });

    // Return the updated stage
    return updatedStage;
  }, [schedule]);

  /**
   * Reset a single stage to default values
   * Removes custom overrides and isCustom flag
   * @param {string} stageId - Stage ID to reset
   * @returns {Object} Restored stage object
   */
  const resetStageToDefaults = useCallback((stageId) => {
    if (!DEFAULT_SCHEDULE[stageId]) {
      console.warn('[PHENOLOGY] Attempted to reset invalid stage ID:', stageId);
      return null;
    }

    console.log('[PHENOLOGY] Resetting stage to defaults (removing custom values):', stageId);

    setSchedule(prevSchedule => {
      const updatedSchedule = { ...prevSchedule };
      // Deep clone the default stage (removes isCustom flag and all custom values)
      const defaultStage = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE[stageId]));
      updatedSchedule[stageId] = defaultStage;
      setIsDirty(true);

      // Auto-save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(updatedSchedule));
        console.log('[PHENOLOGY] Stage reset saved to localStorage');
      } catch (error) {
        console.error('[PHENOLOGY] Error saving reset stage:', error);
      }

      return updatedSchedule;
    });

    // Return the restored default stage
    return JSON.parse(JSON.stringify(DEFAULT_SCHEDULE[stageId]));
  }, []);

  /**
   * Reset entire schedule to defaults
   * Requires user confirmation
   * @param {boolean} skipConfirmation - Skip confirmation dialog (for testing)
   */
  const resetAllToDefaults = useCallback((skipConfirmation = false) => {
    const confirmed = skipConfirmation || window.confirm(
      'Are you sure you want to reset all stages to default values? This cannot be undone.'
    );

    if (!confirmed) {
      console.log('[PHENOLOGY] Reset cancelled by user');
      return;
    }

    console.log('[PHENOLOGY] Resetting all stages to defaults');

    // Deep clone the default schedule
    const defaultScheduleClone = JSON.parse(JSON.stringify(DEFAULT_SCHEDULE));
    setSchedule(defaultScheduleClone);

    // Clear localStorage
    try {
      localStorage.removeItem(STORAGE_KEY_SCHEDULE);
      console.log('[PHENOLOGY] Cleared schedule from localStorage');
    } catch (error) {
      console.error('[PHENOLOGY] Error clearing localStorage:', error);
    }

    setIsDirty(false);
  }, []);

  // Initialize on mount (with StrictMode protection)
  useEffect(() => {
    if (initialized.current) {
      console.log('[PHENOLOGY] Already initialized, skipping...');
      return;
    }
    initialized.current = true;
    loadSchedule();
  }, [loadSchedule]);

  /**
   * Check if a stage has custom values
   * @param {string} stageId - Stage ID to check
   * @returns {boolean} True if stage is customized
   */
  const isStageCustomized = useCallback((stageId) => {
    const stage = schedule[stageId];
    return stage?.isCustom === true;
  }, [schedule]);

  // Get current stage for convenience
  const currentStage = getCurrentStage();

  return {
    // State
    schedule,
    currentStageId,
    currentStage,
    isLoading,
    isDirty,

    // Functions
    loadSchedule,
    saveSchedule,
    getCurrentStage,
    setCurrentStageId,
    updateStageParameter,
    resetStageToDefaults,
    resetAllToDefaults,
    
    // Custom stage functions
    saveCustomStage,
    isStageCustomized,
  };
}
