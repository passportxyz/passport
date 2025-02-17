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
