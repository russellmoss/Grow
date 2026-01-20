# 🔍 Architecture Questions for Cursor to Investigate

**Purpose:** Before implementing the hybrid control architecture and daily AI review system, Cursor must answer these questions by investigating the actual codebase and Home Assistant. After answering each section, update `C:\Users\russe\Documents\Grow\docs\new-architecture.md` with the findings.

**CRITICAL INSTRUCTIONS FOR CURSOR:**
1. Use `hass-mcp` to verify Home Assistant entities and states
2. Read actual files - DO NOT assume or hallucinate
3. After each section, add a new section to `new-architecture.md` with your findings
4. If you find conflicts with the architecture doc, note them clearly

---

## SECTION 1: Environment Variables & API Keys

### Questions to Answer:

1. **What .env files exist in the dashboard directory?**
   - Check for: `.env`, `.env.local`, `.env.example`, `.env.development`
   - List all files found

2. **Is the Anthropic API key configured?**
   - Look for: `VITE_ANTHROPIC_API_KEY` or `ANTHROPIC_API_KEY`
   - Is it in .env or .env.local?
   - Is there a placeholder or actual key?

3. **Is the Home Assistant token configured?**
   - Look for: `VITE_HA_TOKEN`, `VITE_HA_URL`, `HA_TOKEN`, `HA_URL`
   - What values are set (redact actual tokens, just confirm exists)?

4. **Are there any other relevant environment variables?**
   - List all VITE_* variables found

### How to Investigate:
```bash
# Check for .env files
ls -la dashboard/.env* 2>/dev/null || ls -la .env* 2>/dev/null

# Read .env.example if exists
cat dashboard/.env.example 2>/dev/null

# Check for env usage in code
grep -r "import.meta.env" dashboard/src --include="*.js" --include="*.jsx" | head -20
```

### Update new-architecture.md:
Add section: `## 🔐 ENVIRONMENT CONFIGURATION` with:
- List of env files found
- Required variables and their status (configured/missing)
- Any setup instructions needed

---

## SECTION 2: Package Dependencies

### Questions to Answer:

1. **Is @anthropic-ai/sdk installed?**
   - Check package.json for the dependency
   - What version if installed?

2. **Is lucide-react installed?** (used for icons in UI components)
   - Check package.json
   - What version?

3. **What other relevant packages are installed?**
   - React version?
   - Vite version?
   - Tailwind CSS?
   - Any WebSocket libraries?

4. **Are there any missing dependencies for the implementation?**
   - Compare what's needed vs what's installed

### How to Investigate:
```bash
# Read package.json
cat dashboard/package.json

# Check if node_modules has anthropic
ls dashboard/node_modules/@anthropic-ai 2>/dev/null
```

### Update new-architecture.md:
Add section: `## 📦 PACKAGE DEPENDENCIES` with:
- List of key packages and versions
- Missing packages that need to be installed
- Install commands if needed

---

## SECTION 3: Home Assistant History API

### Questions to Answer:

1. **Does the current HA setup support history API calls?**
   - Use hass-mcp to test if history is accessible

2. **What is the exact HA URL being used?**
   - Is it the Tailscale IP (100.65.202.84:8123)?
   - Is there a different URL for internal/external access?

3. **Can we fetch entity history?**
   - Test fetching history for `sensor.ac_infinity_controller_69_pro_vpd`
   - What format does the data come back in?

4. **How far back can we fetch history?**
   - Is there a limit configured?

### How to Investigate:
Use hass-mcp tools to:
- Get current entity states
- Try to access history (if available via MCP)
- Check what API endpoints are available

### Update new-architecture.md:
Add section: `## 📊 HOME ASSISTANT HISTORY API` with:
- Confirmed working/not working
- URL format for history calls
- Any limitations discovered
- Sample response format

---

## SECTION 4: Current Phenology State Management

### Questions to Answer:

1. **How is `currentStage` managed?**
   - Is it in React state?
   - Is it persisted anywhere (localStorage, HA)?
   - Where is it initialized?

2. **Where is the phenology data defined?**
   - Read `dashboard/src/types/phenology.js` completely
   - List all stages defined
   - Confirm VPD targets for each stage

3. **How does the user change phenology stage?**
   - Is there a UI for this?
   - Is it automatic based on dates?

4. **Is `daysInStage` tracked?**
   - How is it calculated?
   - Is it persisted?

