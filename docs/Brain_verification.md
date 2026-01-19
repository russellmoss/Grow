# 🔍 VERIFICATION TASK: Exhaust Fan Power Control Entity Check

You have MCP access to our Home Assistant instance via the `hass-mcp` tool. Use this access to verify whether the critical entities needed for the intelligent environmental control system exist.

## TASK OVERVIEW

Verify the existence and writability of exhaust fan power control entities, then update `C:\Users\russe\Documents\Grow\docs\BRAIN_IMPLEMENTATION_GUIDE.md` with findings and the correct implementation approach.

---

## STEP 1: VERIFY CRITICAL ENTITIES

Use MCP tools to check for the following entities:

### 1.1 Check Primary Fan Power Entity (CRITICAL)
````
get_entity number.exhaust_fan_on_power
````

**What to look for:**
- Entity exists: ✅ PROCEED
- Entity not found: ⚠️ CHECK ALTERNATIVES

### 1.2 Check Confirmed Existing Entities (Reference)
````
get_entity sensor.exhaust_fan_current_power
get_entity select.exhaust_fan_active_mode
get_entity binary_sensor.exhaust_fan_state
````

**Expected:** All should exist (these are documented in docs/ENTITIES.md)

### 1.3 List ALL Fan-Related Entities
````
list_entities
````

**Filter for:** Any entity_id containing "exhaust" or "fan"

**What to look for:**
- `number.exhaust_fan_*` entities (writeable power control)
- `number.*_power` entities
- Any AC Infinity-specific power control entities

### 1.4 Check AC Infinity Services
````
list_services
````

**Filter for:** Services containing "ac_infinity"

**What to look for:**
- `ac_infinity.set_power_level` service
- `ac_infinity.set_fan_speed` service
- Any service that accepts power/speed parameters

### 1.5 Get AC Infinity Controller Device Info
````
get_entity sensor.ac_infinity_controller_69_pro_temperature
````

**Look at attributes** - may contain device_id or other metadata needed for service calls

---

## STEP 2: ANALYZE FINDINGS

Based on verification results, determine which scenario applies:

### **Scenario A: ✅ Primary Entity Exists**
If `number.exhaust_fan_on_power` exists:
- **Status:** READY TO IMPLEMENT
- **Action:** Proceed with Phase 1 as written
- **Risk Level:** LOW
- **Changes Needed:** None

### **Scenario B: 🔧 Alternative Service Available**
If primary entity doesn't exist BUT `ac_infinity.set_power_level` service exists:
- **Status:** MODIFICATION REQUIRED
- **Action:** Update Phase 1 to use service call instead of entity
- **Risk Level:** MEDIUM
- **Changes Needed:** Update automation action from `number.set_value` to `ac_infinity.set_power_level`

**Example service call format:**
````yaml
service: ac_infinity.set_power_level
data:
  device_id: "ac_infinity_controller_69_pro"
  port: 1  # Exhaust fan port
  power_level: 2
````

### **Scenario C: 🔀 No Direct Power Control**
If neither entity nor service exists:
- **Status:** ALTERNATIVE APPROACH REQUIRED
- **Action:** Implement humidifier-only control (Plan B)
- **Risk Level:** LOW (safer approach)
- **Changes Needed:** Remove all fan power automations from Phase 1

---

## STEP 3: UPDATE BRAIN_IMPLEMENTATION_GUIDE.md

Based on your findings, update the file `C:\Users\russe\Documents\Grow\docs\BRAIN_IMPLEMENTATION_GUIDE.md` as follows:

### 3.1 Update the CRITICAL PREREQUISITE Section (Lines 9-16)

**Replace the current warning with your findings:**

**If Scenario A (entity exists):**
````markdown
**✅ ENTITY VERIFICATION COMPLETE:** The required entity `number.exhaust_fan_on_power` has been verified to exist in Home Assistant. This implementation can proceed as written.

