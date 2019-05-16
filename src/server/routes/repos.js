const app = require(`express`).Router()
const got = require(`gh-got`)
const db = require(`../db`)
app.get(`/`, async (req, res) => {
  if (!req.session.USER) {
    return res.sendStatus(401)
  }
  const {
    body: { installations },
  } = await got(`/user/installations`, {
    token: req.session.ACCESS_TOKEN,
    json: true,
    headers: {
      Accept: `application/vnd.github.machine-man-preview+json`,
    },
  })
  const r = []
    .concat(
      ...(await Promise.all(
        installations.map(async (install) => {
          const {
            body: { repositories },
          } = await got(`/user/installations/${install.id}/repositories`, {
            token: req.session.ACCESS_TOKEN,
            headers: {
              Accept: `application/vnd.github.machine-man-preview+json`,
            },
            json: true,
          })
          return repositories
        })
      ))
    )
    .map((repo) => repo.id)
  const { rows: repos } = await db.query(
    `select * from intramural_repos where id = any($1)`,
    [r]
  )
  return res.json(repos)
})

module.exports = app
