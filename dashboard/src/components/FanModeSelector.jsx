import { useState } from 'react';

/**
 * Segmented control for fan mode selection
 */
export function FanModeSelector({ 
  currentMode, 
  onModeChange, 
  options = ['On', 'Off', 'Auto'],
  currentPower, // Optional: Power level (1-10)
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (mode) => {
    if (mode === currentMode || isLoading) return;
    
    setIsLoading(true);
    try {
      await onModeChange(mode);
    } catch (err) {
      // Log error but don't break UI - the error is already logged in useHomeAssistant
      console.error('[FanModeSelector] Mode change error:', err);
      // Optionally show a toast notification here in the future
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-abyss rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <label className="sensor-label">Exhaust Fan Mode</label>
        {currentPower !== null && currentPower !== undefined && (
          <span className="text-sm text-zinc-400">
            Power: <span className="text-neon-green font-medium">{currentPower}/10</span>
          </span>
        )}
      </div>
      
      <div className="flex bg-zinc-900 rounded-lg p-1 gap-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={isLoading}
            className={`
              flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-200
              ${currentMode === option
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-glow-green'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }
              ${isLoading ? 'opacity-50' : ''}
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
