# 🚀 Dashboard Deployment Guide

## Prerequisites

1. **SSH Access to Pi**
   ```bash
   # Test connection
   ssh pi@100.65.202.84
   ```

2. **Node.js 18+** installed locally

3. **Home Assistant www folder** accessible at `/config/www/`

## Deployment Steps

### 1. Configure Environment

Create `.env` file in `dashboard/` with production values:
```bash
VITE_HA_URL=http://100.65.202.84:8123
VITE_HA_TOKEN=your_long_lived_token_here
VITE_GROWTH_STAGE=seedling
VITE_CAMERA_URL=  # Optional: RTSP stream URL
```

### 2. Run Deployment Script

**On Windows (PowerShell):**
```powershell
cd dashboard
npm run build
# Then manually SCP files or use WSL
```

**On Linux/Mac/WSL:**
```bash
cd dashboard
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### 3. Access Dashboard

**Direct URL:**
```
http://100.65.202.84:8123/local/grow-dashboard/index.html
```

## Add to Home Assistant Sidebar

### Option A: Panel Custom (Recommended)

Add to `configuration.yaml`:
```yaml
panel_custom:
  - name: grow-dashboard
    sidebar_title: "🌿 Grow"
    sidebar_icon: mdi:leaf
    url_path: grow
    require_admin: false
    module_url: /local/grow-dashboard/index.html
    embed_iframe: true
    trust_external_script: true
```

Then restart Home Assistant.

### Option B: Lovelace Panel

Add to your dashboard as a custom card:
```yaml
type: iframe
url: /local/grow-dashboard/index.html
aspect_ratio: 100%
```

## Troubleshooting

### Dashboard Not Loading

1. Check file permissions:
   ```bash
   ssh pi@100.65.202.84 "ls -la /config/www/grow-dashboard/"
   ```

2. Verify URL is correct in browser

3. Check browser console for errors

4. Ensure files are in the correct location:
   ```bash
   ssh pi@100.65.202.84 "ls -la /config/www/grow-dashboard/index.html"
   ```

### WebSocket Connection Failed

1. Verify `VITE_HA_URL` is correct in `.env`
2. Check `VITE_HA_TOKEN` is valid (regenerate if needed)
3. Ensure Tailscale is connected
4. Check browser console for specific error messages

### Build Errors

```bash
# Clear cache and rebuild
cd dashboard
rm -rf node_modules dist
npm install
npm run build
```

### Permission Errors

If you get permission errors during deployment:
```bash
# Fix permissions on Pi
ssh pi@100.65.202.84 "sudo chown -R homeassistant:homeassistant /config/www/grow-dashboard"
```

## Updating the Dashboard

Simply run the deploy script again:
```bash
cd dashboard
./scripts/deploy.sh
```

Or manually:
```bash
npm run build
scp -r dist/* pi@100.65.202.84:/config/www/grow-dashboard/
```

## Camera Feed Setup (Optional)

To enable camera feed:

1. Install docker-wyze-bridge on your Pi
2. Enable RTSP in Wyze app
3. Configure docker-wyze-bridge with camera credentials
4. Add to `.env`:
   ```bash
   VITE_CAMERA_URL=http://100.65.202.84:8554/stream
   ```
5. Rebuild and redeploy

## Production Environment Variables

The dashboard reads environment variables at **build time** (not runtime). Make sure your `.env` file has the correct values before running `npm run build`.

For production, you may want to:
- Use a different HA URL (if accessing from outside Tailscale)
- Set a specific growth stage
- Configure camera URL if available
