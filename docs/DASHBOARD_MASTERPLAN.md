# 🕵️ Project: Plausible Deniability
## Dashboard Master Implementation Plan

**Codename:** Plausible Deniability  
**Version:** 1.0.0  
**Last Updated:** 2026-01-18  
**Architect:** GrowOp AI  
**Investigation Status:** ✅ Complete (2026-01-18)  

---

## 📊 Pre-Flight: Entity Reference (From MANIFEST.md)

Before implementation, here are the exact Entity IDs we'll be visualizing:

### Critical Sensors (KPI Cards)
| Metric | Entity ID | Current State | Target (Seedling) |
|--------|-----------|---------------|-------------------|
| Temperature | `sensor.ac_infinity_controller_69_pro_temperature` | 78.1°F | 75-78°F |
| Humidity | `sensor.ac_infinity_controller_69_pro_humidity` | 35.1% | 65-75% |
| VPD | `sensor.ac_infinity_controller_69_pro_vpd` | 2.33 kPa | 0.4-0.8 kPa |

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Updated current sensor values from live MCP data -->
<!-- Reason: Temperature improved to target range, humidity/VPD still critical -->

### Control Entities (Toggle Switches)
| Device | Entity ID | Type | Current State | Status |
|--------|-----------|------|---------------|--------|
| Grow Light | `switch.light` | switch | ON | ✅ Available |
| **CloudForge T5 Humidifier** | `select.cloudforge_t5_active_mode` | select | "Off" | ✅ Available |
| Intake Fan | `switch.intake_air` | switch | ON | ✅ Available |
| Exhaust Fan | `select.exhaust_fan_active_mode` | select | "On" | ✅ Available |
| Heater | `climate.tent_heater` | climate | heat | ✅ Available |
| Leak Sensor | `binary_sensor.leak_sensor_1` | binary_sensor | off (no leak) | ✅ Available |

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Added leak sensor, verified all control entities available -->
<!-- Reason: Complete entity validation from investigation -->

### Power Monitoring
| Device | Entity ID | Current Value | Status |
|--------|-----------|---------------|--------|
| Light Power | `sensor.light_power` | 96.4 W | ✅ Available |
| Intake Power | `sensor.intake_air_power` | 16.8 W | ✅ Available |
| Space Heater Power | `sensor.space_heater_power` | 0.0 W | ✅ Available (heater off) |

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Added space heater power monitoring -->
<!-- Reason: Discovered during entity investigation -->

### Schedule Reference
| Event | Time | Entity | Automation |
|-------|------|--------|------------|
| Lights ON | 06:00 | `switch.light` | `automation.grow_light_control` ✅ |
| Lights OFF | 02:00 | `switch.light` | `automation.grow_light_control` ✅ |
| Day Temp | 06:00 | `climate.tent_heater` → 80°F | `automation.tent_temperature_modulation` ✅ |
| Night Temp | 02:00 | `climate.tent_heater` → 70°F | `automation.tent_temperature_modulation` ✅ |

**Automation Status:** All Phase 1 automations deployed and active

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Added automation entity IDs and verified deployment status -->
<!-- Reason: Confirmed automations exist and are active via MCP -->

### Connection Details
```yaml
ha_url: "http://100.65.202.84:8123"
ws_url: "ws://100.65.202.84:8123/api/websocket"
api_base: "http://100.65.202.84:8123/api"
```

**Access Method:** Tailscale VPN  
**MCP Connection:** ✅ Verified working  
**Long-Lived Token:** Required (stored in `.cursor/mcp.json`)

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Added connection verification notes -->
<!-- Reason: Confirmed MCP access working during investigation -->

---

## 🎨 Design System: "Batcave Botanics"

### Color Palette (Tailwind Config)
```javascript
colors: {
  // Backgrounds
  'void': '#09090b',         // bg-zinc-950 equivalent
  'abyss': '#18181b',        // bg-zinc-900
  'slate-deep': '#27272a',   // bg-zinc-800
  
  // Status Colors
  'optimal': '#22c55e',      // Green - VPD in range
  'caution': '#f59e0b',      // Amber - approaching limits
  'critical': '#ef4444',     // Red - out of range
  'dormant': '#6b7280',      // Gray - device off
  
  // Accents
  'neon-green': '#4ade80',   // Active glow
  'neon-amber': '#fbbf24',   // Warning glow
  'ice-blue': '#38bdf8',     // Temperature accent
  'leaf-green': '#84cc16',   // Plant health
}
```

### Typography
- **Headers:** Inter (Bold)
- **Body:** JetBrains Mono (for that "command center" feel)
- **Numbers:** Tabular figures for sensor readouts

---

# 📦 Phase 1: Scaffolding & Configuration

## Objective
Initialize the Vite + React + Tailwind project with proper configuration for Home Assistant panel deployment.

## 🎯 Cursor Prompt

```
Create a new React + Vite project for a Home Assistant custom dashboard.

Requirements:
1. Initialize with: npm create vite@latest grow-dashboard -- --template react
2. Install dependencies: tailwindcss, postcss, autoprefixer, home-assistant-js-websocket
3. Configure Tailwind with a custom "mysterious dark" theme
4. Set vite.config.js for relative paths (base: './')
5. Create initial folder structure for components, hooks, services

Project name: grow-dashboard
Node version: 18+

After scaffolding, generate:
- tailwind.config.js with custom colors (void, abyss, optimal, caution, critical, neon-green)
- A basic App.jsx with dark background placeholder
- A .env.example file for HA_URL and HA_TOKEN
```

## 📁 File Structure Created

```
grow-dashboard/
├── public/
│   └── vite.svg
├── src/
│   ├── components/
│   │   └── .gitkeep
│   ├── hooks/
│   │   └── .gitkeep
│   ├── services/
│   │   └── .gitkeep
│   ├── utils/
│   │   └── .gitkeep
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

## 📄 Key Configuration Files

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Relative paths for HA panel_custom
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: undefined, // Single bundle for simplicity
      },
    },
  },
  server: {
    port: 5173,
    host: true, // Allow network access for testing
  },
})
```

### tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'void': '#09090b',
        'abyss': '#18181b',
        'slate-deep': '#27272a',
        
        // Status Colors
        'optimal': '#22c55e',
        'caution': '#f59e0b',
        'critical': '#ef4444',
        'dormant': '#6b7280',
        
        // Accents
        'neon-green': '#4ade80',
        'neon-amber': '#fbbf24',
        'ice-blue': '#38bdf8',
        'leaf-green': '#84cc16',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(74, 222, 128, 0.3)',
        'glow-amber': '0 0 20px rgba(251, 191, 36, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-blue': '0 0 20px rgba(56, 189, 248, 0.3)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(74, 222, 128, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(74, 222, 128, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
```

### .env.example
```bash
# Home Assistant Connection
VITE_HA_URL=http://100.65.202.84:8123
VITE_HA_TOKEN=your_long_lived_access_token_here

# Dashboard Config
VITE_GROWTH_STAGE=seedling
VITE_VPD_MIN=0.4
VITE_VPD_MAX=0.8
```

### src/index.css
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-void text-gray-100 font-sans antialiased;
  }
  
  /* Custom scrollbar for that sleek look */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    @apply bg-abyss;
  }
  
  ::-webkit-scrollbar-thumb {
    @apply bg-slate-deep rounded-full;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-zinc-600;
  }
}

@layer components {
  .card {
    @apply bg-abyss rounded-xl border border-zinc-800 p-4 shadow-lg;
  }
  
  .card-glow-optimal {
    @apply border-optimal/30 shadow-glow-green;
  }
  
  .card-glow-caution {
    @apply border-caution/30 shadow-glow-amber;
  }
  
  .card-glow-critical {
    @apply border-critical/30 shadow-glow-red;
  }
  
  .sensor-value {
    @apply font-mono text-4xl font-semibold tracking-tight;
  }
  
  .sensor-label {
    @apply text-sm text-zinc-400 uppercase tracking-wider;
  }
}
```

### src/App.jsx (Initial)
```jsx
function App() {
  return (
    <div className="min-h-screen bg-void p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">
          🌿 Project: Plausible Deniability
        </h1>
        <p className="text-zinc-500 mt-1">
          GrowOp Command Center • Seedling Stage
        </p>
      </header>
      
      <main className="grid gap-6">
        {/* Phase 2+ components will go here */}
        <div className="card">
          <p className="text-zinc-400">
            Dashboard initializing... Connect to Home Assistant in Phase 2.
          </p>
        </div>
      </main>
    </div>
  )
}

export default App
```

