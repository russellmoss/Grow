/**
 * System Thinking Panel
 * 
 * Displays the intelligent controller's analysis, decisions, and actions
 * in a user-friendly format.
 */

import { AlertTriangle, CheckCircle, XCircle, ArrowRight, Brain } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Array} props.actionLog - Controller action history
 * @param {boolean} props.isThinking - Whether controller is currently analyzing
 * @param {boolean} props.isEnabled - Whether controller is enabled
 */
export function SystemThinkingPanel({ actionLog, isThinking, isEnabled }) {
  const latestAction = actionLog?.[0];

  // Format timestamp helper
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return 'Invalid date';
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="w-6 h-6 text-neon-green" />
          <h3 className="text-xl font-semibold">System Thinking</h3>
        </div>
        
        {isThinking && (
          <span className="px-3 py-1 bg-neon-green text-black rounded-full text-sm font-medium animate-pulse">
            Analyzing...
          </span>
        )}
        
        {!isEnabled && (
          <span className="px-3 py-1 bg-zinc-700 text-zinc-400 rounded-full text-sm font-medium">
            Inactive
          </span>
        )}
      </div>
      
      {/* Latest Decision */}
      {latestAction ? (
        <div className="space-y-6">
          {/* Problems Detected */}
          <div>
            <p className="text-sm text-zinc-500 font-medium mb-3">Problems Detected:</p>
            {latestAction.problems?.length > 0 ? (
              <div className="space-y-2">
                {latestAction.problems.map((problem, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-3 bg-zinc-800 p-3 rounded-lg"
                  >
                    <AlertTriangle 
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{
                        color: problem.severity > 75 ? '#ef4444' : 
                               problem.severity > 50 ? '#f59e0b' : '#fbbf24'
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{problem.description}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Severity: {problem.severity}/100 • 
                        Delta: {problem.delta > 0 ? '+' : ''}{problem.delta?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-optimal">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm">Environment is optimal - no problems detected</span>
              </div>
            )}
          </div>
          
          {/* Action Plan */}
          {latestAction.actionPlan?.length > 0 && (
            <div>
              <p className="text-sm text-zinc-500 font-medium mb-3">Action Plan:</p>
              <div className="space-y-2">
                {latestAction.actionPlan.map((action, i) => (
                  <div 
                    key={i} 
                    className="bg-zinc-800 p-3 rounded-lg"
                  >
                    <div className="flex items-start gap-3">
                      <ArrowRight className="w-5 h-5 text-neon-green mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">
                          {action.device?.replace(/([A-Z])/g, ' $1').trim() || action.device}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">{action.reason}</p>
                        {action.intensity !== undefined && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Intensity: {action.intensity}/10
                          </p>
                        )}
                        {action.toPower && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Power: {action.fromPower || '?'} → {action.toPower}
                          </p>
                        )}
                        {action.toTemp && (
                          <p className="text-xs text-zinc-500 mt-1">
                            Temp: {action.fromTemp ? `${action.fromTemp.toFixed(1)}°F` : '?'} → {action.toTemp.toFixed(1)}°F
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Execution Results */}
          {latestAction.results?.length > 0 && (
            <div>
              <p className="text-sm text-zinc-500 font-medium mb-3">Results:</p>
              <div className="bg-zinc-800 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  {latestAction.results.every(r => r.success) ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-optimal" />
                      <span className="text-sm text-optimal">All actions executed successfully</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-critical" />
                      <span className="text-sm text-critical">
                        {latestAction.results.filter(r => !r.success).length} action(s) failed
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Timestamp */}
          <p className="text-xs text-zinc-600">
            Last analysis: {formatTimestamp(latestAction.timestamp)}
          </p>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No analysis history yet. Controller will run automatically every 5 minutes.
        </p>
      )}
    </div>
  );
}
