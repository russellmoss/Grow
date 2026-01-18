# 🌱 Grow Environment Automation

Automated indoor grow environment management using Home Assistant, with AI-assisted development via Cursor MCP.

## Quick Links

| Document | Purpose |
|----------|---------|
| [GROW_PROJECT_PLAN.md](./GROW_PROJECT_PLAN.md) | Master project blueprint |
| [docs/MANIFEST.md](./docs/MANIFEST.md) | Single Source of Truth (SSoT) |
| [docs/AUTOMATIONS.md](./docs/AUTOMATIONS.md) | Automation documentation |

## Current Status

| Metric | Current | Target (Seedling) | Status |
|--------|---------|-------------------|--------|
| 🌡️ Temperature | 80.9°F | 75-78°F | ⚠️ Slightly High |
| 💧 Humidity | 33.7% | 65-75% | ❌ Critical |
| 📊 VPD | 2.6 kPa | 0.4-0.8 kPa | ❌ Critical |

**Priority:** Add CloudForge T7 humidifier to address 30% basement humidity

## Environment

- **Home Assistant:** http://100.65.202.84:8123 (Tailscale)
- **Location:** Basement, Albany NY area
- **Baseline Humidity:** ~30% (requires active humidification)
- **Tap Water pH:** 7.77 (adjust to 6.4-6.5)

## Hardware

| Device | Entity | Status |
|--------|--------|--------|
| Grow Light | `switch.light` | ✅ Online |
| Tent Heater | `climate.tent_heater` | ✅ Heat Mode |
| AC Infinity Controller | `sensor.ac_infinity_*` | ✅ Online |
| CloudForge T7 | `humidifier.cloudforge_t7` | ⏳ Pending |
| Vevor Distiller | Manual | ✅ Available |

## Schedules

### Light (20/4 Photoperiod)
- **ON:** 6:00 AM
- **OFF:** 2:00 AM

### Temperature
- **Day:** 80°F (6 AM - 2 AM)
- **Night:** 70°F (2 AM - 6 AM)

## Development

This project uses Cursor.ai with MCP for AI-assisted development.

### MCP Verification Rule

⚠️ **Before any climate recommendations, always verify live sensor data:**

```
get_entity sensor.ac_infinity_controller_69_pro_temperature
get_entity sensor.ac_infinity_controller_69_pro_humidity
get_entity sensor.ac_infinity_controller_69_pro_vpd
```

## Structure

```
Grow/
├── .cursor/mcp.json      # MCP config
├── .cursorrules          # AI context rules
├── docs/                 # Documentation (SSoT)
│   ├── MANIFEST.md       # Master configuration
│   └── AUTOMATIONS.md    # Automation reference
├── config/               # HA automation YAMLs
├── dashboard/            # React dashboard app
└── scripts/              # Utility scripts
```

## Safe-Touch Protocol (Seedling)

```
Seed Depth:      1/2 inch
Watering Circle: 3 inches diameter
Initial Water:   1 cup @ pH 6.4-6.5
Humidity Dome:   Inverted Solo Cup (4 ceiling slits)
```

---

See [GROW_PROJECT_PLAN.md](./GROW_PROJECT_PLAN.md) for detailed implementation plan.
