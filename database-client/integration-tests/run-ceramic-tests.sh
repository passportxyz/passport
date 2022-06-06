#!/usr/bin/env bash

# === preliminary installs ===
yarn global add lerna
cd dpopp
lerna bootstrap -- --ignore-scripts # skipping pre/postinstall scripts
yarn build:database-client

export CERAMIC_CLIENT_URL="https://ceramic-clay.3boxlabs.com"

# === start up ceramic in background ===
until $(curl --output /dev/null --silent --head --fail $CERAMIC_CLIENT_URL/api/v0/node/healthcheck); do
    printf '... waiting for Ceramic daemon ...'
    sleep 5
done

# === fetch passport and VC definitions ===
curl $CERAMIC_CLIENT_URL/api/v0/streams/kjzl6cwe1jw145znqlxwwar1crvgsm3wf56vcnxo6bu87fqsi6519eypjnzs7mu
curl $CERAMIC_CLIENT_URL/api/v0/streams/kjzl6cwe1jw149zuvayqa89nhmlvwm0pkdkj0awlxhmtbbay6i972xuwy14jg4f

# === run ceramic integration tests ===
yarn test:ceramic-integration