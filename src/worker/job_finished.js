const db = require(`../server/db`)
const sendGithubStatus = require(`./utils/sendGithubStatus`)

const STATUSES = {
  0: `waiting`,
  1: `pending`,
  2: `success`,
  3: `error`,
  4: `failure`,
  waiting: 0,
  pending: 1,
  success: 2,
  error: 3,
  failure: 4,
}

module.exports = async (job) => {
  try {
    const {
      rows: [build_info],
    } = await db.query(`select * from intramural_builds where "id" = $1`, [
      job.data.build,
    ])
    const {
      rows: [repo],
    } = await db.query(`select * from intramural_repos where "id" = $1`, [
      build_info.repo,
    ])
    const { rows: jobs } = await db.query(
      `select * from intramural_jobs where repo = $1 and build = $2`,
      [repo.id, build_info.num]
    )
    let status = STATUSES[Math.max(...jobs.map((t) => STATUSES[t.status]))]
    if (jobs.some((j) => [`waiting`, `pending`].includes(j.status))) {
      status = `pending`
    }
    await sendGithubStatus(
      repo.id,
      build_info.origin,
      build_info.commit,
      status,
      jobs.filter((j) => j.status === `success`).length,
      jobs.length
    )
  } catch (e) {
    console.log(e)
  }
}
