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
            {isEnabled ? 'Active - Auto Mode' : 'Inactive - Manual Mode'}
          </span>
        </div>
        {isEnabled && (
          <p className="text-sm text-zinc-500 mt-2">
            System is analyzing environment every 5 minutes and making automated adjustments.
          </p>
        )}
        {!isEnabled && (
          <p className="text-sm text-zinc-500 mt-2">
            Controller is paused. Manual control of all devices is active.
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
                <span>Disable Auto Mode</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5" />
                <span>Enable Auto Mode</span>
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
      
      {/* Warning */}
      {!isEnabled && (
        <div className="mt-4 p-3 bg-caution/10 border border-caution/30 rounded-lg">
          <p className="text-xs text-caution">
            ⚠️ <strong>Warning:</strong> When auto mode is disabled, you are responsible 
            for manually adjusting all environmental controls. VPD, temperature, and humidity 
            targets will not be maintained automatically.
          </p>
        </div>
      )}
    </div>
  );
}
