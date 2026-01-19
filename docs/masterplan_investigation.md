# 🔍 Dashboard Masterplan Investigation
## Pre-Implementation Validation & Discovery

**Purpose:** Before implementing the dashboard, Cursor should work through this investigation to validate assumptions, discover current state, and update `DASHBOARD_MASTERPLAN.md` with accurate, live data.

**Instructions for Cursor:**
1. Work through each section sequentially
2. Run the MCP commands provided
3. Document findings in the "Findings" section of each task
4. Update `DASHBOARD_MASTERPLAN.md` based on discoveries
5. Mark tasks complete with ✅ when done

---

## 📋 Investigation Checklist

### Phase 0: MCP Connection Verification

**Task 0.1: Confirm MCP Access**
```
MCP Command: get_entity sensor.ac_infinity_controller_69_pro_temperature
```

**Expected:** Returns current temperature value
**If Failed:** Check `.cursor/mcp.json` configuration and Docker status

**Findings:**
```
[ Cursor: Document the response here ]
```

**Action:** If connection works, proceed. If not, troubleshoot before continuing.

---

### Phase 1: Entity Discovery & Validation

**Task 1.1: List All Entities**
```
MCP Command: list_entities
```

**Purpose:** Get complete entity list to discover any new devices or changed entity IDs

**Findings:**
```
[ Cursor: Paste relevant entity IDs here, especially any NEW ones not in MANIFEST.md ]

New entities discovered:
- 
- 
- 

Changed entity IDs:
- Old: → New:
- 
```

**Action:** Update `DASHBOARD_MASTERPLAN.md` Section "Pre-Flight: Entity Reference" with any corrections.

---

**Task 1.2: Validate Climate Sensor Entities**

Run each command and record current values:

```
MCP Command: get_entity sensor.ac_infinity_controller_69_pro_temperature
```
**Finding:** `___°F` | Status: ✅ Available / ❌ Unavailable

```
MCP Command: get_entity sensor.ac_infinity_controller_69_pro_humidity
```
**Finding:** `___%` | Status: ✅ Available / ❌ Unavailable

```
MCP Command: get_entity sensor.ac_infinity_controller_69_pro_vpd
```
**Finding:** `___ kPa` | Status: ✅ Available / ❌ Unavailable

**Action:** Update masterplan "Current State" values if significantly different from documented.

---

**Task 1.3: Validate Control Entities**

```
MCP Command: get_entity switch.light
```
**Finding:** State: `on/off` | Power: `___W` | Status: ✅/❌

```
MCP Command: get_entity switch.intake_air
```
**Finding:** State: `on/off` | Power: `___W` | Status: ✅/❌

```
MCP Command: get_entity climate.tent_heater
```
**Finding:** Mode: `___` | Target Temp: `___°F` | Status: ✅/❌

```
MCP Command: get_entity select.exhaust_fan_active_mode
```
**Finding:** Current Mode: `___` | Options: `[___]` | Status: ✅/❌

**Action:** If any entity is unavailable or has different ID, update masterplan `ENTITIES` constants.

---

**Task 1.4: Check for CloudForge T7 Humidifier**

```
MCP Command: list_entities
```
Search output for: `humidifier`, `cloudforge`, `t7`, `humidity`

**Finding:** 
- Entity ID found: `________________` 
- Or: ❌ Not yet integrated

**Action:** If found, add to masterplan control entities. This is HIGH PRIORITY for VPD control.

---

**Task 1.5: Discover Power Monitoring Entities**

```
MCP Command: list_entities
```
Search for: `*_power`, `*_voltage`, `*_current`, `*_energy`

**Findings:**
| Device | Power Entity | Current Value |
|--------|--------------|---------------|
| Light | `sensor.light_power` | ___W |
| Intake | `sensor.intake_air_power` | ___W |
| Heater | `sensor.space_heater_power` | ___W |
| Other | | |

