import { useMemo } from 'react';

/**
 * Visual timeline showing light schedule
 */
export function ScheduleSlider({ 
  lightsOnTime = '06:00', 
  lightsOffTime = '02:00',
  onScheduleChange,
}) {
  // Convert time strings to hour numbers
  const parseTime = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') {
      console.warn('[ScheduleSlider] Invalid time string:', timeStr);
      return 0;
    }
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const onHour = parseTime(lightsOnTime || '06:00');
  const offHour = parseTime(lightsOffTime || '02:00');

  // Calculate photoperiod
  const photoperiod = useMemo(() => {
    if (offHour < onHour) {
      // Crosses midnight (e.g., 6 AM to 2 AM)
      return (24 - onHour) + offHour;
    }
    return offHour - onHour;
  }, [onHour, offHour]);

  const darkPeriod = 24 - photoperiod;

  // Generate hour markers
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="p-4 bg-abyss rounded-xl border border-zinc-800">
      <div className="flex items-center justify-between mb-4">
        <label className="sensor-label">Light Schedule (20/4)</label>
        <div className="flex gap-4 text-sm">
          <span className="text-neon-green">
            ☀️ {photoperiod.toFixed(1)}h ON
          </span>
          <span className="text-zinc-500">
            🌙 {darkPeriod.toFixed(1)}h OFF
          </span>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative h-12 bg-zinc-900 rounded-lg overflow-hidden">
        {/* Light period highlight */}
        {offHour < onHour ? (
          <>
            {/* Before midnight */}
            <div 
              className="absolute h-full bg-neon-green/20"
              style={{
                left: `${(onHour / 24) * 100}%`,
                width: `${((24 - onHour) / 24) * 100}%`,
              }}
            />
            {/* After midnight */}
            <div 
              className="absolute h-full bg-neon-green/20"
              style={{
                left: '0%',
                width: `${(offHour / 24) * 100}%`,
              }}
            />
          </>
        ) : (
          <div 
            className="absolute h-full bg-neon-green/20"
            style={{
              left: `${(onHour / 24) * 100}%`,
              width: `${(photoperiod / 24) * 100}%`,
            }}
          />
        )}

        {/* Hour markers */}
        <div className="absolute inset-0 flex">
          {hours.map((hour) => (
            <div 
              key={hour} 
              className="flex-1 border-l border-zinc-800 first:border-l-0"
            >
              {hour % 6 === 0 && (
                <span className="absolute bottom-0 text-[10px] text-zinc-600 -translate-x-1/2">
                  {hour.toString().padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* ON marker */}
        <div 
          className="absolute top-0 h-full w-1 bg-neon-green shadow-glow-green"
          style={{ left: `${(onHour / 24) * 100}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-neon-green text-void text-xs font-bold px-2 py-0.5 rounded">
            ON
          </div>
        </div>

        {/* OFF marker */}
        <div 
          className="absolute top-0 h-full w-1 bg-caution shadow-glow-amber"
          style={{ left: `${(offHour / 24) * 100}%` }}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-caution text-void text-xs font-bold px-2 py-0.5 rounded">
            OFF
          </div>
        </div>
      </div>

      {/* Time labels */}
      <div className="flex justify-between mt-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-neon-green rounded-full"></span>
          <span className="text-zinc-400">Lights ON:</span>
          <span className="text-neon-green font-mono">{lightsOnTime}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 bg-caution rounded-full"></span>
          <span className="text-zinc-400">Lights OFF:</span>
          <span className="text-caution font-mono">{lightsOffTime}</span>
        </div>
      </div>
    </div>
  );
}