### How to Investigate:
```bash
# Read phenology file
cat dashboard/src/types/phenology.js

# Search for currentStage usage
grep -r "currentStage" dashboard/src --include="*.js" --include="*.jsx"

# Search for phenology persistence
grep -r "localStorage" dashboard/src --include="*.js" --include="*.jsx" | grep -i stage
```

### Update new-architecture.md:
Add section: `## 🌱 PHENOLOGY STATE MANAGEMENT` with:
- How currentStage is managed
- All stages and their targets (full table)
- How stage changes happen
- Persistence mechanism (if any)

---

## SECTION 5: Existing AI Integration

### Questions to Answer:

1. **Does `dashboard/src/prompts/` directory exist?**
   - List all files in it
   - Read `environment-analysis.js` if it exists

2. **Is there an existing AI service?**
   - Check for files like `ai-service.js`, `claude-service.js`, `anthropic.js`
   - How is AI currently called (if at all)?

3. **How is the existing "Ask AI" feature implemented?**
   - Is there already on-demand analysis?
   - What component handles it?

4. **What prompts are already defined?**
   - Read all prompt files
   - Note what context they include

### How to Investigate:
```bash
# List prompts directory
ls -la dashboard/src/prompts/ 2>/dev/null

# Read environment-analysis.js
cat dashboard/src/prompts/environment-analysis.js 2>/dev/null

# Search for anthropic/claude usage
grep -r "anthropic\|claude\|AI" dashboard/src --include="*.js" --include="*.jsx" -i | head -30
```

### Update new-architecture.md:
Add section: `## 🤖 EXISTING AI INTEGRATION` with:
- Current AI service structure (if exists)
- Existing prompts and their purposes
- What can be reused vs needs to be created
- Any conflicts with planned implementation

---

## SECTION 6: Dashboard Layout & Component Structure

### Questions to Answer:

1. **How is the main dashboard grid structured?**
   - Read App.jsx completely
   - What grid system is used (CSS grid? Flexbox? Tailwind grid?)
   - How many columns?

2. **Where should the AI Review Panel go?**
   - What's the current layout structure?
   - Identify the best insertion point

3. **What component patterns are used?**
   - How are existing panels structured?
   - What props do they typically receive?
   - How is styling done?

4. **How are components exported?**
   - Read `dashboard/src/components/index.js`
   - What's the pattern for adding new exports?

### How to Investigate:
```bash
# Read App.jsx
cat dashboard/src/App.jsx

# Read components index
cat dashboard/src/components/index.js

# Read an existing panel for pattern reference
cat dashboard/src/components/SystemThinkingPanel.jsx
```

### Update new-architecture.md:
Add section: `## 🎨 DASHBOARD LAYOUT & COMPONENT PATTERNS` with:
- Grid structure description
- Component pattern to follow
- Where new panels should be inserted
- Styling conventions

---

## SECTION 7: Unavailable Entity Investigation

### Questions to Answer:

1. **Why are exhaust fan VPD entities unavailable?**
   - Use hass-mcp to check: `number.exhaust_fan_vpd_high_trigger`
   - Use hass-mcp to check: `number.exhaust_fan_vpd_low_trigger`
   - What state do they return?

2. **Is the exhaust fan in VPD mode?**
   - Check `select.exhaust_fan_active_mode`
   - What mode is it currently in?

3. **Should AI skip exhaust fan VPD adjustments?**
   - If entities are unavailable, what's the fallback?
   - Should we only adjust CloudForge T5 entities?

4. **Are there other unavailable entities we should know about?**
   - List any entities that return "unavailable" or "unknown"

### How to Investigate:
Use hass-mcp get_entity for:
- `number.exhaust_fan_vpd_high_trigger`
- `number.exhaust_fan_vpd_low_trigger`
- `select.exhaust_fan_active_mode`
- `select.exhaust_fan_vpd_settings_mode`

### Update new-architecture.md:
Add section: `## ⚠️ ENTITY AVAILABILITY STATUS` with:
- Table of all VPD entities and their current status
- Which entities AI should/shouldn't try to modify
- Recommendations for handling unavailable entities

---

## SECTION 8: WebSocket Connection

### Questions to Answer:

1. **How does the dashboard connect to Home Assistant?**
   - Read `HomeAssistantContext.jsx` completely
   - Is it WebSocket or REST API?

