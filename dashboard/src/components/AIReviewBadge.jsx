/**
 * AI Review Badge
 * 
 * Small status indicator showing AI review state.
 * Displays in header to show if daily review has run.
 */

import React from 'react';
import { Brain, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export function AIReviewBadge({ 
  lastReview, 
  isReviewing, 
  hasReviewToday,
  error 
}) {
  // Currently reviewing
  if (isReviewing) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
        <Loader2 className="w-3 h-3 text-purple-400 animate-spin" />
        <span className="text-xs text-purple-400">AI Reviewing...</span>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
        <AlertCircle className="w-3 h-3 text-red-400" />
        <span className="text-xs text-red-400">AI Error</span>
      </div>
    );
  }
  
  // Has review today
  if (hasReviewToday && lastReview) {
    const actionsCount = lastReview.actionsExecuted?.filter(a => a.executed)?.length || 0;
    const hoursAgo = Math.floor((Date.now() - new Date(lastReview.timestamp).getTime()) / 3600000);
    
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
        <CheckCircle className="w-3 h-3 text-green-400" />
        <span className="text-xs text-green-400">
          AI: {hoursAgo}h ago
          {actionsCount > 0 && ` • ${actionsCount} changes`}
        </span>
      </div>
    );
  }
  
  // No review yet today
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-zinc-700/50 border border-zinc-600/30 rounded-full">
      <Brain className="w-3 h-3 text-zinc-400" />
      <span className="text-xs text-zinc-400">AI: Pending</span>
    </div>
  );
}

export default AIReviewBadge;
