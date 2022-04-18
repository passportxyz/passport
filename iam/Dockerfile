FROM node:16

WORKDIR /usr/src/iam

COPY . .

RUN yarn global add lerna
RUN lerna bootstrap --ignore app

EXPOSE 65535

CMD [ "yarn", "run", "start:iam" ]
