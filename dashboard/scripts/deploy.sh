#!/bin/bash
# =============================================================================
# Grow Dashboard Deployment Script
# Deploys the React dashboard to Home Assistant on Raspberry Pi
# =============================================================================

set -e

# Configuration
PI_HOST="${PI_HOST:-100.65.202.84}"
PI_USER="${PI_USER:-pi}"
REMOTE_PATH="/config/www/grow-dashboard"
SSH_KEY="${SSH_KEY:-~/.ssh/id_rsa}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🌿 Grow Dashboard Deployment${NC}"
echo "================================"

# Step 1: Build
echo -e "${YELLOW}📦 Building production bundle...${NC}"
cd "$(dirname "$0")/.."
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Build failed - dist directory not found${NC}"
    exit 1
fi

# Step 2: Create remote directory
echo -e "${YELLOW}📁 Preparing remote directory...${NC}"
ssh -i "$SSH_KEY" "${PI_USER}@${PI_HOST}" "mkdir -p ${REMOTE_PATH}"

# Step 3: Deploy
echo -e "${YELLOW}🚀 Deploying to ${PI_HOST}...${NC}"
scp -i "$SSH_KEY" -r dist/* "${PI_USER}@${PI_HOST}:${REMOTE_PATH}/"

# Step 4: Verify
echo -e "${YELLOW}✅ Verifying deployment...${NC}"
ssh -i "$SSH_KEY" "${PI_USER}@${PI_HOST}" "ls -la ${REMOTE_PATH}"

echo ""
echo -e "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo "Access your dashboard at:"
echo "  http://${PI_HOST}:8123/local/grow-dashboard/index.html"
echo ""
echo "Or add to HA sidebar with panel_custom (see docs/DEPLOYMENT.md)"
