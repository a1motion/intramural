require(`dotenv`).config();
const path = require(`path`);
const Bull = require(`bull`);
const Sentry = require(`@sentry/node`);

Sentry.init({
  dsn: `https://c53d5d37f1f24e0a98b21606586abbf7@sentry.a1motion.com/11`,
});

const builds = new Bull(`builds`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const freshStart = new Bull(`fresh_start`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const jobs = new Bull(`jobs`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const jobFinished = new Bull(`job_finished`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const rerun = new Bull(`rerun_job`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

freshStart.process(1, path.join(__dirname, `fresh_start.js`));
builds.process(1, path.join(__dirname, `builds.js`));
jobs.process(
  process.env.NODE_ENV === `development`
    ? 1
    : require(`physical-cpu-count`) / 2,
  path.join(__dirname, `jobs.js`)
);
jobFinished.process(1, path.join(__dirname, `job_finished.js`));
rerun.process(1, path.join(__dirname, `rerun.js`));
