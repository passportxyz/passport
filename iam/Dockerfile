FROM node:22.14.0
WORKDIR /usr/src

COPY . .

RUN yarn

EXPOSE 80 443
CMD [ "node", "iam/dist/iam/src/main.js" ]
