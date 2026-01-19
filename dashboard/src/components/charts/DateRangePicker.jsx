import { useState, useEffect } from 'react';
import { format } from 'date-fns';

/**
 * Custom date range picker component
 */
export function DateRangePicker({ onDateRangeChange, onCancel }) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const [startDate, setStartDate] = useState(today);
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState(today);
  const [endTime, setEndTime] = useState('23:59');

  const handleApply = () => {
    if (!startDate || !endDate) return;

    const start = new Date(`${startDate}T${startTime}`);
    const end = new Date(`${endDate}T${endTime}`);

    if (start > end) {
      alert('Start date must be before end date');
      return;
    }

    onDateRangeChange(start, end);
  };

  return (
    <div className="absolute top-full right-0 mt-2 bg-abyss border border-zinc-700 rounded-lg p-4 shadow-xl z-50 min-w-[320px]">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-100 mb-3">Custom Date Range</h4>
        
        {/* Start Date/Time */}
        <div className="mb-3">
          <label className="block text-xs text-zinc-400 mb-1">Start</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-gray-100 focus:outline-none focus:border-neon-green"
            />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-24 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-gray-100 focus:outline-none focus:border-neon-green"
            />
          </div>
        </div>

        {/* End Date/Time */}
        <div className="mb-4">
          <label className="block text-xs text-zinc-400 mb-1">End</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-gray-100 focus:outline-none focus:border-neon-green"
            />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-24 px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-sm text-gray-100 focus:outline-none focus:border-neon-green"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-1.5 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded text-sm font-medium hover:bg-neon-green/30 transition-all"
          >
            Apply
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded text-sm hover:bg-zinc-700 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
