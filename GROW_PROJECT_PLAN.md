# 🌱 Grow Automation Project Plan
## Single Source of Truth (SSoT) Architecture

**Project:** Indoor Grow Environment Automation  
**Platform:** Home Assistant on Raspberry Pi (Tailscale: `http://100.65.202.84:8123`)  
**Development Environment:** Cursor.ai with MCP Integration  
**Location:** Basement, Albany NY area  
**Created:** January 2026  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current State Assessment](#2-current-state-assessment)
3. [Environment Baseline Data](#3-environment-baseline-data)
4. [Repository Structure](#4-repository-structure)
5. [Documentation Architecture](#5-documentation-architecture)
6. [Development Workflow](#6-development-workflow)
7. [Dashboard Application Spec](#7-dashboard-application-spec)
8. [Implementation Phases](#8-implementation-phases)
9. [File Specifications](#9-file-specifications)

---

## 1. Project Overview

### 1.1 Goals

1. **Single Source of Truth (SSoT):** All grow environment configuration, entity mappings, schedules, and logic documented in version-controlled markdown files that serve as both documentation AND context for AI-assisted development.

2. **Custom Dashboard:** A JavaScript/React-based monitoring and control interface that provides cleaner UX than native Home Assistant dashboards, with data logging capabilities.

3. **Agentic Development:** Structure the repository so that Cursor.ai (via MCP) can read documentation, understand the current state, and generate/modify automations, scripts, and dashboard components with full context.

4. **VPD-Optimized Environment:** Automated climate control maintaining optimal Vapor Pressure Deficit across growth stages.

### 1.2 Core Principles

| Principle | Implementation |
|-----------|----------------|
| **Documentation as Code** | Markdown files are the source of truth; YAML/JS generated from them |
| **Context-First AI Dev** | `.cursorrules` and manifest files give AI complete system understanding |
| **MCP Verification First** | AI must verify sensor data via MCP before suggesting changes |
| **Modular Architecture** | Each system (light, climate, humidity) documented and automated independently |
| **Observable State** | All sensor data logged with timestamps for analysis and optimization |

---

## 2. Current State Assessment

### 2.1 Hardware Inventory (Verified)

| Device | HA Entity | Status | Notes |
|--------|-----------|--------|-------|
| AC Infinity Controller 69 Pro | `sensor.ac_infinity_controller_69_pro_*` | ✅ Online | Temp/Humidity/VPD |
| Exhaust Fan | `binary_sensor.exhaust_fan_*` | ✅ Running | Power level 5 |
| Tent Heater | `climate.tent_heater` | ✅ Heat Mode | Thermostat |
| **Grow Light** | `switch.light` | ✅ Online | Third Reality Zigbee Plug |
| **CloudForge T5 Humidifier** | `select.cloudforge_t5_active_mode` | ✅ **Integrated** | AC Infinity Port 2 |
| **Water Distiller** | N/A (Manual) | ✅ Available | Vevor 1.1 gal / 4 hours |

### 2.2 Current Sensor Readings

```
Temperature:  80.9°F    (Target: 75-78°F for seedling)
Humidity:     33.7%     (Target: 65-75% for seedling) ⚠️ CRITICAL
VPD:          2.6 kPa   (Target: 0.4-0.8 kPa) ⚠️ CRITICAL
```

### 2.3 Active Automations

| Name | Entity ID | Status |
|------|-----------|--------|
| Leak Alert | `automation.leak_alert` | ✅ Active |
| Light Schedule ON | — | 🟡 Ready to Deploy |
| Light Schedule OFF | — | 🟡 Ready to Deploy |
| Day Temperature | — | 🟡 Ready to Deploy |
| Night Temperature | — | 🟡 Ready to Deploy |

---

## 3. Environment Baseline Data

### 3.1 Known Challenges

| Challenge | Baseline Value | Impact | Mitigation |
|-----------|---------------|--------|------------|
| **Basement Humidity** | ~30% RH | VPD too high, plant stress | ✅ CloudForge T5 integrated - automation pending |
| **Albany Tap Water** | 7.77 pH | Too alkaline for plants | pH Down to 6.4-6.5 |

### 3.2 Water Chemistry Protocol

```yaml
water_source: Albany Municipal Tap Water
baseline_ph: 7.77
target_ph_range: 6.4 - 6.5
treatment: pH Down solution

rules:
  - Always pH adjust AFTER adding nutrients
  - Test pH before every watering
  - Use Vevor distiller for sensitive applications
```

### 3.3 Ambient Environment

```yaml
location: Basement (Albany, NY area)
baseline_humidity: 30%
baseline_temp: ~65°F (seasonal variation)

critical_notes:
  - Humidifier must run continuously during seedling stage
  - CloudForge T5 integrated on Port 2 - ready for VPD automation
  - Winter months particularly dry
```

---

## 4. Repository Structure

```
C:\Users\russe\Documents\Grow\
│
├── .cursor/
│   └── mcp.json                    # MCP connection config ✅
│
├── .cursorrules                    # AI development context rules ✅
│
├── docs/                           # 📚 SINGLE SOURCE OF TRUTH
│   ├── MANIFEST.md                 # Master entity registry & protocols ✅
│   ├── AUTOMATIONS.md              # Automation logic & YAML reference ✅
│   ├── ENTITIES.md                 # Complete entity documentation
│   ├── SCHEDULES.md                # Time-based schedules
│   ├── VPD_TARGETS.md              # Growth stage VPD targets
│   └── CHANGELOG.md                # All configuration changes
│
├── config/                         # 🔧 HOME ASSISTANT CONFIGS
│   ├── automations/                # Automation YAML files
│   │   ├── light_schedule.yaml
│   │   ├── climate_control.yaml
│   │   ├── vpd_management.yaml
│   │   └── alerts.yaml
│   ├── scripts/                    # HA script definitions
│   ├── scenes/                     # Scene YAML files
│   └── templates/                  # Template sensors
│
├── dashboard/                      # 🖥️ CUSTOM DASHBOARD APP
│   ├── package.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── GaugeCard.jsx       # VPD, Temp, Humidity gauges
│   │   │   ├── ScheduleView.jsx    # Light/climate schedule viz
│   │   │   ├── ControlPanel.jsx    # Manual overrides
│   │   │   ├── HistoryChart.jsx    # Sensor history graphs
│   │   │   └── AlertBanner.jsx     # Active alerts display
│   │   ├── hooks/
│   │   │   └── useHomeAssistant.js # HA WebSocket connection
│   │   ├── services/
│   │   │   └── ha-api.js           # REST API wrapper
│   │   └── utils/
│   │       └── vpd-calculator.js   # VPD math utilities
│   └── public/
│
├── scripts/                        # 🛠️ UTILITY SCRIPTS
│   ├── sync-to-ha.js               # Push configs to HA
│   ├── backup-ha.js                # Pull configs from HA
│   ├── generate-manifest.js        # Auto-generate manifest from HA
│   └── validate-config.js          # Validate YAML before deploy
│
├── data/                           # 📊 LOGGED DATA
│   ├── sensor_logs/                # Historical sensor readings
│   └── events/                     # Automation trigger logs
│
└── README.md                       # Project overview & quick start
```

---

## 5. Documentation Architecture

### 5.1 Document Hierarchy

```
MANIFEST.md (Master Index)
    │
    ├── ENTITIES.md ──────► Detailed entity configs
    │
    ├── AUTOMATIONS.md ───► Automation logic & YAML
    │       │
    │       └──► config/automations/*.yaml
    │
    ├── SCHEDULES.md ─────► Time-based logic
    │
    └── VPD_TARGETS.md ───► Growth stage targets
```

### 5.2 Key Documents

| Document | Purpose | Update Frequency |
|----------|---------|------------------|
| `MANIFEST.md` | Master SSoT - hardware, entities, protocols | Every config change |
| `AUTOMATIONS.md` | Automation documentation and YAML | Every automation change |
| `.cursorrules` | AI context and MCP rules | Project setup changes |
| `CHANGELOG.md` | Change history | Every change |

---

## 6. Development Workflow

### 6.1 MCP-First Development

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURSOR.AI + MCP WORKFLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   1. VERIFY (MCP Required)                                      │
│      ├── get_entity [sensors] → Current live values            │
│      ├── list_entities → Confirm entity IDs                    │
│      └── Compare to docs/MANIFEST.md targets                    │
│                                                                 │
│   2. PLAN                                                       │
│      ├── Read docs/AUTOMATIONS.md for existing logic           │
│      └── Determine required changes                             │
│                                                                 │
│   3. IMPLEMENT                                                  │
│      ├── Update docs/AUTOMATIONS.md                            │
│      ├── Create config/automations/*.yaml                      │
│      └── Update docs/MANIFEST.md                               │
│                                                                 │
│   4. DEPLOY                                                     │
│      ├── MCP → create_automation (push to HA)                  │
│      └── MCP → list_automations (verify)                       │
│                                                                 │
│   5. LOG                                                        │
│      └── Add entry to docs/CHANGELOG.md                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 MCP Verification Rule

**⚠️ CRITICAL:** Before suggesting ANY climate adjustments:

1. Use `get_entity` for current sensor values
2. Compare live data to MANIFEST.md targets
3. Only then recommend adjustments

**Never assume values from documentation - always verify live.**

---

## 7. Dashboard Application Spec

### 7.1 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | React 18+ | Component-based, good HA libraries |
| **Styling** | Tailwind CSS | Rapid UI development |
| **Charts** | Recharts or Chart.js | Sensor history visualization |
| **HA Connection** | WebSocket API | Real-time updates |
| **State** | Zustand or Context | Lightweight state management |
| **Build** | Vite | Fast dev server |

### 7.2 Core Features

1. **Overview Dashboard**
   - VPD gauge (color-coded to growth stage target)
   - Temperature gauge
   - Humidity gauge
   - Light status with countdown
   - Active alerts

2. **Climate Control**
   - Heater setpoint adjustment
   - Fan mode/speed control
   - Humidifier control (when integrated)

3. **Schedules**
   - Visual timeline (light on/off)
   - Temperature day/night display
   - Manual override toggles

4. **History**
   - VPD trends (24h, 7d, 30d)
   - Temperature/humidity correlation
   - Automation event markers

5. **Grow Log**
   - Manual entries (watering, nutrients, observations)
   - Photo upload with timestamps
   - Growth stage tracking

### 7.3 HA Connection

```javascript
// WebSocket (via Tailscale)
const WS_URL = 'ws://100.65.202.84:8123/api/websocket';

// REST API
const API_BASE = 'http://100.65.202.84:8123/api';

// Auth header
headers: {
  'Authorization': `Bearer ${LONG_LIVED_TOKEN}`,
  'Content-Type': 'application/json'
}
```

---

## 8. Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
**Duration:** 1-2 days

- [x] Set up MCP connection in Cursor
- [x] Create `.cursorrules` file
- [x] Create `docs/MANIFEST.md` with current state
- [x] Create `docs/AUTOMATIONS.md` with schedule logic
- [x] Document Safe-Touch Protocol
- [x] Document environment baselines (water pH, humidity)

---

### Phase 2: Core Automations 🟡 IN PROGRESS
**Duration:** 1-2 days

- [x] Document light schedule (20/4)
- [x] Document temperature modulation (80°F/70°F)
- [ ] Deploy light schedule automations to HA
- [ ] Deploy temperature automations to HA
- [ ] Verify automations running correctly

**Deliverables:**
- Light automatically follows 6 AM ON / 2 AM OFF schedule
- Heater automatically adjusts day/night temps

---

### Phase 3: Humidity Integration
**Duration:** 2-3 days

- [x] Add CloudForge T5 to Home Assistant ✅ (Port 2, integrated)
- [ ] Update MANIFEST.md with humidifier entity
- [ ] Create VPD-based humidity automation
- [ ] Create VPD alert system
- [ ] Test full climate control loop

**Deliverables:**
- Automatic VPD maintenance
- Alert notifications when out of range

---

### Phase 4: Dashboard MVP
**Duration:** 5-7 days

- [ ] Initialize React project with Vite
- [ ] Build HA WebSocket hook
- [ ] Create gauge components
- [ ] Build overview dashboard
- [ ] Add basic device controls
- [ ] Implement schedule visualization

**Deliverables:**
- Functional web dashboard
- Real-time sensor display
- Basic device control

---

### Phase 5: Data Logging & History
**Duration:** 3-4 days

- [ ] Implement sensor data logging
- [ ] Build history charts
- [ ] Add event logging
- [ ] Create data export functionality
- [ ] Add manual grow log entries

**Deliverables:**
- Historical data visualization
- Exportable grow logs
- Correlation analysis tools

---

### Phase 6: Advanced Features
**Duration:** Ongoing

- [ ] Growth stage presets (auto-adjust targets)
- [ ] Predictive alerts
- [ ] Mobile-responsive design
- [ ] Nutrient/watering tracking
- [ ] Integration with other grow tools

---

## 9. File Specifications

### 9.1 .cursorrules

**Location:** `C:\Users\russe\Documents\Grow\.cursorrules`

**Key Sections:**
- MCP Verification Rule (MUST verify before climate changes)
- Known entity IDs
- Environment baselines
- Schedule references
- YAML standards

---

### 9.2 docs/MANIFEST.md

**Location:** `C:\Users\russe\Documents\Grow\docs\MANIFEST.md`

**Key Sections:**
1. Quick Status (current vs target)
2. Hardware Inventory
3. Entity Registry
4. Schedules (light, temp, humidity)
5. VPD Targets by growth stage
6. Environment Baseline Data (water pH, ambient conditions)
7. Safe-Touch Planting Protocol
8. Active Automations

---

### 9.3 docs/AUTOMATIONS.md

**Location:** `C:\Users\russe\Documents\Grow\docs\AUTOMATIONS.md`

**Key Sections:**
1. Active automations with status
2. Light Schedule (20/4) with full YAML
3. Temperature Modulation with full YAML
4. Planned automations (VPD, alerts)
5. Deployment checklist
6. MCP commands reference

---

## Appendix: MCP Tools Reference

| Tool | Purpose |
|------|---------|
| `get_entity` | **REQUIRED** before climate recommendations |
| `list_entities` | List all entities |
| `create_automation` | Create new automation |
| `list_automations` | Verify automation deployment |
| `call_service_tool` | Call any HA service |
| `get_history` | Get entity history |
| `get_error_log` | Check HA logs |
| `debug_automation` | Debug automation issues |
| `troubleshoot_entity` | Troubleshoot entity |

---

## Quick Start Checklist

For Cursor.ai sessions in this project:

1. ✅ Open `C:\Users\russe\Documents\Grow` folder
2. ✅ Verify MCP connection (Settings → MCP → hass-mcp green)
3. ✅ Reference `.cursorrules` for context
4. ✅ Check `docs/MANIFEST.md` for current state
5. ✅ **Always use `get_entity` before climate recommendations**

---

*This document is the project blueprint. All implementation should reference and update this plan.*
