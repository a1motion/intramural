const execa = require(`execa`)
const Bull = require(`bull`)
const debug = require(`debug`)(`intramural:worker:jobs`)
const { S3 } = require(`aws-sdk`)
const db = require(`../server/db`)
const generateScript = require(`./utils/generateScript`)

const jobFinished = new Bull(`job_finished`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
})

const s3 = new S3()

function uploadLogs(build, job, logs) {
  return new Promise((resolve, reject) => {
    s3.putObject(
      {
        Key: `${build}/${job}`,
        Bucket: `intramural-logs`,
        ContentType: `text/plain`,
        Body: logs,
      },
      (err) => {
        if (err) {
          return reject(err)
        }
        return resolve()
      }
    )
  })
}

module.exports = async (job) => {
  try {
    const {
      rows: [repo],
    } = await db.query(
      `select *, (select install_id from intramural_accounts acc where acc.id = owner) from intramural_repos where id = $1`,
      [job.data.repo]
    )
    await db.query(
      `update intramural_jobs set status = $1, start_time = $2 where "id" = $3`,
      [`pending`, Date.now(), job.data.id]
    )
    const script = generateScript(repo, job.data, job.data.meta)
    debug(`Starting #${job.data.build}.${job.data.job}`)
    const d = execa(
      `docker run -i --rm -m 2G --cpus 1 intramural/intramural:latest /bin/bash`,
      {
        input: script,
        shell: true,
        reject: false,
      }
    )
    const r = await d
    if (r.exitCode === 0) {
      await db.query(
        `update intramural_jobs set status = $1, end_time = $2 where "id" = $3`,
        [`success`, Date.now(), job.data.id]
      )
    } else {
      await db.query(
        `update intramural_jobs set status = $1, end_time = $2 where "id" = $3`,
        [`error`, Date.now(), job.data.id]
      )
    }
    debug(
      `Finished #${job.data.build}.${job.data.job}: ${r.exitCode} ${
        r.exitCodeName
      }`
    )
    debug(`Uploading Logs: ${job.data.build_id}/${job.data.id}`)
    await uploadLogs(job.data.build_id, job.data.id, r.all)
    debug(`Uploaded Logs`)
    jobFinished.add(
      {
        build: job.data.build_id,
        job: job.data.id,
      },
      {
        delay: 250 + Math.random() * 50,
      }
    )
  } catch (e) {
    console.log(e)
    await db.query(
      `update intramural_jobs set status = $1, end_time = $2 where "id" = $3`,
      [`failure`, Date.now(), job.data.id]
    )
  }
}
