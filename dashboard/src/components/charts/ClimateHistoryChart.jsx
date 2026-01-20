import { useState, useRef, useEffect, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';
import { Download, RotateCcw } from 'lucide-react';
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
  
  // Zoom state
  const [isZoomed, setIsZoomed] = useState(false);
  const [originalRange, setOriginalRange] = useState(null);
  const [originalStartDate, setOriginalStartDate] = useState(null);
  const [originalEndDate, setOriginalEndDate] = useState(null);
  
  // Selection state for drag-to-zoom
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const chartRef = useRef(null);
  
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

  // Calculate dynamic Y-axis domain for temperature based on valid data
  const tempDomain = useMemo(() => {
    if (!data.length || !showTemp) return [60, 95]; // Default fallback
    
    // Filter out invalid temperatures (reasonable range: 0-150°F)
    const validTemps = data
      .map(d => d.temperature)
      .filter(temp => temp != null && !isNaN(temp) && temp >= 0 && temp <= 150);
    
    if (validTemps.length === 0) return [60, 95]; // Fallback if no valid data
    
    const minTemp = Math.min(...validTemps);
    const maxTemp = Math.max(...validTemps);
    const range = maxTemp - minTemp;
    
    // Add 10% padding on each side, but ensure minimum range of 10°F
    const padding = Math.max(range * 0.1, 5);
    const domainMin = Math.max(0, Math.floor(minTemp - padding));
    const domainMax = Math.min(150, Math.ceil(maxTemp + padding));
    
    // Ensure minimum range of 10°F for visibility
    if (domainMax - domainMin < 10) {
      const center = (domainMin + domainMax) / 2;
      return [Math.max(0, Math.floor(center - 5)), Math.min(150, Math.ceil(center + 5))];
    }
    
    return [domainMin, domainMax];
  }, [data, showTemp]);

  const handleDateRangeChange = (start, end) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setSelectedRange(null); // Clear preset range
    setShowDatePicker(false);
    setIsZoomed(true);
    // Save original state if not already saved
    if (!isZoomed) {
      setOriginalRange(selectedRange);
      setOriginalStartDate(customStartDate);
      setOriginalEndDate(customEndDate);
    }
  };

  const handlePresetRange = (hours) => {
    setSelectedRange(hours);
    setCustomStartDate(null);
    setCustomEndDate(null);
    setShowDatePicker(false);
    setIsZoomed(false);
    setOriginalRange(null);
    setOriginalStartDate(null);
    setOriginalEndDate(null);
  };
  
  const handleUndoZoom = () => {
    if (originalRange !== null) {
      setSelectedRange(originalRange);
      setCustomStartDate(originalStartDate);
      setCustomEndDate(originalEndDate);
    } else {
      setSelectedRange(24);
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
    setIsZoomed(false);
    setOriginalRange(null);
    setOriginalStartDate(null);
    setOriginalEndDate(null);
  };
  
  // Handle mouse events for drag-to-zoom
  const handleMouseDown = (e) => {
    if (!e || !data.length) return;
    
    // Start selection immediately
    setIsSelecting(true);
    const activeLabel = e.activeLabel;
    if (activeLabel !== undefined) {
      setSelectionStart(activeLabel);
      setSelectionEnd(activeLabel);
    } else if (e.chartX !== undefined && data.length > 0) {
      // Fallback: calculate from chart X position
      const chartWidth = e.chartX;
      const totalWidth = e.viewBox?.width || 800;
      const dataIndex = Math.floor((chartWidth / totalWidth) * data.length);
      if (dataIndex >= 0 && dataIndex < data.length) {
        const timeValue = data[dataIndex].time;
        setSelectionStart(timeValue);
        setSelectionEnd(timeValue);
      }
    }
  };
  
  const handleMouseMove = (e) => {
    if (!isSelecting || !e || !data.length) return;
    
    const activeLabel = e.activeLabel;
    if (activeLabel !== undefined && selectionStart !== null) {
      setSelectionEnd(activeLabel);
    } else if (e.chartX !== undefined && selectionStart !== null && data.length > 0) {
      // Fallback: calculate from chart X position
      const chartWidth = e.chartX;
      const totalWidth = e.viewBox?.width || 800;
      const dataIndex = Math.floor((chartWidth / totalWidth) * data.length);
      if (dataIndex >= 0 && dataIndex < data.length) {
        const timeValue = data[dataIndex].time;
        setSelectionEnd(timeValue);
      }
    }
  };
  
  const handleMouseUp = () => {
    if (!isSelecting || selectionStart === null || selectionEnd === null) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }
    
    // Find the data points for the selected range
    const startTime = Math.min(selectionStart, selectionEnd);
    const endTime = Math.max(selectionStart, selectionEnd);
    
    // Ensure minimum selection size (at least 5 minutes)
    if (endTime - startTime < 5 * 60 * 1000) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      return;
    }
    
    const startPoint = data.find(d => d.time >= startTime);
    const endPoint = [...data].reverse().find(d => d.time <= endTime);
    
    if (startPoint && endPoint && startPoint.time !== endPoint.time) {
      // Save original state
      setOriginalRange(selectedRange);
      setOriginalStartDate(customStartDate);
      setOriginalEndDate(customEndDate);
      
      // Zoom to selection
      const startDate = new Date(startPoint.time);
      const endDate = new Date(endPoint.time);
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
      setSelectedRange(null);
      setIsZoomed(true);
    }
    
    setIsSelecting(false);
    setSelectionStart(null);
    setSelectionEnd(null);
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
        <div>
          <h3 className="text-lg font-bold text-gray-100">Climate History</h3>
          {!isZoomed && (
            <p className="text-xs text-zinc-500 mt-1">💡 Click and drag on chart to zoom</p>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          {/* Undo Zoom button (only show when zoomed) */}
          {isZoomed && (
            <button
              onClick={handleUndoZoom}
              className="px-3 py-1.5 bg-caution/20 text-caution border border-caution/30 rounded-lg text-sm hover:bg-caution/30 transition-all flex items-center gap-1.5"
              title="Undo Zoom"
            >
              <RotateCcw className="w-4 h-4" />
              Undo Zoom
            </button>
          )}
          
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
            <ComposedChart 
              data={data} 
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: isSelecting ? 'col-resize' : 'crosshair' }}
            >
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="#6b7280"
                tick={{ fill: '#9ca3af', fontSize: 11 }}
              />

              {/* Temperature Y-Axis (left) */}
              <YAxis
                yAxisId="temp"
                domain={tempDomain}
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
              
              {/* Selection visualization: vertical lines and highlight area */}
              {isSelecting && selectionStart !== null && selectionEnd !== null && (
                <>
                  {/* Start vertical line */}
                  <ReferenceLine
                    x={selectionStart}
                    yAxisId="temp"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeOpacity={0.8}
                    ifOverflow="extendDomain"
                  />
                  {/* End vertical line */}
                  <ReferenceLine
                    x={selectionEnd}
                    yAxisId="temp"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    strokeOpacity={0.8}
                    ifOverflow="extendDomain"
                  />
                  {/* Selection area highlight */}
                  <ReferenceArea
                    x1={Math.min(selectionStart, selectionEnd)}
                    x2={Math.max(selectionStart, selectionEnd)}
                    fill="#3b82f6"
                    fillOpacity={0.15}
                    stroke="none"
                  />
                </>
              )}

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
