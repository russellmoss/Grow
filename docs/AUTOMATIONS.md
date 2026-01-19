# 🤖 Grow Automations Documentation
## Home Assistant Automation Reference

**Last Updated:** 2026-01-18  
**Home Assistant:** http://100.65.202.84:8123  

---

## Overview

This document contains all automation logic for the grow environment. Each automation includes:
- Purpose and trigger conditions
- Full YAML configuration
- Related entities
- Testing notes

---

## 1. Active Automations

### 1.1 Leak Alert

**Status:** ✅ Active  
**Entity ID:** `automation.leak_alert`  
**Purpose:** Alert when water leak detected

```yaml
# Existing automation in HA
# Details TBD - query via MCP if needed
```

---

### 1.2 Grow Light Control

**Status:** ✅ **ACTIVE - DEPLOYED**  
**Entity ID:** `automation.grow_light_control`  
**Purpose:** Automated 20/4 photoperiod light schedule

**Note:** This automation is already deployed and active in Home Assistant. It handles both ON (6 AM) and OFF (2 AM) triggers.

**Related Entities:**
- `switch.light` - Third Reality Zigbee Plug

---

### 1.3 Tent Temperature Modulation

**Status:** ✅ **ACTIVE - DEPLOYED**  
**Entity ID:** `automation.tent_temperature_modulation`  
**Purpose:** Day/night temperature modulation (80°F day / 70°F night)

**Note:** This automation is already deployed and active in Home Assistant. It handles both day (6 AM) and night (2 AM) temperature settings.

**Related Entities:**
- `climate.tent_heater` - Tent heater thermostat

---

## 2. Light Schedule (20/4 Photoperiod)

### 2.1 Light ON - Morning

**Status:** ✅ **DEPLOYED** (via `automation.grow_light_control`)  
**Trigger:** Daily at 6:00 AM  
**Action:** Turn on grow light  

```yaml
alias: "Grow Light ON - Morning"
description: "Turn on grow light at 6 AM for 20-hour photoperiod"
mode: single

trigger:
  - platform: time
    at: "06:00:00"

condition: []

action:
  - service: switch.turn_on
    target:
      entity_id: switch.light
```

**Related Entities:**
- `switch.light` - Third Reality Zigbee Plug

**Testing:**
1. Deploy via MCP: `create_automation`
2. Verify with: `get_entity switch.light`
3. Manual test: `call_service switch.turn_on entity_id: switch.light`

---

### 2.2 Light OFF - Night

**Status:** ✅ **DEPLOYED** (via `automation.grow_light_control`)  
**Trigger:** Daily at 2:00 AM  
**Action:** Turn off grow light  

```yaml
alias: "Grow Light OFF - Night"
description: "Turn off grow light at 2 AM for 4-hour dark period"
mode: single

trigger:
  - platform: time
    at: "02:00:00"

condition: []

action:
  - service: switch.turn_off
    target:
      entity_id: switch.light
```

**Related Entities:**
- `switch.light` - Third Reality Zigbee Plug

**Schedule Summary:**
| Event | Time | Duration |
|-------|------|----------|
| Lights ON | 6:00 AM | — |
| Lights OFF | 2:00 AM | — |
| Photoperiod | — | 20 hours |
| Dark Period | 2 AM - 6 AM | 4 hours |

---

## 3. Temperature Modulation (Day/Night)

### 3.1 Day Temperature - Lights On

**Status:** ✅ **DEPLOYED** (via `automation.tent_temperature_modulation`)  
**Trigger:** Daily at 6:00 AM (synced with light ON)  
**Action:** Set heater to 80°F  

```yaml
alias: "Temperature Day Mode"
description: "Set heater to 80°F when lights turn on at 6 AM"
mode: single

trigger:
  - platform: time
    at: "06:00:00"

condition: []

action:
  - service: climate.set_temperature
    target:
      entity_id: climate.tent_heater
    data:
      temperature: 80
      hvac_mode: heat
```

**Related Entities:**
- `climate.tent_heater` - Tent heater thermostat

---

### 3.2 Night Temperature - Lights Off

**Status:** ✅ **DEPLOYED** (via `automation.tent_temperature_modulation`)  
**Trigger:** Daily at 2:00 AM (synced with light OFF)  
**Action:** Set heater to 70°F  

```yaml
alias: "Temperature Night Mode"
description: "Set heater to 70°F when lights turn off at 2 AM"
mode: single

trigger:
  - platform: time
    at: "02:00:00"

condition: []

action:
  - service: climate.set_temperature
    target:
      entity_id: climate.tent_heater
    data:
      temperature: 70
      hvac_mode: heat
```

**Related Entities:**
- `climate.tent_heater` - Tent heater thermostat

**Temperature Schedule Summary:**
| Period | Time Window | Target | Tolerance |
|--------|-------------|--------|-----------|
| Day | 6:00 AM - 2:00 AM | 80°F | ±3°F |
| Night | 2:00 AM - 6:00 AM | 70°F | ±3°F |

---

## 4. Planned Automations (Pending Hardware)

### 4.1 VPD-Based Humidity Control

**Status:** 🟡 Ready to Deploy  
**Trigger:** VPD sensor exceeds target range  
**Action:** Turn on CloudForge T5 humidifier  

