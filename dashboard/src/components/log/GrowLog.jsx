import { useState } from 'react';
import { useGrowLogContext } from '../../context/GrowLogContext';
import { useHA } from '../../context/HomeAssistantContext';

const QUICK_ACTIONS = [
  { type: 'watered', label: '💧 Watered', color: 'bg-ice-blue/20 text-ice-blue border-ice-blue/30' },
  { type: 'nutrients', label: '🧪 Nutrients', color: 'bg-leaf-green/20 text-leaf-green border-leaf-green/30' },
  { type: 'topped', label: '✂️ Topped', color: 'bg-caution/20 text-caution border-caution/30' },
  { type: 'lst', label: '🌀 LST', color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
];

const GROWTH_STAGES = [
  { value: 'seedling', label: '🌱 Seedling', description: '0-3 weeks' },
  { value: 'early_veg', label: '🌿 Early Veg', description: '3-6 weeks' },
  { value: 'late_veg', label: '🌳 Late Veg', description: '6-8 weeks' },
  { value: 'pre_flower', label: '🌸 Pre-Flower', description: 'Transition' },
  { value: 'early_flower', label: '🌺 Early Flower', description: 'Weeks 1-3' },
  { value: 'mid_flower', label: '🌻 Mid Flower', description: 'Weeks 4-6' },
  { value: 'late_flower', label: '🌼 Late Flower', description: 'Weeks 7-9' },
  { value: 'harvest', label: '✂️ Harvest', description: 'Ready!' },
];

/**
 * Captain's Log entry form
 */
export function GrowLog() {
  const [note, setNote] = useState('');
  const [selectedType, setSelectedType] = useState('note');
  const [growthStage, setGrowthStage] = useState('seedling');
  const { addEntry } = useGrowLogContext();
  const { temperature, humidity, vpd } = useHA();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!note.trim() && selectedType === 'note') return;

    addEntry({
      note: note.trim() || `${QUICK_ACTIONS.find(a => a.type === selectedType)?.label || 'Note'}`,
      type: selectedType,
      growthStage,
      sensors: {
        temperature,
        humidity,
        vpd,
      },
    });

    setNote('');
    setSelectedType('note');
  };

  const handleQuickAction = (type) => {
    setSelectedType(type);
    
    // Auto-submit quick actions with no note
    addEntry({
      note: QUICK_ACTIONS.find(a => a.type === type)?.label || type,
      type,
      growthStage,
      sensors: {
        temperature,
        humidity,
        vpd,
      },
    });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-100 mb-4">📝 Captain's Log</h3>
      
      {/* Quick Actions */}
      <div className="mb-4">
        <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">Quick Actions</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.type}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                handleQuickAction(action.type);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${action.color} hover:opacity-80 cursor-pointer`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Growth Stage Selector */}
        <div>
          <label className="block text-xs text-zinc-400 mb-2 uppercase tracking-wider">
            Growth Stage
          </label>
          <select
            value={growthStage}
            onChange={(e) => setGrowthStage(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-gray-100 focus:outline-none focus:border-neon-green"
          >
            {GROWTH_STAGES.map((stage) => (
              <option key={stage.value} value={stage.value}>
                {stage.label} - {stage.description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-zinc-400 mb-1 uppercase tracking-wider">
            Note
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Record observations, changes, or notes..."
            rows={4}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-gray-100 placeholder-zinc-500 focus:outline-none focus:border-neon-green resize-none"
          />
        </div>

        {/* Current Sensor Readings */}
        <div className="bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
          <p className="text-xs text-zinc-400 mb-2 uppercase tracking-wider">Current Conditions</p>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-zinc-500">Temp:</span>
              <span className="ml-1 text-ice-blue font-mono">
                {temperature?.toFixed(1) || '--'}°F
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Humidity:</span>
              <span className="ml-1 text-caution font-mono">
                {humidity?.toFixed(1) || '--'}%
              </span>
            </div>
            <div>
              <span className="text-zinc-500">VPD:</span>
              <span className="ml-1 text-critical font-mono">
                {vpd?.toFixed(2) || '--'} kPa
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-600 mt-2">
            These values will be saved with your entry
          </p>
        </div>

        <button
          type="submit"
          disabled={!note.trim() && selectedType === 'note'}
          className="w-full px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg font-medium hover:bg-neon-green/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Entry
        </button>
      </form>
    </div>
  );
}
