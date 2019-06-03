const app = require(`express`).Router();
const got = require(`gh-got`);
const db = require(`../db`);
const LRU = require(`lru-cache`);
const repoCache = new LRU({
  max: 1000,
  maxAge: 15000,
});
app.get(`/`, async (req, res) => {
  if (!req.session || !req.session.USER) {
    return res.sendStatus(401);
  }
  const cached_repos = repoCache.get(req.session.ACCESS_TOKEN);
  if (cached_repos) {
    return res.json(cached_repos);
  }
  const {
    body: { installations },
  } = await got(`/user/installations`, {
    token: req.session.ACCESS_TOKEN,
    json: true,
    headers: {
      Accept: `application/vnd.github.machine-man-preview+json`,
    },
  });
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
          });
          return repositories;
        })
      ))
    )
    .map((repo) => repo.id);
  const { rows: repos } = await db.query(
    `SELECT r.*,
        b.status, b.start_time, b.end_time
    FROM intramural_repos AS r
    LEFT JOIN LATERAL
      (SELECT status, start_time, end_time
        FROM intramural_builds
        WHERE repo = r.id
          AND branch = 'master'
        ORDER BY id DESC
        LIMIT 1
      ) AS b ON TRUE
    WHERE id = ANY($1);`,
    [r]
  );
  repoCache.set(req.session.ACCESS_TOKEN, repos);
  return res.json(repos);
});

module.exports = app;
