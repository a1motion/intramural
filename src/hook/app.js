const { Pool } = require(`pg`)

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

const db = Pool({
  user: process.env.MAIN_DB_USER,
  host: process.env.MAIN_DB_HOST,
  password: process.env.MAIN_DB_PASSWORD,
  database: process.env.MAIN_DB_DATABASE,
})

module.exports = (app) => {
  app.on([`installation.created`], async (context) => {
    const { installation, repositories } = context.payload
    const { account } = installation
    await createOrUpdateRepos(installation, account, repositories)
    repositories.forEach((repo) => {
      freshStart.add({
        repo: repo.id,
      })
    })
  })
  app.on([`installation_repositories.added`], async (context) => {
    const { installation, repositories_added } = context.payload
    const { account } = installation
    await createOrUpdateRepos(installation, account, repositories_added)
    repositories_added.forEach((repo) => {
      freshStart.add({
        repo: repo.id,
      })
    })
  })
  app.on([`push`], async (context) => {
    const { repository, ref, after, before } = context.payload
    const branch = /refs\/(tags|heads)\/(.*)/.exec(ref)
    if (!branch || branch === null) {
      return
    }
    builds.add({
      repo: repository.id,
      branch: branch[2],
      commit: after || before,
      origin: `branch`,
    })
  })
  app.on([`pull_request.opened`], async (context) => {
    const { pull_request } = context.payload
    const {
      head: { repo: head_repo, ref, sha },
      base: { repo: base_repo },
    } = pull_request
    if (head_repo.full_name === base_repo.full_name) {
      return
    }
    builds.add({
      repo: base_repo.id,
      branch: ref,
      commit: sha,
      origin: `pr`,
      pull_request: pull_request.number,
      full_name: head_repo.full_name,
    })
  })
}

async function createOrUpdateRepos(installation, account, repositories) {
  await db.query(
    `insert into intramural_accounts values ($1, $2, $3, $4, $5) on conflict (id) do update set name = $2, "type" = $3, avatar_url = $4, install_id = $5`,
    [
      account.id,
      account.login,
      account.type,
      account.avatar_url,
      installation.id,
    ]
  )
  await Promise.all(
    repositories.map(async (repo) => {
      await db.query(
        `insert into intramural_repos values ($1, $2, $3, $4, $5) on conflict (id) do update set full_name = $2, name = $3, owner = $4, private = $5`,
        [repo.id, repo.full_name, repo.name, account.id, repo.private]
      )
    })
  )
}