## ✅ Validation Step

```bash
# 1. Initialize project
npm create vite@latest grow-dashboard -- --template react
cd grow-dashboard

# 2. Install dependencies
npm install
npm install -D tailwindcss postcss autoprefixer
npm install home-assistant-js-websocket recharts date-fns

# 3. Initialize Tailwind
npx tailwindcss init -p

# 4. Copy config files from above

# 5. Start dev server
npm run dev

# 6. Verify
# - Open http://localhost:5173
# - Should see dark background with "Project: Plausible Deniability" header
# - Check browser console for no errors
```

---

# 🔌 Phase 2: The Home Assistant Connection

## Objective
Create a robust WebSocket connection hook with authentication, state subscription, and service calling capabilities.

## 🎯 Cursor Prompt

```
Create a Home Assistant WebSocket connection system for my React dashboard.

Requirements:
1. Create a custom hook `useHomeAssistant.js` that:
   - Connects to HA WebSocket API
   - Authenticates with Long-Lived Access Token
   - Subscribes to state changes for specific entities
   - Provides methods to call services
   - Handles reconnection on disconnect
   - Returns connection status, entities state, and error state

2. Create TypeScript-style interfaces (as JSDoc) for these entities:
   - sensor.ac_infinity_controller_69_pro_temperature (°F)
   - sensor.ac_infinity_controller_69_pro_humidity (%)
   - sensor.ac_infinity_controller_69_pro_vpd (kPa)
   - switch.light (on/off)
   - switch.intake_air (on/off)
   - climate.tent_heater (hvac_mode, temperature)
   - select.exhaust_fan_active_mode (On/Off/Auto)

3. Create a `ha-api.js` service for REST API calls (history, etc.)

4. Create a React Context provider for global HA state access

HA URL: http://100.65.202.84:8123
WebSocket: ws://100.65.202.84:8123/api/websocket
```

## 📁 Files Created/Modified

```
src/
├── hooks/
│   └── useHomeAssistant.js
├── services/
│   ├── ha-api.js
│   └── ha-websocket.js
├── context/
│   └── HomeAssistantContext.jsx
├── types/
│   └── entities.js
└── App.jsx (modified)
```

## 📄 Key Files

### src/types/entities.js
```javascript
/**
 * Entity type definitions for the Grow Dashboard
 * Based on MANIFEST.md entity registry
 */

/**
 * @typedef {Object} ClimateEntity
 * @property {string} entity_id
 * @property {string} state - 'heat' | 'off'
 * @property {Object} attributes
 * @property {number} attributes.temperature - Target temperature
 * @property {number} attributes.current_temperature
 * @property {string[]} attributes.hvac_modes
 * @property {string} attributes.hvac_action - 'heating' | 'idle'
 */

/**
 * @typedef {Object} SwitchEntity
 * @property {string} entity_id
 * @property {string} state - 'on' | 'off'
 * @property {Object} attributes
 * @property {string} attributes.friendly_name
 */

/**
 * @typedef {Object} SensorEntity
 * @property {string} entity_id
 * @property {string} state - Numeric value as string
 * @property {Object} attributes
 * @property {string} attributes.unit_of_measurement
 * @property {string} attributes.friendly_name
 */

/**
 * @typedef {Object} SelectEntity
 * @property {string} entity_id
 * @property {string} state - Current option
 * @property {Object} attributes
 * @property {string[]} attributes.options
 */

// Entity ID constants for type safety
export const ENTITIES = {
  // Climate Sensors
  TEMPERATURE: 'sensor.ac_infinity_controller_69_pro_temperature',
  HUMIDITY: 'sensor.ac_infinity_controller_69_pro_humidity',
  VPD: 'sensor.ac_infinity_controller_69_pro_vpd',
  
  // Control Devices
  LIGHT: 'switch.light',
  INTAKE_FAN: 'switch.intake_air',
  HEATER: 'climate.tent_heater',
  EXHAUST_FAN_MODE: 'select.exhaust_fan_active_mode',
  HUMIDIFIER_MODE: 'select.cloudforge_t5_active_mode',  // CloudForge T5
  
  // Power Monitoring
  LIGHT_POWER: 'sensor.light_power',
  INTAKE_POWER: 'sensor.intake_air_power',
  HEATER_POWER: 'sensor.space_heater_power',
  
  // Safety
  LEAK_SENSOR: 'binary_sensor.leak_sensor_1',
  LEAK_BATTERY: 'sensor.leak_sensor_1_battery',
  
  // Secondary Sensors (optional)
  GROW_ROOM_TEMP: 'sensor.sensor_grow_room_temperature_and_humidity_temperature',
  GROW_ROOM_HUMIDITY: 'sensor.sensor_grow_room_temperature_and_humidity_humidity',
  
  // Humidifier Status
  HUMIDIFIER_STATE: 'binary_sensor.cloudforge_t5_state',
  HUMIDIFIER_STATUS: 'binary_sensor.cloudforge_t5_status',
};

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Added heater power, leak battery, and secondary grow room sensors -->
<!-- Reason: Discovered additional monitoring entities during investigation -->

// VPD Target zones by growth stage
export const VPD_TARGETS = {
  seedling: { min: 0.4, max: 0.8, optimal: 0.6 },
  early_veg: { min: 0.8, max: 1.0, optimal: 0.9 },
  late_veg: { min: 1.0, max: 1.2, optimal: 1.1 },
  early_flower: { min: 1.0, max: 1.4, optimal: 1.2 },
  late_flower: { min: 1.2, max: 1.5, optimal: 1.35 },
};

// Temperature targets (verified from automation)
export const TEMP_TARGETS = {
  day: { min: 75, max: 82, target: 80 },  // Lights on: 6 AM - 2 AM
  night: { min: 68, max: 72, target: 70 },  // Lights off: 2 AM - 6 AM
};

<!-- INVESTIGATION UPDATE: 2026-01-18 -->
<!-- Changed: Added schedule context to temperature targets -->
<!-- Reason: Verified schedule times match automation configuration -->

// Humidity targets (seedling)
export const HUMIDITY_TARGETS = {
  seedling: { min: 65, max: 75, optimal: 70 },
};
```

