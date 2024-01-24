# Use an appropriate base image
FROM node:latest

# Create a working directory
WORKDIR /app

# Copy package.json and yarn.lock to the working directory
COPY package.json ./

# Install dependencies using Yarn
RUN yarn install

# Create a directory for Ceramic and set up the configuration
RUN mkdir -p $HOME/.ceramic
RUN echo '{"anchor":{},"http-api":{"cors-allowed-origins":[".*"],"admin-dids":["did:key:z6MknU3gBqubYTbXbHnHzpJurGyrssbpLdS7Mbz1uHdGdzdo","did:key:z6Mki9zj9fFYxBbQcaC6EJvST8XHv7i4iXsP281gJV5nM5Hy#z6Mki9zj9fFYxBbQcaC6EJvST8XHv7i4iXsP281gJV5nM5Hy"]},"ipfs":{"mode":"bundled","disable-peer-data-sync":false},"logger":{"log-level":2,"log-to-files":false},"metrics":{"metrics-exporter-enabled":false},"network":{"name":"inmemory"},"node":{},"state-store":{"mode":"fs","local-directory":"/app/.ceramic/statestore/"},"indexing":{"db":"sqlite:///app/.ceramic/indexing.sqlite","allow-queries-before-historical-sync":true,"disable-composedb":false,"enable-historical-sync":false}}' > $HOME/.ceramic/daemon.config.json

# Expose the port that Ceramic uses
EXPOSE 7007

# Set environment variable
ENV CERAMIC_ENABLE_EXPERIMENTAL_COMPOSE_DB=true

# Run the Ceramic daemon
CMD ["yarn", "ceramic"]
