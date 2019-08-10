const execa = require(`execa`);
const Bull = require(`bull`);
const got = require(`gh-got`);
const colorCode = require(`@a1motion/color-code`);
const Sentry = require(`@sentry/node`);
const getToken = require(`./utils/getToken`);
const getInstallToken = require(`./utils/getInstallToken`);

const redis = new (require(`ioredis`))({
  host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
});

const debug = require(`debug`)(`intramural:worker:jobs`);
const { S3 } = require(`aws-sdk`);
const db = require(`../server/db`);
const generateScript = require(`./utils/generateScript`);

const jobFinished = new Bull(`job_finished`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const s3 = new S3({
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
});

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
          return reject(err);
        }

        return resolve();
      }
    );
  });
}

module.exports = async (job) => {
  const {
    rows: [repo],
  } = await db.query(
    `select *, (select install_id from intramural_accounts acc where acc.id = owner) from intramural_repos where id = $1`,
    [job.data.repo]
  );
  let token = await getInstallToken(getToken(), repo.install_id);
  try {
    await got.patch(
      `repos/${repo.full_name}/check-runs/${job.data.checkRunId}`,
      {
        json: true,
        body: {
          started_at: new Date().toISOString(),
          status: `in_progress`,
        },
        token,
        headers: {
          Accept: `application/vnd.github.antiope-preview+json`,
        },
      }
    );
    await db.query(
      `update intramural_jobs set status = $1, start_time = $2, tag = $3 where "id" = $4`,
      [`pending`, Date.now(), job.data.meta.name, job.data.id]
    );
    const script = await generateScript(repo, job.data, job.data.meta);
    debug(`Starting #${job.data.build}.${job.data.job} (${repo.full_name})`);
    const d = execa(
      `docker run -i --rm -m="4g" --memory-swap="6g" --cpus="1" intramural/intramural:latest /bin/bash`,
      {
        input: script,
        shell: true,
        reject: false,
      }
    );
    let logs = ``;
    d.all.on(`data`, (d) => {
      const s = d.toString();
      logs += s;
      redis.publish(`intramural:logs:${job.data.id}`, s);
      redis.set(`intramural:logs:${job.data.id}`, logs);
    });
    const r = await d;
    if (r.exitCode === 0) {
      await db.query(
        `update intramural_jobs set status = $1, end_time = $2 where "id" = $3`,
        [`success`, Date.now(), job.data.id]
      );
    } else {
      await db.query(
        `update intramural_jobs set status = $1, end_time = $2 where "id" = $3`,
        [`error`, Date.now(), job.data.id]
      );
    }

    token = await getInstallToken(getToken(), repo.install_id);
    await got.patch(
      `repos/${repo.full_name}/check-runs/${job.data.checkRunId}`,
      {
        json: true,
        body: {
          completed_at: new Date().toISOString(),
          conclusion: r.exitCode === 0 ? `success` : `failure`,
          output: {
            title:
              r.exitCode === 0
                ? `All Tests Passed`
                : `One or More Tests Failed`,
            summary: ``,
            text:
              colorCode(logs, { noHtml: true }).length > 65000
                ? `Logs are too long to display on Github.\nVist [#${job.data.job}](https://intramural.arcstatus.com/${repo.full_name}/jobs/${job.data.id})`
                : `\`\`\`\n${colorCode(logs, { noHtml: true })}\n\`\`\``,
          },
        },
        token,
        headers: {
          Accept: `application/vnd.github.antiope-preview+json`,
        },
      }
    );
    debug(
      `Finished #${job.data.build}.${job.data.job} (${repo.full_name}): ${r.exitCode} ${r.exitCodeName}`
    );
    debug(
      `Uploading Logs: ${job.data.build_id}/${job.data.id} (${repo.full_name})`
    );
    await uploadLogs(job.data.build_id, job.data.id, r.all);
    redis.del(`logs:${job.data.id}`);
    debug(
      `Uploaded Logs ${job.data.build_id}/${job.data.id} (${repo.full_name})`
    );
    jobFinished.add(
      {
        build: job.data.build_id,
        job: job.data.id,
      },
      {
        delay: 250 + Math.random() * 50,
      }
    );
  } catch (e) {
    Sentry.captureException(e);
    await db.query(
      `update intramural_jobs set status = $1, end_time = $2 where "id" = $3`,
      [`failure`, Date.now(), job.data.id]
    );
    await got.patch(
      `repos/${repo.full_name}/check-runs/${job.data.checkRunId}`,
      {
        json: true,
        body: {
          completed_at: new Date().toISOString(),
          conclusion: `failure`,
          output: {
            title: `Internal Failure`,
            summary: `There was an error on our end.`,
          },
        },
        token,
        headers: {
          Accept: `application/vnd.github.antiope-preview+json`,
        },
      }
    );
    jobFinished.add(
      {
        build: job.data.build_id,
        job: job.data.id,
      },
      {
        delay: 250 + Math.random() * 50,
      }
    );
  }
};
