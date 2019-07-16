const Bull = require(`bull`);
const db = require(`../server/db`);

const pJobs = new Bull(`jobs`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

module.exports = async (rerun) => {
  const { rows: jobs } = await db.query(
    `select * from intramural_jobs where id = $1`,
    [rerun.data.id]
  );
  if (jobs.length === 0) {
    return false;
  }

  const [job] = jobs;
  const {
    rows: [build],
  } = await db.query(
    `select *, (select full_name from intramural_repos r where r.id = b.repo) from intramural_builds b where num = $1 and repo = $2`,
    [job.build, job.repo]
  );
  return await pJobs.add({
    id: job.id,
    build: build.num,
    build_id: build.id,
    job: job.num,
    meta: job.config,
    checkRunId: rerun.data.checkRunId,
    repo: build.repo,
    branch: build.branch,
    commit: build.commit,
    full_name: build.full_name,
    origin: build.origin,
    pull_request: build.pull_request || undefined,
  });
};
