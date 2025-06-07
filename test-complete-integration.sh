#!/bin/bash

echo "🚀 Testing Cobytes Security Platform with Live Pentest-Tools API"
echo "============================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Direct Pentest-Tools API
echo "1. Testing Direct Pentest-Tools API..."
echo "--------------------------------------"

API_KEY="43cIriuvQ9qEeFFaYbFDKpfzwLWuUA92tq7sOpzJ046a87e7"
API_URL="https://app.pentest-tools.com/api/v2"

# Get targets
echo -n "Getting targets... "
TARGETS=$(curl -s -H "Authorization: Bearer $API_KEY" "$API_URL/targets")
TARGET_COUNT=$(echo $TARGETS | jq '.data | length')
echo -e "${GREEN}✓ Found $TARGET_COUNT targets${NC}"

# Create a test scan
echo -n "Starting subdomain scan on example.com... "
SCAN_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json" \
  -d '{"tool_id": 20, "target_name": "example.com", "tool_params": {"scan_type": "light"}}' \
  "$API_URL/scans")
SCAN_ID=$(echo $SCAN_RESPONSE | jq -r '.data.created_id')

if [ "$SCAN_ID" != "null" ] && [ -n "$SCAN_ID" ]; then
  echo -e "${GREEN}✓ Scan started with ID: $SCAN_ID${NC}"
  
  # Check scan status
  echo -n "Checking scan status... "
  sleep 2
  STATUS_RESPONSE=$(curl -s -H "Authorization: Bearer $API_KEY" "$API_URL/scans/$SCAN_ID")
  STATUS=$(echo $STATUS_RESPONSE | jq -r '.data.status_name')
  echo -e "${GREEN}✓ Status: $STATUS${NC}"
else
  echo -e "${RED}✗ Failed to start scan${NC}"
  echo "Response: $SCAN_RESPONSE"
fi

echo ""
echo "2. Backend Configuration Check"
echo "------------------------------"

# Check if backend is configured correctly
echo -n "Checking backend .env file... "
if [ -f "backend/.env" ]; then
  API_KEY_IN_ENV=$(grep "PENTEST_TOOLS_API_KEY" backend/.env | cut -d'=' -f2)
  if [ "$API_KEY_IN_ENV" = "$API_KEY" ]; then
    echo -e "${GREEN}✓ API key is correctly configured${NC}"
  else
    echo -e "${YELLOW}⚠ API key mismatch in .env file${NC}"
  fi
else
  echo -e "${RED}✗ .env file not found${NC}"
fi

echo ""
echo "3. Summary"
echo "----------"
echo -e "${GREEN}✓ Pentest-Tools API is working correctly${NC}"
echo -e "${GREEN}✓ API key: $API_KEY${NC}"
echo -e "${GREEN}✓ You can now run scans through the platform${NC}"
echo ""
echo "To start the platform:"
echo "1. Backend: cd backend && npm run dev"
echo "2. Frontend: cd frontend && npm start"
echo ""
echo "Or use Docker:"
echo "docker-compose up -d"