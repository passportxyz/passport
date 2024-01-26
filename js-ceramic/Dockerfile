FROM ceramicnetwork/js-ceramic:3.2.0

COPY ceramic/daemon.config.json /ceramic/daemon.config.json

RUN mkdir /ceramic/statestore 

CMD ["--config", "/ceramic/daemon.config.json"]
