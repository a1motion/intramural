require(`dotenv`).config();

const express = require(`express`);
const graphqlHTTP = require(`express-graphql`);
const logger = require(`morgan`);
const path = require(`path`);
const redis = new (require(`ioredis`))({
  host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
});

const app = express();
const expressWs = require(`express-ws`)(app);

redis.psubscribe(`intramural:*`);
redis.on(`pmessage`, (_, channel, message) => {
  const [__, type, id] = channel.split(`:`);
  expressWs.getWss().clients.forEach((client) => {
    if (client.subscribed.some((subs) => subs[type] && subs[type] === id)) {
      client.send(
        JSON.stringify({
          event: `${type}:${id}`,
          payload: message,
        })
      );
    }
  });
});
app.set(`trust proxy`, true);
app.set(`x-powered-by`, false);
app.use(express.json());
app.use(logger(`dev`));

require(`./auth`)(app);
require(`./meta`)(app);

app.use(`/g`, require(`./routes/g`));
app.use(`/g`, require(`../hook`));
app.ws(`/ws`, require(`./ws`));

app.use(`/api/me`, require(`./routes/me`));
app.use(`/api/:owner/:repo/env`, require(`./routes/env`));
app.use(`/badge`, require(`./routes/badge`));

app.use(
  `/graphql`,
  graphqlHTTP({
    ...require(`./graphql/schema`),
    graphiql: true,
  })
);
if (process.env.NODE_ENV === `development`) {
  app.use(express.static(path.join(__dirname, `../../build/client`)));
}
app.get(`*`, (req, res) => {
  res.sendFile(path.join(__dirname, `../../build/client/index.html`));
});
app.listen(9005);

if (process.env.NODE_ENV === `development`) {
  const SmeeClient = require(`smee-client`);

  const smee = new SmeeClient({
    source: process.env.WEBHOOK_PROXY_URL,
    target: `http://localhost:9005/g`,
    logger: console,
  });

  smee.start();
}
