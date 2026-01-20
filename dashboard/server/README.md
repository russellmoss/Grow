# GrowOp AI Review Service

24/7 headless Node.js service that runs on Raspberry Pi, enabling true autonomous AI control without requiring a browser.

## Features

- ✅ **Automatic Daily Reviews** - Runs at 5:30 AM Eastern every day
- ✅ **24/7 Operation** - Runs independently, no browser needed
- ✅ **REST API** - Dashboard can fetch reviews and trigger manual reviews
- ✅ **Auto-Restart** - Managed by PM2, survives reboots
- ✅ **Safety Guardrails** - Hard limits prevent excessive VPD changes
- ✅ **Review History** - Stores last 30 days in JSON file

## Quick Start

### Development (Windows)

```bash
# 1. Install dependencies
cd dashboard/server
npm install

# 2. Ensure .env file exists in dashboard/ directory with:
#    VITE_HA_URL=http://100.65.202.84:8123
#    VITE_HA_TOKEN=your_token
#    VITE_ANTHROPIC_API_KEY=sk-ant-...

# 3. Run service
npm start
# or for development with auto-reload:
npm run dev
```

### Production (Raspberry Pi)

```bash
# 1. SSH into Pi
ssh pi@100.65.202.84

# 2. Navigate to project
cd /path/to/grow/dashboard

# 3. Install server dependencies
cd server
npm install
cd ..

# 4. Install PM2 globally
sudo npm install -g pm2

# 5. Create logs directory
mkdir -p logs

# 6. Start service
pm2 start ecosystem.config.cjs

# 7. Verify it's running
pm2 status
pm2 logs growop-ai

# 8. Save PM2 config (survives reboot)
pm2 save

# 9. Setup auto-start on boot
pm2 startup
# Copy and run the command it outputs (requires sudo)
```

## REST API Endpoints

- `GET /api/status` - Service health check
- `GET /api/reviews` - Get all stored reviews (last 30 days)
- `GET /api/reviews/latest` - Get most recent review
- `POST /api/review/trigger` - Manually trigger a review
- `GET /api/entities` - Get current entity states (debugging)

## Testing

```bash
# Check service status
curl http://localhost:3001/api/status

# Get latest review
curl http://localhost:3001/api/reviews/latest

# Trigger manual review
curl -X POST http://localhost:3001/api/review/trigger

# Check current entities
curl http://localhost:3001/api/entities
```

## PM2 Commands

```bash
# View status
pm2 status

# View logs
pm2 logs growop-ai

# Restart service
pm2 restart growop-ai

# Stop service
pm2 stop growop-ai

# Delete service
pm2 delete growop-ai
```

## File Structure

```
server/
├── index.js              # Express server + cron scheduler
├── services/
│   ├── ha-client.js      # Home Assistant WebSocket client
│   └── ai-review.js      # AI review logic
├── prompts/
│   └── daily-review.js   # AI prompt templates
├── data/
│   └── reviews.json     # Stored reviews (auto-created)
└── package.json          # Dependencies
```

## Environment Variables

Required in `dashboard/.env`:

- `VITE_HA_URL` - Home Assistant URL
- `VITE_HA_TOKEN` - Home Assistant long-lived access token
- `VITE_ANTHROPIC_API_KEY` - Anthropic Claude API key
- `AI_SERVICE_PORT` - Port for REST API (default: 3001)

## Safety Limits

The AI can autonomously adjust VPD settings within these limits:

| Setting | Max Change/Day | Hard Limits |
|---------|---------------|-------------|
| VPD Target | ±0.15 kPa | 0.3 - 1.2 kPa |
| VPD High Trigger | ±0.15 kPa | 0.5 - 1.4 kPa |
| VPD Low Trigger | ±0.1 kPa | 0.1 - 0.8 kPa |

## Troubleshooting

**Service won't start:**
- Check Node.js version: `node --version` (needs 18+)
- Check .env file exists and has correct values
- Check port 3001 is available: `netstat -an | grep 3001`

**Can't connect to Home Assistant:**
- Verify `VITE_HA_URL` and `VITE_HA_TOKEN` in .env
- Test HA connection: `curl -H "Authorization: Bearer $TOKEN" $URL/api/`

**Reviews not executing:**
- Check cron schedule: `pm2 logs growop-ai | grep CRON`
- Verify timezone is correct (America/New_York)
- Check Anthropic API key is valid

**PM2 service dies:**
- Check logs: `pm2 logs growop-ai --err`
- Check memory: `pm2 monit`
- Increase max_memory_restart in ecosystem.config.cjs if needed
