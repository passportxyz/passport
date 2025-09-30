FROM grafana/k6:latest

# Copy test assets needed by k6 open() calls
COPY test_scripts/ /app/test_scripts/
COPY test_data/ /app/test_data/
COPY generate_test_auth_tokens/ /app/generate_test_auth_tokens/

# Create entrypoint script with sufficient permissions
USER root
RUN mkdir -p /app && chown -R 1000:1000 /app
RUN install -m 0755 /dev/stdin /usr/local/bin/entrypoint.sh << 'EOF'
#!/bin/sh
set -e

echo "Running embed service load test..."

# Require EMBED_URL to be provided at runtime (no default)
if [ -z "$EMBED_URL" ]; then
  echo "EMBED_URL is required (no default). Pass -e EMBED_URL=... to docker run." >&2
  exit 1
fi
export SCORER_ID=${SCORER_ID:-"24"}
export NUM_ACCOUNTS=${NUM_ACCOUNTS:-"100"}

# Run k6 test
k6 run \
    -e EMBED_URL=$EMBED_URL \
    -e SCORER_ID=${SCORER_ID:-"24"} \
    -e NUM_ACCOUNTS=${NUM_ACCOUNTS:-"100"} \
    ${X_API_KEY:+-e X_API_KEY=$X_API_KEY} \
    ${SCORER_API_KEY:+-e SCORER_API_KEY=$SCORER_API_KEY} \
    --vus ${VUS:-10} \
    --duration ${DURATION:-"30s"} \
    /app/test_scripts/embed_script.js
EOF
USER 1000
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
