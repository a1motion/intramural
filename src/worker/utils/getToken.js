const jwt = require(`jsonwebtoken`)

module.exports = () =>
  jwt.sign({}, Buffer.from(process.env.PRIVATE_KEY, `base64`).toString(), {
    issuer: process.env.APP_ID,
    expiresIn: `10m`,
    algorithm: `RS256`,
  })
