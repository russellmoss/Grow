# 📊 Home Assistant Entities Reference
## Complete Entity Documentation for Grow Environment

**Last Updated:** 2026-01-18  
**Total Entities:** 100  
**Grow-Related Entities:** ~30

---

## Overview

This document provides comprehensive documentation for all entities related to the grow environment automation system. Entities are organized by domain and include current state, attributes, and availability status.

---

## 1. Climate Sensors

### 1.1 AC Infinity Controller 69 Pro

#### Temperature Sensor
```yaml
entity_id: sensor.ac_infinity_controller_69_pro_temperature
friendly_name: AC Infinity Controller 69 Pro Temperature
current_state: 81.266
unit_of_measurement: °F
status: ✅ Available
device: AC Infinity Controller 69 Pro
location: Tent
```

**Current Value:** 81.3°F  
**Target Range (Seedling):** 75-78°F  
**Status:** ⚠️ Slightly High

#### Humidity Sensor
```yaml
entity_id: sensor.ac_infinity_controller_69_pro_humidity
friendly_name: AC Infinity Controller 69 Pro Humidity
current_state: 33.42
unit_of_measurement: "%"
status: ✅ Available
device: AC Infinity Controller 69 Pro
location: Tent
```

**Current Value:** 33.4%  
**Target Range (Seedling):** 65-75%  
**Status:** ❌ CRITICAL - Very Low

#### VPD Sensor
```yaml
entity_id: sensor.ac_infinity_controller_69_pro_vpd
friendly_name: AC Infinity Controller 69 Pro VPD
current_state: 2.65
unit_of_measurement: kPa
status: ✅ Available
device: AC Infinity Controller 69 Pro
location: Tent
```

**Current Value:** 2.65 kPa  
**Target Range (Seedling):** 0.4-0.8 kPa  
**Status:** ❌ CRITICAL - Extremely High

#### Controller Status
```yaml
entity_id: binary_sensor.ac_infinity_controller_69_pro_status
friendly_name: AC Infinity Controller 69 Pro Status
current_state: on
status: ✅ Available
```

#### Outside Temperature Selector
```yaml
entity_id: select.ac_infinity_controller_69_pro_outside_temperature
friendly_name: AC Infinity Controller 69 Pro Outside Temperature
current_state: Neutral
status: ✅ Available
options: [Neutral, ...]
```

#### Outside Humidity Selector
```yaml
entity_id: select.ac_infinity_controller_69_pro_outside_humidity
friendly_name: AC Infinity Controller 69 Pro Outside Humidity
current_state: Neutral
status: ✅ Available
options: [Neutral, ...]
```

---

### 1.2 Grow Room Sensor (Secondary)

#### Temperature
```yaml
entity_id: sensor.sensor_grow_room_temperature_and_humidity_temperature
friendly_name: Grow Room Sensor Temperature
current_state: 79.358
unit_of_measurement: °F
status: ✅ Available
device: Grow Room Sensor
location: Tent (secondary)
```

**Current Value:** 79.4°F

#### Humidity
```yaml
entity_id: sensor.sensor_grow_room_temperature_and_humidity_humidity
friendly_name: Grow Room Sensor Humidity
current_state: 22.88
unit_of_measurement: "%"
status: ✅ Available
device: Grow Room Sensor
location: Tent (secondary)
```

**Current Value:** 22.9%  
**Note:** This sensor shows significantly lower humidity than AC Infinity controller. May need calibration or different location.

#### Battery
```yaml
entity_id: sensor.sensor_grow_room_temperature_and_humidity_battery
friendly_name: Grow Room Sensor Battery
current_state: unknown
status: ⚠️ Unknown
```

---

## 2. Climate Control Devices

### 2.1 Tent Heater

```yaml
entity_id: climate.tent_heater
friendly_name: Tent Heater
current_state: heat
hvac_modes: [heat, off]
current_temperature: [from sensor]
target_temperature: [set via automation]
status: ✅ Available
device: Space Heater (via thermostat)
location: Tent Floor
```

**Current Mode:** heat  
**Schedule:**
- Day (6 AM - 2 AM): 80°F
- Night (2 AM - 6 AM): 70°F

**Power Monitoring:**
```yaml
entity_id: sensor.space_heater_power
friendly_name: space heater Power
current_state: 0.0
unit_of_measurement: W
status: ✅ Available
```

