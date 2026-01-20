# Cursor Prompt: Add Phase 5b - 24/7 Server-Side AI Review Service

## TASK

Add Phase 5b to `C:\Users\russe\Documents\Grow\docs\new-architecture.md`. This phase creates a headless Node.js service that runs 24/7 on the Raspberry Pi, enabling true autonomous AI control without requiring a browser.

**Insert Phase 5b after the existing Phase 5 section (search for "Phase 5" and add after it).**

---

## CONTEXT

Phase 5 (already documented) runs in the browser via React hooks. The problem: it only works when the browser tab is open. Phase 5b solves this by creating a standalone Node.js service that:

- Runs 24/7 on the Pi via PM2
- Executes daily AI reviews at 5:30 AM automatically
- Provides REST API for dashboard to fetch reviews
- Survives reboots
- No browser or VNC needed

The dashboard becomes optional (view-only) - all autonomous control happens server-side.

---

## ADD THIS SECTION TO new-architecture.md:

```markdown
---

## 🖥️ PHASE 5b: 24/7 SERVER-SIDE AI REVIEW SERVICE

### Why Phase 5b Is Required

Phase 5 runs in the browser (React hooks). This means:
- ❌ Only runs when browser tab is open
- ❌ Stops if laptop closes or browser refreshes
- ❌ Not truly autonomous

**Phase 5b creates a standalone Node.js service that:**
- ✅ Runs 24/7 on the Raspberry Pi (headless)
- ✅ No browser needed
- ✅ Survives reboots (managed by PM2)
- ✅ True agentic autonomy
- ✅ Dashboard becomes optional (view-only)

---

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     RASPBERRY PI (24/7 HEADLESS)                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────┐       ┌────────────────────────────────┐ │
│  │   Home Assistant     │       │   AI Review Service            │ │
│  │   (Docker - 24/7)    │       │   (Node.js + PM2 - 24/7)       │ │
│  │                      │       │                                │ │
│  │  Sensors:            │       │  📅 Cron: 5:30 AM daily        │ │
│  │  • Temperature       │◄──────│  📊 Fetches 24h history        │ │
│  │  • Humidity          │       │  🤖 Calls Claude API           │ │
│  │  • VPD               │       │  ✍️  Writes VPD settings        │ │
│  │                      │       │  💾 Stores reviews (JSON file) │ │
│  │  Writable Entities:  │       │  🌐 REST API for dashboard     │ │
│  │  • number.cloud*     │◄──────│                                │ │
│  │  • climate.tent_*    │       │  Endpoints:                    │ │
│  │                      │       │  • GET  /api/status            │ │
│  └──────────────────────┘       │  • GET  /api/reviews           │ │
│           ▲                     │  • POST /api/review/trigger    │ │
│           │                     └────────────────────────────────┘ │
│           │                                    ▲                    │
│  ┌────────┴────────────────────────────────────┴─────────────────┐ │
│  │              WebSocket + REST API Connections                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │   Dashboard (Optional - for monitoring only)                   │ │
│  │   • Fetches review data from AI Service API                    │ │
│  │   • Manual trigger button calls /api/review/trigger            │ │
│  │   • View-only when browser closed - AI still runs              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

### File Structure

```
dashboard/
├── src/                          # Existing React dashboard (unchanged)
├── server/                       # NEW: Server-side AI service
│   ├── index.js                  # Express server + cron scheduler
│   ├── services/
│   │   ├── ha-client.js          # Home Assistant WebSocket client
│   │   ├── ai-review.js          # AI review logic
│   │   └── history.js            # History fetching utilities
│   ├── prompts/
│   │   └── daily-review.js       # AI prompt templates
│   ├── data/
│   │   └── reviews.json          # Stored reviews (replaces localStorage)
│   └── package.json              # Server dependencies
├── ecosystem.config.cjs          # PM2 configuration
└── .env                          # Shared environment variables
```

---

### Implementation Files

#### 1. CREATE: `dashboard/server/package.json`

```json
{
  "name": "growop-ai-service",
  "version": "1.0.0",
  "description": "24/7 AI Review Service for GrowOp",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.39.0",
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "node-cron": "^3.0.3",
    "home-assistant-js-websocket": "^9.4.0",
    "ws": "^8.18.0",
    "dotenv": "^16.4.5"
  }
}
```

---

#### 2. CREATE: `dashboard/server/index.js`

```javascript
/**
 * GrowOp AI Review Service
 * 
 * 24/7 headless service that runs on Raspberry Pi.
 * Performs daily AI reviews at 5:30 AM and provides REST API for dashboard.
 */