```yaml
alias: "VPD Humidity Control - Turn On"
description: "Turn on CloudForge T5 when VPD exceeds 0.8 kPa (seedling upper limit)"
mode: single

trigger:
  - platform: numeric_state
    entity_id: sensor.ac_infinity_controller_69_pro_vpd
    above: 0.8  # Seedling upper limit
    for:
      minutes: 5  # Wait 5 minutes to avoid rapid cycling

condition:
  - condition: state
    entity_id: switch.light
    state: "on"  # Only during day period
  - condition: state
    entity_id: select.cloudforge_t5_active_mode
    state: "Off"  # Only if currently off

action:
  - service: select.select_option
    target:
      entity_id: select.cloudforge_t5_active_mode
    data:
      option: "On"
  - service: notify.mobile_app_petey
    data:
      title: "🌱 Humidifier Activated"
      message: "VPD {{ states('sensor.ac_infinity_controller_69_pro_vpd') }} kPa - CloudForge T5 turned ON"
```

**Turn Off Automation:**
```yaml
alias: "VPD Humidity Control - Turn Off"
description: "Turn off CloudForge T5 when VPD is within optimal range"
mode: single

trigger:
  - platform: numeric_state
    entity_id: sensor.ac_infinity_controller_69_pro_vpd
    below: 0.6  # Below optimal (0.6 kPa) - turn off to avoid over-humidification
    for:
      minutes: 10  # Wait 10 minutes to ensure stable VPD

condition:
  - condition: state
    entity_id: select.cloudforge_t5_active_mode
    state: "On"  # Only if currently on

action:
  - service: select.select_option
    target:
      entity_id: select.cloudforge_t5_active_mode
    data:
      option: "Off"
  - service: notify.mobile_app_petey
    data:
      title: "🌱 Humidifier Deactivated"
      message: "VPD {{ states('sensor.ac_infinity_controller_69_pro_vpd') }} kPa - CloudForge T5 turned OFF"
```

**Dependencies:**
- ✅ CloudForge T5 integrated with HA
- ✅ Entity `select.cloudforge_t5_active_mode` exists
- ✅ VPD sensor operational

---

### 4.2 VPD Out-of-Range Alert

**Status:** 🟡 Ready to Develop  
**Trigger:** VPD outside 0.4-0.8 kPa (seedling range)  
**Action:** Send notification  

```yaml
alias: "VPD Alert - Out of Range"
description: "Alert when VPD is outside optimal seedling range"
mode: single

trigger:
  - platform: numeric_state
    entity_id: sensor.ac_infinity_controller_69_pro_vpd
    above: 1.0
    for:
      minutes: 10
  - platform: numeric_state
    entity_id: sensor.ac_infinity_controller_69_pro_vpd
    below: 0.3
    for:
      minutes: 10

condition: []

action:
  - service: notify.mobile_app_petey
    data:
      title: "🌱 VPD Alert"
      message: "VPD is {{ states('sensor.ac_infinity_controller_69_pro_vpd') }} kPa - outside optimal range (0.4-0.8)"
```

**Notes:**
- Requires mobile app notification setup
- Adjust thresholds when changing growth stages

---

### 4.3 Exhaust Fan Auto Mode

**Status:** ⏳ Planning  
**Trigger:** Temperature or humidity threshold  
**Action:** Adjust fan mode/speed  

```yaml
# DRAFT
alias: "Exhaust Fan Temperature Control"
description: "Increase fan speed when temperature too high"
mode: single

trigger:
  - platform: numeric_state
    entity_id: sensor.ac_infinity_controller_69_pro_temperature
    above: 85

action:
  - service: select.select_option
    target:
      entity_id: select.exhaust_fan_active_mode
    data:
      option: "Auto"
```

---

## 5. Automation Deployment Checklist

### Before Deploying:
- [ ] Verify entity IDs with MCP: `get_entity [entity_id]`
- [ ] Test service call manually first
- [ ] Document in this file
- [ ] Update MANIFEST.md automation section

### Deployment:
- [ ] Use MCP: `create_automation` with YAML
- [ ] Verify with: `list_automations`
- [ ] Test trigger manually if possible

### After Deploying:
- [ ] Monitor for 24 hours
- [ ] Check HA logs: `get_error_log`
- [ ] Update status in this document
- [ ] Log in CHANGELOG.md

---

## 6. Automation Dependencies Map

```
┌─────────────────────────────────────────────────────────────┐
│                    TIME TRIGGERS                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   6:00 AM ─┬─► Light ON (switch.light)                     │
│            └─► Day Temp 80°F (climate.tent_heater)         │
│                                                             │
│   2:00 AM ─┬─► Light OFF (switch.light)                    │
│            └─► Night Temp 70°F (climate.tent_heater)       │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    SENSOR TRIGGERS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   VPD > 0.8 ──► Humidity Control (PENDING T7)              │
│   VPD > 1.0 ──► Alert Notification                         │
│   Temp > 85 ──► Fan Auto Mode                              │
│   Leak ───────► Leak Alert (ACTIVE)                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. MCP Commands for Automation Management

### List All Automations
```
MCP: list_automations
```

### Create New Automation
```
MCP: create_automation
     [paste full YAML]
```

### Debug Automation
```
MCP: debug_automation automation.automation_name
```

### Manually Trigger (for testing)
```
MCP: call_service automation.trigger
     entity_id: automation.automation_name
```

---

## Changelog

| Date | Automation | Change |
|------|------------|--------|
| 2026-01-18 | Light Schedule | Documented 20/4 schedule (6 AM - 2 AM) |
| 2026-01-18 | Temperature Modulation | Documented Day 80°F / Night 70°F |
| 2026-01-18 | VPD Automations | Drafted pending T7 integration |
| 2026-01-18 | Light & Temperature | Verified as deployed and active in HA |
| 2026-01-18 | System Verification | Confirmed 3 active automations via MCP |

---

*Update this document whenever automations are created, modified, or removed.*
