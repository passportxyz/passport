# Gitcoin Passport Ceramic Ceramic Compose DB Setup

## Setup

- `yarn install`
- ~~`yarn start:ceramic` to start local ceramic node~~
- run a ceramic node with preconfigured admin did: `docker run -p 7007:7007 gitcoinpassport/js-ceramic:3.2.0`

## GraphQL

Run the following commands to compile and deploy the schemas:

- `yarn models:create-composite`
- `yarn models:deploy-composite`
- `yarn models:compile-composite`

## To run a graphql test server:

Run `yarn graphql-server`

## Run ceramic locally

`npx ceramic daemon`

### ceramic config file

Replace `<USER>` with your username and put the content below in the file: `~/.ceramic/daemon.config.json`.
The `admin-dids` values are only for testing.

```json
{
  "anchor": {
    "auth-method": "did"
  },
  "http-api": {
    "cors-allowed-origins": [".*"],
    "admin-dids": ["did:key:z6MkgUzNYV8J1yw43wj9K2CbhTZoN25uZ6TJ3Gi4cYVpZyDb"]
  },
  "ipfs": {
    "mode": "bundled",
    "disable-peer-data-sync": false
  },
  "logger": {
    "log-level": 2,
    "log-to-files": false
  },
  "metrics": {
    "metrics-exporter-enabled": false
  },
  "network": {
    "name": "testnet-clay"
  },
  "node": {
    "privateSeedUrl": "inplace:ed25519#cce8e5b3270923e37d7be8a16bc3d1e9c331a2ab491ee425af2bc7711b2e3b49"
  },
  "state-store": {
    "mode": "fs",
    "local-directory": "/Users/<USER>/.ceramic/statestore/"
  },
  "indexing": {
    "db": "sqlite:///Users/<USER>/.ceramic/indexing.sqlite",
    "allow-queries-before-historical-sync": true,
    "disable-composedb": false,
    "enable-historical-sync": false
  }
}
```
