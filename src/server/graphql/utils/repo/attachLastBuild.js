const db = require(`../../../db`);

module.exports = (repo) => {
  repo.lastBuild = async ({ branch }) => {
    const { rows: builds } = await db.query(
      `select * from intramural_builds where repo = $1 and branch = $2 order by "id" desc limit 1`,
      [repo.id, branch]
    );
    if (builds.length === 0) {
      return null;
    }
    const [build] = builds;
    build.status = build.status.toUpperCase();
    return build;
  };
  return repo;
};
