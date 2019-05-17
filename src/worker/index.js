require(`dotenv`).config()
const path = require(`path`)
const Bull = require(`bull`)

const builds = new Bull(`builds`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
})

const freshStart = new Bull(`fresh_start`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
})

const jobs = new Bull(`jobs`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
})

const jobFinished = new Bull(`job_finished`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
})

freshStart.process(1, path.join(__dirname, `fresh_start.js`))
builds.process(1, path.join(__dirname, `builds.js`))
jobs.process(1, path.join(__dirname, `jobs.js`))
jobFinished.process(
  process.env.NODE_ENV === `development`
    ? 1
    : require(`physical-cpu-count`) / 2,
  path.join(__dirname, `job_finished.js`)
)
