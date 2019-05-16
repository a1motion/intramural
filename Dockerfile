FROM node:10

ENV NODE_ENV production

WORKDIR /var/app

COPY package.json yarn.lock *.pem ./
COPY build ./build

RUN yarn --frozen-lockfile

ENTRYPOINT [ "yarn" ]
