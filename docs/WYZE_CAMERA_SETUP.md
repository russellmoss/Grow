# Wyze Camera Setup - Generic Camera Integration

## Camera Details
- **Camera Name:** Grow Camera
- **Device:** Wyze Cam v4 (HL_CAM4)
- **Location:** Grow Room area
- **Entity ID:** `camera.grow_camera`

## wyze-bridge Configuration
- **Container IP:** 172.30.232.3 (Docker internal)
- **RTSP Port:** 8554
- **HTTP Port:** 8888
- **Stream Name:** `Grow` (case-sensitive, capital G)

## Integration Configuration

### Via Home Assistant UI:

1. Go to **Settings** → **Devices & Services**
2. Click **"+ Add Integration"**
3. Search for **"Generic Camera"**
4. Fill in the following:

**Required Fields:**
- **Name:** `Grow Camera`
- **Still Image URL:** `http://172.30.232.3:8888/Grow/snapshot.jpg`
- **Stream Source:** `rtsp://172.30.232.3:8554/Grow`

**Optional Fields:**
- **RTSP Transport Protocol:** `tcp`
- **Username:** (leave blank)
- **Password:** (leave blank)
- **Verify SSL Certificate:** `false`
- **Frame Rate:** `15` (optional)

5. Click **Submit**
6. Assign to **"Grow Room"** area if prompted

### Via YAML (Alternative - if UI doesn't work):

Add to `configuration.yaml`:

```yaml
camera:
  - platform: generic
    name: Grow Camera
    still_image_url: http://172.30.232.3:8888/Grow/snapshot.jpg
    stream_source: rtsp://172.30.232.3:8554/Grow
    verify_ssl: false
```

Then restart Home Assistant.

## Verification

After creating the integration, verify it works:

1. Check entity exists: `camera.grow_camera`
2. Entity should show as `available` (not `unavailable`)
3. Test snapshot URL: `http://172.30.232.3:8888/Grow/snapshot.jpg`
4. Test RTSP stream: `rtsp://172.30.232.3:8554/Grow`

## Dashboard Integration

The camera feed will automatically appear in the dashboard once:
- Entity `camera.grow_camera` exists
- Entity is in `available` state
- Dashboard is connected to Home Assistant

The `CameraFeed` component is already configured to use `camera.grow_camera` from `entities.js`.

## Troubleshooting

**Camera shows as unavailable:**
- Verify wyze-bridge container is running
- Check RTSP port 8554 is accessible
- Verify stream name is exactly "Grow" (case-sensitive)
- Check Docker network connectivity

**No image loads:**
- Test snapshot URL directly in browser
- Verify HTTP port 8888 is accessible
- Check wyze-bridge logs for errors

**Stream doesn't work:**
- Verify RTSP transport protocol is `tcp`
- Check if VLC can play: `rtsp://172.30.232.3:8554/Grow`
- Verify network connectivity to Docker container
