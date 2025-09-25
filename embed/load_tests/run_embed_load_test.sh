#!/bin/bash
set -e

# Embed Service Load Test Runner
# This script runs load tests against the embed service using k6

# Default configuration
EMBED_URL=${EMBED_URL:-"https://embed.staging.passport.gitcoin.co"}
SCORER_ID=${SCORER_ID:-"24"}
NUM_ACCOUNTS=${NUM_ACCOUNTS:-"100"}
VUS=${VUS:-"10"}
DURATION=${DURATION:-"30s"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if k6 is installed
check_k6() {
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed. Please install k6 first:"
        echo "  - macOS: brew install k6"
        echo "  - Linux: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
}

# Check required environment variables
check_env() {
    if [ -z "$SCORER_API_KEY" ]; then
        print_error "SCORER_API_KEY environment variable is required"
        exit 1
    fi
}

# Run the load test
run_load_test() {
    print_status "Starting embed service load test..."
    print_status "Configuration:"
    echo "  - Embed URL: $EMBED_URL"
    echo "  - Scorer ID: $SCORER_ID"
    echo "  - Virtual Users: $VUS"
    echo "  - Duration: $DURATION"
    echo ""
    
    k6 run \
        -e EMBED_URL="$EMBED_URL" \
        -e SCORER_ID="$SCORER_ID" \
        -e NUM_ACCOUNTS="$NUM_ACCOUNTS" \
        -e SCORER_API_KEY="$SCORER_API_KEY" \
        --vus "$VUS" \
        --duration "$DURATION" \
        test_scripts/embed_script.js
    
    if [ $? -eq 0 ]; then
        print_success "Load test completed successfully!"
    else
        print_error "Load test failed!"
        exit 1
    fi
}

# Main execution
print_status "Embed Service Load Test Runner"
echo ""

check_k6
check_env
run_load_test
