import { useState, useRef, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useHistoryData } from '../../hooks/useHistoryData';
import { ChartTooltip } from './ChartTooltip';
import { DateRangePicker } from './DateRangePicker';

const TIME_RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

/**
 * Climate History Chart with dual Y-axis
 */
export function ClimateHistoryChart() {
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const [selectedRange, setSelectedRange] = useState(24);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  
  const { data, isLoading, error, lastUpdated } = useHistoryData(
    selectedRange,
    customStartDate,
    customEndDate
  );

  // Determine effective time range for formatting
  const effectiveRange = customStartDate && customEndDate
    ? (customEndDate - customStartDate) / (1000 * 60 * 60) // hours
    : selectedRange;

  const formatXAxis = (timestamp) => {
    if (effectiveRange <= 24) {
      return format(new Date(timestamp), 'HH:mm');
    } else if (effectiveRange <= 168) {
      return format(new Date(timestamp), 'EEE HH:mm');
    }
    return format(new Date(timestamp), 'MMM d');
  };

  const handleDateRangeChange = (start, end) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setSelectedRange(null); // Clear preset range
    setShowDatePicker(false);
  };

  const handlePresetRange = (hours) => {
    setSelectedRange(hours);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setShowDatePicker(false);
  };

  const exportToCSV = () => {
    if (!data.length) return;

    // Create CSV header
    const headers = ['Timestamp', 'Date', 'Time', 'Temperature (°F)', 'Humidity (%)'];
    const rows = data.map(point => {
      const date = new Date(point.time);
      return [
        point.timestamp || date.toISOString(),
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm:ss'),
        point.temperature?.toFixed(1) || '',
        point.humidity?.toFixed(1) || '',
      ];
    });

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with date range
    const dateStr = customStartDate && customEndDate
      ? `${format(customStartDate, 'yyyy-MM-dd')}_to_${format(customEndDate, 'yyyy-MM-dd')}`
      : `last_${selectedRange}h`;
    link.download = `climate_history_${dateStr}.csv`;
    
    link.click();
    URL.revokeObjectURL(url);
  };

  // Close date picker when clicking outside
  useEffect(() => {
    if (!showDatePicker) return;
    
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowDatePicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDatePicker]);

  if (error) {
    return (
      <div className="card card-glow-critical">
        <p className="text-critical">Failed to load climate history</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-100">Climate History</h3>
        
        <div className="flex gap-2 items-center">
          {/* Export button */}
          <button
            onClick={exportToCSV}
            disabled={!data.length || isLoading}
            className="px-3 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700 transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Export to CSV"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>

          {/* Toggle buttons */}
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            <button
              onClick={() => setShowTemp(!showTemp)}
              className={`
                px-3 py-1 text-sm rounded transition-all
                ${showTemp
                  ? 'bg-ice-blue/20 text-ice-blue border border-ice-blue/30'
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              🌡️ Temp
            </button>
            <button
              onClick={() => setShowHumidity(!showHumidity)}
              className={`
                px-3 py-1 text-sm rounded transition-all
                ${showHumidity
                  ? 'bg-caution/20 text-caution border border-caution/30'
                  : 'text-zinc-500 hover:text-zinc-300'
                }
              `}
            >
              💧 Humidity
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.hours}
                onClick={() => handlePresetRange(range.hours)}
                disabled={isLoading}
                className={`
                  px-3 py-1 rounded text-sm transition-all duration-200
                  ${selectedRange === range.hours && !customStartDate
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-glow-green'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          {/* Custom date range button */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              disabled={isLoading}
              className={`
                px-3 py-1 rounded text-sm transition-all duration-200
                ${customStartDate && customEndDate
                  ? 'bg-caution/20 text-caution border border-caution/30'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              📅 Custom
            </button>
            {showDatePicker && (
              <DateRangePicker
                onDateRangeChange={handleDateRangeChange}
                onCancel={() => setShowDatePicker(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
            <span className="ml-3 text-zinc-400">Loading...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />

              {/* Temperature Y-Axis (left) */}
              <YAxis
                yAxisId="temp"
                domain={[60, 95]}
                stroke="#38bdf8"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v) => `${v}°`}
                label={{ value: 'Temp (°F)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />

              {/* Humidity Y-Axis (right) */}
              <YAxis
                yAxisId="humidity"
                orientation="right"
                domain={[0, 100]}
                stroke="#f59e0b"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                label={{ value: 'Humidity (%)', angle: 90, position: 'insideRight', fill: '#9ca3af' }}
              />

              <Tooltip content={<ChartTooltip />} />
              <Legend />

              {/* Temperature line */}
              {showTemp && (
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Temperature"
                  unit="°F"
                />
              )}

              {/* Humidity area */}
              {showHumidity && (
                <Area
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="#f59e0b"
                  fillOpacity={0.2}
                  dot={false}
                  activeDot={{ r: 4 }}
                  name="Humidity"
                  unit="%"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <div></div>
        <div className="flex items-center gap-4">
          {customStartDate && customEndDate && (
            <span className="text-zinc-500">
              {format(customStartDate, 'MMM d, HH:mm')} - {format(customEndDate, 'MMM d, HH:mm')}
            </span>
          )}
          {lastUpdated && (
            <span className="text-zinc-600">
              Updated: {format(lastUpdated, 'HH:mm')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
