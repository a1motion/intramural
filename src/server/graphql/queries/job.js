const db = require(`../../db`);
const getReposForUser = require(`../utils/getReposForUser`);
const addJobProps = require(`../utils/job/common`);

module.exports = async ({ id }, req) => {
  const { rows: jobs } = await db.query(
    `select * from intramural_jobs where id = $1`,
    [id]
  );
  if (jobs.length === 0) {
    return null;
  }
  const [job] = jobs;
  const {
    rows: [repo],
  } = await db.query(`select * from intramural_repos where id = $1`, [
    job.repo,
  ]);
  if (repo.private) {
    if (
      !req.session.ACCESS_TOKEN ||
      !(await getReposForUser(req.session.ACCESS_TOKEN)).includes(
        Number(repo.id)
      )
    ) {
      return null;
    }
  }
  addJobProps(job);
  return job;
};