### src/services/ha-websocket.js
```javascript
/**
 * Home Assistant WebSocket Connection Manager
 * Handles authentication, subscription, and reconnection
 */

const WS_URL = import.meta.env.VITE_HA_URL?.replace('http', 'ws') + '/api/websocket';
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

class HAWebSocket {
  constructor() {
    this.ws = null;
    this.messageId = 1;
    this.pendingRequests = new Map();
    this.stateListeners = new Set();
    this.connectionListeners = new Set();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.isAuthenticated = false;
  }

  /**
   * Connect to Home Assistant WebSocket
   * @returns {Promise<void>}
   */
  async connect() {
    return new Promise((resolve, reject) => {
      console.log('[HA-WS] Connecting to:', WS_URL);
      
      this.ws = new WebSocket(WS_URL);
      
      this.ws.onopen = () => {
        console.log('[HA-WS] Connection opened');
        this.reconnectAttempts = 0;
      };
      
      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleMessage(message, resolve, reject);
      };
      
      this.ws.onerror = (error) => {
        console.error('[HA-WS] WebSocket error:', error);
        this.notifyConnectionListeners('error', error);
        reject(error);
      };
      
      this.ws.onclose = () => {
        console.log('[HA-WS] Connection closed');
        this.isAuthenticated = false;
        this.notifyConnectionListeners('disconnected');
        this.attemptReconnect();
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  async handleMessage(message, resolve, reject) {
    switch (message.type) {
      case 'auth_required':
        console.log('[HA-WS] Authentication required');
        this.sendAuth();
        break;
        
      case 'auth_ok':
        console.log('[HA-WS] Authentication successful');
        this.isAuthenticated = true;
        this.notifyConnectionListeners('connected');
        resolve();
        break;
        
      case 'auth_invalid':
        console.error('[HA-WS] Authentication failed:', message.message);
        this.notifyConnectionListeners('auth_failed', message.message);
        reject(new Error(message.message));
        break;
        
      case 'result':
        this.handleResult(message);
        break;
        
      case 'event':
        if (message.event?.event_type === 'state_changed') {
          this.handleStateChange(message.event.data);
        }
        break;
        
      default:
        console.log('[HA-WS] Unhandled message type:', message.type);
    }
  }

  /**
   * Send authentication message
   */
  sendAuth() {
    this.ws.send(JSON.stringify({
      type: 'auth',
      access_token: HA_TOKEN,
    }));
  }

  /**
   * Send a message and wait for response
   * @param {Object} message
   * @returns {Promise<any>}
   */
  async sendMessage(message) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      message.id = id;
      
      this.pendingRequests.set(id, { resolve, reject });
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 10000);
      
      this.ws.send(JSON.stringify(message));
    });
  }

  /**
   * Handle result messages
   */
  handleResult(message) {
    const pending = this.pendingRequests.get(message.id);
    if (pending) {
      this.pendingRequests.delete(message.id);
      if (message.success) {
        pending.resolve(message.result);
      } else {
        pending.reject(new Error(message.error?.message || 'Unknown error'));
      }
    }
  }

  /**
   * Handle state change events
   */
  handleStateChange(data) {
    const { entity_id, new_state } = data;
    this.stateListeners.forEach(listener => {
      listener(entity_id, new_state);
    });
  }

  /**
   * Subscribe to state changes
   * @returns {Promise<void>}
   */
  async subscribeToStates() {
    return this.sendMessage({
      type: 'subscribe_events',
      event_type: 'state_changed',
    });
  }

  /**
   * Get all states
   * @returns {Promise<Object[]>}
   */
  async getStates() {
    return this.sendMessage({
      type: 'get_states',
    });
  }

  /**
   * Call a service
   * @param {string} domain - e.g., 'switch', 'climate'
   * @param {string} service - e.g., 'turn_on', 'set_temperature'
   * @param {Object} data - Service data
   * @returns {Promise<any>}
   */
  async callService(domain, service, data = {}) {
    return this.sendMessage({
      type: 'call_service',
      domain,
      service,
      service_data: data,
    });
  }

  /**
   * Add state change listener
   * @param {Function} listener
   */
  addStateListener(listener) {
    this.stateListeners.add(listener);
  }

  /**
   * Remove state change listener
   * @param {Function} listener
   */
  removeStateListener(listener) {
    this.stateListeners.delete(listener);
  }

  /**
   * Add connection status listener
   * @param {Function} listener
   */
  addConnectionListener(listener) {
    this.connectionListeners.add(listener);
  }

  /**
   * Notify connection listeners
   */
  notifyConnectionListeners(status, data = null) {
    this.connectionListeners.forEach(listener => {
      listener(status, data);
    });
  }

  /**
   * Attempt to reconnect
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[HA-WS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[HA-WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(err => {
        console.error('[HA-WS] Reconnection failed:', err);
      });
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Singleton instance
export const haWebSocket = new HAWebSocket();
```

### src/hooks/useHomeAssistant.js
```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import { haWebSocket } from '../services/ha-websocket';
import { ENTITIES } from '../types/entities';

/**
 * Custom hook for Home Assistant connection and state management
 * @returns {Object} HA connection state and methods
 */
export function useHomeAssistant() {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [entities, setEntities] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // Initialize connection
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        // Add connection listener
        haWebSocket.addConnectionListener((status, data) => {
          setConnectionStatus(status);
          if (status === 'auth_failed') {
            setError(new Error(data || 'Authentication failed'));
          }
        });

        // Add state listener
        haWebSocket.addStateListener((entityId, newState) => {
          setEntities(prev => ({
            ...prev,
            [entityId]: newState,
          }));
        });

        // Connect
        await haWebSocket.connect();

        // Subscribe to state changes
        await haWebSocket.subscribeToStates();

        // Get initial states
        const states = await haWebSocket.getStates();
        const stateMap = {};
        states.forEach(state => {
          stateMap[state.entity_id] = state;
        });
        setEntities(stateMap);
        setIsLoading(false);

      } catch (err) {
        console.error('[useHomeAssistant] Initialization error:', err);
        setError(err);
        setIsLoading(false);
      }
    };

    init();

    return () => {
      haWebSocket.disconnect();
    };
  }, []);

  /**
   * Call a Home Assistant service
   */
  const callService = useCallback(async (domain, service, data = {}) => {
    try {
      await haWebSocket.callService(domain, service, data);
    } catch (err) {
      console.error('[useHomeAssistant] Service call error:', err);
      setError(err);
      throw err;
    }
  }, []);

  /**
   * Toggle a switch entity
   */
  const toggleSwitch = useCallback(async (entityId) => {
    const entity = entities[entityId];
    if (!entity) return;
    
    const service = entity.state === 'on' ? 'turn_off' : 'turn_on';
    await callService('switch', service, { entity_id: entityId });
  }, [entities, callService]);

  /**
   * Set heater temperature
   */
  const setHeaterTemp = useCallback(async (temperature) => {
    await callService('climate', 'set_temperature', {
      entity_id: ENTITIES.HEATER,
      temperature,
      hvac_mode: 'heat',
    });
  }, [callService]);

  /**
   * Set exhaust fan mode
   */
  const setFanMode = useCallback(async (mode) => {
    await callService('select', 'select_option', {
      entity_id: ENTITIES.EXHAUST_FAN_MODE,
      option: mode,
    });
  }, [callService]);

  // Convenience getters for specific entities
  const getEntityValue = useCallback((entityId) => {
    const entity = entities[entityId];
    if (!entity) return null;
    return parseFloat(entity.state) || entity.state;
  }, [entities]);

  return {
    // Connection state
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isLoading,
    error,

    // Entity state
    entities,
    getEntityValue,

    // Convenience accessors
    temperature: getEntityValue(ENTITIES.TEMPERATURE),
    humidity: getEntityValue(ENTITIES.HUMIDITY),
    vpd: getEntityValue(ENTITIES.VPD),
    lightState: entities[ENTITIES.LIGHT]?.state,
    heaterState: entities[ENTITIES.HEATER]?.state,
    fanMode: entities[ENTITIES.EXHAUST_FAN_MODE]?.state,

    // Actions
    callService,
    toggleSwitch,
    setHeaterTemp,
    setFanMode,
  };
}
```

### src/context/HomeAssistantContext.jsx
```jsx
import { createContext, useContext } from 'react';
import { useHomeAssistant } from '../hooks/useHomeAssistant';

const HomeAssistantContext = createContext(null);

/**
 * Provider component for Home Assistant state
 */
export function HomeAssistantProvider({ children }) {
  const ha = useHomeAssistant();

  return (
    <HomeAssistantContext.Provider value={ha}>
      {children}
    </HomeAssistantContext.Provider>
  );
}

/**
 * Hook to access Home Assistant context
 */
export function useHA() {
  const context = useContext(HomeAssistantContext);
  if (!context) {
    throw new Error('useHA must be used within a HomeAssistantProvider');
  }
  return context;
}
```

### src/services/ha-api.js
```javascript
/**
 * Home Assistant REST API Service
 * For history, logbook, and other REST endpoints
 */

const HA_URL = import.meta.env.VITE_HA_URL;
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN;

const headers = {
  'Authorization': `Bearer ${HA_TOKEN}`,
  'Content-Type': 'application/json',
};

/**
 * Fetch entity history
 * @param {string} entityId - Entity ID
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time (optional, defaults to now)
 * @returns {Promise<Array>}
 */
export async function getEntityHistory(entityId, startTime, endTime = new Date()) {
  const start = startTime.toISOString();
  const end = endTime.toISOString();
  
  const url = `${HA_URL}/api/history/period/${start}?filter_entity_id=${entityId}&end_time=${end}`;
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`History fetch failed: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data[0] || []; // Returns array of state changes
}

/**
 * Get VPD history formatted for Recharts
 * @param {number} hours - Number of hours to fetch
 * @returns {Promise<Array>}
 */
export async function getVPDHistory(hours = 24) {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);
  
  const [vpdHistory, tempHistory, humidHistory] = await Promise.all([
    getEntityHistory('sensor.ac_infinity_controller_69_pro_vpd', startTime, endTime),
    getEntityHistory('sensor.ac_infinity_controller_69_pro_temperature', startTime, endTime),
    getEntityHistory('sensor.ac_infinity_controller_69_pro_humidity', startTime, endTime),
  ]);
  
  // Merge and format for Recharts
  const dataMap = new Map();
  
  vpdHistory.forEach(point => {
    const time = new Date(point.last_changed).getTime();
    dataMap.set(time, { 
      time, 
      timestamp: point.last_changed,
      vpd: parseFloat(point.state) || null 
    });
  });
  
  tempHistory.forEach(point => {
    const time = new Date(point.last_changed).getTime();
    const existing = dataMap.get(time) || { time, timestamp: point.last_changed };
    existing.temperature = parseFloat(point.state) || null;
    dataMap.set(time, existing);
  });
  
  humidHistory.forEach(point => {
    const time = new Date(point.last_changed).getTime();
    const existing = dataMap.get(time) || { time, timestamp: point.last_changed };
    existing.humidity = parseFloat(point.state) || null;
    dataMap.set(time, existing);
  });
  
  return Array.from(dataMap.values())
    .sort((a, b) => a.time - b.time)
    .filter(point => point.vpd !== null || point.temperature !== null || point.humidity !== null);
}

