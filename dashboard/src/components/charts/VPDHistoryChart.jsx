import { useState, useMemo, useRef, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { Download } from 'lucide-react';
import { useHistoryData } from '../../hooks/useHistoryData';
import { ChartTooltip } from './ChartTooltip';
import { DateRangePicker } from './DateRangePicker';
import { VPD_TARGETS } from '../../types/entities';

const TIME_RANGES = [
  { label: '24h', hours: 24 },
  { label: '7d', hours: 168 },
  { label: '30d', hours: 720 },
];

/**
 * VPD History Chart with target zone overlay
 */
export function VPDHistoryChart({ growthStage = 'seedling' }) {
  const [selectedRange, setSelectedRange] = useState(24);
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef(null);
  
  const { data, isLoading, error, lastUpdated, refetch } = useHistoryData(
    selectedRange,
    customStartDate,
    customEndDate
  );

  const targets = VPD_TARGETS[growthStage];

  // Determine effective time range for formatting
  const effectiveRange = customStartDate && customEndDate
    ? (customEndDate - customStartDate) / (1000 * 60 * 60) // hours
    : selectedRange;

  // Format X-axis labels based on time range
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
    const headers = ['Timestamp', 'Date', 'Time', 'VPD (kPa)', 'Temperature (°F)', 'Humidity (%)'];
    const rows = data.map(point => {
      const date = new Date(point.time);
      return [
        point.timestamp || date.toISOString(),
        format(date, 'yyyy-MM-dd'),
        format(date, 'HH:mm:ss'),
        point.vpd?.toFixed(2) || '',
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
    link.download = `vpd_history_${dateStr}.csv`;
    
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

  // Custom gradient for VPD line color based on target zone
  const getVPDColor = (value) => {
    if (!value) return '#6b7280';
    if (value >= targets.min && value <= targets.max) return '#22c55e'; // optimal
    if (value < targets.min) return '#f59e0b'; // caution (too low)
    return '#ef4444'; // critical (too high)
  };

  if (error) {
    return (
      <div className="card card-glow-critical">
        <p className="text-critical mb-2">Failed to load history data</p>
        <button 
          onClick={refetch}
          className="px-3 py-1 bg-critical/20 text-critical border border-critical/30 rounded text-sm hover:bg-critical/30"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green"></div>
          <span className="ml-3 text-zinc-400">Loading history...</span>
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="card">
        <p className="text-zinc-500">No history data available</p>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-100">VPD History</h3>
          <p className="text-xs text-zinc-500">
            Target: {targets.min}-{targets.max} kPa (optimal: {targets.optimal} kPa)
          </p>
        </div>
        
        <div className="flex items-center gap-2">
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

          {/* Time range selector */}
          <div className="flex gap-1 bg-zinc-900 rounded-lg p-1">
            {TIME_RANGES.map((range) => (
              <button
                key={range.hours}
                onClick={() => handlePresetRange(range.hours)}
                disabled={isLoading}
                className={`px-3 py-1 rounded text-sm transition-all duration-200 ${
                  selectedRange === range.hours && !customStartDate
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-glow-green'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="vpdGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          
          {/* Target zone reference area */}
          <ReferenceArea
            y1={targets.min}
            y2={targets.max}
            fill="#22c55e"
            fillOpacity={0.1}
            stroke="#22c55e"
            strokeDasharray="3 3"
            strokeOpacity={0.3}
          />
          
          {/* Optimal target line */}
          <ReferenceLine
            y={targets.optimal}
            stroke="#22c55e"
            strokeDasharray="2 2"
            strokeOpacity={0.5}
            label={{ value: 'Optimal', position: 'right', fill: '#22c55e', fontSize: 10 }}
          />
          
          <XAxis
            dataKey="time"
            tickFormatter={formatXAxis}
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
          />
          <YAxis
            stroke="#6b7280"
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            label={{ value: 'VPD (kPa)', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
          />
          
          <Tooltip content={<ChartTooltip />} />
          
          <Area
            type="monotone"
            dataKey="vpd"
            stroke="#4ade80"
            strokeWidth={2}
            fill="url(#vpdGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#4ade80' }}
            name="VPD"
            unit=" kPa"
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-optimal"></span>
            <span className="text-zinc-400">Optimal Zone</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-caution"></span>
            <span className="text-zinc-400">Caution</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-critical"></span>
            <span className="text-zinc-400">Critical</span>
          </div>
        </div>
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