**Verification Details:**
- Entity ID: `number.exhaust_fan_on_power`
- Current Value: [VALUE YOU FOUND]
- Verification Date: [TODAY'S DATE]
- Status: READY TO IMPLEMENT
````

**If Scenario B (service exists):**
````markdown
**⚠️ ENTITY VERIFICATION - MODIFICATION REQUIRED:** The entity `number.exhaust_fan_on_power` does NOT exist, but the AC Infinity integration provides an alternative service call: `ac_infinity.set_power_level`.

**Verification Details:**
- Primary Entity: NOT FOUND
- Alternative Service: `ac_infinity.set_power_level` ✅ AVAILABLE
- Required Parameters: device_id, port, power_level
- Verification Date: [TODAY'S DATE]
- Status: REQUIRES CODE MODIFICATION (see modified Phase 1 below)

**IMPORTANT:** All automation actions in Phase 1 must use the service call format instead of `number.set_value`. See updated code in Step 1.3 and 1.4.
````

**If Scenario C (neither exists):**
````markdown
**⚠️ ENTITY VERIFICATION - ALTERNATIVE APPROACH REQUIRED:** Neither `number.exhaust_fan_on_power` entity nor `ac_infinity.set_power_level` service exist. Direct fan power control is not available through Home Assistant.

**Verification Details:**
- Primary Entity: NOT FOUND
- Alternative Service: NOT FOUND
- Verification Date: [TODAY'S DATE]
- Status: IMPLEMENT PLAN B (Humidifier-Only Control)

**RECOMMENDED APPROACH:** Use AC Infinity Controller's built-in VPD control for fan management, and implement custom Home Assistant automations ONLY for humidifier control. This is safer and requires no fan power manipulation.

See modified Phase 1 implementation below.
````

### 3.2 Update Step 1.3 Automation Builder (If Scenario B)

If you found Scenario B, update the automation action in Step 1.3 (lines 222-230):

**Find this section:**
````javascript
action: [
  {
    // NOTE: If number.exhaust_fan_on_power doesn't exist...
    service: 'number.set_value',
    target: { entity_id: ENTITIES.EXHAUST_FAN_ON_POWER },
    data: { value: reducedPower },
  },
],
````

**Replace with:**
````javascript
action: [
  {
    // ✅ VERIFIED: Using ac_infinity.set_power_level service
    service: 'ac_infinity.set_power_level',
    data: {
      device_id: 'ac_infinity_controller_69_pro',  // ← Verify this device_id
      port: 1,  // Exhaust fan is on port 1
      power_level: reducedPower,
    },
  },
],
````

**Also update Step 1.4** with the same service call change.

### 3.3 Add New Section: VERIFIED IMPLEMENTATION PATH

Add this section right after "Prerequisites & Setup":

**If Scenario A:**
````markdown
## ✅ VERIFIED IMPLEMENTATION PATH

**Verification Complete:** All required entities exist and are accessible.

**Implementation Path:** Standard Phase 1-3 implementation
- Phase 1: Fan Power Coordination (30-60 min)
- Phase 2: Smart Decision Engine (2-3 hours)
- Phase 3: Visualization & UI (1-2 hours)

**Entity Details:**
- Fan Power Control: `number.exhaust_fan_on_power` ✅
- Fan Power Sensor: `sensor.exhaust_fan_current_power` ✅
- Humidifier Control: `select.cloudforge_t5_active_mode` ✅

**Proceed to Phase 1.**
````

**If Scenario B:**
````markdown
## 🔧 VERIFIED IMPLEMENTATION PATH - MODIFIED

**Verification Complete:** Required entity does not exist, but alternative service available.

**Implementation Path:** Modified Phase 1-3 implementation using service calls
- Phase 1: Fan Power Coordination via Service Call (45-75 min)
- Phase 2: Smart Decision Engine (2-3 hours) 
- Phase 3: Visualization & UI (1-2 hours)

**Service Details:**
- Service Name: `ac_infinity.set_power_level`
- Required Parameters: `device_id`, `port`, `power_level`
- Device ID: `ac_infinity_controller_69_pro`
- Port: 1 (exhaust fan)

**Code modifications applied to Step 1.3 and 1.4. Proceed to modified Phase 1.**
````

**If Scenario C:**
````markdown
## 🔀 VERIFIED IMPLEMENTATION PATH - ALTERNATIVE APPROACH

**Verification Complete:** Direct fan power control not available via Home Assistant.

**Implementation Path:** Humidifier-Only Control + AC Infinity Native VPD
- Phase 1-Lite: Humidifier VPD Control ONLY (20-30 min)
- Configure AC Infinity VPD triggers directly in controller
- Phase 2: Decision Engine (humidifier only) (1-2 hours)
- Phase 3: Visualization & UI (1-2 hours)

**Recommended Configuration:**
1. Use Home Assistant to control humidifier based on VPD
2. Configure AC Infinity Controller's built-in VPD control for fan
3. Let each system manage its domain independently

**Modified Phase 1 implementation provided below. Skip fan power automations.**
````

### 3.4 Create Modified Phase 1 (If Scenario C)

If Scenario C applies, add this replacement section:
````markdown
## Phase 1-Lite: Humidifier-Only VPD Control

**Goal:** Control humidifier based on VPD without touching fan power  
**Time Estimate:** 20-30 minutes  
**Impact:** Moderate VPD reduction (slower than coordinated approach)

**Note:** Fan power will be managed by AC Infinity Controller's built-in VPD control. Configure target VPD directly in the AC Infinity app/controller for your growth stage.

### Step 1.1: Skip Fan Power Entities

**Action:** Do NOT add `EXHAUST_FAN_ON_POWER` or `EXHAUST_FAN_CURRENT_POWER` to entities.js

These entities don't exist and aren't needed for this approach.

### Step 1.2: Add Only Humidifier Automation IDs

**File:** `dashboard/src/services/automation-manager.js`

**Code to Add:**
```javascript
// VPD control via humidifier only (fan managed by AC Infinity)
VPD_HUMIDIFIER_HIGH: 'phenology_vpd_humidifier_high',
VPD_HUMIDIFIER_LOW: 'phenology_vpd_humidifier_low',
```

### Step 1.3: Humidifier High VPD Automation

[Provide the buildVPDHumidifierOnAutomation code only, no fan coordination]

### Step 1.4: Humidifier Low VPD Automation  

[Provide the buildVPDHumidifierOffAutomation code only]

### Step 1.5: Configure AC Infinity VPD Control

**Action:** Configure exhaust fan VPD triggers directly in AC Infinity Controller:

1. Open AC Infinity app or controller interface
2. Navigate to Port 1 (Exhaust Fan) settings
3. Set VPD triggers:
   - VPD High Trigger: 0.9 kPa → Increase fan power
   - VPD Low Trigger: 0.5 kPa → Decrease fan power
   - Base Power: 5
   - Power Range: 3-7

This allows the AC Infinity controller to modulate fan power based on VPD while your HA automations control the humidifier.
````

---

## STEP 4: CREATE VERIFICATION SUMMARY

At the very top of the BRAIN_IMPLEMENTATION_GUIDE.md file, add this summary section:
````markdown
---

## 🔍 ENTITY VERIFICATION SUMMARY

**Verification Date:** [TODAY'S DATE]  
**Verification Method:** MCP Direct Query via Cursor AI  
**Home Assistant Version:** [VERSION FROM get_entity query]

### Findings:

**Critical Entity: `number.exhaust_fan_on_power`**
- Status: [EXISTS / DOES NOT EXIST]
- Value: [CURRENT VALUE / N/A]
- Writable: [YES / N/A]

**Alternative Service: `ac_infinity.set_power_level`**
- Status: [AVAILABLE / NOT AVAILABLE]
- Parameters: [LIST PARAMS / N/A]

**Decision:** [SCENARIO A / SCENARIO B / SCENARIO C]

**Implementation Approach:** [STANDARD / MODIFIED / ALTERNATIVE]

**Ready to Implement:** [YES / REQUIRES MODIFICATION / PLAN B]

---
````

---

## STEP 5: OUTPUT YOUR FINDINGS

After completing the verification and updates, provide a summary in this format:
````
## VERIFICATION COMPLETE ✅

**Scenario Identified:** [A/B/C]

**Entity Status:**
- number.exhaust_fan_on_power: [EXISTS with value X / DOES NOT EXIST]
- ac_infinity.set_power_level service: [AVAILABLE / NOT AVAILABLE]

**Files Updated:**
- ✅ C:\Users\russe\Documents\Grow\docs\BRAIN_IMPLEMENTATION_GUIDE.md
  - Updated prerequisite section with verification results
  - Added verified implementation path section
  - [Modified Phase 1 automation code / Added Phase 1-Lite / No changes needed]

**Next Steps:**
1. Review updated guide at: C:\Users\russe\Documents\Grow\docs\BRAIN_IMPLEMENTATION_GUIDE.md
2. [Proceed with Phase 1 / Review modified Phase 1 code / Configure AC Infinity manually]
3. [Additional step based on scenario]

**Implementation Risk Level:** [LOW / MEDIUM / HIGH]
**Estimated Time to Implement:** [TIME]
**Recommendation:** [PROCEED / PROCEED WITH MODIFICATIONS / USE ALTERNATIVE APPROACH]
````

---

## IMPORTANT NOTES

1. **Use MCP tools** - You have access to hass-mcp, use it for all entity queries
2. **Document everything** - Record exact entity IDs, values, and attributes you find
3. **Update the guide comprehensively** - Don't just add notes, actually modify the implementation steps
4. **Be specific** - If you find device_id or port numbers, include them in the updated code
5. **Verify service parameters** - If using a service call, check what parameters it accepts
6. **Test accessibility** - Confirm you can actually read the entities you find
7. **Error handling** - If MCP access fails, document that in your summary

---

## SUCCESS CRITERIA

Your task is complete when:

- ✅ All verification queries executed successfully
- ✅ Scenario (A/B/C) definitively identified
- ✅ BRAIN_IMPLEMENTATION_GUIDE.md updated with findings
- ✅ Implementation path clearly documented
- ✅ Code examples updated if modifications needed
- ✅ Risk assessment provided
- ✅ Clear go/no-go recommendation given

---
