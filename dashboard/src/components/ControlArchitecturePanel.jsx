/**
 * Control Architecture Panel
 * 
 * Displays the hybrid control architecture status and recommendations
 * for AC Infinity devices that the dashboard monitors but doesn't control.
 */

import { AlertCircle, CheckCircle2, Info, Droplets, Wind, Thermometer, RefreshCw } from 'lucide-react';

export function ControlArchitecturePanel({ recommendations = [], controlStatus = null, vpdSyncStatus = null }) {
  const hasRecommendations = recommendations && recommendations.length > 0;
  
  // Format timestamp for VPD sync status
  const formatSyncTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="card card-glow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
          <Info className="w-5 h-5 text-neon-green" />
          Control Architecture
        </h2>
      </div>

      {/* Architecture Overview */}
      <div className="mb-6 space-y-3">
        <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-200">Dashboard Controls</p>
            <p className="text-xs text-zinc-400 mt-1">
              <Thermometer className="w-4 h-4 inline mr-1" />
              Heater (Temperature) • Light (Schedule)
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-zinc-800/50 rounded-lg">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-gray-200">AC Infinity App Controls</p>
            <p className="text-xs text-zinc-400 mt-1">
              <Droplets className="w-4 h-4 inline mr-1" />
              Humidifier (VPD Mode) • 
              <Wind className="w-4 h-4 inline mx-1" />
              Exhaust Fan (VPD Mode)
            </p>
          </div>
        </div>
      </div>

      {/* VPD Settings Sync Status */}
      {vpdSyncStatus && (
        <div className={`mb-6 p-3 rounded-lg border ${
          vpdSyncStatus.error 
            ? 'bg-red-900/20 border-red-700/50' 
            : vpdSyncStatus.skipped
            ? 'bg-zinc-800/50 border-zinc-700/50'
            : 'bg-green-900/20 border-green-700/50'
        }`}>
          <div className="flex items-start gap-3">
            {vpdSyncStatus.error ? (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            ) : vpdSyncStatus.skipped ? (
              <Info className="w-5 h-5 text-zinc-400 flex-shrink-0 mt-0.5" />
            ) : (
              <RefreshCw className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-200">
                {vpdSyncStatus.error 
                  ? 'VPD Settings Update Failed'
                  : vpdSyncStatus.skipped
                  ? 'VPD Settings Already Synced'
                  : `VPD Targets Synced with ${vpdSyncStatus.stage}`
                }
              </p>
              {vpdSyncStatus.error ? (
                <p className="text-xs text-red-400 mt-1">{vpdSyncStatus.error}</p>
              ) : vpdSyncStatus.skipped ? (
                <p className="text-xs text-zinc-400 mt-1">{vpdSyncStatus.reason || 'No changes needed'}</p>
              ) : vpdSyncStatus.changes && vpdSyncStatus.changes.length > 0 ? (
                <div className="mt-2 space-y-1">
                  {vpdSyncStatus.changes.map((change, i) => (
                    <p key={i} className="text-xs text-green-400">
                      {change.name}: {change.from.toFixed(2)} → {change.to.toFixed(2)} kPa
                    </p>
                  ))}
                </div>
              ) : null}
              <p className="text-xs text-zinc-500 mt-2">
                {formatSyncTime(vpdSyncStatus.timestamp)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations Section */}
      {hasRecommendations ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Recommendations for AC Infinity App
          </h3>
          
          <div className="space-y-2">
            {recommendations.map((rec, index) => {
              const deviceIcon = rec.device === 'humidifier' ? Droplets : Wind;
              const DeviceIcon = deviceIcon;
              const severityColor = 
                rec.severity >= 75 ? 'text-critical' :
                rec.severity >= 50 ? 'text-warning' :
                'text-optimal';
              
              return (
                <div
                  key={index}
                  className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50"
                >
                  <div className="flex items-start gap-3">
                    <DeviceIcon className={`w-5 h-5 ${severityColor} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-semibold text-gray-200 capitalize">
                          {rec.device === 'humidifier' ? 'Humidifier' : 'Exhaust Fan'}
                        </p>
                        <span className={`text-xs font-medium ${severityColor}`}>
                          {rec.severity >= 75 ? 'High Priority' :
                           rec.severity >= 50 ? 'Medium Priority' :
                           'Low Priority'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mb-2">{rec.reason}</p>
                      <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>Current: {rec.currentValue}</span>
                        <span>→</span>
                        <span className="text-neon-green">Recommended: {rec.recommendedValue}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-zinc-800/30 rounded-lg text-center">
          <CheckCircle2 className="w-6 h-6 text-optimal mx-auto mb-2" />
          <p className="text-sm text-zinc-400">
            No recommendations at this time. All AC Infinity devices are operating within target ranges.
          </p>
        </div>
      )}
    </div>
  );
}
