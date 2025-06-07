#!/bin/bash

# Deploy script for Cobytes Security Platform
# This script triggers a deployment on DigitalOcean App Platform

echo "🚀 Deploying Cobytes Security Platform..."
echo "====================================="

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl CLI is not installed"
    echo "Please install it from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl auth list &> /dev/null; then
    echo "❌ Not authenticated with DigitalOcean"
    echo "Please run: doctl auth init"
    exit 1
fi

# App ID for cobytes-security-platform
APP_ID="93a8fcec-94b3-4c24-9c7f-3b23c6b37b5c"

echo "📦 Triggering deployment..."
echo ""

# Create a new deployment
doctl apps create-deployment $APP_ID --force-rebuild

if [ $? -eq 0 ]; then
    echo "✅ Deployment triggered successfully!"
    echo ""
    echo "📊 You can monitor the deployment at:"
    echo "https://cloud.digitalocean.com/apps/$APP_ID"
    echo ""
    echo "Or check status with: doctl apps list-deployments $APP_ID"
else
    echo "❌ Failed to trigger deployment"
    exit 1
fi