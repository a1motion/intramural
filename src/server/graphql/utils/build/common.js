const db = require(`../../../db`)

module.exports = (build) => {
  build.totalBuilds = build.total_builds || 0
  build.endTime = build.end_time
  build.startTime = build.start_time
  build.status = build.status.toUpperCase()
  build.jobs = async () => {
    let { rows: jobs } = await db.query(
      `select * from intramural_jobs where repo = $1 and build = $2`,
      [build.repo, build.num]
    )
    jobs = jobs.map(require(`../job/common`))
    return jobs
  }
  return build
}
