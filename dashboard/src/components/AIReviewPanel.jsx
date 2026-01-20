/**
 * AI Review Panel
 * 
 * Full panel showing daily review results, actions taken,
 * recommendations, and on-demand analysis interface.
 */

import React, { useState } from 'react';
import { 
  Brain, 
  Zap, 
  Lightbulb, 
  TrendingUp, 
  BookOpen,
  Play,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign
} from 'lucide-react';

export function AIReviewPanel({ 
  lastReview, 
  isReviewing,
  isAnalyzing,
  onDemandResult,
  onTriggerReview,
  onRequestAnalysis,
  onClearAnalysis,
  error,
  reviews = []
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [question, setQuestion] = useState('');
  
  const handleAskAI = () => {
    if (question.trim()) {
      onRequestAnalysis(question.trim());
      setQuestion('');
    } else {
      onRequestAnalysis(null);
    }
  };
  
  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-700">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-gray-100">AI Grow Advisor</h3>
        </div>
        
        <button
          onClick={onTriggerReview}
          disabled={isReviewing}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50 rounded-lg text-sm transition-colors text-white"
        >
          {isReviewing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Reviewing...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Review
            </>
          )}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border-b border-red-500/30">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}
      
      {/* On-Demand Analysis Section */}
      <div className="p-4 border-b border-zinc-700 bg-zinc-800/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Ask about your grow... (or leave blank for general analysis)"
            className="flex-1 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-sm focus:outline-none focus:border-purple-500 text-gray-100 placeholder-zinc-400"
          />
          <button
            onClick={handleAskAI}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-lg text-sm transition-colors text-white"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageSquare className="w-4 h-4" />
            )}
            Ask AI
          </button>
        </div>
        
        {/* On-Demand Result */}
        {onDemandResult && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-blue-400">
                {new Date(onDemandResult.timestamp).toLocaleTimeString()}
              </span>
              <button 
                onClick={onClearAnalysis}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Clear
              </button>
            </div>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">
              {onDemandResult.analysis}
            </p>
            <p className="text-xs text-zinc-500 mt-2">
              Tokens: {(onDemandResult.apiUsage?.inputTokens || 0) + (onDemandResult.apiUsage?.outputTokens || 0)}
            </p>
          </div>
        )}
      </div>
      
      {/* Main Content - Last Review */}
      {lastReview && !lastReview.failed ? (
        <div className="p-4 space-y-4">
          {/* Review Timestamp */}
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(lastReview.timestamp).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ~${lastReview.apiUsage?.estimatedCost || '0.00'}
            </div>
          </div>
          
          {/* Summary */}
          <div className="p-3 bg-zinc-800/50 rounded-lg">
            <p className="text-sm text-zinc-300">
              {lastReview.analysis?.overnightSummary || 'No summary available'}
            </p>
            {lastReview.analysis?.stabilityScore && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-zinc-500">Stability:</span>
                <div className="flex-1 h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all"
                    style={{ width: `${lastReview.analysis.stabilityScore * 10}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-400">
                  {lastReview.analysis.stabilityScore}/10
                </span>
              </div>
            )}
          </div>
          
          {/* Actions Executed */}
          {lastReview.actionsExecuted?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-gray-200">Actions Taken</h4>
              </div>
              <div className="space-y-2">
                {lastReview.actionsExecuted.map((action, i) => (
                  <div 
                    key={i} 
                    className={`p-2 rounded-lg text-xs ${
                      action.executed 
                        ? 'bg-green-500/10 border border-green-500/30' 
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-200">
                        {action.entity?.split('.')[1]?.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-center gap-1">
                        {action.executed ? (
                          <CheckCircle className="w-3 h-3 text-green-400" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-400" />
                        )}
                        <span className={action.executed ? 'text-green-400' : 'text-red-400'}>
                          {action.currentValue} → {action.newValue}
                        </span>
                      </div>
                    </div>
                    <p className="text-zinc-400 mt-1">{action.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {lastReview.recommendations?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-yellow-400" />
                <h4 className="text-sm font-medium text-gray-200">Recommendations</h4>
              </div>
              <div className="space-y-2">
                {lastReview.recommendations.map((rec, i) => (
                  <div key={i} className="p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-yellow-400 capitalize">{rec.type}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        rec.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-zinc-500/20 text-zinc-400'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-zinc-300">{rec.suggestion}</p>
                    <p className="text-zinc-500 mt-1">{rec.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Predictions */}
          {lastReview.predictions?.todayOutlook && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-gray-200">Today's Outlook</h4>
              </div>
              <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs">
                <p className="text-zinc-300">{lastReview.predictions.todayOutlook}</p>
                {lastReview.predictions.potentialConcerns?.length > 0 && (
                  <div className="mt-2">
                    {lastReview.predictions.potentialConcerns.map((concern, i) => (
                      <p key={i} className="text-yellow-400">⚠️ {concern}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Learnings */}
          {lastReview.learnings?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-medium text-gray-200">AI Learnings</h4>
              </div>
              <div className="space-y-1">
                {lastReview.learnings.map((learning, i) => (
                  <p key={i} className="text-xs text-zinc-400">• {learning}</p>
                ))}
              </div>
            </div>
          )}
          
          {/* Stats */}
          {lastReview.stats && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-700">
              <div className="text-center p-2 bg-zinc-800/30 rounded">
                <p className="text-lg font-medium text-gray-200">{lastReview.stats.avgVPD}</p>
                <p className="text-xs text-zinc-500">Avg VPD</p>
              </div>
              <div className="text-center p-2 bg-zinc-800/30 rounded">
                <p className="text-lg font-medium text-gray-200">{lastReview.stats.timeInRange}%</p>
                <p className="text-xs text-zinc-500">In Range</p>
              </div>
              <div className="text-center p-2 bg-zinc-800/30 rounded">
                <p className="text-lg font-medium text-gray-200">{lastReview.stats.dataPoints}</p>
                <p className="text-xs text-zinc-500">Readings</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-8 text-center">
          <Brain className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">No review yet today</p>
          <p className="text-xs text-zinc-500 mt-1">
            Daily review runs at 5:30 AM, or click "Run Review" above
          </p>
        </div>
      )}
      
      {/* Review History Toggle */}
      {reviews.length > 1 && (
        <div className="border-t border-zinc-700">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full p-3 flex items-center justify-between text-sm text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/30 transition-colors"
          >
            <span>Previous Reviews ({reviews.length - 1})</span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showHistory && (
            <div className="p-4 pt-0 max-h-64 overflow-y-auto space-y-2">
              {reviews.slice(1, 8).map((review, i) => (
                <div key={i} className="p-2 bg-zinc-800/30 rounded text-xs">
                  <div className="flex justify-between text-zinc-500">
                    <span>{new Date(review.timestamp).toLocaleDateString()}</span>
                    <span>{review.actionsExecuted?.filter(a => a.executed)?.length || 0} actions</span>
                  </div>
                  {review.analysis?.overnightSummary && (
                    <p className="text-zinc-400 mt-1 line-clamp-2">
                      {review.analysis.overnightSummary}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AIReviewPanel;
