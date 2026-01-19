import { useState } from 'react';

/**
 * Custom toggle switch with glow effect
 */
export function ToggleSwitch({ 
  label, 
  isOn, 
  onToggle, 
  disabled = false,
  icon: Icon,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-abyss rounded-xl border border-zinc-800">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className={`w-5 h-5 ${isOn ? 'text-neon-green' : 'text-zinc-500'}`} />
        )}
        <span className="font-medium text-gray-200">{label}</span>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          relative w-14 h-7 rounded-full transition-all duration-300
          ${isOn 
            ? 'bg-neon-green/20 border-neon-green/50 shadow-glow-green' 
            : 'bg-zinc-800 border-zinc-700'
          }
          border
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Knob */}
        <span
          className={`
            absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300
            ${isOn 
              ? 'left-7 bg-neon-green' 
              : 'left-0.5 bg-zinc-500'
            }
            ${isLoading ? 'animate-pulse' : ''}
          `}
        />
      </button>
    </div>
  );
}