```yaml
entity_id: sensor.space_heater_voltage
friendly_name: space heater Voltage
current_state: 119.8
unit_of_measurement: V
status: ✅ Available
```

```yaml
entity_id: sensor.space_heater_current
friendly_name: space heater Current
current_state: 0.0
unit_of_measurement: A
status: ✅ Available
```

```yaml
entity_id: switch.space_heater
friendly_name: space heater
current_state: off
status: ✅ Available
```

**Note:** Heater is controlled via `climate.tent_heater` entity, not the switch directly.

---

### 2.2 Exhaust Fan

#### Active Mode Selector
```yaml
entity_id: select.exhaust_fan_active_mode
friendly_name: Exhaust fan Active Mode
current_state: On
status: ✅ Available
options: [On, Off, Auto]
device: AC Infinity Controller 69 Pro - Port 1
location: Tent Top
```

**Current Mode:** On

#### Status Binary Sensor
```yaml
entity_id: binary_sensor.exhaust_fan_status
friendly_name: Exhaust fan Status
current_state: on
status: ✅ Available
```

#### State Binary Sensor
```yaml
entity_id: binary_sensor.exhaust_fan_state
friendly_name: Exhaust fan State
current_state: on
status: ✅ Available
```

#### Current Power
```yaml
entity_id: sensor.exhaust_fan_current_power
friendly_name: Exhaust fan Current Power
current_state: 5
unit_of_measurement: [level 1-10]
status: ✅ Available
```

**Current Power Level:** 5/10

#### Remaining Time
```yaml
entity_id: sensor.exhaust_fan_remaining_time
friendly_name: Exhaust fan Remaining Time
current_state: 0
status: ✅ Available
```

#### Next State Change
```yaml
entity_id: sensor.exhaust_fan_next_state_change
friendly_name: Exhaust fan Next State Change
current_state: unknown
status: ✅ Available
```

#### Device Type
```yaml
entity_id: select.exhaust_fan_device_type
friendly_name: Exhaust fan Device Type
current_state: No Device Type
status: ✅ Available
```

#### Dynamic Response
```yaml
entity_id: select.exhaust_fan_dynamic_response
friendly_name: Exhaust fan Dynamic Response
current_state: Transition
status: ✅ Available
```

#### Auto Settings Mode
```yaml
entity_id: select.exhaust_fan_auto_settings_mode
friendly_name: Exhaust fan Auto Settings Mode
current_state: unavailable
status: ❌ Unavailable
```

#### VPD Settings Mode
```yaml
entity_id: select.exhaust_fan_vpd_settings_mode
friendly_name: Exhaust fan VPD Settings Mode
current_state: unavailable
status: ❌ Unavailable
```

#### Trigger Enable Switches
All exhaust fan trigger switches are unavailable:
- `switch.exhaust_fan_humidity_high_trigger_enabled`
- `switch.exhaust_fan_humidity_low_trigger_enabled`
- `switch.exhaust_fan_temperature_high_trigger_enabled`
- `switch.exhaust_fan_temperature_low_trigger_enabled`
- `switch.exhaust_fan_vpd_high_trigger_enabled`
- `switch.exhaust_fan_vpd_low_trigger_enabled`
- `switch.exhaust_fan_scheduled_on_time_enabled`
- `switch.exhaust_fan_scheduled_off_time_enabled`
- `switch.exhaust_fan_target_humidity_enabled`
- `switch.exhaust_fan_target_temperature_enabled`
- `switch.exhaust_fan_target_vpd_enabled`
- `switch.exhaust_fan_sunrise_sunset_enabled` (available, state: off)

---

### 2.3 Intake Air (Additional Fan?)

```yaml
entity_id: switch.intake_air
friendly_name: intake air
current_state: on
status: ✅ Available
```

**Power Monitoring:**
- `sensor.intake_air_power`: 16.8 W
- `sensor.intake_air_voltage`: 120.1 V
- `sensor.intake_air_current`: 0.22 A
- `sensor.intake_air_power_factor`: 63
- `sensor.intake_air_summation_delivered`: 0.431 kWh

```yaml
entity_id: select.intake_air_start_up_behavior
friendly_name: intake air Start-up behavior
current_state: Off
status: ✅ Available
```

