# dPopp

# Quick Start

Prerequisites: [Node (v16 LTS)](https://nodejs.org/en/download/) plus [Yarn](https://classic.yarnpkg.com/en/docs/install/) and [Git](https://git-scm.com/downloads)

> clone/fork DPOPP:

```bash
git clone https://github.com/gitcoinco/dPopp.git
npm install --global lerna
lerna bootstrap
```

> start your 📱 frontend:

```bash
cd app
yarn start
```

## app

This will be the web app allowing users to interact with their dpopp

## schema

This will manage creation and publishing of the Ceramic schemas and data models.

## iam

This will be the server handling incoming requests to process verifications
