const LRU = require(`lru-cache`);
const db = require(`../../db`);
const getReposForUser = require(`../utils/getReposForUser`);
const renameProperties = require(`../utils/repo/renameProperties`);
const attachLastBuild = require(`../utils/repo/attachLastBuild`);
const attachOwner = require(`../utils/repo/attachOwner`);
const attachBuilds = require(`../utils/repo/attachBuilds`);

const repoCache = new LRU({
  max: 1000,
  maxAge: 15000,
});

module.exports = async (_, req) => {
  if (!req.session || !req.session.USER) {
    throw new Error(`Not Logged In`);
  }

  const cached_repos = repoCache.get(req.session.ACCESS_TOKEN);
  if (cached_repos) {
    return cached_repos;
  }

  const r = (await getReposForUser(req.session.ACCESS_TOKEN)).map(
    (repo) => repo.id
  );
  const { rows: repos } = await db.query(
    `SELECT * FROM intramural_repos WHERE id = ANY($1);`,
    [r]
  );
  repos.forEach((repo) => {
    renameProperties(repo);
    attachOwner(repo);
    attachLastBuild(repo);
    attachBuilds(repo, req);
    repo.hasWriteAccess = async () => {
      const rs = await getReposForUser(req.session.ACCESS_TOKEN);
      const r = rs.find((a) => a.id === Number(repo.id));
      if (!r) {
        return false;
      }

      return r.permissions.admin === true;
    };

    repo.environmentVariables = async () => {
      if (!(await repo.hasWriteAccess())) {
        return null;
      }

      return repo.environment_variables;
    };
  });
  repoCache.set(req.session.ACCESS_TOKEN, repos);
  return repos;
};
