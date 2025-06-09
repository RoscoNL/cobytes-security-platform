#!/bin/bash

# Complete Docker Test Suite Runner for Cobytes Security Platform
# This script builds and runs all tests with proper error handling and logging

set -e

echo "🚀 Cobytes Security Platform - Docker Test Suite"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.test.yml"
LOG_DIR="./test-logs"
REPORT_DIR="./test-reports"

# Create directories
mkdir -p "$LOG_DIR"
mkdir -p "$REPORT_DIR"

# Function to check Docker
check_docker() {
    echo "🔍 Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed${NC}"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Docker is ready${NC}"
}

# Function to clean up
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans || true
    echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Function to build images
build_images() {
    echo ""
    echo "🔨 Building Docker images..."
    
    # Build test images
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Images built successfully${NC}"
    else
        echo -e "${RED}❌ Failed to build images${NC}"
        exit 1
    fi
}

# Function to start services
start_services() {
    echo ""
    echo "🚀 Starting test services..."
    
    # Start all services except test-runner
    docker-compose -f "$COMPOSE_FILE" up -d postgres-test redis-test backend-test frontend-test
    
    echo "⏳ Waiting for services to be healthy..."
    
    # Wait for postgres
    echo -n "  PostgreSQL: "
    for i in {1..30}; do
        if docker-compose -f "$COMPOSE_FILE" exec -T postgres-test pg_isready -U cobytes_test_user -d cobytes_test_db &> /dev/null; then
            echo -e "${GREEN}ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Wait for backend
    echo -n "  Backend API: "
    for i in {1..30}; do
        if curl -s http://localhost:3001/api/health > /dev/null; then
            echo -e "${GREEN}ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
    
    # Wait for frontend
    echo -n "  Frontend: "
    for i in {1..30}; do
        if curl -s http://localhost:3002 > /dev/null; then
            echo -e "${GREEN}ready${NC}"
            break
        fi
        echo -n "."
        sleep 2
    done
}

# Function to run tests
run_tests() {
    echo ""
    echo "🧪 Running test suite..."
    echo "======================"
    
    # Run test runner
    docker-compose -f "$COMPOSE_FILE" run --rm test-runner
    
    TEST_EXIT_CODE=$?
    
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed!${NC}"
    else
        echo -e "${YELLOW}⚠️  Some tests failed${NC}"
    fi
    
    return $TEST_EXIT_CODE
}

# Function to collect logs
collect_logs() {
    echo ""
    echo "📋 Collecting logs..."
    
    # Backend logs
    docker-compose -f "$COMPOSE_FILE" logs backend-test > "$LOG_DIR/backend.log" 2>&1
    
    # Frontend logs
    docker-compose -f "$COMPOSE_FILE" logs frontend-test > "$LOG_DIR/frontend.log" 2>&1
    
    # Database logs
    docker-compose -f "$COMPOSE_FILE" logs postgres-test > "$LOG_DIR/postgres.log" 2>&1
    
    echo -e "${GREEN}✓ Logs saved to $LOG_DIR/${NC}"
}

# Function to show test report
show_report() {
    echo ""
    echo "📊 Test Report Summary"
    echo "===================="
    
    if [ -f "$REPORT_DIR/summary.txt" ]; then
        cat "$REPORT_DIR/summary.txt"
    fi
    
    echo ""
    echo "📁 Full reports available in: $REPORT_DIR/"
    echo "📸 Screenshots available in: ./test-screenshots/"
    echo "📝 Logs available in: $LOG_DIR/"
}

# Main execution
main() {
    echo "Starting at: $(date)"
    
    # Set up trap for cleanup
    trap cleanup EXIT
    
    # Check Docker
    check_docker
    
    # Clean up any existing containers
    cleanup
    
    # Build images
    build_images
    
    # Start services
    start_services
    
    # Run tests
    run_tests
    TEST_RESULT=$?
    
    # Collect logs
    collect_logs
    
    # Show report
    show_report
    
    echo ""
    echo "Completed at: $(date)"
    
    # Exit with test result code
    exit $TEST_RESULT
}

# Handle script arguments
case "${1:-}" in
    "quick")
        echo "Running quick tests only..."
        export TEST_SUITE="backend"
        ;;
    "frontend")
        echo "Running frontend tests only..."
        export TEST_SUITE="frontend"
        ;;
    "integration")
        echo "Running integration tests only..."
        export TEST_SUITE="integration"
        ;;
    "e2e")
        echo "Running E2E tests only..."
        export TEST_SUITE="e2e"
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [quick|frontend|integration|e2e|help]"
        echo ""
        echo "Options:"
        echo "  quick       - Run backend unit tests only"
        echo "  frontend    - Run frontend tests only"
        echo "  integration - Run integration tests only"
        echo "  e2e         - Run E2E tests only"
        echo "  help        - Show this help message"
        echo ""
        echo "Without arguments, runs all test suites"
        exit 0
        ;;
esac

# Run main function
main