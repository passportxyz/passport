#!/usr/bin/env bash

npm i
npm link
cd ~/workspace/artillery/
npm link artillery-engine-ceramic
DEBUG=engine:ceramic* node ~/workspace/artillery/bin/run run ~/workspace/gitcoin/passport/database-client/ceramic-loadtest/basic-staging-test.yml
