# database-client

## Running the Ceramic integration tests locally

> Start up the Ceramic daemon in another thread

```bash
yarn run ceramic
```

> Run the integration tests

```bash
yarn run test:integration
```

## Running the Ceramic integration tests in Docker

IMPORTANT this will overwrite your `schemas/scripts/create-model.json` and `schemas/scripts/publish-model.json` files! Make a backup of these files!

```bash
docker-compose up -d
```

Tests are flaky the first time, possibly due to connection issues with the Ceramic node. If tests fail due to an error like `request to http://localhost:7007/api/v0/streams failed, reason: connect ECONNREFUSED 127.0.0.1:7007`, try running `docker-compose up -d` again to re-run the tests.