import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { HAClient } from './services/ha-client.js';
import { runDailyReview, getStoredReviews } from './services/ai-review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Home Assistant client
const haClient = new HAClient({
  url: process.env.VITE_HA_URL || 'http://100.65.202.84:8123',
  token: process.env.VITE_HA_TOKEN,
});

// Service state
let lastReview = null;
let isReviewing = false;
let serviceStartTime = Date.now();

// ════════════════════════════════════════════════════════════════════
// SCHEDULED DAILY REVIEW - 5:30 AM Eastern
// ════════════════════════════════════════════════════════════════════

cron.schedule('30 5 * * *', async () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🌅 5:30 AM - DAILY AI REVIEW STARTING');
  console.log('═══════════════════════════════════════════════════════════════');
  
  await executeDailyReview();
  
}, {
  timezone: 'America/New_York'
});

async function executeDailyReview() {
  if (isReviewing) {
    console.log('[CRON] Review already in progress, skipping');
    return null;
  }
  
  try {
    isReviewing = true;
    lastReview = await runDailyReview(haClient);
    
    const actionsExecuted = lastReview.actionsExecuted?.filter(a => a.executed).length || 0;
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ✅ DAILY REVIEW COMPLETE');
    console.log(`  📊 Actions Executed: ${actionsExecuted}`);
    console.log(`  💰 Cost: $${lastReview.apiUsage?.estimatedCost || '0.00'}`);
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
    
    return lastReview;
  } catch (error) {
    console.error('[REVIEW] Failed:', error.message);
    return null;
  } finally {
    isReviewing = false;
  }
}

console.log('[CRON] Daily AI review scheduled for 5:30 AM Eastern');

// ════════════════════════════════════════════════════════════════════
// REST API ENDPOINTS
// ════════════════════════════════════════════════════════════════════

/**
 * GET /api/status - Service health check
 */
app.get('/api/status', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - serviceStartTime) / 1000);
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  
  res.json({
    status: 'running',
    uptime: `${hours}h ${minutes}m`,
    uptimeSeconds,
    isReviewing,
    haConnected: haClient.isConnected(),
    lastReviewTime: lastReview?.timestamp || null,
    lastReviewSuccess: lastReview ? !lastReview.failed : null,
    nextReviewTime: getNextReviewTime(),
  });
});

/**
 * GET /api/reviews - Get all stored reviews (last 30 days)
 */
app.get('/api/reviews', (req, res) => {
  const reviews = getStoredReviews();
  res.json({
    count: reviews.length,
    reviews,
  });
});

/**
 * GET /api/reviews/latest - Get most recent review
 */
app.get('/api/reviews/latest', (req, res) => {
  const reviews = getStoredReviews();
  if (reviews.length === 0) {
    return res.json(null);
  }
  res.json(reviews[0]);
});

/**
 * POST /api/review/trigger - Manually trigger a review
 */
app.post('/api/review/trigger', async (req, res) => {
  if (isReviewing) {
    return res.status(409).json({
      error: 'Review already in progress',
      isReviewing: true,
    });
  }
  
  console.log('[API] Manual review triggered via REST API');
  
  const review = await executeDailyReview();
  
  if (review) {
    res.json({ success: true, review });
  } else {
    res.status(500).json({ success: false, error: 'Review failed' });
  }
});

/**
 * GET /api/entities - Get current entity states (debugging)
 */
app.get('/api/entities', (req, res) => {
  const entities = haClient.getEntities();
  
  // Return only relevant entities
  const relevant = {};
  const keys = [
    'sensor.ac_infinity_controller_69_pro_temperature',
    'sensor.ac_infinity_controller_69_pro_humidity',
    'sensor.ac_infinity_controller_69_pro_vpd',
    'number.cloudforge_t5_target_vpd',
    'number.cloudforge_t5_vpd_high_trigger',
    'number.cloudforge_t5_vpd_low_trigger',
    'switch.light',
    'climate.tent_heater',
  ];
  
  for (const key of keys) {
    if (entities[key]) {
      relevant[key] = {
        state: entities[key].state,
        last_changed: entities[key].last_changed,
      };
    }
  }
  
  res.json(relevant);
});

// ════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════════

function getNextReviewTime() {
  const now = new Date();
  const next = new Date(now);
  next.setHours(5, 30, 0, 0);
  
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }
  
  return next.toISOString();
}

