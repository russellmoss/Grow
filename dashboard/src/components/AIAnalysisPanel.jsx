/**
 * AI Analysis Panel Component
 * @file src/components/AIAnalysisPanel.jsx
 * 
 * Displays AI-powered environmental analysis and optimization suggestions
 */

import { useState } from 'react';
import { 
  Brain, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Send, Loader2, Zap
} from 'lucide-react';
import { useAIAnalysis } from '../hooks/useAIAnalysis';

/**
 * Simple markdown formatter for AI responses
 * Converts markdown to JSX with proper styling
 */
function formatMarkdown(text) {
  if (!text) return null;
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs.map((para, pIdx) => {
    if (!para.trim()) return null;
    
    // Check for headers (## or ###)
    if (para.startsWith('## ')) {
      return (
        <h3 key={pIdx} className="text-base font-semibold text-zinc-200 mt-4 mb-2 first:mt-0">
          {para.replace(/^##\s+/, '')}
        </h3>
      );
    }
    
    if (para.startsWith('### ')) {
      return (
        <h4 key={pIdx} className="text-sm font-semibold text-zinc-300 mt-3 mb-1.5 first:mt-0">
          {para.replace(/^###\s+/, '')}
        </h4>
      );
    }
    
    // Check for bullet lists
    if (para.includes('\n- ') || para.startsWith('- ')) {
      const lines = para.split('\n');
      const items = [];
      let currentList = [];
      
      lines.forEach((line, lIdx) => {
        if (line.trim().startsWith('- ')) {
          if (currentList.length > 0) {
            items.push(currentList);
            currentList = [];
          }
          currentList.push(line.trim().substring(2));
        } else if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
          // Bold item header
          if (currentList.length > 0) {
            items.push(currentList);
            currentList = [];
          }
          currentList.push(line.trim());
        } else if (line.trim()) {
          currentList.push(line.trim());
        }
      });
      
      if (currentList.length > 0) {
        items.push(currentList);
      }
      
      return (
        <ul key={pIdx} className="list-disc list-inside space-y-1.5 my-2 text-zinc-300">
          {items.map((item, iIdx) => {
            const itemText = Array.isArray(item) ? item.join(' ') : item;
            // Process bold text
            const parts = itemText.split(/(\*\*[^*]+\*\*)/g);
            return (
              <li key={iIdx} className="text-sm leading-relaxed">
                {parts.map((part, partIdx) => {
                  if (part.startsWith('**') && part.endsWith('**')) {
                    return (
                      <strong key={partIdx} className="font-semibold text-zinc-200">
                        {part.slice(2, -2)}
                      </strong>
                    );
                  }
                  return <span key={partIdx}>{part}</span>;
                })}
              </li>
            );
          })}
        </ul>
      );
    }
    
    // Regular paragraph - process bold and inline formatting
    const parts = para.split(/(\*\*[^*]+\*\*)/g);
    
    return (
      <p key={pIdx} className="text-sm text-zinc-300 leading-relaxed my-2 first:mt-0">
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={partIdx} className="font-semibold text-zinc-200">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <span key={partIdx}>{part}</span>;
        })}
      </p>
    );
  }).filter(Boolean);
}

