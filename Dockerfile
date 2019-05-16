FROM node:10

ENV NODE_ENV production

WORKDIR /var/app

COPY build/ package.json yarn.lock *.pem ./

RUN yarn --frozen-lockfile

ENTRYPOINT [ "yarn" ]