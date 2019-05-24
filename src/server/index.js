require(`dotenv`).config()

const express = require(`express`)
const graphqlHTTP = require(`express-graphql`)
const logger = require(`morgan`)
const path = require(`path`)
const app = express()

app.set(`trust proxy`, true)
app.set(`x-powered-by`, false)

app.use(logger(`dev`))

require(`./auth`)(app)
require(`./meta`)(app)

app.use(`/g`, require(`./routes/g`))
app.use(`/g`, require(`../hook`))

app.use(`/api/me`, require(`./routes/me`))
app.use(`/api/repos`, require(`./routes/repos`))
app.use(`/api/builds`, require(`./routes/builds`))
app.use(`/badge`, require(`./routes/badge`))

app.use(
  `/graphql`,
  graphqlHTTP({
    ...require(`./graphql/schema`),
    graphiql: true,
  })
)
if (process.env.NODE_ENV === `development`) {
  app.use(express.static(path.join(__dirname, `../../build/client`)))
}
app.get(`*`, (req, res) => {
  res.sendFile(path.join(__dirname, `../../build/client/index.html`))
})
app.listen(9005)

if (process.env.NODE_ENV === `development`) {
  const SmeeClient = require(`smee-client`)

  const smee = new SmeeClient({
    source: process.env.WEBHOOK_PROXY_URL,
    target: `http://localhost:9005/g`,
    logger: console,
  })

  smee.start()
}
