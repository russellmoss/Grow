import { HomeAssistantProvider, useHA } from './context/HomeAssistantContext';
import { GrowLogProvider } from './context/GrowLogContext';
import { PhenologyProvider, usePhenology } from './context/PhenologyContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { KPICard, ToggleSwitch, FanModeSelector, ScheduleSlider } from './components';
import { VPDHistoryChart } from './components/charts/VPDHistoryChart';
import { ClimateHistoryChart } from './components/charts/ClimateHistoryChart';
import { GrowLog } from './components/log/GrowLog';
import { LogHistory } from './components/log/LogHistory';
import { CameraFeed } from './components/CameraFeed';
import StageSelector from './components/StageSelector';
import { Thermometer, Droplets, Wind } from 'lucide-react';
import { VPD_TARGETS, TEMP_TARGETS, HUMIDITY_TARGETS } from './types/entities';

function Dashboard() {
  const { 
    isConnected, 
    isLoading, 
    error,
    temperature,
    humidity,
    vpd,
    lightState,
    fanMode,
    fanPower,
    heaterAction,
    humidifierState,
    toggleSwitch,
    setFanMode,
  } = useHA();

  // Get phenology context
  const { currentStage } = usePhenology();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4"></div>
          <p className="text-zinc-400">Connecting to Home Assistant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-6">
        <div className="card card-glow-critical max-w-md text-center">
          <h2 className="text-xl font-bold text-critical mb-2">Connection Error</h2>
          <p className="text-zinc-400 whitespace-pre-line text-left mb-4">{error.message}</p>
          <div className="text-zinc-500 text-sm space-y-2 text-left">
            <p><strong>Troubleshooting:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Verify Tailscale is connected</li>
              <li>Test: <code className="text-zinc-400">ping 100.65.202.84</code></li>
              <li>Verify HA is running: <code className="text-zinc-400">http://100.65.202.84:8123</code></li>
              <li>Check browser console for detailed error</li>
              <li>Verify .env file has correct VITE_HA_URL and VITE_HA_TOKEN</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg hover:bg-neon-green/30 transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
            🌿 Project: Plausible Deniability
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            GrowOp Command Center • {currentStage?.emoji} {currentStage?.name || 'Loading...'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-optimal' : 'bg-critical'}`}></span>
          <span className="text-sm text-zinc-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Stage Selector - Full Width */}
        <div className="lg:col-span-3">
          <StageSelector />
        </div>

        {/* KPI Cards - Climate Sensors */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            label="Temperature"
            value={temperature}
            unit="°F"
            min={TEMP_TARGETS.day.min}
            max={TEMP_TARGETS.day.max}
            optimal={TEMP_TARGETS.day.target}
            icon={Thermometer}
            precision={1}
            statusIndicator={
              heaterAction === 'heating' 
                ? { text: 'heating', icon: '🔥', color: 'text-amber-400' }
                : null
            }
          />
          <KPICard
            label="Humidity"
            value={humidity}
            unit="%"
            min={HUMIDITY_TARGETS.seedling.min}
            max={HUMIDITY_TARGETS.seedling.max}
            optimal={HUMIDITY_TARGETS.seedling.optimal}
            icon={Droplets}
            precision={1}
            statusIndicator={
              humidifierState === 'on'
                ? { text: 'humidifying', icon: '💧', color: 'text-blue-400' }
                : null
            }
          />
          <KPICard
            label="VPD"
            value={vpd}
            unit=" kPa"
            min={VPD_TARGETS.seedling.min}
            max={VPD_TARGETS.seedling.max}
            optimal={VPD_TARGETS.seedling.optimal}
            icon={Wind}
            precision={2}
          />
        </div>

        {/* Control Section */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Device Controls */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-100 mb-4">Device Controls</h2>
            <ToggleSwitch
              label="Grow Light"
              isOn={lightState === 'on'}
              onToggle={() => toggleSwitch('switch.light')}
              disabled={!isConnected}
            />
            <FanModeSelector
              currentMode={fanMode || 'Off'}
              onModeChange={(mode) => setFanMode(mode)}
              options={['On', 'Off', 'Auto']}
              currentPower={fanPower}
            />
          </div>

          {/* Schedule */}
          <div>
            <h2 className="text-xl font-bold text-gray-100 mb-4">Light Schedule</h2>
            <ScheduleSlider
              lightsOnTime={currentStage?.lightSchedule?.onTime || '06:00'}
              lightsOffTime={currentStage?.lightSchedule?.offTime || '02:00'}
            />
          </div>
        </div>

        {/* History Charts */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <VPDHistoryChart growthStage="seedling" />
          <ClimateHistoryChart />
        </div>

        {/* Captain's Log */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GrowLog />
          <LogHistory />
        </div>

        {/* Camera Feed */}
        <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CameraFeed streamUrl={import.meta.env.VITE_CAMERA_URL || null} />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HomeAssistantProvider>
        <PhenologyProvider>
          <GrowLogProvider>
            <Dashboard />
          </GrowLogProvider>
        </PhenologyProvider>
      </HomeAssistantProvider>
    </ErrorBoundary>
  );
}

export default App;
