#!/bin/bash

echo "🚀 Deploying Cobytes Security Platform to Production"
echo "==================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${RED}❌ doctl CLI is not installed${NC}"
    echo "Please install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo -e "${RED}❌ Not authenticated with DigitalOcean${NC}"
    echo "Please run: doctl auth init"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Deploy using the app spec
echo "📦 Deploying application..."
echo ""

# Update the existing app
APP_ID="93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c"

echo "Updating app configuration..."
doctl apps update $APP_ID --spec .do/app.yaml

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ App configuration updated successfully${NC}"
    echo ""
    
    # Get the app URL
    APP_URL=$(doctl apps get $APP_ID --format LiveURL --no-header)
    echo -e "${GREEN}🌐 Application URL: $APP_URL${NC}"
    echo ""
    
    # Get deployment status
    echo "📊 Deployment Status:"
    doctl apps list-deployments $APP_ID --format ID,Phase,Progress,CreatedAt --no-header | head -5
    
    echo ""
    echo -e "${YELLOW}⏳ Deployment in progress...${NC}"
    echo "You can monitor the deployment at: https://cloud.digitalocean.com/apps/$APP_ID"
    echo ""
    echo "Or run: doctl apps list-deployments $APP_ID"
else
    echo -e "${RED}❌ Failed to update app${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you have the correct permissions"
    echo "2. Check if the app spec is valid: doctl apps spec validate .do/app.yaml"
    echo "3. Try creating a new app: doctl apps create --spec .do/app.yaml"
fi