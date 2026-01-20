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
import { useHA } from '../context/HomeAssistantContext.jsx';
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
  const haContext = useHA();
  
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
