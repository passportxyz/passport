# Gitcoin Passport

## What is Passport?

Many social organizations, online particularly, have difficulty ensuring that every participant is a unique human and does not have multiple participating accounts. Most existing digital identity solutions are either centralized (e.g., national identity cards) or individualistic (e.g., most “self-sovereign” identity models). However, identity is naturally [intersectional and social](https://www.radicalxchange.org/concepts/intersectional-social-identity/); everybody shares different data and relationships with a unique set of others. The Gitcoin Passport aims to provide a more collaborative and secure infrastructure for digital identity by capturing the richness of our diversely shared lives.

The Gitcoin Passport is an identity verification application. We have written software enabling people to grow personal collections of [verifiable credentials](https://decentralized-id.com/web-standards/w3c/wg/vc/verifiable-credentials/) about themselves and organizations to assess their identities to coordinate rights and responsibilities. The institutions define, verify, and utilize identity as functions of the networked records of the individuals. While we build the Passport agnostic to specific applications, we are actively exploring its benefits for [personhood proofs](https://en.wikipedia.org/wiki/Proof_of_personhood) and [plurality](https://www.radicalxchange.org/media/blog/why-i-am-a-pluralist/) in organizational designs.

## Documentation

Check out our documentation at https://docs.passport.gitcoin.co

## Contributing to Passport

We welcome everyone to contribute to the Passport project.

You can join our [Discord](https://discord.gg/gitcoin) and specifically the [passport-builders](https://discord.com/channels/562828676480237578/986222591096279040) channel (just be sure to select the builder role when you join the discord) to get help and discuss the project with the rest of the community.

You can also familiarize yourself with our near term project roadmap in the passport [project backlog](https://github.com/orgs/gitcoinco/projects/6/views/3)

## Reviewing Changes

Once a pull request is sent, the Passport team will review your changes. We outline our process below to clarify the roles of everyone involved.

All pull requests must be approved by two committers before being merged into the repository. If any changes are necessary, the team will leave appropriate comments requesting changes to the code. Unfortunately, we cannot guarantee a pull request will be merged, even when modifications are requested, as the Passport team will re-evaluate the contribution as it changes.

Committers may also push style changes directly to your branch. If you would rather manage all changes yourself, you can disable the "Allow edits from maintainers" feature when submitting your pull request.

The Passport team may optionally assign someone to review a pull request. If someone is assigned, they must explicitly approve the code before another team member can merge it.

When the review finishes, your pull request will be squashed and merged into the repository. If you have carefully organized your commits and believe they should be merged without squashing, please mention it in a comment.

## Bug Bounty

If you think you've found a security vulnerability, we maintain an open bounty on Gitcoin to help reward community members who report these issues. Check it out here: https://github.com/gitcoinco/passport/issues/133

## Quick Start

Prerequisites: [Node (v16 LTS)](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

1. Install Gitcoin Passport (this will install all packages within the passport monorepo):

```sh
git clone https://github.com/gitcoinco/passport.git
cd passport
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

4. Run the [Passport Scorer API](https://github.com/gitcoinco/passport-scorer/tree/main/api) locally. Set up instructions are [here](https://github.com/gitcoinco/passport-scorer/blob/main/SETUP.md) 

## Passport Data

A passport has two sources of data. The primary source is a postgres database that is hosted by gitcoin. To run the passport application locally you will need spin up the [Scorer API](https://github.com/gitcoinco/passport-scorer/tree/main/api). All relevant instructions to run the scorer api can be found [here](https://github.com/gitcoinco/passport-scorer/blob/main/SETUP.md). The sample environment variables in the .env-example.env files are configured to make requests to the scorer api running locally. Once the scorer api is running locally, you should have a reliable data source for development.

The second source of data is the ceramic network. No steps are needed to run the ceramic network locally. The sample environment variables in the .env-example.env files are configured to make requests to a test version of the ceramic network.

## Background Knowledge

- Know what a wallet is, how to create one, etc.
- Know what a Verifiable Credential is
- Know basics of Ceramic Network - interacting with DIDDatastore, Self.ID

# Packages

## app

The web app allowing users to interact with their Gitcoin Passport. [README](app/README.md)

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
