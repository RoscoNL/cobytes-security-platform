#!/bin/bash

# Docker Container Monitor and Fixer for Cobytes Security Platform
# This script monitors containers and attempts to fix common issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🔍 Cobytes Security Platform - Docker Monitor"
echo "==========================================="
echo ""

# Function to check container status
check_container() {
    local container=$1
    local status=$(docker ps -a --filter "name=$container" --format "{{.Status}}" 2>/dev/null | head -1)
    
    if [[ -z "$status" ]]; then
        echo -e "${RED}✗ $container: Not found${NC}"
        return 1
    elif [[ "$status" =~ "Up" ]]; then
        echo -e "${GREEN}✓ $container: Running ($status)${NC}"
        return 0
    else
        echo -e "${RED}✗ $container: $status${NC}"
        return 1
    fi
}

# Function to check service health
check_health() {
    local service=$1
    local url=$2
    local expected=$3
    
    echo -n "  Testing $service... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [[ "$response" == "$expected" ]]; then
        echo -e "${GREEN}OK (HTTP $response)${NC}"
        return 0
    else
        echo -e "${RED}FAIL (HTTP $response)${NC}"
        return 1
    fi
}

# Function to show container logs
show_logs() {
    local container=$1
    echo ""
    echo "📋 Last 20 lines from $container:"
    echo "--------------------------------"
    docker logs --tail 20 "$container" 2>&1 || echo "Failed to get logs"
}

# Function to fix common issues
fix_issues() {
    echo ""
    echo "🔧 Attempting to fix common issues..."
    
    # Fix 1: Clear node_modules issues
    echo "  - Clearing node_modules volumes..."
    docker volume ls | grep node_modules | awk '{print $2}' | xargs -r docker volume rm 2>/dev/null || true
    
    # Fix 2: Rebuild without cache
    echo "  - Rebuilding containers..."
    docker-compose down
    docker-compose build --no-cache
    
    # Fix 3: Reset database
    echo "  - Resetting database..."
    docker volume rm cobytes-security-platform_postgres_data 2>/dev/null || true
    
    echo -e "${GREEN}✓ Fixes applied${NC}"
}

# Main monitoring loop
monitor() {
    while true; do
        clear
        echo "🔍 Docker Container Status ($(date +%H:%M:%S))"
        echo "========================================"
        echo ""
        
        # Check containers
        all_healthy=true
        
        echo "📦 Containers:"
        check_container "cobytes-postgres" || all_healthy=false
        check_container "cobytes-redis" || all_healthy=false
        check_container "cobytes-backend" || all_healthy=false
        check_container "cobytes-frontend" || all_healthy=false
        
        echo ""
        echo "🌐 Service Health:"
        check_health "Backend API" "http://localhost:3001/api/health" "200" || all_healthy=false
        check_health "Frontend" "http://localhost:3002" "200" || all_healthy=false
        check_health "Database" "http://localhost:3001/api/system/database-health" "200" || all_healthy=false
        
        # If not healthy, show logs
        if [ "$all_healthy" = false ]; then
            echo ""
            echo -e "${YELLOW}⚠️  Issues detected!${NC}"
            
            # Check which container has issues
            if ! check_container "cobytes-backend" > /dev/null 2>&1; then
                show_logs "cobytes-backend"
            fi
            
            if ! check_container "cobytes-frontend" > /dev/null 2>&1; then
                show_logs "cobytes-frontend"
            fi
            
            echo ""
            echo "Press 'f' to attempt fixes, 'q' to quit, or wait for refresh..."
            
            # Read user input with timeout
            read -t 5 -n 1 key || true
            
            case $key in
                f|F)
                    fix_issues
                    docker-compose up -d
                    sleep 10
                    ;;
                q|Q)
                    echo "Exiting..."
                    exit 0
                    ;;
            esac
        else
            echo ""
            echo -e "${GREEN}✅ All services healthy!${NC}"
            echo ""
            echo "Press 'q' to quit or wait for refresh..."
            
            read -t 5 -n 1 key || true
            if [[ "$key" == "q" || "$key" == "Q" ]]; then
                echo "Exiting..."
                exit 0
            fi
        fi
    done
}

# Command line options
case "${1:-}" in
    "fix")
        fix_issues
        ;;
    "logs")
        container="${2:-cobytes-backend}"
        docker logs -f "$container"
        ;;
    "restart")
        echo "Restarting all containers..."
        docker-compose restart
        ;;
    "rebuild")
        echo "Rebuilding all containers..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        ;;
    *)
        monitor
        ;;
esac