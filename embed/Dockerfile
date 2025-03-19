FROM node:22.14.0 AS build
WORKDIR /app

COPY . .

RUN yarn --mode=production --frozen-lockfile install --ignore-scripts \
&& yarn build:platforms \
&& yarn build:identity \
&& yarn build:embed


FROM node:22.14.0
WORKDIR /app

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/embed ./embed
COPY --from=build /app/identity ./node_modules/@gitcoin/passport-identity
COPY --from=build /app/platforms ./node_modules/@gitcoin/passport-platforms

ENV HUMAN_NETWORK_WASM_PATH=/app/node_modules/@holonym-foundation/mishtiwasm/pkg/esm/mishtiwasm_bg.wasm

EXPOSE 80 443
CMD [ "node", "embed/dist/main.js" ]
