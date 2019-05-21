const { S3 } = require(`aws-sdk`)
const db = require(`../../../db`)

const s3 = new S3({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
})

module.exports = (job) => {
  job.endTime = job.end_time
  job.startTime = job.start_time
  job.status = job.status.toUpperCase()
  job.build_num = job.build
  job.build = async () => {
    let {
      rows: [build],
    } = await db.query(
      `select * from intramural_builds where repo = $1 and num = $2`,
      [job.repo, job.build_num]
    )
    build = require(`../build/common`)(build)
    return build
  }
  job.log = () => {
    return new Promise(async (resolve) => {
      const {
        rows: [build],
      } = await db.query(
        `select id from intramural_builds where repo = $1 and num = $2`,
        [job.repo, job.build_num]
      )
      s3.getObject(
        {
          Bucket: `intramural-logs`,
          Key: `${build.id}/${job.id}`,
        },
        (err, data) => {
          if (err) {
            return resolve(null)
          }
          return resolve(data.Body.toString())
        }
      )
    })
  }
  return job
}
