const app = require(`express`).Router({
  mergeParams: true,
});
const db = require(`../db`);
const getReposForUser = require(`../graphql/utils/getReposForUser`);

app.post(`/`, async (req, res) => {
  if (!req.session.USER) {
    return res.status(400).end();
  }

  const fullName = `${req.params.owner}/${req.params.repo}`;
  console.log(fullName);
  const { rows: repos } = await db.query(
    `SELECT * FROM intramural_repos WHERE full_name = $1`,
    [fullName]
  );
  if (repos.length === 0) {
    return res.status(404).end();
  }

  const [repo] = repos;
  const rs = await getReposForUser(req.session.ACCESS_TOKEN);
  const r = rs.find((a) => a.id === Number(repo.id));
  if (!r) {
    return res.status(400).end();
  }

  const { env } = req.body;
  await db.query(
    `update intramural_repos set environment_variables = $1 where id = $2`,
    [env, repo.id]
  );
  return res.status(200).end();
});

module.exports = app;
