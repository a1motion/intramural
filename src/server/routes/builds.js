const app = require(`express`).Router();
const got = require(`got`);
const db = require(`../db`);

async function checkIfHasRepoAccess(accessToken, repo) {
  const {
    body: { installations },
  } = await got(`/user/installations`, {
    token: accessToken,
    json: true,
    headers: {
      Accept: `application/vnd.github.machine-man-preview+json`,
    },
  });
  return []
    .concat(
      ...(await Promise.all(
        installations.map(async (install) => {
          const {
            body: { repositories },
          } = await got(`/user/installations/${install.id}/repositories`, {
            token: accessToken,
            headers: {
              Accept: `application/vnd.github.machine-man-preview+json`,
            },
            json: true,
          });
          return repositories;
        })
      ))
    )
    .map((repo) => repo.id)
    .includes(repo);
}

app.get(`/:owner/:repo`, async (req, res) => {
  const { rows: repos } = await db.query(
    `select * from intramural_repos where full_name = $1`,
    [`${req.params.owner}/${req.params.repo}`]
  );
  if (repos.length === 0) {
    return res.json({ error: 404 });
  }
  const [repo] = repos;
  if (repo.private === true) {
    if (!(await checkIfHasRepoAccess(req.session.ACCESS_TOKEN, repo.id))) {
      return res.json({ error: 401 });
    }
  }
  const { rows: builds } = await db.query(
    `select distinct on (branch) *, (select count(*) from intramural_builds t where t.branch = b.branch) as total_builds from intramural_builds b where repo = $1 order by branch, "id" desc`,
    [repo.id]
  );
  return res.json(builds);
});

module.exports = app;
