# Embed Service Load Testing

This directory contains comprehensive load testing tools for the Gitcoin Passport Embed Service using k6.

## Overview

The load testing suite includes:
- **k6 test scripts** for testing embed service endpoints
- **Test data generation** for accounts and verifiable credentials
- **Authentication token generation** for test accounts
- **Docker support** for containerized testing
- **Shell scripts** for easy execution

## Quick Start

### Prerequisites

1. **Install k6**:
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Get a Scorer API Key**:
   - Go to the [Gitcoin Scorer dashboard](https://scorer.gitcoin.co/)
   - Create a new scorer
   - Copy the API key

3. **Set Environment Variables**:
   ```bash
   export SCORER_API_KEY="your_api_key_here"
   export EMBED_URL="https://embed.staging.passport.gitcoin.co"  # or production URL
   export SCORER_ID="24"  # your scorer ID
   ```

### Running Tests

#### Method 1: Using the Shell Script (Recommended)

```bash
# Navigate to the load_tests directory
cd embed/load_tests

# Run with default settings (10 users, 30 seconds)
./run_embed_load_test.sh

# Run with custom settings
VUS=50 DURATION=2m ./run_embed_load_test.sh
```

#### Method 2: Direct k6 Command

```bash
k6 run \
  -e EMBED_URL="https://embed.staging.passport.gitcoin.co" \
  -e SCORER_ID="24" \
  -e SCORER_API_KEY="your_api_key_here" \
  --vus 10 \
  --duration 30s \
  test_scripts/embed_script.js
```

#### Method 3: Using Docker

```bash
# Build the Docker image
docker build -t embed-load-test .

# Run the container
docker run -e SCORER_API_KEY="your_api_key_here" embed-load-test

# Run with custom settings
docker run \
  -e SCORER_API_KEY="your_api_key_here" \
  -e VUS=50 \
  -e DURATION=2m \
  embed-load-test
```

## Test Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMBED_URL` | Embed service URL | `https://embed.staging.passport.gitcoin.co` |
| `SCORER_ID` | Scorer ID for testing | `24` |
| `SCORER_API_KEY` | API key for authentication | Required |
| `NUM_ACCOUNTS` | Number of test accounts | `100` |
| `VUS` | Virtual users (concurrent) | `10` |
| `DURATION` | Test duration | `30s` |

### Test Parameters

You can customize the load test by modifying these parameters:

```bash
# Light load test
VUS=5 DURATION=30s ./run_embed_load_test.sh

# Medium load test
VUS=50 DURATION=2m ./run_embed_load_test.sh

# Heavy load test
VUS=200 DURATION=5m ./run_embed_load_test.sh

# Stress test
VUS=500 DURATION=10m ./run_embed_load_test.sh
```

## Test Endpoints

The load test covers these embed service endpoints:

1. **Health Check** (`GET /health`)
   - Basic availability test
   - No authentication required

2. **Stamps Metadata** (`GET /embed/stamps/metadata`)
   - Retrieves stamp metadata for a scorer
   - Tests static content serving

3. **Challenge Generation** (`POST /embed/challenge`)
   - Generates authentication challenges
   - Tests challenge creation flow

4. **Auto-Verification** (`POST /embed/auto-verify`)
   - Automatic stamp verification
   - Tests credential verification logic

5. **Manual Verification** (`POST /embed/verify`)
   - Manual stamp verification with proofs
   - Tests full verification workflow

6. **Score Retrieval** (`GET /embed/score/:scorerId/:address`)
   - Gets passport scores
   - Tests scoring system performance

## Test Data Generation

### Accounts and VCs

The test suite generates:
- **Test Ethereum accounts** with addresses and private keys
- **Mock verifiable credentials** for various providers
- **Authentication tokens** for test accounts

### Generating Test Data

```bash
# Generate test accounts
cd test_data
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 generate_test_accounts.py

# Generate VCs
python3 generate_test_vcs.py

# Generate auth tokens
cd ../generate_test_auth_tokens
npm install
node generate_tokens.js
```

## Understanding Results

### Key Metrics

k6 provides several important metrics:

- **Response Time**: How long requests take
- **Throughput**: Requests per second
- **Error Rate**: Percentage of failed requests
- **Virtual Users**: Number of concurrent users

### Sample Output

```
     ✓ Health check status 200
     ✓ Metadata request status 200
     ✓ Challenge request status 200
     ✓ Auto-verify request status 200
     ✓ Verify request status 200
     ✓ Score request status 200

     checks.........................: 100.00% ✓ 60      ✗ 0
     data_received..................: 1.2 MB  40 kB/s
     data_sent......................: 156 kB  5.2 kB/s
     http_req_duration..............: avg=245ms min=89ms med=234ms max=1.2s p(95)=456ms
     http_req_failed................: 0.00%   ✓ 0       ✗ 60
     http_reqs......................: 60      2.0/s
     iteration_duration.............: avg=1.2s min=456ms med=1.1s max=2.1s p(95)=1.8s
     iterations.....................: 10      0.33/s
     vus............................: 1       min=1     max=10
     vus_max........................: 10      min=10    max=10
```

### Performance Thresholds

Consider these performance targets:

- **Response Time**: < 500ms for 95% of requests
- **Error Rate**: < 1%
- **Throughput**: > 100 requests/second
- **Availability**: > 99.9%

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Verify `SCORER_API_KEY` is correct
   - Check that the scorer ID exists
   - Ensure API key has proper permissions

2. **Connection Errors**:
   - Verify `EMBED_URL` is accessible
   - Check network connectivity
   - Ensure the embed service is running

3. **Test Data Issues**:
   - Regenerate test data if corrupted
   - Check file permissions
   - Verify Python/Node.js dependencies

### Debug Mode

Run with verbose output:

```bash
k6 run --verbose test_scripts/embed_script.js
```

## CI/CD Integration

### GitHub Actions

Add to your workflow:

```yaml
- name: Run Load Tests
  run: |
    cd embed/load_tests
    export SCORER_API_KEY=${{ secrets.SCORER_API_KEY }}
    ./run_embed_load_test.sh
```

### Performance Regression Testing

Set up automated performance testing:

```bash
# Run baseline test
k6 run --out json=baseline.json test_scripts/embed_script.js

# Compare with current performance
k6 run --out json=current.json test_scripts/embed_script.js
```

## Contributing

When adding new tests:

1. Follow the existing patterns in `test_scripts/embed_script.js`
2. Add appropriate checks and assertions
3. Update this README with new endpoints or features
4. Test with different load scenarios
5. Document any new environment variables

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [Gitcoin Passport Documentation](https://docs.passport.xyz/)
- [Scorer API Documentation](https://docs.scorer.gitcoin.co/)
