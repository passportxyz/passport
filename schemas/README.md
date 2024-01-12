# Gitcoin Passport Ceramic Ceramic Compose DB Setup

## Setup

- `yarn install`
- `yarn start:ceramic` to start local ceramic node

## GraphQL

- Run the following commands to compile and deploy the schemas. I was unable to run them via yarn and had to run them from the command line. Will need ti fix passing the arguments via yarn.

  ````bash
  TODO: Fix

  ```bash
  "models:create-composite": "composedb composite:create models/passportStamps.graphql --output=composites/gitcoin-passport-stamps-composite.json --did-private-key=${PRIVAKE_KEY}",
    "models:deploy-composite": "composedb composite:deploy composites/gitcoin-passport-stamps-composite.json --ceramic-url=${CERAMIC_URL} --did-private-key=${PRIVAKE_KEY}",
    "models:compile-composite": "composedb composite:compile composites/gitcoin-passport-stamps-composite.json definitions/gitcoin-passport-stamps.ts --ceramic-url=${CERAMIC_URL}"
  ````

- Open `schemas/definitions/gitcoin-passport-stamps.ts` and copy the `definition` object into `schemas/composites/gitcoin-passport-stamps-composite.json`
- run `yarn composedb graphql:server --ceramic-url=${CERAMIC_URL} --graphiql composites/gitcoin-passport-stamps-composite.json --did-private-key=${PRIVAKE_KEY} --port=5005`
