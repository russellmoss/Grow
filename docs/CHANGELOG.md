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

*This changelog tracks all significant changes to the grow automation system, including hardware additions, automation deployments, configuration changes, and documentation updates.*
