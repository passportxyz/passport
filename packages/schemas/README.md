# Gitcoin Passport Ceramic Schemas

## Setup

1. Install dependencies using `yarn install`
1. Start a local Ceramic node using `yarn ceramic`
1. Publish the model to your Ceramic node with `yarn publish-model`

## Scripts

In the project directory, you can run:

### `yarn create-model`

Runs the `create-model.mjs` script.
This is only needed to make changes to the model used by the app.
A hex-encoded 32-byte `SEED` environment variable must be present to create a key DID for the model when running the script.

Set the `CERAMIC_CLIENT_URL` environment variable to change the Ceramic node to run against - the scripts will default to `http://localhost:7007` if not provided.

### `yarn publish-model`

Runs the `publish-model.mjs` script to publish the models to Ceramic.

## License

Apache-2.0 OR MIT
