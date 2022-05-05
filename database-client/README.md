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

Still work-in-progress. IMPORTANT this will overwrite your `schemas/scripts/create-model.json` and `schemas/scripts/publish-model.json` files! Make a backup of these files!

```bash
docker-compose up -d
```
