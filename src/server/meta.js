const cors = require(`cors`)

module.exports = (app) => {
  const corsOptions = {
    origin: true,
    methods: `GET,HEAD,PUT,PATCH,POST,DELETE`,
    credentials: true,
    maxAge: 600,
  }
  app.options(`*`, cors(corsOptions))
  app.use(cors(corsOptions))
}
