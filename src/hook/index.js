const { createProbot } = require(`probot`)
const { findPrivateKey } = require(`probot/lib/private-key`)
const app = require(`./app`) // This will be the exported function

const probot = createProbot({
  id: process.env.APP_ID,
  port: process.env.PORT || 3000,
  secret: process.env.WEBHOOK_SECRET,
  cert: findPrivateKey(),
  webhookProxy: process.env.WEBHOOK_PROXY_URL || undefined,
})

probot.load(app)

module.exports = probot.server
