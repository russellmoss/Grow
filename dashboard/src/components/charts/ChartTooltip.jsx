import { format } from 'date-fns';

/**
 * Custom tooltip for charts
 */
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const time = format(new Date(label), 'MMM d, HH:mm');

  return (
    <div className="bg-abyss border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-500 mb-2">{time}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-zinc-400">{entry.name}:</span>
            <span className="text-sm font-mono font-medium" style={{ color: entry.color }}>
              {entry.value?.toFixed(entry.name === 'VPD' ? 2 : 1)} {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
