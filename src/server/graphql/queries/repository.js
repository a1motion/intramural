const db = require(`../../db`);
const renameProperties = require(`../utils/repo/renameProperties`);
const attachLastBuild = require(`../utils/repo/attachLastBuild`);
const attachOwner = require(`../utils/repo/attachOwner`);
const attachBuilds = require(`../utils/repo/attachBuilds`);
const getReposForUser = require(`../utils/getReposForUser`);

module.exports = async ({ fullName }, req) => {
  const { rows: repos } = await db.query(
    `SELECT * FROM intramural_repos WHERE full_name = $1`,
    [fullName]
  );
  if (repos.length === 0) {
    return null;
  }

  const [repo] = repos;
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

  return repo;
};
