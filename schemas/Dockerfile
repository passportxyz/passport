# Use an appropriate base image. You might need to adjust this depending on your needs.
FROM node:latest

# Create a directory for Ceramic
RUN mkdir -p $HOME/.ceramic

RUN echo '{"anchor":{},"http-api":{"cors-allowed-origins":[".*"],"admin-dids":["did:key:z6MknU3gBqubYTbXbHnHzpJurGyrssbpLdS7Mbz1uHdGdzdo","did:key:z6Mki9zj9fFYxBbQcaC6EJvST8XHv7i4iXsP281gJV5nM5Hy#z6Mki9zj9fFYxBbQcaC6EJvST8XHv7i4iXsP281gJV5nM5Hy"]},"ipfs":{"mode":"bundled","disable-peer-data-sync":false},"logger":{"log-level":2,"log-to-files":false},"metrics":{"metrics-exporter-enabled":false},"network":{"name":"inmemory"},"node":{},"state-store":{"mode":"fs","local-directory":"/Users/timschultz/repos/compose-db/ceramic-app/ceramic-app-app/.ceramic/.ceramic/statestore/"},"indexing":{"db":"sqlite:///Users/timschultz/repos/compose-db/ceramic-app/ceramic-app-app/.ceramic/indexing.sqlite","allow-queries-before-historical-sync":true,"disable-composedb":false,"enable-historical-sync":false}}' > $HOME/.ceramic/daemon.config.json

# Expose the port that Ceramic uses
EXPOSE 7007

CMD ["ceramicnetwork/js-ceramic:3.2.0"]