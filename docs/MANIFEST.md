# 🌱 Grow Environment Manifest
## Single Source of Truth

**Last Updated:** 2026-01-18  
**Home Assistant:** http://100.65.202.84:8123 (Tailscale)  
**Growth Stage:** Seedling  
**Location:** Basement (Albany, NY area)

---

## Quick Status

| Metric | Current | Target (Seedling) | Status |
|--------|---------|-------------------|--------|
| Temperature | 81.3°F | 75-78°F | ⚠️ Slightly High |
| Humidity | 33.4% | 65-75% | ❌ CRITICAL - LOW |
| VPD | 2.65 kPa | 0.4-0.8 kPa | ❌ CRITICAL - HIGH |

### ⚠️ Known Environmental Challenges

| Challenge | Baseline | Mitigation |
|-----------|----------|------------|
| **Basement Humidity** | ~30% RH | CloudForge T5 humidifier ✅ INTEGRATED |
| **Albany Tap Water pH** | 7.77 pH | pH down to 6.4-6.5 before use |

---

## 1. Hardware Inventory

### 1.1 Connected & Active

| Device | HA Entity | Location | Status | Notes |
|--------|-----------|----------|--------|-------|
| AC Infinity Controller 69 Pro | `sensor.ac_infinity_controller_69_pro_*` | Tent | ✅ Online | Temp/Humidity/VPD sensors |
| Exhaust Fan | `binary_sensor.exhaust_fan_*` | Tent Top | ✅ Running | Power level 5 |
| Tent Heater | `climate.tent_heater` | Tent Floor | ✅ Heat Mode | Thermostat control |
| **Grow Light** | `switch.light` | Tent Ceiling | ✅ Online | Third Reality Zigbee Plug (96.4W) |
| **CloudForge T5 Humidifier** | `select.cloudforge_t5_active_mode` | Tent | ✅ Online | Port 2, AC Infinity Controller |
| Intake Air Fan | `switch.intake_air` | Tent | ✅ Online | 16.8W power draw |
| Grow Room Sensor | `sensor.sensor_grow_room_*` | Tent | ✅ Online | Secondary temp/humidity sensor |
| Leak Sensor #1 | `binary_sensor.leak_sensor_1` | Tent Floor | ✅ Online | 69.5% battery |
| Raspberry Pi | `binary_sensor.rpi_power_status` | Network Closet | ✅ Online | HA Host |

### 1.2 Pending Integration

| Device | Expected Entity | Connection Type | Priority | Notes |
|--------|-----------------|-----------------|----------|-------|
| ~~**CloudForge T7 Humidifier**~~ | ~~`humidifier.cloudforge_t7`~~ | ~~AC Infinity Cloud~~ | ~~🔴 High~~ | ~~9L tank capacity~~ ✅ **INTEGRATED AS T5** |

### 1.3 Manual Maintenance Devices

| Device | Purpose | Schedule | Notes |
|--------|---------|----------|-------|
| **Vevor Water Distiller** | Produce clean water | As needed | 1.1 gal / 4 hours runtime |

### 1.4 Unused Ports (AC Infinity Controller)

| Port | Entity Pattern | Status | Device |
|------|---------------|--------|--------|
| Port 2 | `cloudforge_t5_*` | ✅ **ACTIVE** | **CloudForge T5 Humidifier** |
| Port 3 | `*_port_3_*` | ❌ Unavailable | — |
| Port 4 | `*_port_4_*` | ❌ Unavailable | — |

---

## 2. Entity Registry

### 2.1 Climate Sensors

```yaml
ac_infinity_controller:
  temperature:
    entity_id: sensor.ac_infinity_controller_69_pro_temperature
    unit: °F
    current_value: 81.266
    last_updated: 2026-01-18
    alerts:
      low: 65
      high: 88
      
  humidity:
    entity_id: sensor.ac_infinity_controller_69_pro_humidity
    unit: "%"
    current_value: 33.42
    last_updated: 2026-01-18
    alerts:
      low: 30
      high: 80
      
  vpd:
    entity_id: sensor.ac_infinity_controller_69_pro_vpd
    unit: kPa
    current_value: 2.65
    last_updated: 2026-01-18
    alerts:
      low: 0.4
      high: 1.6
```

### 2.2 Climate Control Devices

```yaml
heater:
  entity_id: climate.tent_heater
  type: thermostat
  current_mode: heat
  hvac_modes:
    - heat
    - "off"
  schedule:
    day_temp: 80  # Lights on (6 AM - 2 AM)
    night_temp: 70  # Lights off (2 AM - 6 AM)

exhaust_fan:
  status_entity: binary_sensor.exhaust_fan_status
  state_entity: binary_sensor.exhaust_fan_state
  power_entity: sensor.exhaust_fan_current_power
  mode_entity: select.exhaust_fan_active_mode
  current_power: 5
  current_mode: "On"
  modes_available:
    - "On"
    - "Off"
    - "Auto"
```

### 2.3 Lighting