/**
 * Add entry to Home Assistant logbook
 * @param {string} message - Log message
 * @param {string} entityId - Related entity (optional)
 */
export async function addLogEntry(message, entityId = null) {
  const url = `${HA_URL}/api/logbook`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      message,
      entity_id: entityId,
      domain: 'grow_dashboard',
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Log entry failed: ${response.statusText}`);
  }
}

/**
 * Get current states for multiple entities
 * @param {string[]} entityIds
 * @returns {Promise<Object>}
 */
export async function getStates(entityIds) {
  const url = `${HA_URL}/api/states`;
  
  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error(`States fetch failed: ${response.statusText}`);
  }
  
  const allStates = await response.json();
  
  const filtered = {};
  allStates
    .filter(state => entityIds.includes(state.entity_id))
    .forEach(state => {
      filtered[state.entity_id] = state;
    });
  
  return filtered;
}
```

### Updated src/App.jsx
```jsx
import { HomeAssistantProvider, useHA } from './context/HomeAssistantContext';

function Dashboard() {
  const { 
    isConnected, 
    isLoading, 
    error,
    temperature,
    humidity,
    vpd,
    lightState,
  } = useHA();

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
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="card card-glow-critical max-w-md text-center">
          <h2 className="text-xl font-bold text-critical mb-2">Connection Error</h2>
          <p className="text-zinc-400">{error.message}</p>
          <p className="text-zinc-500 text-sm mt-4">
            Check your .env file and ensure HA is accessible.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-void p-6">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">
            🌿 Project: Plausible Deniability
          </h1>
          <p className="text-zinc-500 mt-1">
            GrowOp Command Center • Seedling Stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-optimal' : 'bg-critical'}`}></span>
          <span className="text-sm text-zinc-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      <main className="grid gap-6">
        {/* Quick Stats - Placeholder for Phase 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="sensor-label">Temperature</p>
            <p className="sensor-value text-ice-blue">
              {temperature?.toFixed(1) || '--'}°F
            </p>
          </div>
          <div className="card">
            <p className="sensor-label">Humidity</p>
            <p className="sensor-value text-caution">
              {humidity?.toFixed(1) || '--'}%
            </p>
          </div>
          <div className="card">
            <p className="sensor-label">VPD</p>
            <p className="sensor-value text-critical">
              {vpd?.toFixed(2) || '--'} kPa
            </p>
          </div>
        </div>

        {/* Light Status */}
        <div className="card">
          <p className="sensor-label">Grow Light</p>
          <p className={`text-2xl font-bold ${lightState === 'on' ? 'text-neon-green' : 'text-dormant'}`}>
            {lightState === 'on' ? '💡 ON' : '🌙 OFF'}
          </p>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <HomeAssistantProvider>
      <Dashboard />
    </HomeAssistantProvider>
  );
}

export default App;
```

## ✅ Validation Step

```bash
# 1. Create .env file with your actual token
cp .env.example .env
# Edit .env with your actual HA_TOKEN

# 2. Start dev server
npm run dev

# 3. Verify in browser:
# - Connection status shows "Connected" (green dot)
# - Temperature, Humidity, VPD values populate
# - Light status shows ON or OFF
# - No console errors

# 4. Test service calls (in browser console):
# The hook is accessible via React DevTools
```

---

# 🎛️ Phase 3: Core UI Components ("The Control Deck")

## Objective
Create the primary visual components: KPI gauge cards, toggle switches, and the schedule slider.

## 🎯 Cursor Prompt

```
Create React UI components for my grow dashboard with a "Batcave Botanics" dark theme.

Components needed:

1. **KPICard.jsx** - A glowing card for sensor display:
   - Props: label, value, unit, min, max, optimal, icon
   - Shows value in large mono font
   - Glows green/amber/red based on whether value is in optimal/warning/critical range
   - Includes a mini visual indicator bar

2. **ToggleSwitch.jsx** - Custom styled toggle for switches:
   - Props: label, isOn, onToggle, disabled, icon
   - Sleek pill-shaped toggle with glow effect when on
   - Shows loading state during service calls

3. **FanModeSelector.jsx** - Segmented control for exhaust fan:
   - Props: currentMode, onModeChange, options=['On', 'Off', 'Auto']
   - Horizontal segmented button group
   - Active segment has neon glow

4. **ScheduleSlider.jsx** - Visual time schedule control:
   - Props: lightsOnTime, lightsOffTime, onScheduleChange
   - 24-hour timeline visualization
   - Draggable handles for ON/OFF times
   - Shows photoperiod duration

5. **StatusBadge.jsx** - Small status indicator:
   - Props: status ('optimal' | 'caution' | 'critical' | 'offline'), label
   - Colored dot with label text

Use Tailwind CSS with our custom colors (void, abyss, optimal, caution, critical, neon-green, etc.)
Use Lucide React icons where appropriate.
```

## 📁 Files Created

```
src/components/
├── KPICard.jsx
├── ToggleSwitch.jsx
├── FanModeSelector.jsx
├── ScheduleSlider.jsx
├── StatusBadge.jsx
└── index.js
```

## 📄 Key Components

### src/components/KPICard.jsx
```jsx
import { useMemo } from 'react';

/**
 * Determine status based on value vs thresholds
 */
function getStatus(value, min, max, optimal) {
  if (value === null || value === undefined) return 'offline';
  if (value >= min && value <= max) return 'optimal';
  
  // Check how far out of range
  const lowerDiff = min - value;
  const upperDiff = value - max;
  const maxDiff = Math.max(lowerDiff, upperDiff);
  
  // If within 20% of the range, it's caution; otherwise critical
  const range = max - min;
  if (maxDiff <= range * 0.5) return 'caution';
  return 'critical';
}

/**
 * KPI Card with status-based glow effect
 */
export function KPICard({ 
  label, 
  value, 
  unit, 
  min, 
  max, 
  optimal,
  icon: Icon,
  precision = 1,
}) {
  const status = useMemo(() => 
    getStatus(value, min, max, optimal), 
    [value, min, max, optimal]
  );
  
  const displayValue = value !== null && value !== undefined 
    ? value.toFixed(precision) 
    : '--';

  const statusColors = {
    optimal: 'border-optimal/40 shadow-glow-green',
    caution: 'border-caution/40 shadow-glow-amber',
    critical: 'border-critical/40 shadow-glow-red',
    offline: 'border-zinc-700',
  };

  const valueColors = {
    optimal: 'text-optimal',
    caution: 'text-caution',
    critical: 'text-critical',
    offline: 'text-zinc-500',
  };

  // Calculate position on indicator bar (0-100%)
  const barPosition = useMemo(() => {
    if (value === null || value === undefined) return 50;
    const range = max - min;
    const position = ((value - min) / range) * 100;
    return Math.max(0, Math.min(100, position));
  }, [value, min, max]);

  return (
    <div className={`card ${statusColors[status]} transition-all duration-300`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="sensor-label flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4" />}
          {label}
        </span>
        <StatusDot status={status} />
      </div>

      {/* Value */}
      <div className="mb-4">
        <span className={`sensor-value ${valueColors[status]}`}>
          {displayValue}
        </span>
        <span className="text-xl text-zinc-500 ml-1">{unit}</span>
      </div>

      {/* Range Indicator Bar */}
      <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
        {/* Optimal zone highlight */}
        <div 
          className="absolute h-full bg-optimal/20"
          style={{
            left: '0%',
            width: '100%',
          }}
        />
        
        {/* Current value indicator */}
        <div 
          className={`absolute top-0 w-2 h-full rounded-full transition-all duration-500 ${
            status === 'optimal' ? 'bg-optimal' :
            status === 'caution' ? 'bg-caution' : 'bg-critical'
          }`}
          style={{ left: `calc(${barPosition}% - 4px)` }}
        />
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-zinc-600">{min}{unit}</span>
        <span className="text-xs text-zinc-500">Target: {optimal}{unit}</span>
        <span className="text-xs text-zinc-600">{max}{unit}</span>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    optimal: 'bg-optimal',
    caution: 'bg-caution',
    critical: 'bg-critical animate-pulse',
    offline: 'bg-zinc-600',
  };

  return (
    <span className={`w-2 h-2 rounded-full ${colors[status]}`} />
  );
}
```

### src/components/ToggleSwitch.jsx
```jsx
import { useState } from 'react';

