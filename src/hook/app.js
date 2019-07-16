const { Pool } = require(`pg`);
const debug = require(`debug`)(`intramural:hook`);
const Bull = require(`bull`);

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

const rerun = new Bull(`rerun_job`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
});

const db = Pool({
  user: process.env.MAIN_DB_USER,
  host: process.env.MAIN_DB_HOST,
  password: process.env.MAIN_DB_PASSWORD,
  database: process.env.MAIN_DB_DATABASE,
});

module.exports = (app) => {
  app.on([`installation.created`], async (context) => {
    const { installation, repositories } = context.payload;
    const { account } = installation;
    debug(
      `New Install with the following repos: ${repositories.map(
        (a) => a.full_name
      )}`
    );
    await createOrUpdateAccount(account, installation);
    await createOrUpdateRepos(account, repositories);
    repositories.forEach((repo) => {
      freshStart.add({
        repo: repo.id,
      });
    });
  });
  /*app.on([`installation_repositories.added`], async (context) => {
    const { installation, repositories_added } = context.payload;
    const { account } = installation;
    debug(
      `Repos added to existing install with the following repos: ${repositories_added.map(
        (a) => a.full_name
      )}`
    );
    await createOrUpdateAccount(account, installation);
    await createOrUpdateRepos(account, repositories_added);
    repositories_added.forEach((repo) => {
      freshStart.add({
        repo: repo.id,
      });
    });
  });
  app.on([`push`], async (context) => {
    const { repository, ref, after, before } = context.payload;
    const branch = /refs\/(tags|heads)\/(.*)/.exec(ref);
    if (!branch || branch === null) {
      return;
    }

    builds.add({
      repo: repository.id,
      branch: branch[2],
      commit:
        after === `0000000000000000000000000000000000000000` ? before : after,
      origin: `branch`,
    });
  });
  app.on(
    [`pull_request.opened`, `pull_request.synchronize`],
    async (context) => {
      const { pull_request } = context.payload;
      const {
        head: { repo: head_repo, ref, sha },
        base: { repo: base_repo },
      } = pull_request;
      if (head_repo.full_name === base_repo.full_name) {
        debug(
          `Pull Request ${head_repo.full_name}#${pull_request.number} skipped because it is also a branch. (${ref})`
        );
        return;
      }

      builds.add({
        repo: base_repo.id,
        branch: ref,
        commit: sha,
        origin: `pr`,
        pull_request: pull_request.number,
        full_name: head_repo.full_name,
      });
    }
  );*/
  app.on([`check_suite.requested`], async (context) => {
    const {
      check_suite: { head_branch, head_sha, pull_requests },
      repository: { id: repo_id, full_name },
    } = context.payload;
    builds.add({
      repo: repo_id,
      branch: head_branch,
      commit: head_sha,
      origin: pull_requests.length === 0 ? `branch` : `pr`,
      pull_request:
        pull_requests.length === 0 ? undefined : pull_requests[0].number,
      full_name,
    });
  });
  app.on([`check_run.rerequested`], async (context) => {
    const {
      check_run: { id, external_id },
    } = context.payload;
    rerun.add({
      checkRunId: id,
      id: external_id,
    });
  });
};

async function createOrUpdateAccount(account, installation) {
  await db.query(
    `insert into intramural_accounts values ($1, $2, $3, $4${
      installation ? `, $5` : ``
    }) on conflict (id) do update set name = $2, "type" = $3, avatar_url = $4${
      installation ? `, install_id = $5` : ``
    }`,
    [
      account.id,
      account.login,
      account.type,
      account.avatar_url,
      installation && installation.id,
    ].filter(Boolean)
  );
}

async function createOrUpdateRepos(account, repositories) {
  await Promise.all(
    repositories.map(async (repo) => {
      await db.query(
        `insert into intramural_repos values ($1, $2, $3, $4, $5) on conflict (id) do update set full_name = $2, name = $3, owner = $4, private = $5`,
        [repo.id, repo.full_name, repo.name, account.id, repo.private]
      );
    })
  );
}
