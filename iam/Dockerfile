FROM node:16
WORKDIR /usr/src

COPY . .

RUN yarn global add lerna
RUN lerna bootstrap --ignore app

EXPOSE 80 443
CMD [ "node", "iam/dist/src/main.js" ]