**Action:** Add any new power entities to masterplan for potential "Power Dashboard" feature.

---

### Phase 2: Automation State Verification

**Task 2.1: List Active Automations**
```
MCP Command: list_automations
```

**Findings:**
| Automation | Entity ID | State |
|------------|-----------|-------|
| | | |
| | | |
| | | |

**Expected Automations:**
- [ ] `automation.grow_light_control` - Light schedule
- [ ] `automation.tent_temperature_modulation` - Temp schedule  
- [ ] `automation.leak_alert` - Safety alert

**Action:** If automations are missing or have different IDs, update `docs/AUTOMATIONS.md` and masterplan.

---

**Task 2.2: Verify Light Schedule Timing**
```
MCP Command: get_entity automation.grow_light_control
```

**Finding:** 
- Trigger times: ON at `___` / OFF at `___`
- Matches masterplan (06:00 / 02:00)? ✅ Yes / ❌ No

**Action:** Update `ScheduleSlider` default props if times differ.

---

**Task 2.3: Verify Temperature Schedule**
```
MCP Command: get_entity automation.tent_temperature_modulation
```

**Finding:**
- Day temp target: `___°F`
- Night temp target: `___°F`

**Action:** Update `TEMP_TARGETS` in masterplan if different from 80°F/70°F.

---

### Phase 3: Secondary Sensor Discovery

**Task 3.1: Check Grow Room Sensor (Secondary)**
```
MCP Command: get_entity sensor.sensor_grow_room_temperature_and_humidity_temperature
MCP Command: get_entity sensor.sensor_grow_room_temperature_and_humidity_humidity
```

**Findings:**
- Temperature: `___°F` (vs AC Infinity: `___°F`)
- Humidity: `___% ` (vs AC Infinity: `___%`)
- Discrepancy: `___°F` / `___%`

**Action:** If discrepancy >5%, note in masterplan. May want to display both sensors or average them.

---

**Task 3.2: Check Leak Sensor**
```
MCP Command: get_entity binary_sensor.leak_sensor_1
MCP Command: get_entity sensor.leak_sensor_1_battery
```

**Findings:**
- Leak Status: `___`
- Battery Level: `___%`

**Action:** If battery <30%, add alert to dashboard. Add leak sensor to dashboard if not already planned.

---

### Phase 4: API & History Verification

**Task 4.1: Test History API Access**
```
MCP Command: get_history sensor.ac_infinity_controller_69_pro_vpd
```
(Or via REST API test in browser)

**Finding:** 
- History available: ✅ Yes / ❌ No
- Data points returned: `___`
- Time range: `___`

**Action:** If history API has limitations, note in masterplan chart implementation.

---

**Task 4.2: Check HA Version & Updates**
```
MCP Command: get_entity update.home_assistant_core_update
```

**Finding:**
- Current version: `___`
- Update available: ✅ Yes / ❌ No

**Action:** Note any compatibility concerns for WebSocket API version.

---

### Phase 5: Network & Access Verification

**Task 5.1: Verify Tailscale Connectivity**
```
Ping test: ping 100.65.202.84
```

**Finding:** 
- Reachable: ✅ Yes / ❌ No
- Latency: `___ms`

---

**Task 5.2: Verify HA Web Access**
```
Browser test: http://100.65.202.84:8123
```

**Finding:**
- Accessible: ✅ Yes / ❌ No
- Login required: ✅ Yes / ❌ No

---

**Task 5.3: Validate Long-Lived Access Token**

Check if token in `.cursor/mcp.json` works:
```
MCP Command: get_entity switch.light
```

**Finding:**
- Token valid: ✅ Yes / ❌ No (auth error)

**Action:** If token invalid, generate new one in HA → Profile → Long-Lived Access Tokens

---

### Phase 6: File System & Project Structure

**Task 6.1: Verify Project Directory**
```bash
# In terminal, check structure exists:
ls -la C:\Users\russe\Documents\Grow\
```

