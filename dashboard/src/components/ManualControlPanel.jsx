/**
 * Manual Control Panel
 * 
 * Allows users to:
 * - Enable/disable the intelligent controller
 * - Manually trigger an analysis
 * - View override mode status
 */

import { Power, PlayCircle, StopCircle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {boolean} props.isEnabled - Whether controller is enabled
 * @param {boolean} props.isThinking - Whether controller is currently running
 * @param {Function} props.onToggleEnabled - Callback to enable/disable
 * @param {Function} props.onTriggerNow - Callback to manually trigger
 */
export function ManualControlPanel({ 
  isEnabled, 
  isThinking, 
  onToggleEnabled, 
  onTriggerNow 
}) {
  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Power className="w-6 h-6 text-neon-green" />
        <h3 className="text-xl font-semibold">Controller Status</h3>
      </div>
      
      {/* Status Display */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isEnabled ? 'bg-optimal animate-pulse' : 'bg-zinc-600'}`} />
          <span className="font-medium">
            {isEnabled ? 'Active - Heater Control' : 'Paused - Heater Control'}
          </span>
        </div>
        {isEnabled && (
          <div className="mt-2 space-y-1">
            <p className="text-sm text-zinc-400">
              Dashboard controls heater temperature automatically.
            </p>
            <p className="text-xs text-zinc-500">
              AC Infinity devices (humidifier, exhaust fan) are controlled by the AC Infinity app.
            </p>
          </div>
        )}
        {!isEnabled && (
          <p className="text-sm text-zinc-500 mt-2">
            Heater control is paused. Manual control is active.
          </p>
        )}
      </div>
      
      {/* Controls */}
      <div className="space-y-3">
        {/* Enable/Disable Button */}
        <button
          onClick={onToggleEnabled}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isEnabled 
              ? 'bg-caution hover:bg-amber-600 text-black' 
              : 'bg-optimal hover:bg-green-600 text-black'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isEnabled ? (
              <>
                <StopCircle className="w-5 h-5" />
                <span>Pause Heater Control</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>Enable Heater Control</span>
              </>
            )}
          </div>
        </button>
        
        {/* Manual Trigger Button */}
        <button
          onClick={onTriggerNow}
          disabled={isThinking}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
            isThinking
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-zinc-700 hover:bg-zinc-600 text-white'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <PlayCircle className="w-5 h-5" />
            <span>{isThinking ? 'Analyzing...' : 'Analyze Now'}</span>
          </div>
        </button>
      </div>
      
      {/* Hybrid Control Info */}
      <div className="mt-4 p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg">
        <p className="text-xs text-zinc-400">
          <strong className="text-zinc-300">Hybrid Control:</strong> Dashboard controls heater temperature. 
          AC Infinity app controls humidifier and exhaust fan (VPD mode). 
          See Control Architecture panel for recommendations.
        </p>
      </div>
    </div>
  );
}
