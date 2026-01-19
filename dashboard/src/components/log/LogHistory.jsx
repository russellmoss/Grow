import { format, formatDistanceToNow } from 'date-fns';
import { useGrowLogContext } from '../../context/GrowLogContext';
import { Trash2, Download } from 'lucide-react';

const QUICK_ACTIONS = [
  { type: 'watered', label: '💧 Watered', color: 'text-ice-blue' },
  { type: 'nutrients', label: '🧪 Nutrients', color: 'text-leaf-green' },
  { type: 'topped', label: '✂️ Topped', color: 'text-caution' },
  { type: 'lst', label: '🌀 LST', color: 'text-violet-400' },
  { type: 'note', label: '📝 Note', color: 'text-zinc-400' },
];

/**
 * Display history of grow log entries
 */
const GROWTH_STAGES = {
  seedling: '🌱 Seedling',
  early_veg: '🌿 Early Veg',
  late_veg: '🌳 Late Veg',
  pre_flower: '🌸 Pre-Flower',
  early_flower: '🌺 Early Flower',
  mid_flower: '🌻 Mid Flower',
  late_flower: '🌼 Late Flower',
  harvest: '✂️ Harvest',
};

export function LogHistory() {
  const { entries, deleteEntry, clearAll, exportEntries, entryCount } = useGrowLogContext();

  if (entries.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-100">📜 Log History</h3>
        </div>
        <div className="text-center py-8 text-zinc-500">
          <p>No entries yet. Start logging your grow activities!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-100">📜 Log History</h3>
          <p className="text-xs text-zinc-500 mt-1">{entryCount} entries</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportEntries}
            className="px-3 py-1.5 bg-zinc-800 text-zinc-300 border border-zinc-700 rounded-lg text-sm hover:bg-zinc-700 transition-all flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={clearAll}
            className="px-3 py-1.5 bg-critical/20 text-critical border border-critical/30 rounded-lg text-sm hover:bg-critical/30 transition-all"
          >
            Clear All
          </button>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {entries.map((entry) => {
          const action = QUICK_ACTIONS.find(a => a.type === entry.type) || QUICK_ACTIONS[4];
          const entryDate = new Date(entry.timestamp);
          
          return (
            <div
              key={entry.id}
              className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${action.color}`}>
                    {action.label}
                  </span>
                  {entry.growthStage && (
                    <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded text-zinc-300">
                      {GROWTH_STAGES[entry.growthStage] || entry.growthStage}
                    </span>
                  )}
                  <span className="text-xs text-zinc-600">
                    {formatDistanceToNow(entryDate, { addSuffix: true })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Delete this entry?')) {
                      deleteEntry(entry.id);
                    }
                  }}
                  className="text-zinc-500 hover:text-critical transition-colors p-1"
                  title="Delete entry"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {entry.note && (
                <p className="text-sm text-gray-200 mb-3 whitespace-pre-wrap">
                  {entry.note}
                </p>
              )}

              {/* Sensor readings at time of entry */}
              {entry.sensors && (
                <div className="flex gap-4 text-xs text-zinc-500 border-t border-zinc-800 pt-2">
                  <div>
                    <span className="text-zinc-600">Temp:</span>
                    <span className="ml-1 text-ice-blue font-mono">
                      {entry.sensors.temperature?.toFixed(1) || '--'}°F
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600">Humidity:</span>
                    <span className="ml-1 text-caution font-mono">
                      {entry.sensors.humidity?.toFixed(1) || '--'}%
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600">VPD:</span>
                    <span className="ml-1 text-critical font-mono">
                      {entry.sensors.vpd?.toFixed(2) || '--'} kPa
                    </span>
                  </div>
                </div>
              )}

              <div className="text-xs text-zinc-600 mt-2">
                {format(entryDate, 'MMM d, yyyy • HH:mm')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