// ════════════════════════════════════════════════════════════════════
// START SERVER
// ════════════════════════════════════════════════════════════════════

const PORT = process.env.AI_SERVICE_PORT || 3001;

async function start() {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  🌿 GrowOp AI Review Service');
  console.log('═══════════════════════════════════════════════════════════════');
  
  // Connect to Home Assistant
  console.log('[HA] Connecting to Home Assistant...');
  try {
    await haClient.connect();
    console.log('[HA] ✅ Connected successfully');
  } catch (error) {
    console.error('[HA] ❌ Connection failed:', error.message);
    console.error('[HA] Service will retry connection on first API call');
  }
  
  // Load last review from storage
  const reviews = getStoredReviews();
  if (reviews.length > 0) {
    lastReview = reviews[0];
    console.log(`[STORAGE] Loaded ${reviews.length} previous reviews`);
  }
  
  // Start Express server
  app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log(`[SERVER] Running on port ${PORT}`);
    console.log('');
    console.log('  Endpoints:');
    console.log(`  • GET  http://localhost:${PORT}/api/status`);
    console.log(`  • GET  http://localhost:${PORT}/api/reviews`);
    console.log(`  • GET  http://localhost:${PORT}/api/reviews/latest`);
    console.log(`  • POST http://localhost:${PORT}/api/review/trigger`);
    console.log(`  • GET  http://localhost:${PORT}/api/entities`);
    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  ⏰ Next scheduled review: 5:30 AM Eastern');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('');
  });
}

start();
```

---

#### 3. CREATE: `dashboard/server/services/ha-client.js`

```javascript
/**
 * Home Assistant WebSocket Client
 * 
 * Provides persistent connection to HA for entity states and service calls.
 */

import {
  createConnection,
  createLongLivedTokenAuth,
  subscribeEntities,
  callService,
} from 'home-assistant-js-websocket';
import WebSocket from 'ws';

// Polyfill WebSocket for Node.js environment
global.WebSocket = WebSocket;

export class HAClient {
  constructor({ url, token }) {
    this.httpUrl = url;
    this.wsUrl = url.replace('http://', 'ws://').replace('https://', 'wss://') + '/api/websocket';
    this.token = token;
    this.connection = null;
    this.entities = {};
    this._connectionPromise = null;
  }
  
  async connect() {
    if (this.connection) return;
    if (this._connectionPromise) return this._connectionPromise;
    
    this._connectionPromise = this._doConnect();
    return this._connectionPromise;
  }
  
  async _doConnect() {
    console.log(`[HA-CLIENT] Connecting to ${this.wsUrl}`);
    
    const auth = createLongLivedTokenAuth(this.httpUrl, this.token);
    
    this.connection = await createConnection({ auth });
    
    // Subscribe to all entity state changes
    subscribeEntities(this.connection, (entities) => {
      this.entities = entities;
    });
    
    // Wait a moment for initial entity sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`[HA-CLIENT] Connected, tracking ${Object.keys(this.entities).length} entities`);
  }
  
  isConnected() {
    return this.connection !== null;
  }
  
  getEntities() {
    return this.entities;
  }
  
  getEntity(entityId) {
    return this.entities[entityId] || null;
  }
  
  getEntityState(entityId) {
    return this.entities[entityId]?.state || null;
  }
  