```yaml
grow_light:
  entity_id: switch.light
  type: switch
  device: Third Reality Zigbee Smart Plug
  connection: Zigbee
  status: online
  schedule:
    on_time: "06:00:00"   # 6 AM
    off_time: "02:00:00"  # 2 AM
    photoperiod: "20:00:00"  # 20 hours on
    dark_period: "04:00:00"  # 4 hours off
```

### 2.4 Humidity Control (CloudForge T5)

```yaml
humidifier:
  primary_control: select.cloudforge_t5_active_mode
  state_entity: binary_sensor.cloudforge_t5_state
  status_entity: binary_sensor.cloudforge_t5_status
  type: AC Infinity CloudForge T5
  port: 2
  connection: AC Infinity Controller 69 Pro
  current_mode: "Off"
  available_modes:
    - "On"
    - "Off"
    - "Auto"
  target_humidity: 70  # Seedling stage (65-75%)
  purpose: Maintain VPD in 0.4-0.8 kPa range
  control_method: Turn on/off based on humidity/VPD thresholds
```

---

## 3. Schedules

### 3.1 Light Schedule (20/4 Photoperiod)

| Parameter | Value | Notes |
|-----------|-------|-------|
| **Lights ON** | 6:00 AM | Start of "day" period |
| **Lights OFF** | 2:00 AM | Start of "night" period |
| **Photoperiod** | 20 hours | Optimized for vegetative growth |
| **Dark Period** | 4 hours | 2 AM - 6 AM |

```yaml
light_schedule:
  type: time_based
  entity: switch.light
  
  on_trigger:
    platform: time
    at: "06:00:00"
    action: switch.turn_on
    
  off_trigger:
    platform: time
    at: "02:00:00"
    action: switch.turn_off
```

### 3.2 Temperature Schedule (Day/Night Modulation)

| Period | Time Window | Target | Tolerance |
|--------|-------------|--------|-----------|
| **Day** | 6:00 AM - 2:00 AM | 80°F | ±3°F |
| **Night** | 2:00 AM - 6:00 AM | 70°F | ±3°F |

```yaml
temperature_schedule:
  type: time_based
  entity: climate.tent_heater
  
  day_settings:
    trigger_time: "06:00:00"
    target_temp: 80
    hvac_mode: heat
    
  night_settings:
    trigger_time: "02:00:00"
    target_temp: 70
    hvac_mode: heat
```

### 3.3 Humidity/VPD Schedule

| Period | VPD Target | Humidity Target | Notes |
|--------|------------|-----------------|-------|
| **Day** | 0.4-0.8 kPa | 65-75% | Seedling stage |
| **Night** | 0.4-0.6 kPa | 70-80% | Higher RH acceptable |

---

## 4. VPD Targets by Growth Stage

### Reference Chart

| Stage | VPD (kPa) | Temp (°F) | Humidity (%) | Duration |
|-------|-----------|-----------|--------------|----------|
| **Seedling** | 0.4 - 0.8 | 75-78 | 65-75 | Weeks 1-2 |
| **Early Veg** | 0.8 - 1.0 | 75-80 | 60-70 | Weeks 3-4 |
| **Late Veg** | 1.0 - 1.2 | 78-82 | 55-65 | Weeks 5-8 |
| **Early Flower** | 1.0 - 1.4 | 78-82 | 50-60 | Weeks 9-12 |
| **Late Flower** | 1.2 - 1.5 | 75-80 | 45-55 | Weeks 13+ |

### Current Stage Settings

```yaml
current_stage: seedling

targets:
  vpd:
    min: 0.4
    max: 0.8
    optimal: 0.6
  temperature:
    day: 80
    night: 70
  humidity:
    day: 70
    night: 75
```

---

## 5. Environment Baseline Data

### 5.1 Water Chemistry

```yaml
water_source:
  type: Albany Municipal Tap Water
  baseline_ph: 7.77
  treatment_required: true
  
ph_adjustment:
  target_range:
    min: 6.4
    max: 6.5
  method: pH Down solution
  notes: "Always pH adjust AFTER adding nutrients"

distilled_water:
  source: Vevor Water Distiller
  capacity: 1.1 gallons
  runtime: 4 hours
  use_case: Mixing nutrients, sensitive plants
```

### 5.2 Ambient Environment

```yaml
basement_conditions:
  location: Albany, NY area
  baseline_humidity: 30%  # Challenge: Very dry
  baseline_temp: ~65°F (varies seasonally)
  
challenges:
  - Low ambient humidity requires active humidification
  - Humidifier must run continuously during seedling stage
  - 9L CloudForge T7 tank critical for maintaining RH
```

---

## 6. Safe-Touch Planting Protocol

### 6.1 Seed Planting Procedure

