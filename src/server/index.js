require(`dotenv`).config();

const express = require(`express`);
const aws = require(`aws-sdk`);
const graphqlHTTP = require(`express-graphql`);
const logger = require(`morgan`);
const path = require(`path`);
const getPendingJobs = require(`../worker/utils/getPendingJobs`);

const redis = new (require(`ioredis`))({
  host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
});

const s3 = new aws.S3({
  region: `us-east-1`,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

const app = express();
const expressWs = require(`express-ws`)(app);

redis.psubscribe(`intramural:*`);
redis.on(`pmessage`, (_, channel, message) => {
  const [, type, id] = channel.split(`:`);
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

app.get(`/meta`, async (req, res) => {
  const { pendingBuilds, pendingJobs } = await getPendingJobs();
  res.send(`Builds: ${pendingBuilds}\nJobs: ${pendingJobs}`);
});
let CACHE = {};
const getPage = async () => {
  return new Promise((resolve) => {
    s3.getObject(
      {
        Bucket: `public.a1motion.com`,
        Key: `mural/index.html`,
      },
      (err, data) => {
        const { Body } = data;
        resolve(Body.toString());
      }
    );
  });
};

app.get(`*`, async (req, res) => {
  if (!req.user) {
    return res.redirect(`/g?r=${encodeURIComponent(req.url)}`);
  }

  if (!(CACHE.expires && CACHE.expires > Date.now())) {
    const data = await getPage();
    CACHE = {
      expires: Date.now() + 1000 * 60 * 5,
      data,
    };
  }

  return res.type(`html`).send(CACHE.data);
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
