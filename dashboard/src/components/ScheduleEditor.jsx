import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

/**
 * Schedule Editor Component
 * Modal dialog for editing phenology stage parameters
 * 
 * @param {Object} props
 * @param {Object} props.stage - Stage object to edit
 * @param {Function} props.onSave - Callback(stageId, updatedParams)
 * @param {Function} props.onClose - Callback()
 * @param {Function} props.onReset - Callback(stageId) - resets to defaults
 */
export default function ScheduleEditor({ stage, onSave, onClose, onReset }) {
  if (!stage) return null;

  // Local state for form fields
  const [dayTemp, setDayTemp] = useState(stage.temperature?.day?.target || 77);
  const [nightTemp, setNightTemp] = useState(stage.temperature?.night?.target || 71);
  const [vpdMin, setVpdMin] = useState(stage.vpd?.min || 0.4);
  const [vpdMax, setVpdMax] = useState(stage.vpd?.max || 0.8);
  const [vpdOptimal, setVpdOptimal] = useState(stage.vpd?.optimal || 0.6);
  // VPD triggers: 
  // - high trigger = when to turn ON humidifier (should be >= vpdMax, uses vpdMax in automation)
  // - low trigger = when to turn OFF humidifier (should be <= vpdOptimal, uses vpdOptimal in automation)
  // Initialize from stage.vpd.highTrigger/vpd.lowTrigger if they exist, otherwise use defaults
  const [vpdHighTrigger, setVpdHighTrigger] = useState(
    stage.vpd?.highTrigger ?? (stage.vpd?.max || 0.8)
  );
  const [vpdLowTrigger, setVpdLowTrigger] = useState(
    stage.vpd?.lowTrigger ?? (stage.vpd?.optimal || 0.6)
  );
  const [humidityTarget, setHumidityTarget] = useState(stage.humidity?.optimal || 70);
  const [lightOnTime, setLightOnTime] = useState(stage.lightSchedule?.onTime || '06:00');
  const [lightOffTime, setLightOffTime] = useState(stage.lightSchedule?.offTime || '02:00');

  // Validation errors
  const [errors, setErrors] = useState({});

  /**
   * Calculate photoperiod in hours
   * Handles overnight schedules (e.g., 6 AM to 2 AM = 20 hours)
   */
  const calculatePhotoperiod = (onTime, offTime) => {
    const [onHours, onMinutes] = onTime.split(':').map(Number);
    const [offHours, offMinutes] = offTime.split(':').map(Number);
    
    const onTotalMinutes = onHours * 60 + onMinutes;
    const offTotalMinutes = offHours * 60 + offMinutes;
    
    let diffMinutes = offTotalMinutes - onTotalMinutes;
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours if overnight
    }
    
    return diffMinutes / 60;
  };

  const photoperiod = calculatePhotoperiod(lightOnTime, lightOffTime);

  /**
   * Validate all fields
   */
  const validate = () => {
    const newErrors = {};

    // Temperature validation
    if (dayTemp < nightTemp) {
      newErrors.temperature = 'Day temperature must be >= night temperature';
    }

    // VPD validation
    if (vpdMin >= vpdMax) {
      newErrors.vpdRange = 'VPD min must be < VPD max';
    }
    if (vpdOptimal < vpdMin || vpdOptimal > vpdMax) {
      newErrors.vpdOptimal = 'VPD optimal must be between min and max';
    }
    // High trigger: when VPD goes above this, turn ON humidifier (should be >= vpdMax)
    if (vpdHighTrigger < vpdMax) {
      newErrors.vpdHigh = 'VPD high trigger must be >= VPD max (triggers humidifier ON when VPD is too high)';
    }
    // Low trigger: when VPD goes below this, turn OFF humidifier (should be <= vpdOptimal)
    if (vpdLowTrigger > vpdOptimal) {
      newErrors.vpdLow = 'VPD low trigger must be <= VPD optimal (triggers humidifier OFF when VPD is low enough)';
    }

    // Time validation
    if (!/^\d{2}:\d{2}$/.test(lightOnTime) || !/^\d{2}:\d{2}$/.test(lightOffTime)) {
      newErrors.time = 'Invalid time format (use HH:MM)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate on field changes
  useEffect(() => {
    validate();
  }, [dayTemp, nightTemp, vpdMin, vpdMax, vpdOptimal, vpdHighTrigger, vpdLowTrigger, lightOnTime, lightOffTime]);

  /**
   * Handle save
   */
  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const updatedParams = {
      temperature: {
        day: {
          ...stage.temperature?.day,
          target: dayTemp,
        },
        night: {
          ...stage.temperature?.night,
          target: nightTemp,
        },
      },
      vpd: {
        min: vpdMin,
        max: vpdMax,
        optimal: vpdOptimal,
        // Store triggers for automation use (high trigger = when to turn ON, low trigger = when to turn OFF)
        highTrigger: vpdHighTrigger,
        lowTrigger: vpdLowTrigger,
      },
      humidity: {
        ...stage.humidity,
        optimal: humidityTarget,
      },
      lightSchedule: {
        ...stage.lightSchedule,
        onTime: lightOnTime,
        offTime: lightOffTime,
        hoursOn: Math.round(photoperiod),
        hoursOff: Math.round(24 - photoperiod),
      },
    };

    onSave(stage.id, updatedParams);
  };

  /**
   * Handle reset to defaults
   */
  const handleReset = () => {
    if (window.confirm(`Reset ${stage.name} to default values?`)) {
      onReset(stage.id);
    }
  };

  const isValid = Object.keys(errors).length === 0;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-abyss border border-zinc-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-abyss border-b border-zinc-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-100">
            Edit {stage.emoji} {stage.name} Parameters
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Section 1: Temperature */}
          <section>
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              🌡️ Temperature
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Day Temperature (°F)
                </label>
                <input
                  type="number"
                  min="60"
                  max="90"
                  step="1"
                  value={dayTemp}
                  onChange={(e) => setDayTemp(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Night Temperature (°F)
                </label>
                <input
                  type="number"
                  min="60"
                  max="90"
                  step="1"
                  value={nightTemp}
                  onChange={(e) => setNightTemp(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                />
              </div>
            </div>
            {errors.temperature && (
              <div className="mt-2 flex items-center gap-2 text-critical text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.temperature}</span>
              </div>
            )}
          </section>

          {/* Section 2: Humidity & VPD */}
          <section>
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              💧 Humidity & VPD
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Humidity Target (%)
                </label>
                <input
                  type="number"
                  min="20"
                  max="90"
                  step="1"
                  value={humidityTarget}
                  onChange={(e) => setHumidityTarget(Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    VPD Min (kPa)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={vpdMin}
                    onChange={(e) => setVpdMin(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    VPD Max (kPa)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={vpdMax}
                    onChange={(e) => setVpdMax(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    VPD Optimal (kPa)
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={vpdOptimal}
                    onChange={(e) => setVpdOptimal(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    VPD High Trigger (kPa)
                    <span className="text-xs text-zinc-500 block mt-1">
                      Turn ON humidifier when VPD &gt; this value (must be ≥ {vpdMax.toFixed(1)})
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={vpdHighTrigger}
                    onChange={(e) => setVpdHighTrigger(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    VPD Low Trigger (kPa)
                    <span className="text-xs text-zinc-500 block mt-1">
                      Turn OFF humidifier when VPD &lt; this value (must be ≤ {vpdOptimal.toFixed(1)})
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={vpdLowTrigger}
                    onChange={(e) => setVpdLowTrigger(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                  />
                </div>
              </div>
              {errors.vpdRange && (
                <div className="flex items-center gap-2 text-critical text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.vpdRange}</span>
                </div>
              )}
              {errors.vpdHigh && (
                <div className="flex items-center gap-2 text-critical text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.vpdHigh}</span>
                </div>
              )}
              {errors.vpdLow && (
                <div className="flex items-center gap-2 text-critical text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.vpdLow}</span>
                </div>
              )}
              {errors.vpdOptimal && (
                <div className="flex items-center gap-2 text-critical text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.vpdOptimal}</span>
                </div>
              )}
            </div>
          </section>

          {/* Section 3: Light Schedule */}
          <section>
            <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
              💡 Light Schedule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Lights ON Time
                </label>
                <input
                  type="time"
                  value={lightOnTime}
                  onChange={(e) => setLightOnTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">
                  Lights OFF Time
                </label>
                <input
                  type="time"
                  value={lightOffTime}
                  onChange={(e) => setLightOffTime(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 text-gray-100 focus:border-neon-green focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-zinc-900 rounded-lg">
              <p className="text-sm text-zinc-400">
                <span className="text-gray-100 font-medium">Photoperiod:</span>{' '}
                {photoperiod.toFixed(1)} hours
                <span className="text-zinc-500 ml-2">
                  (Dark: {(24 - photoperiod).toFixed(1)} hours)
                </span>
              </p>
            </div>
            {errors.time && (
              <div className="mt-2 flex items-center gap-2 text-critical text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.time}</span>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-abyss border-t border-zinc-700 p-6 flex items-center justify-between gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 text-gray-100 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save & Deploy
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
