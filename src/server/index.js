require(`dotenv`).config()

const express = require(`express`)
const logger = require(`morgan`)

const app = express()

app.use(logger(`dev`))

require(`./auth`)(app)
require(`./meta`)(app)

app.use(`/g`, require(`./routes/g`))
app.use(`/g`, require(`../hook`))

app.use(`/api/me`, require(`./routes/me`))
app.use(`/api/repos`, require(`./routes/repos`))

app.listen(9005)

if (process.env.NODE_ENV === `development`) {
  const SmeeClient = require(`smee-client`)

  const smee = new SmeeClient({
    source: process.env.WEBHOOK_PROXY_URL,
    target: `http://localhost:9005/g`,
    logger: console,
  })

  const events = smee.start()
}
