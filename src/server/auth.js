const cookieParser = require(`cookie-parser`);
const nanoid = require(`nanoid`);
const session = require(`express-session`);
const RedisStore = require(`connect-redis`)(session);
const Redis = require(`ioredis`);

module.exports = (app) => {
  app.use(cookieParser(process.env.COOKIE_SECRET));
  const redisStore = new RedisStore({
    client: new Redis({
      host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
    }),
  });
  app.use(
    session({
      secret: process.env.COOKIE_SECRET,
      store: redisStore,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV !== `development`,
        maxAge: 1000 * 60 * 60 * 24 * 3,
        signed: true,
      },
      name: `session`,
      resave: false,
      rolling: true,
      genid(req) {
        if (req.session && req.session.uid) {
          return `${req.session.uid}:${nanoid(8)}`;
        }
        return nanoid(24);
      },
    })
  );
};