---

## 3. Lighting

### 3.1 Grow Light

```yaml
entity_id: switch.light
friendly_name: Light
current_state: on
status: ✅ Available
device: Third Reality Zigbee Smart Plug
connection: Zigbee
location: Tent Ceiling
```

**Current State:** ON  
**Schedule:** 20/4 photoperiod
- ON: 6:00 AM
- OFF: 2:00 AM

**Power Monitoring:**
```yaml
entity_id: sensor.light_power
friendly_name: Light Power
current_state: 96.4
unit_of_measurement: W
status: ✅ Available
```

**Current Power Draw:** 96.4 W

```yaml
entity_id: sensor.light_voltage
friendly_name: Light Voltage
current_state: 119.6
unit_of_measurement: V
status: ✅ Available
```

```yaml
entity_id: sensor.light_current
friendly_name: Light Current
current_state: 0.833
unit_of_measurement: A
status: ✅ Available
```

```yaml
entity_id: sensor.light_power_factor
friendly_name: Light Power factor
current_state: 96
unit_of_measurement: "%"
status: ✅ Available
```

```yaml
entity_id: sensor.light_instantaneous_demand
friendly_name: Light Instantaneous demand
current_state: 0.3
status: ✅ Available
```

```yaml
entity_id: sensor.light_summation_delivered
friendly_name: Light Summation delivered
current_state: 2.60412416666667
unit_of_measurement: kWh
status: ✅ Available
```

**Total Energy Used:** 2.60 kWh

```yaml
entity_id: select.light_start_up_behavior
friendly_name: Light Start-up behavior
current_state: Off
status: ✅ Available
```

---

## 4. Leak Detection

### 4.1 Leak Sensor #1

```yaml
entity_id: binary_sensor.leak_sensor_1
friendly_name: leak sensor #1
current_state: off
status: ✅ Available
```

**Status:** No leak detected ✅

#### Battery
```yaml
entity_id: sensor.leak_sensor_1_battery
friendly_name: leak sensor #1 Battery
current_state: 69.5
unit_of_measurement: "%"
status: ✅ Available
```

**Battery Level:** 69.5%

#### Device Temperature
```yaml
entity_id: sensor.leak_sensor_1_device_temperature
friendly_name: leak sensor #1 Device temperature
current_state: 82.4
unit_of_measurement: °F
status: ✅ Available
```

---

## 5. System Monitoring

### 5.1 Raspberry Pi Power Status

```yaml
entity_id: binary_sensor.rpi_power_status
friendly_name: RPi Power status
current_state: off
status: ✅ Available
device: Raspberry Pi (HA Host)
location: Network Closet
```

**Status:** Power monitoring active (currently off = no power issue)

---

## 6. Humidity Control - CloudForge T5

### 6.1 Active Mode Selector
```yaml
entity_id: select.cloudforge_t5_active_mode
friendly_name: CloudForge T5 Active Mode
current_state: Off
status: ✅ Available
options: [On, Off, Auto]
device: AC Infinity CloudForge T5
port: 2
location: Tent
```

**Current Mode:** Off  
**Purpose:** Control humidifier to maintain target humidity (65-75% for seedling) and VPD (0.4-0.8 kPa)

### 6.2 State Binary Sensor
```yaml
entity_id: binary_sensor.cloudforge_t5_state
friendly_name: CloudForge T5 State
current_state: off
status: ✅ Available
```

**Status:** Currently OFF

### 6.3 Status Binary Sensor
```yaml
entity_id: binary_sensor.cloudforge_t5_status
friendly_name: CloudForge T5 Status
current_state: on
status: ✅ Available
```

**Status:** Device is online and operational

### 6.4 Device Type Selector
```yaml
entity_id: select.cloudforge_t5_device_type
friendly_name: CloudForge T5 Device Type
current_state: No Device Type
status: ✅ Available
```

### 6.5 Dynamic Response Selector
```yaml
entity_id: select.cloudforge_t5_dynamic_response
friendly_name: CloudForge T5 Dynamic Response
current_state: Transition
status: ✅ Available
```

### 6.6 VPD Settings Mode
```yaml
entity_id: select.cloudforge_t5_vpd_settings_mode
friendly_name: CloudForge T5 VPD Settings Mode
current_state: unavailable
status: ❌ Unavailable
```

