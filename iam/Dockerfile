FROM node:16
WORKDIR /usr/src

COPY . .

RUN yarn global add lerna@6.6.2
RUN lerna bootstrap --ignore app

EXPOSE 80 443
CMD [ "node", "iam/dist/iam/src/main.js" ]
