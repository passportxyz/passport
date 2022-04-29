FROM node:16

WORKDIR /usr/src/iam

COPY . .

RUN yarn global add lerna
RUN lerna bootstrap --ignore app

EXPOSE 80 443

CMD [ "yarn", "run", "prod:start:iam" ]