2. **How is connection state managed?**
   - Is there an `isConnected` state?
   - How is reconnection handled?

3. **How does the dashboard get entity updates?**
   - Push (WebSocket) or poll?
   - What's the update frequency?

4. **Is there a `callService` function?**
   - What's its exact signature?
   - What does it return on success/failure?

### How to Investigate:
```bash
# Read the context
cat dashboard/src/context/HomeAssistantContext.jsx

# Search for WebSocket
grep -r "WebSocket\|websocket\|ws://" dashboard/src --include="*.js" --include="*.jsx"
```

### Update new-architecture.md:
Add section: `## 🔌 HOME ASSISTANT CONNECTION` with:
- Connection method (WebSocket/REST)
- How to call services
- How to get entity states
- Error handling patterns

---

## SECTION 9: Current Light Schedule Implementation

### Questions to Answer:

1. **How is the light controlled?**
   - Is there a Home Assistant automation?
   - Or is it controlled from the dashboard?

2. **What is the actual current schedule?**
   - Use hass-mcp to check `switch.light` state
   - Is there an automation entity for the schedule?

3. **Is the 20/4 (6AM-2AM) schedule confirmed?**
   - Where is this documented/configured?

4. **Does the dashboard need to know the schedule?**
   - How does isDayTime work?
   - Is it just checking light state?

### How to Investigate:
Use hass-mcp:
- Get `switch.light` state
- List automations related to "light"
- Check if there's a schedule entity

### Update new-architecture.md:
Add section: `## 💡 LIGHT SCHEDULE` with:
- How light is controlled
- Confirmed schedule times
- How dashboard determines day/night

---

## SECTION 10: Cooldown & Rate Limit Mechanisms

### Questions to Answer:

1. **What cooldown mechanism exists in environment-controller.js?**
   - Find the cooldown logic
   - What are the current cooldown times?
   - How is it tracked?

2. **How should Phase 4 and Phase 5 coordinate?**
   - If Phase 4 updates on stage change, should Phase 5 skip that day?
   - Is there a global "last VPD update" timestamp?

3. **What's the minimum time between VPD setting changes?**
   - AC Infinity rate limits?
   - Our self-imposed limits?

### How to Investigate:
```bash
# Search for cooldown in controller
grep -n "cooldown\|Cooldown\|COOLDOWN" dashboard/src/services/environment-controller.js

# Search for rate limit handling
grep -n "rate\|limit\|throttle" dashboard/src/services/environment-controller.js
```

### Update new-architecture.md:
Add section: `## ⏱️ COOLDOWN & RATE LIMIT STRATEGY` with:
- Current cooldown implementation
- Proposed coordination between Phase 4 and Phase 5
- Minimum time between VPD changes

---

## SECTION 11: Testing Strategy

### Questions to Answer:

1. **Are there existing tests?**
   - Check for test files
   - What testing framework (if any)?

2. **How can we verify changes without breaking production?**
   - Is there a development mode?
   - Can we test with mock data?

3. **What logging exists?**
   - How are actions logged?
   - Where can we see logs?

### How to Investigate:
```bash
# Check for test files
ls dashboard/src/**/*.test.js 2>/dev/null
ls dashboard/__tests__/ 2>/dev/null

# Check package.json for test scripts
grep "test" dashboard/package.json
```

### Update new-architecture.md:
Add section: `## 🧪 TESTING STRATEGY` with:
- Existing test infrastructure
- How to test changes safely
- Logging and debugging approach

---

## SECTION 12: LocalStorage Usage

### Questions to Answer:

1. **What is currently stored in localStorage?**
   - Search for localStorage usage
   - List all keys used

2. **Is there any state persistence?**
   - Phenology stage?
   - User preferences?
   - Action logs?

3. **Will AI review storage conflict with anything?**
   - Planned key: `ai_daily_reviews`
   - Any naming conventions to follow?

### How to Investigate:
```bash
# Search for localStorage
grep -r "localStorage" dashboard/src --include="*.js" --include="*.jsx"
```

### Update new-architecture.md:
Add section: `## 💾 LOCALSTORAGE USAGE` with:
- Current localStorage keys and their purposes
- Storage patterns used
- How AI review storage fits in

---

## SECTION 13: Phase 5b - Server-Side AI Review Service

### Questions to Answer:

