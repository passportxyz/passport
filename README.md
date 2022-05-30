# dPopp

# Quick Start

Prerequisites: [Node (v16 LTS)](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

1. Install dPopp (this will install all packages within the dPopp monorepo):

```sh
git clone https://github.com/gitcoinco/dPopp.git
cd dPopp
npm install --global lerna
lerna init
lerna bootstrap
```

2. Create environment files, and replace environment variables with your own values

```sh
cp ./app/.env-example.env ./app/.env
cp ./iam/.env-example.env ./iam/.env
cp ./schemas/.env-example.env ./schemas/.env
```

3. Start iam, app, and ceramic services concurrently:

```sh
# remember to create .env files first
yarn start
```

## Background Knowledge

- Know what a wallet is, how to create one, etc.
- Know what a Verifiable Credential is
- Know basics of Ceramic Network - interacting with DIDDatastore, Self.ID

# Packages

## app

The web app allowing users to interact with their dPopp. [README](app/README.md)

## database-client

Contains database connection implementations. Currently supports Ceramic Network. [README](database-client/README.md)

## iam

The server handling incoming requests to issue credentials and process verifications. [README](iam/README.md)

## identity

This is a helper package to compile Spruce DIDKit and export functions for use in `iam` and `app` packages.

## infra

Holds the Pulumi deployment configuration for this repository. [README](infra/README.md)

## schemas

Ceramic schemas and model definitions, and scripts for creating and publishing these to the Ceramic Network. [README](schemas/README.md)

## types

Shared type definitions. [README](types/README.md)
