# 📝 Grow Automation Project Changelog

**Project:** Indoor Grow Environment Automation  
**Home Assistant:** http://100.65.202.84:8123  
**Location:** Basement (Albany, NY area)

---

## 2026-01-18

### Documentation
- ✅ **Initial SSoT documentation created**
  - Created comprehensive `docs/ENTITIES.md` with all grow-related entities
  - Documented current sensor values, states, and availability
  - Identified 3 active automations already deployed
  - Updated `docs/MANIFEST.md` with live sensor data
  - Verified automation deployment status

### Discoveries
- Found 3 automations already active:
  - `automation.grow_light_control` (light schedule)
  - `automation.tent_temperature_modulation` (temperature schedule)
  - `automation.leak_alert` (leak detection)
- Current climate status:
  - Temperature: 81.3°F (slightly high, target 75-78°F)
  - Humidity: 33.4% (critical low, target 65-75%)
  - VPD: 2.65 kPa (critical high, target 0.4-0.8 kPa)
- Additional devices discovered:
  - Intake air fan (16.8W, currently on)
  - Grow Room Sensor (secondary temp/humidity sensor)
  - Power monitoring for all major devices

### System Status
- Total entities: 100
- Grow-related entities: ~30
- Available entities: Most sensors and controls operational
- Unavailable entities: AC Infinity Ports 2, 3, 4 (no devices connected)

---

## 2026-01-18 (Evening)

### Hardware Integration
- ✅ **CloudForge T5 Humidifier Integrated**
  - Connected to AC Infinity Controller 69 Pro Port 2
  - Primary control entity: `select.cloudforge_t5_active_mode`
  - Status entities: `binary_sensor.cloudforge_t5_state`, `binary_sensor.cloudforge_t5_status`
  - Current state: Off (ready for VPD-based automation)
  - Purpose: Maintain humidity (65-75%) and VPD (0.4-0.8 kPa) for seedling stage

### Documentation Updates
- Updated `docs/MANIFEST.md`:
  - Moved CloudForge T5 from "Pending Integration" to "Connected & Active"
  - Updated Port 2 status from unavailable to active
  - Added CloudForge T5 entity registry section
- Updated `docs/ENTITIES.md`:
  - Added comprehensive CloudForge T5 section (Section 6)
  - Documented all T5-related entities (select, binary_sensor, switch)
  - Updated entity relationships to show T5 in climate control chain
- Updated `docs/AUTOMATIONS.md`:
  - Changed VPD Humidity Control from "Pending T7" to "Ready to Deploy"
  - Updated automation YAML to use `select.cloudforge_t5_active_mode`
  - Added turn-on and turn-off automations for VPD-based control
- Updated `docs/DASHBOARD_MASTERPLAN.md`:
  - Added CloudForge T5 to control entities table
  - Added T5 entities to ENTITIES constants
  - Updated investigation summary to reflect T5 integration

### Next Steps
- Deploy VPD-based humidity control automations
- Monitor T5 performance in maintaining target VPD range
- Adjust automation thresholds based on real-world performance

---

*This changelog tracks all significant changes to the grow automation system, including hardware additions, automation deployments, configuration changes, and documentation updates.*
