FROM node:10

ENV NODE_ENV production

WORKDIR /var/app

COPY package.json yarn.lock *.pem ./

RUN yarn --frozen-lockfile

RUN yarn build

ENTRYPOINT [ "yarn" ]