### 6.7 Trigger Enable Switches
All CloudForge T5 trigger switches are available but most are unavailable:
- `switch.cloudforge_t5_humidity_high_trigger_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_humidity_low_trigger_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_temperature_high_trigger_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_temperature_low_trigger_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_vpd_high_trigger_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_vpd_low_trigger_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_scheduled_on_time_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_scheduled_off_time_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_target_humidity_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_target_temperature_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_target_vpd_enabled` - ❌ Unavailable
- `switch.cloudforge_t5_sunrise_sunset_enabled` - ✅ Available (state: off)

**Note:** Control via `select.cloudforge_t5_active_mode` (On/Off/Auto) for VPD-based automation.

---

## 7. Unavailable Entities (AC Infinity Ports 3, 4)

### Port 3 Entities
All entities with pattern `*_port_3_*` are **unavailable**:
- Same pattern as Port 2
- No planned use currently

### Port 4 Entities
All entities with pattern `*_port_4_*` are **unavailable**:
- Same pattern as Port 2
- No planned use currently

**Note:** Port 2 is now active with CloudForge T5 Humidifier (see Section 6 above)

---

## 8. Entity Status Summary

### Available Entities (Grow-Related)
- ✅ AC Infinity Controller sensors (temp, humidity, VPD)
- ✅ **CloudForge T5 Humidifier** (Port 2, currently Off)
- ✅ Tent Heater (climate control)
- ✅ Exhaust Fan (active, power level 5)
- ✅ Grow Light (on, 96.4W)
- ✅ Intake Air (on, 16.8W)
- ✅ Leak Sensor (no leak, 69.5% battery)
- ✅ Grow Room Sensor (secondary temp/humidity)

### Unavailable Entities
- ❌ All Port 3 entities (no device)
- ❌ All Port 4 entities (no device)
- ❌ Most exhaust fan trigger switches
- ❌ Exhaust fan auto/VPD settings modes
- ❌ Most CloudForge T5 trigger switches (use active_mode instead)

---

## 9. Entity Relationships

### Climate Control Chain
```
sensor.ac_infinity_controller_69_pro_temperature
  └─► climate.tent_heater (target: 80°F day / 70°F night)

sensor.ac_infinity_controller_69_pro_humidity
  └─► select.cloudforge_t5_active_mode (On/Off/Auto for 65-75% target)

sensor.ac_infinity_controller_69_pro_vpd
  └─► select.cloudforge_t5_active_mode (VPD-based control: 0.4-0.8 kPa target)
```

### Lighting Chain
```
Time Trigger (6 AM / 2 AM)
  └─► switch.light (ON/OFF)
      └─► sensor.light_power (monitoring)
```

### Fan Control Chain
```
select.exhaust_fan_active_mode (On/Off/Auto)
  └─► binary_sensor.exhaust_fan_state (on/off)
      └─► sensor.exhaust_fan_current_power (level 5)
```

---

## 10. Quick Reference

### Critical Sensors
| Entity | Current | Target | Status |
|--------|---------|--------|--------|
| Temperature | 81.3°F | 75-78°F | ⚠️ High |
| Humidity | 33.4% | 65-75% | ❌ Critical |
| VPD | 2.65 kPa | 0.4-0.8 kPa | ❌ Critical |

### Control Entities
| Device | Entity ID | Current State |
|--------|-----------|---------------|
| Grow Light | `switch.light` | ON |
| Heater | `climate.tent_heater` | heat |
| Exhaust Fan | `select.exhaust_fan_active_mode` | On |

### Power Monitoring
| Device | Power | Voltage | Current |
|--------|-------|---------|---------|
| Grow Light | 96.4 W | 119.6 V | 0.833 A |
| Intake Air | 16.8 W | 120.1 V | 0.22 A |
| Space Heater | 0.0 W | 119.8 V | 0.0 A |

---

## 11. Changelog

| Date | Change |
|------|--------|
| 2026-01-18 | Initial entity documentation created from MCP data |
| 2026-01-18 | Added power monitoring details, leak sensor, secondary sensors |
| 2026-01-18 | Added CloudForge T5 Humidifier (Port 2) - integrated and operational |

---

*This document is updated whenever entities are added, removed, or their states change significantly.*
