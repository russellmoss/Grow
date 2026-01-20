import { useMemo } from 'react';

/**
 * Determine status based on value vs thresholds
 */
function getStatus(value, min, max, optimal) {
  if (value === null || value === undefined) return 'offline';
  if (value >= min && value <= max) return 'optimal';
  
  // Check how far out of range
  const lowerDiff = min - value;
  const upperDiff = value - max;
  const maxDiff = Math.max(lowerDiff, upperDiff);
  
  // If within 20% of the range, it's caution; otherwise critical
  const range = max - min;
  if (maxDiff <= range * 0.5) return 'caution';
  return 'critical';
}

function StatusDot({ status }) {
  const colors = {
    optimal: 'bg-optimal',
    caution: 'bg-caution',
    critical: 'bg-critical animate-pulse',
    offline: 'bg-zinc-600',
  };

  return (
    <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
  );
}

/**
 * KPI Card with status-based glow effect
 */
export function KPICard({ 
  label, 
  value, 
  unit, 
  min, 
  max, 
  optimal,
  icon: Icon,
  precision = 1,
  statusIndicator, // Optional: { text, icon, color }
}) {
  const status = useMemo(() => 
    getStatus(value, min, max, optimal), 
    [value, min, max, optimal]
  );
  
  const displayValue = value !== null && value !== undefined 
    ? value.toFixed(precision) 
    : '--';

  const statusColors = {
    optimal: 'border-optimal/40 shadow-glow-green',
    caution: 'border-caution/40 shadow-glow-amber',
    critical: 'border-critical/40 shadow-glow-red',
    offline: 'border-zinc-700',
  };

  const valueColors = {
    optimal: 'text-optimal',
    caution: 'text-caution',
    critical: 'text-critical',
    offline: 'text-zinc-500',
  };

  // Calculate position on indicator bar (0-100%)
  const barPosition = useMemo(() => {
    if (value === null || value === undefined) return 50;
    const range = max - min;
    const position = ((value - min) / range) * 100;
    return Math.max(0, Math.min(100, position));
  }, [value, min, max]);

  return (
    <div className={`card ${statusColors[status]} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="sensor-label flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </span>
        <StatusDot status={status} />
      </div>

      {/* Value */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className={`sensor-value ${valueColors[status]}`}>
            {displayValue}
          </span>
          <span className="text-xl text-zinc-500">{unit}</span>
          {/* Support both single indicator and array of indicators */}
          {statusIndicator && (
            Array.isArray(statusIndicator) ? (
              // Multiple indicators (e.g., multiple humidifiers)
              <div className="flex items-center gap-2 flex-wrap">
                {statusIndicator.map((indicator, idx) => (
                  <span 
                    key={idx}
                    className={`text-sm flex items-center gap-1 ${
                      indicator.color || 'text-zinc-400'
                    }`}
                  >
                    {indicator.icon && <span>{indicator.icon}</span>}
                    <span>{indicator.text}</span>
                  </span>
                ))}
              </div>
            ) : (
              // Single indicator
              <span className={`text-sm flex items-center gap-1 ${
                statusIndicator.color || 'text-zinc-400'
              }`}>
                {statusIndicator.icon && <span>{statusIndicator.icon}</span>}
                <span>{statusIndicator.text}</span>
              </span>
            )
          )}
        </div>
      </div>

      {/* Range Indicator Bar */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        {/* Optimal zone highlight */}
        <div 
          className="absolute h-full bg-optimal/20"
          style={{
            left: '0%',
            width: '100%',
          }}
        />
        
        {/* Current value indicator */}
        <div 
          className={`absolute top-0 w-2 h-full rounded-full transition-all duration-500 ${
            status === 'optimal' ? 'bg-optimal' :
            status === 'caution' ? 'bg-caution' : 'bg-critical'
          }`}
          style={{ left: `calc(${barPosition}% - 4px)` }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-zinc-600">{min}{unit}</span>
        <span className="text-xs text-zinc-500">Target: {optimal}{unit}</span>
        <span className="text-xs text-zinc-600">{max}{unit}</span>
      </div>
    </div>
  );
}