1. **What is the current deployment setup?**
   - Is there a Raspberry Pi running Home Assistant?
   - What OS is on the Pi (Raspberry Pi OS, Ubuntu, etc.)?
   - Is Node.js installed on the Pi?
   - Is PM2 installed?

2. **Where should the server code live?**
   - Should it be in `dashboard/server/` or separate directory?
   - What's the project structure preference?
   - Is there a deployment script or process?

3. **How will the server access Home Assistant?**
   - Same URL as dashboard (`http://100.65.202.84:8123`)?
   - Same token or separate service account?
   - Can it use WebSocket from Node.js?

4. **What port should the AI service use?**
   - Is port 3001 available?
   - Any firewall rules needed?
   - Should it be accessible from outside the Pi?

5. **How will phenology stage data be accessed?**
   - Should server read from localStorage file?
   - Or create a shared JSON file?
   - Or query from Home Assistant somehow?

6. **What logging infrastructure exists?**
   - Where should PM2 logs be stored?
   - Should logs rotate?
   - Any existing log management?

### How to Investigate:
```bash
# Check if Pi is accessible
ping 100.65.202.84

# Check if Node.js is available (if you have SSH access)
# ssh pi@100.65.202.84 "node --version"

# Check dashboard directory structure
ls -la dashboard/

# Check for existing server directories
find dashboard -type d -name "server" 2>/dev/null
```

### Update new-architecture.md:
Add section: `## 🖥️ PHASE 5b: 24/7 SERVER-SIDE AI REVIEW SERVICE` with:
- Why Phase 5b is needed (browser dependency limitations)
- Architecture diagram showing server-side service
- File structure for server code
- Deployment instructions for Raspberry Pi
- PM2 configuration
- REST API endpoints
- Integration with dashboard (optional)
- Cost and resource usage
- Success criteria

### Key Implementation Details:

**Files to Create:**
1. `dashboard/server/package.json` - Server dependencies
2. `dashboard/server/index.js` - Express server + cron scheduler
3. `dashboard/server/services/ha-client.js` - HA WebSocket client
4. `dashboard/server/services/ai-review.js` - AI review logic
5. `dashboard/server/prompts/daily-review.js` - AI prompts
6. `dashboard/ecosystem.config.cjs` - PM2 configuration

**Key Differences from Phase 5:**
- Runs in Node.js (not browser)
- Uses `fs` for storage (not localStorage)
- Uses `node-cron` for scheduling (not React hooks)
- Provides REST API for dashboard
- Survives reboots via PM2

**Deployment Requirements:**
- Node.js 18+ on Raspberry Pi
- PM2 installed globally
- Port 3001 available
- Same environment variables as dashboard
- Network access to Home Assistant

---

## 📝 FINAL CHECKLIST

After answering all questions, verify:

- [ ] All 13 sections investigated (including Phase 5b)
- [ ] new-architecture.md updated with findings
- [ ] Phase 5b section added to architecture doc
- [ ] Any conflicts or concerns noted
- [ ] Missing dependencies identified
- [ ] Environment setup documented
- [ ] Server deployment path documented
- [ ] Ready for implementation

---

## 🚀 HOW TO USE THIS DOCUMENT

**For Cursor:**

1. Work through each section in order
2. Use the investigation commands provided
3. Use hass-mcp for Home Assistant queries
4. After completing each section:
   - Open `C:\Users\russe\Documents\Grow\docs\new-architecture.md`
   - Add the new section with your findings
   - Use the exact section title format provided
5. If you find something that contradicts the existing doc, note it clearly
6. After all sections, summarize any blockers or concerns

**Example finding format:**
```markdown
## 🔐 ENVIRONMENT CONFIGURATION

**Investigation Date:** 2026-01-19
**Investigator:** Cursor AI

### Files Found:
- ✅ `dashboard/.env` - Main environment file
- ✅ `dashboard/.env.example` - Template file

### Environment Variables:
| Variable | Status | Notes |
|----------|--------|-------|
| VITE_ANTHROPIC_API_KEY | ✅ Configured | Key present |
| VITE_HA_URL | ✅ Configured | http://100.65.202.84:8123 |
| VITE_HA_TOKEN | ✅ Configured | Token present |

### Setup Required:
- None - all variables configured

### Notes:
- API key appears to be valid (starts with sk-ant-)
```

---

**START INVESTIGATION NOW**