**Expected Structure:**
```
Grow/
├── .cursor/mcp.json ✅/❌
├── .cursorrules ✅/❌
├── docs/
│   ├── MANIFEST.md ✅/❌
│   ├── AUTOMATIONS.md ✅/❌
│   ├── ENTITIES.md ✅/❌
│   ├── CHANGELOG.md ✅/❌
│   └── DASHBOARD_MASTERPLAN.md ✅/❌
├── config/ ✅/❌
└── dashboard/ (to be created) ❌
```

**Action:** Create any missing directories before starting Phase 1 of masterplan.

---

**Task 6.2: Check for Existing Dashboard Code**
```bash
ls -la C:\Users\russe\Documents\Grow\dashboard\
```

**Finding:**
- Directory exists: ✅ Yes / ❌ No
- Contains files: `___`

**Action:** If dashboard folder exists with code, review before overwriting.

---

### Phase 7: Growth Stage & Target Verification

**Task 7.1: Confirm Current Growth Stage**

Ask user or check documentation:
- Current stage: `Seedling` / `Veg` / `Flower`
- Days since germination: `___`
- Expected stage change: `___`

**Action:** Update `VITE_GROWTH_STAGE` default and VPD targets if stage has changed.

---

**Task 7.2: Calculate Current VPD Status**

Using live values from Task 1.2:
- Temperature: `___°F`
- Humidity: `___%`
- VPD: `___ kPa`

Target (Seedling): 0.4 - 0.8 kPa

**Status:**
- [ ] ✅ OPTIMAL (0.4-0.8)
- [ ] ⚠️ CAUTION (0.3-0.4 or 0.8-1.0)
- [ ] ❌ CRITICAL (<0.3 or >1.0)

**Action:** Note current status in masterplan intro. This sets urgency for humidifier integration.

---

## 📝 Investigation Summary

After completing all tasks, fill out this summary:

### Entities Confirmed
| Entity | Status | Notes |
|--------|--------|-------|
| Temperature sensor | ✅/❌ | |
| Humidity sensor | ✅/❌ | |
| VPD sensor | ✅/❌ | |
| Light switch | ✅/❌ | |
| Intake fan | ✅/❌ | |
| Heater climate | ✅/❌ | |
| Exhaust fan select | ✅/❌ | |
| Humidifier | ✅/❌ | |
| Leak sensor | ✅/❌ | |

### New Discoveries
```
[ List any new entities, features, or issues discovered ]
```

### Masterplan Updates Required
```
[ List specific sections of DASHBOARD_MASTERPLAN.md that need updating ]
```

### Blockers Identified
```
[ List any issues that would prevent dashboard implementation ]
```

---

## 🔄 Update Instructions for Cursor

After completing investigation, update these sections in `DASHBOARD_MASTERPLAN.md`:

1. **Pre-Flight Entity Reference table** - Update current values
2. **ENTITIES constants** - Fix any incorrect entity IDs  
3. **VPD_TARGETS** - Adjust if growth stage changed
4. **TEMP_TARGETS** - Update if schedule changed
5. **Connection Details** - Verify URL and token guidance
6. **Any new components** - Add sections for discovered features

### Update Template

When updating masterplan, use this format:
```markdown
<!-- INVESTIGATION UPDATE: 2026-01-XX -->
<!-- Changed: [description] -->
<!-- Reason: [finding from investigation] -->
```

---

## ✅ Investigation Complete Checklist

Before proceeding to implementation:

- [ ] All Phase 0-7 tasks completed
- [ ] Findings documented in each section
- [ ] DASHBOARD_MASTERPLAN.md updated with corrections
- [ ] No critical blockers identified
- [ ] MCP connection verified working
- [ ] Growth stage and targets confirmed

**Sign-off:** Investigation completed by Cursor on `___________`

---

*This investigation ensures the dashboard is built on accurate, verified data rather than potentially stale documentation.*