```yaml
planting_method: Safe-Touch Protocol
version: 1.0

steps:
  1_seed_depth:
    depth: 0.5 inches  # 1/2 inch
    notes: "Gently press seed into moist medium, cover lightly"
    
  2_watering_zone:
    diameter: 3 inches
    shape: circle
    center: seed location
    notes: "Water only within this zone to encourage root development"
    
  3_initial_water:
    volume: 1 cup (8 oz)
    ph_target: 6.4 - 6.5
    temperature: room temp (~70°F)
    method: "Slow pour around perimeter of 3-inch circle"
    
  4_humidity_dome:
    type: Solo Cup (inverted)
    ventilation: 4 slits cut in ceiling (bottom of cup)
    placement: centered over seed
    removal: "When first true leaves appear"
    notes: "Slits provide air exchange while maintaining humidity"
```

### 6.2 Humidity Dome Specifications

```
         ┌─────────────┐
         │  ////       │  ← 4 slits for airflow
         │             │
         │   DOME      │  ← Inverted Solo Cup
         │             │
         │             │
    ─────┴─────────────┴─────
         │  ●  │             ← Seed at 1/2" depth
         │◄─3"─►│            ← Watering circle diameter
    ═══════════════════════  ← Growing medium
```

### 6.3 Early Stage Care Timeline

| Day | Action | Notes |
|-----|--------|-------|
| 0 | Plant seed, initial water, place dome | 1 cup pH 6.4-6.5 water |
| 1-3 | Monitor only | Do not water unless visibly dry |
| 3-5 | Check for emergence | Maintain dome humidity |
| 5-7 | Seedling emerges | Continue dome until true leaves |
| 7-14 | Remove dome gradually | Acclimate to tent humidity |

---

## 7. Active Automations

### 7.1 Currently Active

| Name | Entity ID | Trigger | Status |
|------|-----------|---------|--------|
| Leak Alert | `automation.leak_alert` | Leak sensor | ✅ Active |
| Grow Light Control | `automation.grow_light_control` | Time-based (6 AM / 2 AM) | ✅ Active |
| Tent Temperature Modulation | `automation.tent_temperature_modulation` | Time-based (6 AM / 2 AM) | ✅ Active |

### 7.2 Implemented Automations

| Name | Entity | Trigger | Status |
|------|--------|---------|--------|
| Light Schedule | `switch.light` | Time: 6:00 AM / 2:00 AM | ✅ **DEPLOYED** |
| Temperature Modulation | `climate.tent_heater` | Time: 6:00 AM / 2:00 AM | ✅ **DEPLOYED** |

### 7.3 Planned Automations

| Name | Priority | Dependencies |
|------|----------|--------------|
| VPD Humidity Control | 🟡 Ready to Deploy | `select.cloudforge_t5_active_mode` |
| VPD Out-of-Range Alert | 🟡 Medium | Notification service |
| Exhaust Fan Auto Mode | 🟡 Medium | VPD logic |

---

## 8. People & Tracking

```yaml
people:
  - person.russell_moss:
      status: home
      device: device_tracker.petey
      
  - person.amy_moss:
      status: home  
      device: device_tracker.amys_iphone
```

---

## 9. System Status

### Home Assistant

| Component | Entity | Status |
|-----------|--------|--------|
| Core Update | `update.home_assistant_core_update` | ⚠️ Update Available |
| OS Update | `update.home_assistant_operating_system_update` | ✅ Current |
| Supervisor | `update.home_assistant_supervisor_update` | ✅ Current |
| HACS | `update.hacs_update` | ✅ Current |
| Tailscale | `update.tailscale_update` | ✅ Current |

### Integrations

- AC Infinity (Custom Integration via HACS)
- Tailscale
- Mobile App (iOS)
- Zigbee (Third Reality devices)
- Google Translate TTS

---

## 10. Quick Commands

### Check Current Climate
```
MCP: get_entity sensor.ac_infinity_controller_69_pro_temperature
MCP: get_entity sensor.ac_infinity_controller_69_pro_humidity
MCP: get_entity sensor.ac_infinity_controller_69_pro_vpd
```

### Control Grow Light
```
MCP: call_service switch.turn_on
     entity_id: switch.light

MCP: call_service switch.turn_off
     entity_id: switch.light
```

### Control Heater
```
MCP: call_service climate.set_temperature 
     entity_id: climate.tent_heater
     temperature: 80
```

### Set Exhaust Fan Mode
```
MCP: call_service select.select_option
     entity_id: select.exhaust_fan_active_mode
     option: "Auto"
```

---

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-01-18 | Initial manifest created from MCP entity list | System |
| 2026-01-18 | Added Safe-Touch Protocol, environment baselines, confirmed hardware | System |
| 2026-01-18 | Updated grow light entity to `switch.light`, added water chemistry | System |
| 2026-01-18 | Updated with live sensor values (81.3°F, 33.4%, 2.65 kPa) | System |
| 2026-01-18 | Marked Phase 1 automations as deployed (light & temperature) | System |
| 2026-01-18 | Added intake air fan, grow room sensor, leak sensor to inventory | System |

---

*This manifest is the single source of truth for the grow environment. Update it whenever configuration changes.*
