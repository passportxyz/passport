FROM grafana/k6:latest

# Copy test scripts
COPY test_scripts/ /app/test_scripts/
WORKDIR /app

# Create entrypoint script
RUN cat > /app/entrypoint.sh << 'EOF'
#!/bin/bash
set -e

echo "Running embed service load test..."

# Set default values if not provided
export EMBED_URL=${EMBED_URL:-"https://embed.staging.passport.gitcoin.co"}
export SCORER_ID=${SCORER_ID:-"24"}
export NUM_ACCOUNTS=${NUM_ACCOUNTS:-"100"}

# Run k6 test
k6 run \
    --vus ${VUS:-10} \
    --duration ${DURATION:-"30s"} \
    test_scripts/embed_script.js
EOF

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
