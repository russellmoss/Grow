# 🌿 Grow Dashboard

React + Vite dashboard for Home Assistant grow environment automation.

## Project: Plausible Deniability

Custom dashboard for monitoring and controlling the indoor grow environment.

## Setup

```bash
npm install
npm run dev
```

## Build for Production

```bash
npm run build
```

Output will be in `dist/` directory, ready for deployment to Home Assistant.

## Environment Variables

Create `.env` file:

```bash
VITE_HA_URL=http://100.65.202.84:8123
VITE_HA_TOKEN=your_long_lived_access_token_here
VITE_GROWTH_STAGE=seedling
VITE_VPD_MIN=0.4
VITE_VPD_MAX=0.8
```

## Deployment

See `docs/DASHBOARD_MASTERPLAN.md` for deployment instructions.