function StatusBadge({ status }) {
  const config = {
    optimal: { bg: 'bg-optimal/20', border: 'border-optimal/50', text: 'text-optimal', icon: CheckCircle, label: 'Optimal' },
    caution: { bg: 'bg-caution/20', border: 'border-caution/50', text: 'text-caution', icon: AlertTriangle, label: 'Caution' },
    critical: { bg: 'bg-critical/20', border: 'border-critical/50', text: 'text-critical', icon: XCircle, label: 'Critical' },
  };
  const { bg, border, text, icon: Icon, label } = config[status] || config.caution;

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} ${border} border`}>
      <Icon className={`w-3.5 h-3.5 ${text}`} />
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  );
}

export function AIAnalysisPanel({ sensorData, stageTargets, actuatorStates, controllerState, actionHistory, callService }) {
  const {
    analysis, isAnalyzing, error, lastAnalyzed,
    isConfigured, runAnalysis, askQuestion, executeRecommendation, clearAnalysis,
    followUpResponse, isAskingFollowUp
  } = useAIAnalysis({ 
    sensorData, 
    stageTargets, 
    actuatorStates, 
    controllerState, 
    actionHistory,
    callService,
  });

  const [showReasoning, setShowReasoning] = useState(false);
  const [followUpInput, setFollowUpInput] = useState('');
  const [executingIndex, setExecutingIndex] = useState(null);

  const handleExecute = async (index) => {
    setExecutingIndex(index);
    await executeRecommendation(index);
    setExecutingIndex(null);
  };

  const handleAskQuestion = async () => {
    if (!followUpInput.trim()) return;
    await askQuestion(followUpInput);
    setFollowUpInput('');
  };

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-zinc-500" />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <p className="text-sm text-zinc-400 mb-2">API key not configured</p>
          <p className="text-xs text-zinc-500">
            Add VITE_ANTHROPIC_API_KEY to your .env file.
            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer"
               className="text-neon-green hover:underline ml-1">
              Get API key →
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Brain className={`w-5 h-5 ${isAnalyzing ? 'text-neon-green animate-pulse' : 'text-zinc-400'}`} />
          <h3 className="text-lg font-semibold">AI Analysis</h3>
        </div>
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          title="Analyze Environment"
        >
          <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {isAnalyzing && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-neon-green animate-spin mr-2" />
          <span className="text-zinc-400">Analyzing environment...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isAnalyzing && (
        <div className="bg-critical/10 border border-critical/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-critical">{error}</p>
          <button onClick={runAnalysis} className="text-xs text-zinc-400 hover:text-white mt-2">
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && !error && (
        <div className="text-center py-8">
          <Brain className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 mb-4">Click Analyze to get AI insights</p>
          <button
            onClick={runAnalysis}
            className="px-4 py-2 rounded-lg bg-neon-green/20 text-neon-green hover:bg-neon-green/30 transition-colors"
          >
            Analyze Environment
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isAnalyzing && (
        <div className="space-y-4">
          {/* Status & Summary */}
          <div>
            <StatusBadge status={analysis.status} />
            <p className="mt-2 text-zinc-200">{analysis.summary}</p>
          </div>

          {/* Controller Decision Analysis */}
          {analysis.controllerAnalysis && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Controller Decision Analysis</p>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                <div className="flex items-center gap-2 mb-2">
                  {analysis.controllerAnalysis.decisionCorrect ? (
                    <CheckCircle className="w-4 h-4 text-optimal" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-caution" />
                  )}
                  <span className="text-sm font-medium">
                    Decision: {analysis.controllerAnalysis.decisionCorrect ? 'Correct' : 'Needs Review'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mb-2">{analysis.controllerAnalysis.decisionExplanation}</p>
                <p className="text-xs text-zinc-500">
                  Coordination Quality: <span className="text-zinc-300">{analysis.controllerAnalysis.coordinationQuality}</span>
                </p>
                {analysis.controllerAnalysis.suggestedImprovements?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-zinc-500 mb-1">Suggested Improvements:</p>
                    <ul className="text-xs text-zinc-400 space-y-1">
                      {analysis.controllerAnalysis.suggestedImprovements.map((improvement, i) => (
                        <li key={i}>• {improvement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Variable Relationships */}
          {analysis.variableRelationships && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Variable Relationships</p>
              <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800 space-y-2 text-xs">
                {analysis.variableRelationships.temperatureToVPD && (
                  <div>
                    <span className="text-zinc-300 font-medium">Temperature ↔ VPD:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.temperatureToVPD}</span>
                  </div>
                )}
                {analysis.variableRelationships.humidityToVPD && (
                  <div>
                    <span className="text-zinc-300 font-medium">Humidity ↔ VPD:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.humidityToVPD}</span>
                  </div>
                )}
                {analysis.variableRelationships.fanPowerToHumidity && (
                  <div>
                    <span className="text-zinc-300 font-medium">Fan Power ↔ Humidity:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.fanPowerToHumidity}</span>
                  </div>
                )}
                {analysis.variableRelationships.interactions && (
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="text-zinc-300 font-medium">Interactions:</span>
                    <span className="text-zinc-400 ml-2">{analysis.variableRelationships.interactions}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optimization Suggestions */}
          {analysis.optimizationSuggestions?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Optimization Suggestions</p>
              <div className="space-y-2">
                {analysis.optimizationSuggestions.map((suggestion, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {suggestion.type === 'target_adjustment' && '🎯 Target Adjustment'}
                          {suggestion.type === 'threshold_tuning' && '⚙️ Threshold Tuning'}
                          {suggestion.type === 'timing_adjustment' && '⏱️ Timing Adjustment'}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {suggestion.parameter}: {suggestion.currentValue} → {suggestion.suggestedValue}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 mb-1">{suggestion.reason}</p>
                    <p className="text-xs text-neon-green">Expected Impact: {suggestion.expectedImpact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Predictions */}
          {analysis.predictions?.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Predictions</p>
              <div className="space-y-2">
                {analysis.predictions.map((prediction, i) => (
                  <div key={i} className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
                    <p className="text-sm font-medium text-zinc-200 mb-1">{prediction.scenario}</p>
                    <p className="text-xs text-zinc-400 mb-1">{prediction.predictedOutcome}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      prediction.confidence === 'high' ? 'bg-optimal/20 text-optimal' :
                      prediction.confidence === 'medium' ? 'bg-caution/20 text-caution' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>
                      Confidence: {prediction.confidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reasoning (collapsible) */}
          {analysis.reasoning && (
            <div>
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300"
              >
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showReasoning ? 'Hide' : 'Show'} AI Reasoning
              </button>
              {showReasoning && (
                <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-400 whitespace-pre-wrap">
                  {analysis.reasoning}
                </div>
              )}
            </div>
          )}

          {/* Follow-up Question */}
          <div className="pt-3 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
                placeholder="Ask a follow-up question..."
                className="flex-1 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm
                           placeholder-zinc-600 focus:outline-none focus:border-zinc-700"
              />
              <button
                onClick={handleAskQuestion}
                disabled={isAskingFollowUp || !followUpInput.trim()}
                className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {isAskingFollowUp ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            {followUpResponse && (
              <div className="mt-3 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-zinc-300 leading-relaxed space-y-2">
                    {formatMarkdown(followUpResponse)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Last analyzed: {lastAnalyzed?.toLocaleTimeString() || 'Never'}</span>
            <button onClick={clearAnalysis} className="hover:text-zinc-400">Clear</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIAnalysisPanel;
