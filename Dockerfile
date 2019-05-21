FROM node:10

RUN apt-get update
RUN apt-get install -y -q --no-install-recommends \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | apt-key add -
RUN add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/debian \
   $(lsb_release -cs) \
   stable"
RUN apt-get update
RUN apt-get install -q -y docker-ce-cli

ENV NODE_ENV production

WORKDIR /var/app

COPY package.json yarn.lock *.pem ./
COPY build ./build

RUN yarn --frozen-lockfile

ENTRYPOINT [ "yarn" ]
