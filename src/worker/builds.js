const got = require(`gh-got`);
const Bull = require(`bull`);
const debug = require(`debug`)(`intramural:worker:builds`);
const Sentry = require(`@sentry/node`);
const db = require(`../server/db`);
const getToken = require(`./utils/getToken`);
const getInstallToken = require(`./utils/getInstallToken`);
const parseConfig = require(`./utils/parseConfig`);

const pJobs = new Bull(`jobs`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

module.exports = async (job) => {
  try {
    const {
      rows: [repo],
    } = await db.query(
      `select *, (select install_id from intramural_accounts acc where acc.id = owner) from intramural_repos where id = $1`,
      [job.data.repo]
    );
    const token = await getInstallToken(getToken(), repo.install_id);
    let config;
    const { body } = await got(
      `/repos/${repo.full_name}/contents/.intramural.yml`,
      {
        token,
        json: true,
      }
    );
    if (body.type !== `file`) {
      debug(
        `${repo.full_name} does not have a .intramural.yml config file, skipping.`
      );
      return;
    }

    config = Buffer.from(body.content, body.encoding).toString();
    config = parseConfig(config);
    if (!config) {
      debug(
        `${repo.full_name} does not have a valid .intramural.yml config file, skipping.`
      );
      return;
    }

    const { rows: old_builds } = await db.query(
      `select num from intramural_builds where repo = $1 order by num desc limit 1`,
      [repo.id]
    );
    let build_id;
    if (old_builds.length === 0) {
      build_id = 1;
    } else {
      build_id = Number.parseInt(old_builds[0].num, 10) + 1;
    }

    const {
      rows: [b],
    } = await db.query(
      `insert into intramural_builds values (DEFAULT, $1, $2, $3, $4, $5, null, $6, $7, $8) returning *`,
      [
        repo.id,
        build_id,
        job.data.branch,
        job.data.commit,
        Date.now(),
        job.data.origin,
        job.data.origin === `pr` ? job.data.pull_request : null,
        `pending`,
      ]
    );
    debug(`Starting build #${build_id} (${b.id}) for ${repo.full_name}`);
    await Promise.all(
      config.jobs.map(async (j, i) => {
        const {
          rows: [t],
        } = await db.query(
          `insert into intramural_jobs (repo, build, num, os, tag, status, config) values ($1, $2, $3, $4, $5, $6, $7) returning * `,
          [repo.id, build_id, i + 1, `Ubuntu 18.10`, j.name, `waiting`, j]
        );
        debug(`Created #${build_id}.${i + 1}`);
        const { body } = await got.post(`repos/${repo.full_name}/check-runs`, {
          json: true,
          body: {
            name: `[intramural] ${j.name}`,
            head_sha: job.data.commit,
            details_url: `https://intramural.arcstatus.com/${repo.full_name}/jobs/${t.id}`,
            external_id: t.id,
          },
          headers: {
            Accept: `application/vnd.github.antiope-preview+json`,
          },
          token,
        });
        await pJobs.add({
          ...job.data,
          id: t.id,
          build: build_id,
          build_id: b.id,
          job: i + 1,
          meta: j,
          checkRunId: body.id,
        });
      })
    );
  } catch (e) {
    Sentry.captureException(e);
  }
};
