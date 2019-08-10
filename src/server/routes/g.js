const app = require(`express`).Router();
const crypto = require(`crypto`);
const got = require(`got`);

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
  );
  if (body.error) {
    throw new Error(body.error_description);
  }

  return body.access_token;
};

const getUser = async (accessToken) => {
  const data = await got.post(`https://api.github.com/graphql`, {
    responseType: `json`,
    headers: {
      Authorization: `token ${accessToken}`,
    },
    body: JSON.stringify({
      query: `{
          viewer {
            avatarUrl
            email
            id
            login
            name
          }
        }`,
    }),
  });
  let { body } = data;
  body = JSON.parse(body);
  const {
    data: { viewer },
  } = body;
  return {
    name: viewer.name || viewer.login,
    email: viewer.email,
    image: viewer.avatarUrl,
    id: viewer.id,
  };
};

app.get(`/`, async (req, res) => {
  if (req.query.error) {
    return res
      .status(400)
      .send(`${req.query.error}\n${req.query.error_description}`);
  }

  if (!req.query.code || !req.query.state) {
    const state = crypto.randomBytes(12).toString(`hex`);
    req.session.STATE = state;
    req.session.r = req.query.r;
    return req.session.save(() => {
      return res.redirect(
        `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&state=${state}`
      );
    });
  }

  if (req.query.state !== req.session.STATE) {
    return res.status(400).send(`State mismatch between requests.`);
  }

  let ACCESS_TOKEN;
  try {
    ACCESS_TOKEN = await getAccessTokenFromCode(
      req.query.code,
      req.session.STATE
    );
  } catch (e) {
    res.status(400).send(e.message);
  }

  req.session.ACCESS_TOKEN = ACCESS_TOKEN;
  const USER = await getUser(ACCESS_TOKEN);
  req.session.USER = USER;
  return res.redirect(
    req.session.r
      ? req.session.r
      : process.env.NODE_ENV === `development`
      ? `http://localhost:3000`
      : `/`
  );
});

app.get(`/logout`, (req, res) => {
  delete req.session.ACCESS_TOKEN;
  delete req.session.USER;
  return req.session.save(() =>
    res.redirect(
      process.env.NODE_ENV === `development` ? `http://localhost:3000` : `/`
    )
  );
});

module.exports = app;