  async callService(domain, service, data = {}) {
    if (!this.connection) {
      await this.connect();
    }
    
    try {
      console.log(`[HA-CLIENT] Calling ${domain}.${service}:`, JSON.stringify(data));
      const result = await callService(this.connection, domain, service, data);
      console.log(`[HA-CLIENT] ✅ Service call successful`);
      return { success: true, data: result };
    } catch (error) {
      console.error(`[HA-CLIENT] ❌ Service call failed:`, error.message);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Fetch entity history via REST API
   */
  async fetchHistory(entityId, hoursBack = 24) {
    const endTime = new Date().toISOString();
    const startTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000).toISOString();
    
    const url = `${this.httpUrl}/api/history/period/${startTime}?end_time=${endTime}&filter_entity_id=${entityId}&minimal_response`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data[0] || [];
    } catch (error) {
      console.error(`[HA-CLIENT] History fetch failed for ${entityId}:`, error.message);
      return [];
    }
  }
}
```

---

#### 4. CREATE: `dashboard/server/services/ai-review.js`

```javascript
/**
 * AI Review Service
 * 
 * Core logic for daily AI reviews with Claude API.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildDailyReviewPrompt } from '../prompts/daily-review.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.VITE_ANTHROPIC_API_KEY,
});

// Entity IDs
const ENTITIES = {
  TEMPERATURE: 'sensor.ac_infinity_controller_69_pro_temperature',
  HUMIDITY: 'sensor.ac_infinity_controller_69_pro_humidity',
  VPD: 'sensor.ac_infinity_controller_69_pro_vpd',
  LIGHT: 'switch.light',
  CLOUDFORGE_TARGET_VPD: 'number.cloudforge_t5_target_vpd',
  CLOUDFORGE_VPD_HIGH: 'number.cloudforge_t5_vpd_high_trigger',
  CLOUDFORGE_VPD_LOW: 'number.cloudforge_t5_vpd_low_trigger',
};

// Hard limits for autonomous actions - AI cannot exceed these
const HARD_LIMITS = {
  [ENTITIES.CLOUDFORGE_TARGET_VPD]: { min: 0.3, max: 1.2, maxChange: 0.15 },
  [ENTITIES.CLOUDFORGE_VPD_HIGH]: { min: 0.5, max: 1.4, maxChange: 0.15 },
  [ENTITIES.CLOUDFORGE_VPD_LOW]: { min: 0.1, max: 0.8, maxChange: 0.1 },
};

// Phenology stage targets (seedling defaults - will be configurable later)
const PHENOLOGY = {
  stage: 'seedling',
  daysInStage: 0,
  targets: {
    vpdOptimal: 0.6,
    vpdMin: 0.4,
    vpdMax: 0.8,
    tempDay: 77,
    tempNight: 71,
    humidityOptimal: 70,
  },
};

/**
 * Get stored reviews from JSON file
 */
