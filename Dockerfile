FROM node:10

ENV NODE_ENV production

WORKDIR /var/app

COPY package.json yarn.lock *.pem ./
COPY src ./src

RUN NODE_ENV=development yarn --frozen-lockfile

ENTRYPOINT [ "yarn" ]
