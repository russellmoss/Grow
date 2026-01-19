# 🚀 Grow Dashboard - Cursor Build Guide
## Sequential Prompts for Iterative Development

**Project Location:** `C:\Users\russe\Documents\Grow\dashboard\`  
**Estimated Time:** 2-3 hours (with testing)  
**Prerequisites:** Node.js 18+, npm, Cursor with MCP connected

---

## How to Use This Guide

1. Copy each prompt into Cursor
2. Let Cursor complete the task
3. Run the validation command
4. Fix any issues before moving to next prompt
5. ✅ Check off when complete

---

# Phase 1: Project Scaffolding

## Prompt 1.1: Initialize Project Structure

```
Create a new React + Vite dashboard project in C:\Users\russe\Documents\Grow\dashboard\

Requirements:
1. Create the directory structure:
   dashboard/
   ├── src/
   │   ├── components/
   │   ├── hooks/
   │   ├── services/
   │   ├── context/
   │   ├── types/
   │   └── components/charts/
   ├── public/
   └── [config files]

2. Create package.json with these dependencies:
   - react, react-dom (^18.2.0)
   - recharts (^2.12.0)
   - date-fns (^3.3.1)
   - lucide-react (^0.312.0)
   - home-assistant-js-websocket (^9.1.0)
   - Dev: vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer

3. Create vite.config.js with base: './' for HA deployment

4. Create postcss.config.js

5. Create index.html with root div and dark meta theme

Do NOT run npm install yet - just create the files.
```

### ✅ Validation 1.1
```bash
cd C:\Users\russe\Documents\Grow\dashboard
dir  # Should see package.json, vite.config.js, src folder
```
- [ ] package.json exists
- [ ] vite.config.js has `base: './'`
- [ ] src/ folder structure created

---

## Prompt 1.2: Tailwind Configuration

```
In C:\Users\russe\Documents\Grow\dashboard\, create the Tailwind CSS configuration:

