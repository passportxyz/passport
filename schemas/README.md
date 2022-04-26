# Glaze demo app

Example Web app using [Glaze libraries](https://developers.ceramic.network/tools/glaze/overview/).

## Setup

1. Install dependencies using `yarn install`
1. Start a local Ceramic node using `yarn ceramic`
1. Publish the model to your Ceramic node with `yarn publish-model`

## Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `yarn build`

Builds the app for production to the `build` folder.

### `yarn create-model`

Runs the `create-model.mjs` script.
This is only needed to make changes to the model used by the app.
A hex-encoded 32-byte `SEED` environment variable must be present to create a key DID for the model when running the script.

## License

Apache-2.0 OR MIT
