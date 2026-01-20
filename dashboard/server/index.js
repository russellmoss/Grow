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
