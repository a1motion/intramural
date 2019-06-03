const db = require(`../../../db`);
const getReposForUser = require(`../getReposForUser`);
const addBuildProperties = require(`../build/common`);

module.exports = (repo, req) => {
  repo.builds = async () => {
    if (repo.private === true) {
      if (
        !(await getReposForUser(req.session.ACCESS_TOKEN)).includes(
          Number(repo.id)
        )
      ) {
        throw new Error(`No`);
      }
    }
    const { rows: builds } = await db.query(
      `select distinct on (branch) *, (select count(*) from intramural_builds t where t.branch = b.branch and repo = $1) as total_builds from intramural_builds b where repo = $1 order by branch, "id" desc`,
      [repo.id]
    );
    builds.forEach((build) => {
      addBuildProperties(build);
    });
    return builds;
  };
  return repo;
};
