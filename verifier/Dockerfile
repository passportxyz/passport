
FROM node:18

RUN mkdir /app
ADD src app/src
ADD yarn.lock app/
ADD package.json app/

WORKDIR /app
RUN yarn install --frozen-lockfile

CMD ["node", "src/index.js"]