/**
 * Custom toggle switch with glow effect
 */
export function ToggleSwitch({ 
  label, 
  isOn, 
  onToggle, 
  disabled = false,
  icon: Icon,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (disabled || isLoading) return;
    
    setIsLoading(true);
    try {
      await onToggle();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-abyss rounded-xl border border-zinc-800">
      <div className="flex items-center gap-3">
        {Icon && (
          <Icon className={`w-5 h-5 ${isOn ? 'text-neon-green' : 'text-zinc-500'}`} />
        )}
        <span className="font-medium text-gray-200">{label}</span>
      </div>
      
      <button
        onClick={handleToggle}
        disabled={disabled || isLoading}
        className={`
          relative w-14 h-7 rounded-full transition-all duration-300
          ${isOn 
            ? 'bg-neon-green/20 border-neon-green/50 shadow-glow-green' 
            : 'bg-zinc-800 border-zinc-700'
          }
          border
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        {/* Knob */}
        <span
          className={`
            absolute top-0.5 w-6 h-6 rounded-full transition-all duration-300
            ${isOn 
              ? 'left-7 bg-neon-green' 
              : 'left-0.5 bg-zinc-500'
            }
            ${isLoading ? 'animate-pulse' : ''}
          `}
        />
      </button>
    </div>
  );
}
```

### src/components/FanModeSelector.jsx
```jsx
import { useState } from 'react';

/**
 * Segmented control for fan mode selection
 */
export function FanModeSelector({ 
  currentMode, 
  onModeChange, 
  options = ['On', 'Off', 'Auto'],
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = async (mode) => {
    if (mode === currentMode || isLoading) return;
    
    setIsLoading(true);
    try {
      await onModeChange(mode);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-abyss rounded-xl border border-zinc-800">
      <label className="sensor-label block mb-3">Exhaust Fan Mode</label>
      
      <div className="flex bg-zinc-900 rounded-lg p-1 gap-1">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            disabled={isLoading}
            className={`
              flex-1 py-2 px-4 rounded-md font-medium text-sm transition-all duration-200
              ${currentMode === option
                ? 'bg-neon-green/20 text-neon-green border border-neon-green/30 shadow-glow-green'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }
              ${isLoading ? 'opacity-50' : ''}
            `}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### src/components/ScheduleSlider.jsx
```jsx
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
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours + minutes / 60;
  };

  const onHour = parseTime(lightsOnTime);
  const offHour = parseTime(lightsOffTime);

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
            ☀️ {photoperiod}h ON
          </span>
          <span className="text-zinc-500">
            🌙 {darkPeriod}h OFF
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
```

### src/components/StatusBadge.jsx
```jsx
/**
 * Small status indicator badge
 */
export function StatusBadge({ status, label }) {
  const styles = {
    optimal: 'bg-optimal/10 text-optimal border-optimal/30',
    caution: 'bg-caution/10 text-caution border-caution/30',
    critical: 'bg-critical/10 text-critical border-critical/30',
    offline: 'bg-zinc-800 text-zinc-500 border-zinc-700',
  };

  const dotStyles = {
    optimal: 'bg-optimal',
    caution: 'bg-caution',
    critical: 'bg-critical animate-pulse',
    offline: 'bg-zinc-600',
  };

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
      border ${styles[status]}
    `}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {label}
    </span>
  );
}
```

### src/components/index.js
```javascript
export { KPICard } from './KPICard';
export { ToggleSwitch } from './ToggleSwitch';
export { FanModeSelector } from './FanModeSelector';
export { ScheduleSlider } from './ScheduleSlider';
export { StatusBadge } from './StatusBadge';
```

## ✅ Validation Step

```bash
# 1. Install Lucide icons
npm install lucide-react

# 2. Update App.jsx to use new components
# (See Phase 3 integration code below)

# 3. Run dev server
npm run dev

# 4. Verify:
# - KPI cards show with proper colors based on status
# - Toggle switches animate on click
# - Schedule slider shows correct light periods
# - No console errors
```

---

# 📈 Phase 4: Data Visualization ("The Time Machine")

## Objective
Integrate Recharts for historical data visualization with VPD target zone overlays.

## 🎯 Cursor Prompt

```
Create a Recharts-based history visualization component for VPD, temperature, and humidity.

Requirements:
1. **VPDHistoryChart.jsx** component that:
   - Fetches data from HA History API (via ha-api.js)
   - Shows 24h/7d/30d time range selector
   - Displays VPD line with color gradient (green in optimal, red in critical)
   - Overlays "Ghost Lines" for target zones (seedling: 0.4-0.8 kPa)
   - Shows temperature and humidity as secondary lines (optional toggle)
   - Custom tooltip showing all values at hover point

2. **ClimateHistoryChart.jsx** for temp/humidity correlation:
   - Dual Y-axis (temperature left, humidity right)
   - Area fill between current and target ranges

3. Use these Recharts components:
   - AreaChart, LineChart
   - XAxis, YAxis with custom formatters
   - Tooltip with custom content
   - ReferenceArea for target zones
   - ResponsiveContainer

4. Create a **useHistoryData.js** hook that:
   - Fetches and caches history data
   - Auto-refreshes every 5 minutes
   - Handles loading and error states

Style with our dark theme colors.
```

## 📁 Files Created

```
src/components/
├── charts/
│   ├── VPDHistoryChart.jsx
│   ├── ClimateHistoryChart.jsx
│   └── ChartTooltip.jsx
src/hooks/
├── useHistoryData.js
```

## 📄 Key Components

### src/hooks/useHistoryData.js
```javascript
import { useState, useEffect, useCallback } from 'react';
import { getVPDHistory } from '../services/ha-api';

/**
 * Hook for fetching and caching historical data
 */
export function useHistoryData(hours = 24) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const history = await getVPDHistory(hours);
      setData(history);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('[useHistoryData] Fetch error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    refetch: fetchData,
  };
}
```

### src/components/charts/ChartTooltip.jsx
```jsx
import { format } from 'date-fns';

/**
 * Custom tooltip for charts
 */
export function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const time = format(new Date(label), 'MMM d, HH:mm');

  return (
    <div className="bg-abyss border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-500 mb-2">{time}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-zinc-400">{entry.name}:</span>
            <span className="text-sm font-mono font-medium" style={{ color: entry.color }}>
              {entry.value?.toFixed(2)} {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### src/components/charts/VPDHistoryChart.jsx
```jsx
import { useState, useMemo } from 'react';
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
import { useHistoryData } from '../../hooks/useHistoryData';
import { ChartTooltip } from './ChartTooltip';
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
  const { data, isLoading, error, lastUpdated, refetch } = useHistoryData(selectedRange);

  const targets = VPD_TARGETS[growthStage];

  // Format X-axis labels based on time range
  const formatXAxis = (timestamp) => {
    if (selectedRange <= 24) {
      return format(new Date(timestamp), 'HH:mm');
    } else if (selectedRange <= 168) {
      return format(new Date(timestamp), 'EEE HH:mm');
    }
    return format(new Date(timestamp), 'MMM d');
  };

  // Custom gradient for VPD line color
  const gradientOffset = useMemo(() => {
    if (!data.length) return 0.5;
    
    const maxVPD = Math.max(...data.map(d => d.vpd || 0));
    const minVPD = Math.min(...data.map(d => d.vpd || 3));
    
    if (maxVPD <= targets.max) return 0; // All optimal
    if (minVPD >= targets.max) return 1; // All critical
    
    return (targets.max - minVPD) / (maxVPD - minVPD);
  }, [data, targets]);

  if (error) {
    return (
      <div className="card card-glow-critical">
        <p className="text-critical">Failed to load history data</p>
        <button 
          onClick={refetch}
          className="mt-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">VPD History</h3>
          <p className="text-xs text-zinc-500">
            Target: {targets.min} - {targets.max} kPa ({growthStage})
          </p>
        </div>

        {/* Time Range Selector */}
        <div className="flex bg-zinc-900 rounded-lg p-1 gap-1">
          {TIME_RANGES.map(({ label, hours }) => (
            <button
              key={hours}
              onClick={() => setSelectedRange(hours)}
              className={`
                px-3 py-1 text-sm rounded-md transition-all
                ${selectedRange === hours
                  ? 'bg-neon-green/20 text-neon-green'
                  : 'text-zinc-400 hover:text-zinc-200'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              {/* Gradient definition */}
              <defs>
                <linearGradient id="vpdGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset={`${gradientOffset * 100}%`} stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="vpdStroke" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset={`${gradientOffset * 100}%`} stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#22c55e" />
                </linearGradient>
              </defs>

              {/* Target Zone (Ghost Lines) */}
              <ReferenceArea
                y1={targets.min}
                y2={targets.max}
                fill="#22c55e"
                fillOpacity={0.1}
                stroke="#22c55e"
                strokeOpacity={0.3}
                strokeDasharray="3 3"
              />

              {/* Optimal line */}
              <ReferenceLine
                y={targets.optimal}
                stroke="#22c55e"
                strokeDasharray="5 5"
                strokeOpacity={0.5}
              />

              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={{ stroke: '#27272a' }}
              />

              <YAxis
                domain={[0, 3.5]}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 10 }}
                axisLine={{ stroke: '#27272a' }}
                tickFormatter={(v) => v.toFixed(1)}
              />

              <Tooltip content={<ChartTooltip />} />

              <Area
                type="monotone"
                dataKey="vpd"
                stroke="url(#vpdStroke)"
                strokeWidth={2}
                fill="url(#vpdGradient)"
                name="VPD"
                unit=" kPa"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      {lastUpdated && (
        <p className="text-xs text-zinc-600 mt-2 text-right">
          Last updated: {format(lastUpdated, 'HH:mm:ss')}
        </p>
      )}
    </div>
  );
}
```

### src/components/charts/ClimateHistoryChart.jsx
```jsx
import { useState } from 'react';
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
import { useHistoryData } from '../../hooks/useHistoryData';
import { ChartTooltip } from './ChartTooltip';

/**
 * Climate History Chart with dual Y-axis
 */
export function ClimateHistoryChart() {
  const [showTemp, setShowTemp] = useState(true);
  const [showHumidity, setShowHumidity] = useState(true);
  const { data, isLoading } = useHistoryData(24);

  const formatXAxis = (timestamp) => format(new Date(timestamp), 'HH:mm');

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">Climate History</h3>
        
        {/* Toggle buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemp(!showTemp)}
            className={`
              px-3 py-1 text-sm rounded-md transition-all
              ${showTemp
                ? 'bg-ice-blue/20 text-ice-blue'
                : 'bg-zinc-800 text-zinc-500'
              }
            `}
          >
            🌡️ Temp
          </button>
          <button
            onClick={() => setShowHumidity(!showHumidity)}
            className={`
              px-3 py-1 text-sm rounded-md transition-all
              ${showHumidity
                ? 'bg-caution/20 text-caution'
                : 'bg-zinc-800 text-zinc-500'
              }
            `}
          >
            💧 Humidity
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-green" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxis}
                stroke="#52525b"
                tick={{ fill: '#71717a', fontSize: 10 }}
              />

              {/* Temperature Y-Axis (left) */}
              <YAxis
                yAxisId="temp"
                domain={[60, 95]}
                stroke="#38bdf8"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickFormatter={(v) => `${v}°`}
              />

              {/* Humidity Y-Axis (right) */}
              <YAxis
                yAxisId="humidity"
                orientation="right"
                domain={[0, 100]}
                stroke="#f59e0b"
                tick={{ fill: '#71717a', fontSize: 10 }}
                tickFormatter={(v) => `${v}%`}
              />

              <Tooltip content={<ChartTooltip />} />

              {showTemp && (
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  name="Temperature"
                  unit="°F"
                />
              )}

              {showHumidity && (
                <Area
                  yAxisId="humidity"
                  type="monotone"
                  dataKey="humidity"
                  fill="#f59e0b"
                  fillOpacity={0.2}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Humidity"
                  unit="%"
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
```

## ✅ Validation Step

```bash
# 1. Install date-fns
npm install date-fns

# 2. Test chart rendering
npm run dev

# 3. Verify:
# - VPD chart loads with data (or shows loading spinner)
# - Ghost lines visible in optimal zone
# - Time range selector works
# - Tooltip shows values on hover
# - Climate chart shows dual Y-axes
```

---

# 📝 Phase 5: The "Captain's Log"

## Objective
Create a form for manual grow log entries with local storage and optional HA Logbook integration.

## 🎯 Cursor Prompt

```
Create a "Captain's Log" component for recording grow observations.

Requirements:
1. **GrowLog.jsx** component with:
   - Text input for notes (multiline)
   - Quick-action buttons: "Watered", "Topped", "LST", "Nutrients"
   - Optional photo upload placeholder
   - Timestamp auto-filled
   - Current sensor readings auto-attached to entry

2. **LogHistory.jsx** to display past entries:
   - Scrollable list of entries
   - Shows timestamp, note, and sensor readings at that time
   - Delete button for entries

3. **useGrowLog.js** hook that:
   - Saves entries to localStorage (persist across sessions)
   - Provides CRUD operations
   - Option to sync to HA Logbook API

4. Data structure for entries:
   {
     id: string,
     timestamp: ISO string,
     note: string,
     type: 'note' | 'watered' | 'topped' | 'lst' | 'nutrients',
     sensors: { temp, humidity, vpd },
     photo?: base64 string
   }
```

## 📁 Files Created

```
src/components/
├── log/
│   ├── GrowLog.jsx
│   └── LogHistory.jsx
src/hooks/
├── useGrowLog.js
```

## 📄 Key Components

### src/hooks/useGrowLog.js
```javascript
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'grow-log-entries';

/**
 * Hook for managing grow log entries
 */
export function useGrowLog() {
  const [entries, setEntries] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setEntries(JSON.parse(stored));
      }
    } catch (err) {
      console.error('[useGrowLog] Failed to load entries:', err);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.error('[useGrowLog] Failed to save entries:', err);
    }
  }, [entries]);

  /**
   * Add a new log entry
   */
  const addEntry = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  /**
   * Delete an entry
   */
  const deleteEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  /**
   * Clear all entries
   */
  const clearAll = useCallback(() => {
    if (window.confirm('Delete all log entries? This cannot be undone.')) {
      setEntries([]);
    }
  }, []);

  /**
   * Export entries as JSON
   */
  const exportEntries = useCallback(() => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grow-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    clearAll,
    exportEntries,
    entryCount: entries.length,
  };
}
```

### src/components/log/GrowLog.jsx
```jsx
import { useState } from 'react';
import { useGrowLog } from '../../hooks/useGrowLog';
import { useHA } from '../../context/HomeAssistantContext';

const QUICK_ACTIONS = [
  { type: 'watered', label: '💧 Watered', color: 'bg-ice-blue/20 text-ice-blue' },
  { type: 'nutrients', label: '🧪 Nutrients', color: 'bg-leaf-green/20 text-leaf-green' },
  { type: 'topped', label: '✂️ Topped', color: 'bg-caution/20 text-caution' },
  { type: 'lst', label: '🌀 LST', color: 'bg-purple-500/20 text-purple-400' },
];

/**
 * Captain's Log entry form
 */
export function GrowLog() {
  const [note, setNote] = useState('');
  const [selectedType, setSelectedType] = useState('note');
  const { addEntry } = useGrowLog();
  const { temperature, humidity, vpd } = useHA();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!note.trim() && selectedType === 'note') return;

    addEntry({
      note: note.trim() || `${QUICK_ACTIONS.find(a => a.type === selectedType)?.label || 'Note'}`,
      type: selectedType,
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
      sensors: {
        temperature,
        humidity,
        vpd,
      },
    });
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-100 mb-4">📝 Captain's Log</h3>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_ACTIONS.map(({ type, label, color }) => (
          <button
            key={type}
            onClick={() => handleQuickAction(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${color} hover:opacity-80`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Note Input */}
      <form onSubmit={handleSubmit}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add observation, note, or custom entry..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-gray-200 placeholder-zinc-500 resize-none focus:outline-none focus:border-neon-green/50"
          rows={3}
        />

        {/* Current Readings */}
        <div className="flex items-center gap-4 mt-2 text-xs text-zinc-500">
          <span>Current: {temperature?.toFixed(1)}°F</span>
          <span>{humidity?.toFixed(1)}% RH</span>
          <span>{vpd?.toFixed(2)} kPa</span>
        </div>

        <button
          type="submit"
          className="mt-3 w-full py-2 bg-neon-green/20 text-neon-green border border-neon-green/30 rounded-lg font-medium hover:bg-neon-green/30 transition-all"
        >
          Log Entry
        </button>
      </form>
    </div>
  );
}
```

### src/components/log/LogHistory.jsx
```jsx
import { format } from 'date-fns';
import { useGrowLog } from '../../hooks/useGrowLog';
import { Trash2, Download } from 'lucide-react';

const TYPE_STYLES = {
  note: 'border-zinc-700',
  watered: 'border-ice-blue/40',
  nutrients: 'border-leaf-green/40',
  topped: 'border-caution/40',
  lst: 'border-purple-500/40',
};

/**
 * Log history display
 */
export function LogHistory() {
  const { entries, deleteEntry, exportEntries, entryCount } = useGrowLog();

  if (entryCount === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">📜 Log History</h3>
        <p className="text-zinc-500 text-center py-8">
          No entries yet. Start logging your grow journey!
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100">
          📜 Log History ({entryCount})
        </h3>
        <button
          onClick={exportEntries}
          className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-200"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`p-3 bg-zinc-900 rounded-lg border-l-4 ${TYPE_STYLES[entry.type] || 'border-zinc-700'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-200">{entry.note}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                  <span>{format(new Date(entry.timestamp), 'MMM d, HH:mm')}</span>
                  {entry.sensors && (
                    <>
                      <span>•</span>
                      <span>{entry.sensors.temperature?.toFixed(1)}°F</span>
                      <span>{entry.sensors.humidity?.toFixed(1)}%</span>
                      <span>{entry.sensors.vpd?.toFixed(2)} kPa</span>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={() => deleteEntry(entry.id)}
                className="p-1 text-zinc-600 hover:text-critical transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## ✅ Validation Step

```bash
# 1. Test log functionality
npm run dev

# 2. Verify:
# - Quick action buttons create entries
# - Custom note form works
# - Entries persist after page refresh (localStorage)
# - Delete and export work
# - Sensor readings attached to entries
```

---

# 🚀 Phase 6: Camera & Deployment

## Objective
Add camera feed placeholder and create deployment script for Raspberry Pi.

## 🎯 Cursor Prompt

```
Create the final deployment configuration for the grow dashboard.

Requirements:
1. **CameraFeed.jsx** component:
   - Placeholder layout for Wyze v4 camera feed
   - Manual refresh button
   - Timestamp overlay
   - Note: Actual Wyze integration requires RTSP/docker-wyze-bridge

2. **deploy.sh** script that:
   - Runs npm run build
   - SCPs dist/ to Pi at /config/www/grow-dashboard/
   - Provides URL to access dashboard
   - Handles SSH key auth

3. **panel_custom configuration** for HA sidebar:
   - YAML config for configuration.yaml
   - Instructions for adding to sidebar

4. **Production optimizations:**
   - Vite build for minification
   - Environment variable handling for production
   - Error boundary component
```

## 📁 Files Created

```
src/components/
├── CameraFeed.jsx
├── ErrorBoundary.jsx
scripts/
├── deploy.sh
docs/
├── DEPLOYMENT.md
```

## 📄 Key Files

### src/components/CameraFeed.jsx
```jsx
import { useState } from 'react';
import { RefreshCw, Camera } from 'lucide-react';

/**
 * Camera feed placeholder
 * Note: Actual Wyze integration requires docker-wyze-bridge for RTSP
 */
export function CameraFeed({ streamUrl = null }) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const handleRefresh = () => {
    setIsLoading(true);
    setLastRefresh(new Date());
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Tent Camera
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Video Feed Area */}
      <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden">
        {streamUrl ? (
          <img
            src={streamUrl}
            alt="Camera Feed"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600">
            <Camera className="w-16 h-16 mb-4" />
            <p className="text-sm">Camera feed not configured</p>
            <p className="text-xs mt-2 text-zinc-700">
              Requires docker-wyze-bridge for RTSP
            </p>
          </div>
        )}

        {/* Timestamp Overlay */}
        <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-zinc-400">
          {lastRefresh.toLocaleTimeString()}
        </div>
      </div>

      {/* Setup Instructions */}
      {!streamUrl && (
        <details className="mt-4">
          <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400">
            How to connect Wyze camera
          </summary>
          <div className="mt-2 p-3 bg-zinc-900 rounded-lg text-xs text-zinc-500">
            <ol className="list-decimal list-inside space-y-1">
              <li>Install docker-wyze-bridge on your Pi</li>
              <li>Enable RTSP in Wyze app</li>
              <li>Add camera credentials to docker-wyze-bridge</li>
              <li>Update VITE_CAMERA_URL in .env</li>
            </ol>
          </div>
        </details>
      )}
    </div>
  );
}
```

### src/components/ErrorBoundary.jsx
```jsx
import { Component } from 'react';

/**
 * Error boundary for catching render errors
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-void flex items-center justify-center p-6">
          <div className="card card-glow-critical max-w-lg text-center">
            <h1 className="text-2xl font-bold text-critical mb-4">
              Something went wrong
            </h1>
            <p className="text-zinc-400 mb-4">
              The dashboard encountered an unexpected error.
            </p>
            <pre className="text-left text-xs bg-zinc-900 p-3 rounded-lg overflow-auto max-h-40 text-zinc-500">
              {this.state.error?.message || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-neon-green/20 text-neon-green rounded-lg hover:bg-neon-green/30 transition-all"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### scripts/deploy.sh
```bash
#!/bin/bash
# =============================================================================
# Grow Dashboard Deployment Script
# Deploys the React dashboard to Home Assistant on Raspberry Pi
# =============================================================================

set -e

# Configuration
PI_HOST="${PI_HOST:-100.65.202.84}"
PI_USER="${PI_USER:-pi}"
REMOTE_PATH="/config/www/grow-dashboard"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌿 Grow Dashboard Deployment${NC}"
echo "================================"

# Step 1: Build
echo -e "${YELLOW}📦 Building production bundle...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

# Step 2: Create remote directory
echo -e "${YELLOW}📁 Preparing remote directory...${NC}"
ssh -i "$SSH_KEY" "${PI_USER}@${PI_HOST}" "mkdir -p ${REMOTE_PATH}"

# Step 3: Deploy
echo -e "${YELLOW}🚀 Deploying to ${PI_HOST}...${NC}"
scp -i "$SSH_KEY" -r dist/* "${PI_USER}@${PI_HOST}:${REMOTE_PATH}/"

# Step 4: Verify
echo -e "${YELLOW}✅ Verifying deployment...${NC}"
ssh -i "$SSH_KEY" "${PI_USER}@${PI_HOST}" "ls -la ${REMOTE_PATH}"

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo "Access your dashboard at:"
echo "  http://${PI_HOST}:8123/local/grow-dashboard/index.html"
echo ""
echo "Or add to HA sidebar with panel_custom (see docs/DEPLOYMENT.md)"
```

### docs/DEPLOYMENT.md
```markdown
# 🚀 Dashboard Deployment Guide

## Prerequisites

1. **SSH Access to Pi**
   ```bash
   # Test connection
   ssh pi@100.65.202.84
   ```

2. **Node.js 18+** installed locally

3. **Home Assistant www folder** accessible at `/config/www/`

## Deployment Steps

### 1. Configure Environment

Create `.env` file with production values:
```bash
VITE_HA_URL=http://100.65.202.84:8123
VITE_HA_TOKEN=your_long_lived_token_here
VITE_GROWTH_STAGE=seedling
```

### 2. Run Deployment Script

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3. Access Dashboard

Direct URL:
```
http://100.65.202.84:8123/local/grow-dashboard/index.html
```

## Add to Home Assistant Sidebar

### Option A: Panel Custom (Recommended)

Add to `configuration.yaml`:
```yaml
panel_custom:
  - name: grow-dashboard
    sidebar_title: "🌿 Grow"
    sidebar_icon: mdi:leaf
    url_path: grow
    require_admin: false
    module_url: /local/grow-dashboard/index.html
    embed_iframe: true
    trust_external_script: true
```

Then restart Home Assistant.

### Option B: Lovelace Panel

Add to your dashboard as a custom card:
```yaml
type: iframe
url: /local/grow-dashboard/index.html
aspect_ratio: 100%
```

## Troubleshooting

### Dashboard Not Loading

1. Check file permissions:
   ```bash
   ssh pi@100.65.202.84 "ls -la /config/www/grow-dashboard/"
   ```

2. Verify URL is correct in browser

3. Check browser console for errors

### WebSocket Connection Failed

1. Verify HA_URL is correct
2. Check HA_TOKEN is valid (regenerate if needed)
3. Ensure Tailscale is connected

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## Updating the Dashboard

Simply run the deploy script again:
```bash
./scripts/deploy.sh
```

The script will overwrite existing files.
```

### Final src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
```

### Complete src/App.jsx
```jsx
import { HomeAssistantProvider, useHA } from './context/HomeAssistantContext';
import { KPICard, ToggleSwitch, FanModeSelector, ScheduleSlider } from './components';
import { VPDHistoryChart } from './components/charts/VPDHistoryChart';
import { ClimateHistoryChart } from './components/charts/ClimateHistoryChart';
import { GrowLog } from './components/log/GrowLog';
import { LogHistory } from './components/log/LogHistory';
import { CameraFeed } from './components/CameraFeed';
import { ENTITIES, VPD_TARGETS, TEMP_TARGETS, HUMIDITY_TARGETS } from './types/entities';
import { Thermometer, Droplets, Gauge, Lightbulb, Fan } from 'lucide-react';

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
    toggleSwitch,
    setFanMode,
  } = useHA();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-green mx-auto mb-4" />
          <p className="text-zinc-400">Connecting to Home Assistant...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="card card-glow-critical max-w-md text-center">
          <h2 className="text-xl font-bold text-critical mb-2">Connection Error</h2>
          <p className="text-zinc-400">{error.message}</p>
        </div>
      </div>
    );
  }

  const targets = VPD_TARGETS.seedling;

  return (
    <div className="min-h-screen bg-void p-4 md:p-6">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-100">
            🌿 Project: Plausible Deniability
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">
            GrowOp Command Center • Seedling Stage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-optimal' : 'bg-critical'}`} />
          <span className="text-sm text-zinc-400 hidden sm:inline">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* KPI Cards */}
        <KPICard
          label="Temperature"
          value={temperature}
          unit="°F"
          min={TEMP_TARGETS.day.min}
          max={TEMP_TARGETS.day.max}
          optimal={TEMP_TARGETS.day.target}
          icon={Thermometer}
        />
        <KPICard
          label="Humidity"
          value={humidity}
          unit="%"
          min={HUMIDITY_TARGETS.seedling.min}
          max={HUMIDITY_TARGETS.seedling.max}
          optimal={HUMIDITY_TARGETS.seedling.optimal}
          icon={Droplets}
        />
        <KPICard
          label="VPD"
          value={vpd}
          unit="kPa"
          min={targets.min}
          max={targets.max}
          optimal={targets.optimal}
          precision={2}
          icon={Gauge}
        />

        {/* Controls Section */}
        <div className="lg:col-span-2 space-y-4">
          <ScheduleSlider 
            lightsOnTime="06:00"
            lightsOffTime="02:00"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ToggleSwitch
              label="Grow Light"
              isOn={lightState === 'on'}
              onToggle={() => toggleSwitch(ENTITIES.LIGHT)}
              icon={Lightbulb}
            />
            <ToggleSwitch
              label="Intake Fan"
              isOn={true} // From entity state
              onToggle={() => toggleSwitch(ENTITIES.INTAKE_FAN)}
              icon={Fan}
            />
          </div>

          <FanModeSelector
            currentMode={fanMode}
            onModeChange={setFanMode}
          />
        </div>

        {/* Camera */}
        <CameraFeed />

        {/* Charts */}
        <div className="lg:col-span-2">
          <VPDHistoryChart growthStage="seedling" />
        </div>
        <ClimateHistoryChart />

        {/* Log Section */}
        <GrowLog />
        <div className="lg:col-span-2">
          <LogHistory />
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-zinc-600">
        Project: Plausible Deniability v1.0.0 • Built with React + Tailwind
      </footer>
    </div>
  );
}

function App() {
  return (
    <HomeAssistantProvider>
      <Dashboard />
    </HomeAssistantProvider>
  );
}

export default App;
```

## ✅ Final Validation

```bash
# 1. Full build test
npm run build

# 2. Preview production build locally
npm run preview

# 3. Deploy to Pi
./scripts/deploy.sh

# 4. Access dashboard
# http://100.65.202.84:8123/local/grow-dashboard/index.html
```

---

# 📋 Quick Start Checklist

## Phase Completion Tracker

| Phase | Status | Validation |
|-------|--------|------------|
| 1. Scaffolding | ⬜ | `npm run dev` shows dark page |
| 2. HA Connection | ⬜ | Green "Connected" dot, values populate |
| 3. UI Components | ⬜ | KPI cards glow based on status |
| 4. Charts | ⬜ | VPD history loads with ghost lines |
| 5. Grow Log | ⬜ | Entries persist after refresh |
| 6. Deployment | ⬜ | Dashboard accessible from Pi URL |

## Command Summary

```bash
# Initialize
npm create vite@latest grow-dashboard -- --template react
cd grow-dashboard
npm install
npm install -D tailwindcss postcss autoprefixer
npm install home-assistant-js-websocket recharts date-fns lucide-react
npx tailwindcss init -p

# Development
npm run dev

# Production
npm run build
npm run preview

# Deploy
./scripts/deploy.sh
```

---

*This masterplan is your blueprint. Follow each phase sequentially. The validation step ensures each phase works before moving on.*

---

## 🔍 Investigation Summary (2026-01-18)

### Phase 0: MCP Connection ✅
- **Status:** Verified working
- **Method:** Successfully fetched entities via MCP resources
- **Token:** Valid and functional

### Phase 1: Entity Discovery ✅
- **Total Entities:** 100
- **Grow-Related Entities:** ~30
- **New Discoveries:**
  - Space heater power monitoring (`sensor.space_heater_power`)
  - Leak sensor battery level (`sensor.leak_sensor_1_battery`)
  - Secondary grow room sensor (temp/humidity)
- **Entity Status:** All critical entities available and operational

### Phase 2: Automation Verification ✅
- **Active Automations:** 3
  - `automation.grow_light_control` ✅ (Light schedule)
  - `automation.tent_temperature_modulation` ✅ (Temp schedule)
  - `automation.leak_alert` ✅ (Safety)
- **Schedule Times:** Verified (ON: 06:00, OFF: 02:00)
- **Temperature Targets:** Verified (Day: 80°F, Night: 70°F)

### Phase 3: Current Climate Status ⚠️
- **Temperature:** 78.1°F ✅ (Within target range 75-78°F)
- **Humidity:** 35.1% ❌ (Critical - Target: 65-75%)
- **VPD:** 2.33 kPa ❌ (Critical - Target: 0.4-0.8 kPa)
- **Assessment:** Temperature improved, but humidity/VPD still require CloudForge T7 integration

### Phase 4: Power Monitoring ✅
- **Light:** 96.4W (operational)
- **Intake Fan:** 16.8W (operational)
- **Space Heater:** 0.0W (off, controlled by thermostat)

### Phase 5: Secondary Sensors ✅
- **Grow Room Sensor:** Available (secondary temp/humidity)
- **Leak Sensor:** Operational, 69.5% battery
- **Note:** Secondary sensor shows different values - may need calibration

### Blockers Identified
- ❌ **CloudForge T7 Humidifier:** Not yet integrated (Port 2 unavailable)
- ⚠️ **VPD Critical:** Currently 2.33 kPa (target: 0.4-0.8 kPa)
- ⚠️ **Humidity Critical:** Currently 35.1% (target: 65-75%)

### Masterplan Updates Applied
1. ✅ Updated current sensor values (temperature, humidity, VPD)
2. ✅ Added power monitoring entities (heater power)
3. ✅ Added leak sensor and battery monitoring
4. ✅ Verified automation deployment status
5. ✅ Added secondary sensor entities
6. ✅ Confirmed schedule times and temperature targets

### Ready for Implementation
- ✅ All entity IDs verified
- ✅ MCP connection confirmed
- ✅ Automation status documented
- ✅ Current state baseline established
- ⚠️ **Note:** Dashboard should highlight critical VPD/humidity status prominently

---

**Happy Growing! 🌿**