export function getStoredReviews() {
  try {
    if (!fs.existsSync(REVIEWS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('[STORAGE] Error reading reviews:', error.message);
    return [];
  }
}

/**
 * Store a review to JSON file
 */
function storeReview(review) {
  const reviews = getStoredReviews();
  reviews.unshift(review);
  // Keep last 30 days
  const trimmed = reviews.slice(0, 30);
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(trimmed, null, 2));
  console.log(`[STORAGE] Saved review, total stored: ${trimmed.length}`);
}

/**
 * Run the daily AI review
 */
export async function runDailyReview(haClient) {
  console.log('[AI-REVIEW] Starting daily review...');
  const startTime = Date.now();
  
  try {
    // ═══════════════════════════════════════════════════════════════
    // STEP 1: GATHER DATA
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 1: Gathering 24h sensor history...');
    
    const entities = haClient.getEntities();
    
    // Fetch 24h history for each sensor
    const [tempHistory, humHistory, vpdHistory] = await Promise.all([
      haClient.fetchHistory(ENTITIES.TEMPERATURE, 24),
      haClient.fetchHistory(ENTITIES.HUMIDITY, 24),
      haClient.fetchHistory(ENTITIES.VPD, 24),
    ]);
    
    // Process history into usable format
    const processHistory = (data) => data
      .filter(e => e.state !== 'unavailable' && e.state !== 'unknown')
      .map(e => ({
        timestamp: new Date(e.last_changed).getTime(),
        value: parseFloat(e.state),
      }))
      .filter(e => !isNaN(e.value));
    
    const history = {
      temperature: processHistory(tempHistory),
      humidity: processHistory(humHistory),
      vpd: processHistory(vpdHistory),
    };
    
    console.log(`[AI-REVIEW] History: ${history.vpd.length} VPD, ${history.temperature.length} temp, ${history.humidity.length} humidity readings`);
    
    // Calculate statistics
    const calcStats = (arr) => {
      if (!arr.length) return { avg: 0, min: 0, max: 0 };
      const values = arr.map(e => e.value);
      return {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    };
    
    const vpdStats = calcStats(history.vpd);
    const tempStats = calcStats(history.temperature);
    const humStats = calcStats(history.humidity);
    
    // Calculate time in target range
    const vpdInRange = history.vpd.filter(
      e => e.value >= PHENOLOGY.targets.vpdMin && e.value <= PHENOLOGY.targets.vpdMax
    );
    const timeInRange = history.vpd.length > 0
      ? Math.round((vpdInRange.length / history.vpd.length) * 100)
      : 0;
    
    const stats = {
      avgVPD: vpdStats.avg.toFixed(2),
      minVPD: vpdStats.min.toFixed(2),
      maxVPD: vpdStats.max.toFixed(2),
      avgTemp: tempStats.avg.toFixed(1),
      minTemp: tempStats.min.toFixed(1),
      maxTemp: tempStats.max.toFixed(1),
      avgHumidity: humStats.avg.toFixed(1),
      minHumidity: humStats.min.toFixed(1),
      maxHumidity: humStats.max.toFixed(1),
      timeInRange,
      dataPoints: history.vpd.length,
    };
    
    console.log('[AI-REVIEW] Stats:', stats);
    
    // Get current AC Infinity VPD settings
    const acInfinitySettings = {
      humidifierVPDTarget: parseFloat(entities[ENTITIES.CLOUDFORGE_TARGET_VPD]?.state) || null,
      humidifierVPDHigh: parseFloat(entities[ENTITIES.CLOUDFORGE_VPD_HIGH]?.state) || null,
      humidifierVPDLow: parseFloat(entities[ENTITIES.CLOUDFORGE_VPD_LOW]?.state) || null,
    };
    
    console.log('[AI-REVIEW] AC Infinity settings:', acInfinitySettings);
    
    // Get previous actions for context
    const previousActions = getStoredReviews()
      .slice(0, 7)
      .flatMap(r => (r.actionsExecuted || []).map(a => ({
        date: new Date(r.timestamp).toLocaleDateString(),
        action: `${a.entity?.split('.')[1]}: ${a.currentValue} → ${a.newValue}`,
        outcome: a.executed ? 'Applied' : `Blocked: ${a.reason}`,
      })));
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 2: CALL CLAUDE API
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 2: Calling Claude API...');
    
    const prompt = buildDailyReviewPrompt({
      phenology: PHENOLOGY,
      acInfinitySettings,
      stats,
      historyTable: formatHistoryTable(history),
      previousActions,
    });
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });
    
    console.log(`[AI-REVIEW] Claude response: ${response.usage?.input_tokens} in, ${response.usage?.output_tokens} out tokens`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 3: PARSE AI RESPONSE
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 3: Parsing AI response...');
    
    let aiDecision;
    try {
      let jsonText = response.content[0].text;
      
      // Handle potential markdown code blocks
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }
      
      aiDecision = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('[AI-REVIEW] ❌ Failed to parse AI response as JSON');
      console.error('[AI-REVIEW] Raw response:', response.content[0].text.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
    
    console.log('[AI-REVIEW] AI analysis:', aiDecision.analysis?.overnightSummary);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 4: EXECUTE AUTONOMOUS ACTIONS
    // ═══════════════════════════════════════════════════════════════
    
    console.log('[AI-REVIEW] Step 4: Executing autonomous actions...');
    
    const executedActions = [];
    
    for (const action of aiDecision.autonomousActions || []) {
      console.log(`[AI-REVIEW] Processing: ${action.entity} (${action.currentValue} → ${action.newValue})`);
      const result = await executeAutonomousAction(action, haClient);
      executedActions.push({
        ...action,
        ...result,
        timestamp: new Date().toISOString(),
      });
    }
    
    const successCount = executedActions.filter(a => a.executed).length;
    const blockedCount = executedActions.filter(a => a.blocked).length;
    console.log(`[AI-REVIEW] Actions: ${successCount} executed, ${blockedCount} blocked, ${executedActions.length - successCount - blockedCount} failed`);
    
    // ═══════════════════════════════════════════════════════════════
    // STEP 5: STORE AND RETURN REVIEW
    // ═══════════════════════════════════════════════════════════════
    
    const review = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      analysis: aiDecision.analysis,
      actionsExecuted: executedActions,
      recommendations: aiDecision.recommendations || [],
      predictions: aiDecision.predictions || {},
      learnings: aiDecision.learnings || [],
      stats,
      apiUsage: {
        inputTokens: response.usage?.input_tokens,
        outputTokens: response.usage?.output_tokens,
        estimatedCost: (
          (response.usage?.input_tokens || 0) * 0.003 / 1000 +
          (response.usage?.output_tokens || 0) * 0.015 / 1000
        ).toFixed(4),
      },
    };
    
    storeReview(review);
    
    return review;
    
  } catch (error) {
    console.error('[AI-REVIEW] ❌ Review failed:', error.message);
    
    // Store failed review for debugging
    const failedReview = {
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      error: error.message,
      failed: true,
    };
    storeReview(failedReview);
    
    throw error;
  }
}

/**
 * Execute a single autonomous action with validation
 */
async function executeAutonomousAction(action, haClient) {
  const limits = HARD_LIMITS[action.entity];
  
  // Validate entity is in allowed list
  if (!limits) {
    console.log(`[AI-REVIEW] ⚠️ Entity not allowed: ${action.entity}`);
    return {
      executed: false,
      reason: `Entity ${action.entity} is not in the allowed list`,
      blocked: true,
    };
  }
  
  // Validate values are numbers
  if (typeof action.currentValue !== 'number' || typeof action.newValue !== 'number') {
    return {
      executed: false,
      reason: 'Invalid current or new value (must be numbers)',
      blocked: true,
    };
  }
  
  // Validate change size
  const change = Math.abs(action.newValue - action.currentValue);
  if (change > limits.maxChange) {
    console.log(`[AI-REVIEW] ⚠️ Change too large: ${change} > ${limits.maxChange}`);
    return {
      executed: false,
      reason: `Change of ${change.toFixed(2)} kPa exceeds max allowed ${limits.maxChange} kPa per day`,
      blocked: true,
    };
  }
  
  // Validate new value is within hard limits
  if (action.newValue < limits.min || action.newValue > limits.max) {
    console.log(`[AI-REVIEW] ⚠️ Value out of range: ${action.newValue} not in [${limits.min}, ${limits.max}]`);
    return {
      executed: false,
      reason: `Value ${action.newValue} is outside allowed range [${limits.min}, ${limits.max}]`,
      blocked: true,
    };
  }
  
  // All validations passed - execute!
  console.log(`[AI-REVIEW] ✅ Executing: ${action.entity} = ${action.newValue}`);
  
  const result = await haClient.callService('number', 'set_value', {
    entity_id: action.entity,
    value: action.newValue,
  });
  
  return {
    executed: result.success,
    reason: result.success ? 'Applied successfully' : result.error,
    blocked: false,
  };
}

/**
 * Format history data as markdown table for AI prompt
 */
function formatHistoryTable(history) {
  // Sample every 30 minutes to keep prompt size reasonable
  const intervalMs = 30 * 60 * 1000;
  
  let output = 'Time | Temp (°F) | Humidity (%) | VPD (kPa)\n';
  output += '--- | --- | --- | ---\n';
  
  // Get unique timestamps (rounded to interval)
  const allTimestamps = [...new Set([
    ...history.vpd.map(e => Math.floor(e.timestamp / intervalMs) * intervalMs),
  ])].sort();
  
  // Limit to last 48 entries (24 hours at 30-min intervals)
  const recentTimestamps = allTimestamps.slice(-48);
  
  for (const ts of recentTimestamps) {
    const time = new Date(ts).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    const findNearest = (arr) => arr.find(e => Math.abs(e.timestamp - ts) < intervalMs);
    
    const temp = findNearest(history.temperature)?.value?.toFixed(1) || '-';
    const hum = findNearest(history.humidity)?.value?.toFixed(1) || '-';
    const vpd = findNearest(history.vpd)?.value?.toFixed(2) || '-';
    
    output += `${time} | ${temp} | ${hum} | ${vpd}\n`;
  }
  
  return output;
}
```

---

#### 5. CREATE: `dashboard/server/prompts/daily-review.js`

```javascript
/**
 * Daily Review Prompt Builder
 * 
 * Constructs the system prompt for Claude to analyze and optimize VPD settings.
 */

export function buildDailyReviewPrompt(data) {
  return `You are the AI botanist for a precision indoor cannabis grow in Albany, NY. Each morning you review the last 24 hours and make optimization adjustments to VPD settings.

## YOUR AUTHORITY

### ✅ AUTONOMOUS ACTIONS (You can execute these immediately)
You may adjust these AC Infinity CloudForge T5 VPD settings:

| Setting | Entity | Max Change/Day | Hard Limits |
|---------|--------|----------------|-------------|
| VPD Target | number.cloudforge_t5_target_vpd | ±0.15 kPa | 0.3 - 1.2 kPa |
| VPD High Trigger | number.cloudforge_t5_vpd_high_trigger | ±0.15 kPa | 0.5 - 1.4 kPa |
| VPD Low Trigger | number.cloudforge_t5_vpd_low_trigger | ±0.1 kPa | 0.1 - 0.8 kPa |

### 📋 RECOMMENDATIONS ONLY (User must approve)
- Heater temperature target changes
- Phenology stage advancement
- Light schedule changes
- Major strategy changes (> ±0.2 kPa)

## CURRENT PHENOLOGY STAGE

- **Stage:** ${data.phenology?.stage || 'seedling'}
- **Days in Stage:** ${data.phenology?.daysInStage || 0}
- **VPD Target:** ${data.phenology?.targets?.vpdOptimal || 0.6} kPa
- **VPD Range:** ${data.phenology?.targets?.vpdMin || 0.4} - ${data.phenology?.targets?.vpdMax || 0.8} kPa
- **Day Temp:** ${data.phenology?.targets?.tempDay || 77}°F
- **Night Temp:** ${data.phenology?.targets?.tempNight || 71}°F

## CURRENT AC INFINITY SETTINGS

- **Humidifier VPD Target:** ${data.acInfinitySettings?.humidifierVPDTarget ?? 'unknown'} kPa
- **Humidifier VPD High Trigger:** ${data.acInfinitySettings?.humidifierVPDHigh ?? 'unknown'} kPa
- **Humidifier VPD Low Trigger:** ${data.acInfinitySettings?.humidifierVPDLow ?? 'unknown'} kPa

## LAST 24 HOURS - STATISTICS

- **Average VPD:** ${data.stats?.avgVPD || 'N/A'} kPa (target: ${data.phenology?.targets?.vpdOptimal || 0.6})
- **VPD Range:** ${data.stats?.minVPD || 'N/A'} - ${data.stats?.maxVPD || 'N/A'} kPa
- **Time in Target Range:** ${data.stats?.timeInRange || 0}%
- **Average Temperature:** ${data.stats?.avgTemp || 'N/A'}°F
- **Average Humidity:** ${data.stats?.avgHumidity || 'N/A'}%
- **Data Points:** ${data.stats?.dataPoints || 0} readings

## LAST 24 HOURS - SENSOR DATA

${data.historyTable || 'No history data available'}

## PREVIOUS AI ACTIONS (Last 7 Days)

${data.previousActions?.length > 0
    ? data.previousActions.map(a => `- ${a.date}: ${a.action} → ${a.outcome}`).join('\n')
    : 'No previous AI actions recorded'}

## ENVIRONMENT CONTEXT

- **Location:** Basement in Albany, NY (cold/dry climate)
- **Baseline Humidity:** ~30% (very dry, constant battle)
- **Humidifier:** CloudForge T5 running at max intensity (10)
- **Heater:** Oil radiator controlled by dashboard
- **Light Schedule:** 20/4 (6 AM on, 2 AM off)

## YOUR TASK

Analyze the last 24 hours and decide if any VPD setting adjustments are needed.

**Consider:**
1. Is average VPD close to target? (±0.1 kPa is good)
2. Is VPD stable or swinging wildly?
3. Are there day/night patterns causing issues?
4. Did previous adjustments help or hurt?
5. Is the current strategy working?

**Rules:**
1. **autonomousActions can be empty []** - Only change if clearly beneficial
2. **Prefer stability** - Don't change settings that are working
3. **Gradual adjustments** - Never max out the allowed change unless critical
4. **Explain reasoning** - Every action needs a clear "reason"

## RESPONSE FORMAT

Respond with ONLY this JSON structure (no markdown, no explanation outside JSON):

{
  "analysis": {
    "overnightSummary": "2-3 sentence summary of environment performance",
    "issuesDetected": ["List of problems found"],
    "positives": ["What went well"],
    "vpdAssessment": "on_target | slightly_high | slightly_low | too_high | too_low",
    "stabilityScore": 7
  },
  "autonomousActions": [
    {
      "entity": "number.cloudforge_t5_target_vpd",
      "currentValue": 0.6,
      "newValue": 0.55,
      "reason": "Clear explanation of why this change is needed"
    }
  ],
  "recommendations": [
    {
      "type": "heater",
      "priority": "low | medium | high",
      "suggestion": "What the user should consider doing",
      "reason": "Why this would help"
    }
  ],
  "predictions": {
    "todayOutlook": "What to expect today based on current/new settings",
    "potentialConcerns": ["Things to watch for"]
  },
  "learnings": [
    "Insights about this specific grow environment"
  ]
}`;
}
```

---

#### 6. CREATE: `dashboard/ecosystem.config.cjs`

```javascript
/**
 * PM2 Ecosystem Configuration
 * 
 * Manages the AI Review Service for 24/7 operation on Raspberry Pi.
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'growop-ai',
      script: './server/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      
      // Environment
      env: {
        NODE_ENV: 'production',
        AI_SERVICE_PORT: 3001,
      },
      
      // Restart daily at 5:00 AM (before the 5:30 review) to clear memory
      cron_restart: '0 5 * * *',
      
      // Logging
      error_file: './logs/ai-error.log',
      out_file: './logs/ai-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      
      // Graceful restart
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
```

---

### Deployment Instructions

#### On Development Machine (Windows):

```bash
# 1. Navigate to dashboard directory
cd C:\Users\russe\Documents\Grow\dashboard

# 2. Create server directory structure
mkdir server
mkdir server\services
mkdir server\prompts
mkdir server\data
mkdir logs

# 3. Create all the files above

# 4. Install server dependencies
cd server
npm install
cd ..

# 5. Test locally
node server/index.js
```

#### On Raspberry Pi (Production):

```bash
# 1. SSH into Pi
ssh pi@100.65.202.84

# 2. Navigate to project (adjust path as needed)
cd /home/pi/grow/dashboard

# 3. Pull latest code (if using git)
git pull

# 4. Install server dependencies
cd server
npm install
cd ..

# 5. Create logs directory
mkdir -p logs

# 6. Install PM2 globally
sudo npm install -g pm2

# 7. Start the service
pm2 start ecosystem.config.cjs

# 8. Verify it's running
pm2 status
pm2 logs growop-ai

# 9. Save PM2 config (survives reboot)
pm2 save

# 10. Setup PM2 to start on boot
pm2 startup
# Copy and run the command it outputs (requires sudo)

# 11. Verify auto-start works
sudo reboot
# Wait for Pi to restart, then:
pm2 status
```

---

### Verification Checklist

After deployment, verify:

- [ ] `pm2 status` shows `growop-ai` as `online`
- [ ] `curl http://localhost:3001/api/status` returns service info
- [ ] `curl http://localhost:3001/api/entities` returns current sensor values
- [ ] Manual trigger works: `curl -X POST http://localhost:3001/api/review/trigger`
- [ ] Service survives reboot (check with `pm2 status` after `sudo reboot`)
- [ ] Logs show activity: `pm2 logs growop-ai`
- [ ] VPD settings actually change in Home Assistant after a review

---

### Dashboard Integration (Optional Update)

To have the dashboard fetch reviews from the server instead of localStorage, update the useAIReview hook:

**Update `dashboard/.env`:**
```
VITE_AI_SERVICE_URL=http://100.65.202.84:3001
```

**Update `dashboard/src/hooks/useAIReview.js`:**
```javascript
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:3001';

// Replace localStorage calls with fetch calls:
async function fetchReviews() {
  const response = await fetch(`${AI_SERVICE_URL}/api/reviews`);
  const data = await response.json();
  return data.reviews;
}

async function triggerReview() {
  const response = await fetch(`${AI_SERVICE_URL}/api/review/trigger`, { method: 'POST' });
  return response.json();
}
```

---

### Cost Summary

| Component | Consumption | Monthly Cost |
|-----------|-------------|--------------|
| Pi running 24/7 | ~5W | ~$0.50 |
| Claude API (daily reviews) | ~$0.02/day | ~$0.60 |
| **Total** | | **~$1.10/month** |

---

### Success Criteria (Phase 5b)

- [ ] Node.js service runs 24/7 without browser
- [ ] Daily review executes automatically at 5:30 AM
- [ ] AI can autonomously adjust VPD settings within hard limits
- [ ] All actions logged with reasoning
- [ ] Reviews stored in JSON file (30 days)
- [ ] REST API accessible for dashboard integration
- [ ] Service survives Pi reboots
- [ ] Manual trigger available via API
- [ ] Cost tracking shows ~$0.02 per review

---

**This completes the 24/7 autonomous AI control system.**
```

---

## VERIFICATION AFTER ADDING:

1. Phase 5b section appears after Phase 5
2. All 6 file templates are included with correct paths
3. Deployment instructions are complete
4. Success criteria checklist is present
5. Architecture diagram renders correctly

---

## WHAT THIS ENABLES:

When deployed to the Pi, the AI service will:
- ✅ Start automatically on boot
- ✅ Run 24/7 without any browser or monitor
- ✅ Execute daily AI review at 5:30 AM Eastern
- ✅ Analyze 24h of sensor history
- ✅ Autonomously adjust VPD settings (within safety limits)
- ✅ Log all decisions and actions
- ✅ Provide REST API for dashboard to display results
- ✅ Survive reboots and crashes (PM2 auto-restart)

**True agentic autonomy - set it and forget it.** 🌿🤖
