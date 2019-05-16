const app = require(`express`).Router()
const crypto = require(`crypto`)
const got = require(`got`)

const getAccessTokenFromCode = async (code, state) => {
  const { body } = await got.post(
    `https://github.com/login/oauth/access_token`,
    {
      json: true,
      body: {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        state,
      },
    }
  )
  if (body.error) {
    throw new Error(body.error_description)
  }

  return body.access_token
}

const getUser = async (accessToken) => {
  const { body } = await got.get(`https://api.github.com/user`, {
    json: true,
    headers: {
      Authorization: `token ${accessToken}`,
    },
  })
  return {
    name: body.name || body.login,
    email: body.email,
    image: body.avatar_url,
    id: body.id,
  }
}

app.get(`/`, async (req, res) => {
  if (req.query.error) {
    return res
      .status(400)
      .send(`${req.query.error}\n${req.query.error_description}`)
  }
  if (!req.query.code || !req.query.state) {
    const state = crypto.randomBytes(12).toString(`hex`)
    req.session.STATE = state
    return req.session.save(() => {
      return res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${
          process.env.GITHUB_CLIENT_ID
        }&state=${state}`
      )
    })
  }
  if (req.query.state !== req.session.STATE) {
    return res.status(400).send(`State mismatch between requests.`)
  }
  let ACCESS_TOKEN
  try {
    ACCESS_TOKEN = await getAccessTokenFromCode(
      req.query.code,
      req.session.STATE
    )
  } catch (e) {
    res.status(400).send(e.message)
  }
  req.session.ACCESS_TOKEN = ACCESS_TOKEN
  const USER = await getUser(ACCESS_TOKEN)
  req.session.USER = USER
  return res.redirect(`/`)
})

module.exports = app
