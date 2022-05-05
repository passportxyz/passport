#!/usr/bin/env bash

# === preliminary installs ===
yarn global add lerna
cd dpopp
lerna bootstrap # TODO - figure out how to speed this up if run in docker

# === start up ceramic in background ===
# TODO - how to kill this ceramic process at the end?
echo "Starting up Ceramic..."
(yarn workspace @dpopp/schemas ceramic &) | grep --max-count=1 "Ceramic API running on"

# TODO alternatively figure out how to save the PID and kill at the end
# CERAMIC_PID = $(ceramic daemon)
# echo $CERAMIC_PID

# TODO - not needed once we publish + persist our schemas to ceramic testnet
# === create & publish model to ceramic ===
export SEED="06be7d9853096fca06d6da9268a8a66ecaab2a7249ccd63c70fead97aafefa02" # TEST SEED, DO NOT USE IN PROD
yarn workspace @dpopp/schemas create-model
yarn workspace @dpopp/schemas publish-model

# === run ceramic integration tests ===
yarn test:ceramic-integration