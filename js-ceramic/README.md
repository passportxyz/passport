# Instructions for building & running docker image

- build docker image: `docker build . --tag gitcoinpassport/js-ceramic:<version>`
- push docker image: `docker push gitcoinpassport/js-ceramic:<version>`
- running `ceramicnetwork/js-ceramic` directly on local with: `docker run --rm -v $(pwd)/ceramic:/ceramic ceramicnetwork/js-ceramic:3.2.0 --config /ceramic/daemon.config.json`
