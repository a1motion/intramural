const Bull = require(`bull`);

const builds = new Bull(`builds`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const jobs = new Bull(`jobs`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

module.exports = async () => {
  const [pendingBuilds, pendingJobs] = await Promise.all(
    builds.getWaitingCount(),
    jobs.getWaitingCount()
  );
  return { pendingBuilds, pendingJobs };
};
