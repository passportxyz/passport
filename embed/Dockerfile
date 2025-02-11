FROM node:22.14.0
WORKDIR /usr/src

COPY . .

RUN yarn && cd embed && yarn build

EXPOSE 80 443
CMD [ "node", "embed/dist/src/main.js" ]