1. Create tailwind.config.js with this custom theme:
   - Colors: void (#09090b), abyss (#18181b), slate-deep (#27272a)
   - Status: optimal (#22c55e), caution (#f59e0b), critical (#ef4444), dormant (#6b7280)
   - Accents: neon-green (#4ade80), neon-amber (#fbbf24), ice-blue (#38bdf8), leaf-green (#84cc16)
   - Fonts: JetBrains Mono for mono, Inter for sans
   - Custom shadows: glow-green, glow-amber, glow-red, glow-blue
   - Animation: pulse-slow, glow keyframes

2. Create src/index.css with:
   - Google Fonts import for Inter and JetBrains Mono
   - Tailwind directives (@tailwind base, components, utilities)
   - Custom scrollbar styles (dark theme)
   - Base layer: body with bg-void, text-gray-100
   - Component classes: .card, .card-glow-optimal, .card-glow-critical, .sensor-value, .sensor-label
```

### ✅ Validation 1.2
- [ ] tailwind.config.js has all custom colors
- [ ] src/index.css has @tailwind directives
- [ ] .card class defined in @layer components

---

## Prompt 1.3: Environment & Entry Files

```
In C:\Users\russe\Documents\Grow\dashboard\, create:

1. .env.example file:
   VITE_HA_URL=http://100.65.202.84:8123
   VITE_HA_TOKEN=your_long_lived_access_token_here
   VITE_GROWTH_STAGE=seedling

2. .env file (copy of above with the ACTUAL token from .cursor/mcp.json):
   - Get the token from C:\Users\russe\Documents\Grow\.cursor\mcp.json
   - The HA_TOKEN value in that file

3. src/main.jsx - Standard React 18 entry with StrictMode

4. src/App.jsx - Placeholder that just shows:
   - Dark background (bg-void)
   - "🌿 Project: Plausible Deniability" header
   - "Connecting to Home Assistant..." text
   - Use Tailwind classes

5. .gitignore with node_modules, dist, .env (but NOT .env.example)
```

### ✅ Validation 1.3
```bash
cd C:\Users\russe\Documents\Grow\dashboard
npm install
npm run dev
```
- [ ] No npm install errors
- [ ] Browser opens to localhost:5173
- [ ] Dark background visible
- [ ] Header text displays
- [ ] Stop dev server (Ctrl+C)

---

# Phase 2: Home Assistant Connection

## Prompt 2.1: Entity Types & Constants

```
In C:\Users\russe\Documents\Grow\dashboard\src\types\, create entities.js:

Define constants for all entity IDs (these are verified from MANIFEST.md):

ENTITIES object with:
  // Climate Sensors
  TEMPERATURE: 'sensor.ac_infinity_controller_69_pro_temperature'
  HUMIDITY: 'sensor.ac_infinity_controller_69_pro_humidity'
  VPD: 'sensor.ac_infinity_controller_69_pro_vpd'
  
  // Control Devices
  LIGHT: 'switch.light'
  INTAKE_FAN: 'switch.intake_air'
  HEATER: 'climate.tent_heater'
  EXHAUST_FAN_MODE: 'select.exhaust_fan_active_mode'
  HUMIDIFIER_MODE: 'select.cloudforge_t5_active_mode'  // CloudForge T5
  
  // Power Monitoring
  LIGHT_POWER: 'sensor.light_power'
  INTAKE_POWER: 'sensor.intake_air_power'
  
  // Safety
  LEAK_SENSOR: 'binary_sensor.leak_sensor_1'

VPD_TARGETS object:
  seedling: { min: 0.4, max: 0.8, optimal: 0.6 }
  early_veg: { min: 0.8, max: 1.0, optimal: 0.9 }
  late_veg: { min: 1.0, max: 1.2, optimal: 1.1 }
  flower: { min: 1.0, max: 1.5, optimal: 1.2 }

TEMP_TARGETS object:
  day: { min: 75, max: 82, target: 80 }
  night: { min: 68, max: 72, target: 70 }

HUMIDITY_TARGETS object:
  seedling: { min: 65, max: 75, optimal: 70 }

Export all constants.
```

### ✅ Validation 2.1
- [ ] File created at src/types/entities.js
- [ ] All ENTITIES match the entity IDs in MANIFEST.md
- [ ] No typos in entity IDs (critical!)

---

## Prompt 2.2: WebSocket Service

```
In C:\Users\russe\Documents\Grow\dashboard\src\services\, create ha-websocket.js:

Create a HAWebSocket class that:

1. Constructor initializes:
   - ws = null
   - messageId counter starting at 1
   - pendingRequests Map
   - stateListeners Set
   - connectionListeners Set
   - reconnect settings (max 10 attempts, exponential backoff)

2. connect() method:
   - Builds WebSocket URL from VITE_HA_URL (replace http with ws, add /api/websocket)
   - Returns Promise that resolves on auth_ok, rejects on auth_invalid
   - Handles: auth_required, auth_ok, auth_invalid, result, event messages

3. sendAuth() - sends auth message with VITE_HA_TOKEN

4. sendMessage(message) - adds ID, returns Promise, handles timeout (10s)

5. subscribeToStates() - subscribes to state_changed events

6. getStates() - returns all entity states

7. callService(domain, service, data) - calls HA services

8. State and connection listeners (add/remove/notify methods)

9. attemptReconnect() with exponential backoff

10. disconnect() cleanup method

Export singleton instance: export const haWebSocket = new HAWebSocket()

Add console.log statements prefixed with [HA-WS] for debugging.
```

### ✅ Validation 2.2
- [ ] File created at src/services/ha-websocket.js
- [ ] Uses import.meta.env.VITE_HA_URL
- [ ] Uses import.meta.env.VITE_HA_TOKEN
- [ ] Singleton exported

---

## Prompt 2.3: useHomeAssistant Hook

```
In C:\Users\russe\Documents\Grow\dashboard\src\hooks\, create useHomeAssistant.js:

Create a custom React hook that:

1. State:
   - connectionStatus: 'disconnected' | 'connected' | 'error'
   - entities: {} object keyed by entity_id
   - error: null | Error
   - isLoading: true initially

2. useEffect on mount:
   - Import and use haWebSocket from services
   - Add connection listener (updates connectionStatus)
   - Add state listener (updates entities on state_changed)
   - Call connect(), then subscribeToStates(), then getStates()
   - Populate entities from initial getStates()
   - Set isLoading false
   - Cleanup: disconnect on unmount
   - Use useRef to prevent double-init in StrictMode

3. Helper functions:
   - callService(domain, service, data) - wrapper with error handling
   - toggleSwitch(entityId) - toggles switch based on current state
   - setHeaterTemp(temperature) - sets climate.tent_heater temp
   - setFanMode(mode) - sets exhaust fan select option
   - setHumidifierMode(mode) - sets CloudForge T5 select option (IMPORTANT for VPD control)

4. Convenience getters using ENTITIES constants:
   - temperature, humidity, vpd (parsed as floats)
   - lightState, heaterState, fanMode, humidifierMode

5. Return object with all state and functions

Import ENTITIES from '../types/entities'
```

### ✅ Validation 2.3
- [ ] File created at src/hooks/useHomeAssistant.js
- [ ] Imports haWebSocket and ENTITIES
- [ ] setHumidifierMode function exists (critical for VPD control!)

---

## Prompt 2.4: Context Provider

```
In C:\Users\russe\Documents\Grow\dashboard\src\context\, create HomeAssistantContext.jsx:

1. Create HomeAssistantContext using createContext(null)

2. Create HomeAssistantProvider component:
   - Uses useHomeAssistant() hook
   - Provides value to context
   - Renders children

3. Create useHA() hook:
   - Gets context with useContext
   - Throws error if used outside provider
   - Returns context value

Export: HomeAssistantProvider, useHA
```

### ✅ Validation 2.4
```bash
npm run dev
```
Update src/App.jsx to wrap content in HomeAssistantProvider and use useHA():
- Should show "Connected" or "Disconnected" status
- Check browser console for [HA-WS] logs
- [ ] No console errors
- [ ] Connection status shows
- [ ] Stop dev server

---

# Phase 3: Core UI Components

## Prompt 3.1: KPI Card Component

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create KPICard.jsx:

A glowing card that displays sensor values with status-based styling.

Props:
- label: string (e.g., "Temperature")
- value: number | null
- unit: string (e.g., "°F")
- min: number (acceptable minimum)
- max: number (acceptable maximum)
- optimal: number (target value)
- icon: Lucide icon component (optional)
- precision: number (decimal places, default 1)

Features:
1. getStatus(value, min, max) helper:
   - Returns 'offline' if value null
   - Returns 'optimal' if within min-max
   - Returns 'caution' if within 50% of range outside bounds
   - Returns 'critical' if further out

2. Status-based styling:
   - optimal: border-optimal/40, shadow-glow-green
   - caution: border-caution/40, shadow-glow-amber
   - critical: border-critical/40, shadow-glow-red, animate-pulse on dot
   - offline: border-zinc-700

3. Layout:
   - Header: icon + label + status dot
   - Value: large mono font with unit
   - Range indicator bar showing current position
   - Min/Max/Target labels below bar

Use Tailwind classes from our config. Make it look like a command center gauge.
```

### ✅ Validation 3.1
- [ ] File created at src/components/KPICard.jsx
- [ ] Status logic handles all cases
- [ ] Glowing border classes applied

---

## Prompt 3.2: Toggle Switch Component

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create ToggleSwitch.jsx:

A sleek toggle switch for controlling devices.

Props:
- label: string
- isOn: boolean
- onToggle: async function
- disabled: boolean (optional)
- icon: Lucide icon component (optional)

Features:
1. Local isLoading state for async operations
2. handleToggle:
   - Sets isLoading true
   - Calls onToggle (awaits it)
   - Sets isLoading false in finally block

3. Styling:
   - Pill-shaped toggle (w-14 h-7)
   - ON: bg-neon-green/20, border-neon-green/50, shadow-glow-green
   - OFF: bg-zinc-800, border-zinc-700
   - Knob slides left/right with transition
   - Loading: animate-pulse on knob
   - Disabled: opacity-50, cursor-not-allowed

4. Container shows icon (colored by state) and label on left, toggle on right
```

### ✅ Validation 3.2
- [ ] File created at src/components/ToggleSwitch.jsx
- [ ] Async handling works (no errors on rapid clicks)

---

## Prompt 3.3: Humidifier Control Component (PRIORITY!)

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create HumidifierControl.jsx:

A PROMINENT control panel for the CloudForge T5 - this is critical for VPD management!

Props:
- currentMode: string ('On', 'Off', 'Auto')
- onModeChange: async function(mode)
- currentVPD: number
- currentHumidity: number
- targetVPD: { min, max, optimal }
- targetHumidity: { min, max, optimal }

Features:
1. Large card with special styling - make it stand out!
   - Use ice-blue accent color
   - Larger than other cards
   - "💨 Humidity Control" header

2. Current readings display:
   - VPD with status color (critical if > 1.0 for seedling)
   - Humidity % with status color
   - Clear "TARGET" vs "CURRENT" labels

3. Mode selector (3 large buttons):
   - ON: Forces humidifier on
   - OFF: Forces humidifier off  
   - AUTO: (future - VPD-based automation)
   - Active mode has neon-green glow

4. Status message:
   - If VPD > target.max: "⚠️ VPD HIGH - Consider turning ON"
   - If humidity < target.min: "⚠️ HUMIDITY LOW - Consider turning ON"
   - If in range: "✅ Climate in range"

5. Quick stats row:
   - "VPD Target: 0.4-0.8 kPa"
   - "Humidity Target: 65-75%"

Make this the HERO component of the dashboard - it's what they'll use most!
```

### ✅ Validation 3.3
- [ ] File created at src/components/HumidifierControl.jsx
- [ ] Shows current VPD and humidity
- [ ] Mode buttons work
- [ ] Status messages display correctly

---

## Prompt 3.4: Schedule Display Component

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create ScheduleDisplay.jsx:

Visual timeline showing the 20/4 light schedule.

Props:
- lightsOnTime: string ('06:00')
- lightsOffTime: string ('02:00')
- currentLightState: 'on' | 'off'

Features:
1. 24-hour timeline bar (horizontal)
2. Light period highlighted in neon-green/20
3. Dark period in zinc-900
4. ON marker at 6 AM, OFF marker at 2 AM
5. Current time indicator (moving line)
6. Shows "20h ON / 4h OFF" summary
7. Current state badge: "💡 LIGHTS ON" or "🌙 LIGHTS OFF"

No draggable handles needed - just display. Automations control the schedule.
```

### ✅ Validation 3.4
- [ ] File created at src/components/ScheduleDisplay.jsx
- [ ] Timeline renders correctly
- [ ] Current state shows

---

## Prompt 3.5: Component Index

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create index.js:

Export all components:
- KPICard
- ToggleSwitch
- HumidifierControl
- ScheduleDisplay

This allows clean imports like:
import { KPICard, ToggleSwitch } from './components'
```

### ✅ Validation 3.5
```bash
npm run dev
```
- [ ] No import errors
- [ ] Components can be imported from './components'

---

# Phase 4: Main Dashboard Assembly

## Prompt 4.1: Dashboard Layout

```
In C:\Users\russe\Documents\Grow\dashboard\src\, update App.jsx:

Build the complete dashboard layout:

1. Imports:
   - HomeAssistantProvider, useHA from context
   - All components from ./components
   - ENTITIES, VPD_TARGETS, TEMP_TARGETS, HUMIDITY_TARGETS from types
   - Lucide icons: Thermometer, Droplets, Gauge, Lightbulb, Fan, Wind

2. Dashboard component (inside provider):
   
   a. Get from useHA():
      - isConnected, isLoading, error
      - temperature, humidity, vpd
      - lightState, fanMode, humidifierMode
      - entities (for intake fan state)
      - toggleSwitch, setFanMode, setHumidifierMode

   b. Loading state: spinner + "Connecting to Home Assistant..."
   
   c. Error state: red card with error message
   
   d. Main layout (responsive grid):
      
      HEADER ROW:
      - Title: "🌿 Project: Plausible Deniability"
      - Subtitle: "GrowOp Command Center • Seedling Stage"
      - Connection indicator (green/red dot)
      
      KPI ROW (3 columns on desktop):
      - Temperature KPICard
      - Humidity KPICard  
      - VPD KPICard
      
      CONTROL ROW (2 columns):
      - LEFT (lg:col-span-2): HumidifierControl (HERO - prominent!)
      - RIGHT: ScheduleDisplay
      
      DEVICE ROW (3 columns):
      - Grow Light toggle
      - Intake Fan toggle
      - Exhaust Fan mode selector (On/Off/Auto buttons)
      
      FOOTER:
      - "Project: Plausible Deniability v1.0.0"

3. App component wraps Dashboard in HomeAssistantProvider

Use responsive classes: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
Gap: gap-4 md:gap-6
Padding: p-4 md:p-6
```

### ✅ Validation 4.1
```bash
npm run dev
```
- [ ] Dashboard renders without errors
- [ ] KPI cards show live values from HA
- [ ] Humidifier control is prominent and visible
- [ ] Light toggle works (turn off/on)
- [ ] Schedule displays correctly
- [ ] Responsive on mobile (shrink browser window)
- [ ] Connection status accurate

---

# Phase 5: Final Polish & Deployment

## Prompt 5.1: Error Boundary

```
In C:\Users\russe\Documents\Grow\dashboard\src\components\, create ErrorBoundary.jsx:

React error boundary class component:

1. State: hasError, error

2. static getDerivedStateFromError(error) - sets hasError true

3. componentDidCatch(error, errorInfo) - logs to console

4. Render:
   - If hasError: dark card with error message and "Reload Dashboard" button
   - Otherwise: render children

Update main.jsx to wrap App in ErrorBoundary.
```

### ✅ Validation 5.1
- [ ] ErrorBoundary created
- [ ] main.jsx updated

---

## Prompt 5.2: Create Deploy Script

```
In C:\Users\russe\Documents\Grow\dashboard\, create deploy.ps1 (PowerShell for Windows):

Script that:
1. Runs npm run build
2. Shows instructions for copying to Pi:
   
   "Build complete! To deploy:"
   "1. Open WinSCP or use scp"
   "2. Connect to 100.65.202.84 (via Tailscale)"
   "3. Copy contents of dist\ to /config/www/grow-dashboard/"
   "4. Access at: http://100.65.202.84:8123/local/grow-dashboard/index.html"

Also create a DEPLOYMENT.md with:
- Full deployment steps
- How to add to HA sidebar (panel_custom config)
- Troubleshooting tips
```

### ✅ Validation 5.2
```bash
npm run build
```
- [ ] Build completes without errors
- [ ] dist/ folder created with index.html and assets/

---

## Prompt 5.3: Final Testing Checklist

```
Create a TESTING.md file with this checklist for manual verification:

## Pre-Deployment Tests

### Connection
- [ ] Dashboard connects to HA (green dot)
- [ ] Reconnects after HA restart
- [ ] Shows error state if HA unreachable

### Sensors
- [ ] Temperature displays and updates
- [ ] Humidity displays and updates
- [ ] VPD displays and updates
- [ ] Values match HA dashboard

### Controls
- [ ] Light toggle turns light on/off
- [ ] Intake fan toggle works
- [ ] Exhaust fan mode selector works
- [ ] Humidifier mode selector works (CRITICAL)

### Visual
- [ ] KPI cards glow based on status
- [ ] Critical values show red
- [ ] Schedule timeline correct
- [ ] Mobile responsive

### Humidifier Control (PRIORITY)
- [ ] Shows current VPD
- [ ] Shows current humidity
- [ ] Mode buttons change humidifier state in HA
- [ ] Status message shows warnings when out of range
```

### ✅ Validation 5.3
Work through the testing checklist!

---

# 🎉 Completion Checklist

- [ ] Phase 1: Project scaffolding complete, npm run dev works
- [ ] Phase 2: HA connection working, entities loading
- [ ] Phase 3: All UI components created
- [ ] Phase 4: Dashboard assembled and functional
- [ ] Phase 5: Error handling, deployment ready
- [ ] All tests pass
- [ ] Humidifier control works (can manage VPD!)

---

## Quick Commands Reference

```bash
# Development
cd C:\Users\russe\Documents\Grow\dashboard
npm install          # First time only
npm run dev          # Start dev server (localhost:5173)

# Production
npm run build        # Creates dist/ folder
npm run preview      # Test production build locally

# Deploy (after build)
# Copy dist/* to Pi:/config/www/grow-dashboard/
```

---

## Troubleshooting

### "WebSocket connection failed"
- Check .env has correct VITE_HA_URL and VITE_HA_TOKEN
- Verify Tailscale is connected
- Check HA is running: http://100.65.202.84:8123

### "Entity undefined"
- Verify entity ID in src/types/entities.js
- Use MCP get_entity to confirm exact ID

### "Component not rendering"
- Check browser console for errors
- Verify imports in App.jsx

### Values not updating
- Check WebSocket connection in browser Network tab
- Look for [HA-WS] logs in console

---

*Work through each prompt sequentially. Don't skip validation steps!*
