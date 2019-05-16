const got = require(`gh-got`)
const Bull = require(`bull`)
const db = require(`../server/db`)
const getToken = require(`./utils/getToken`)
const getInstallToken = require(`./utils/getInstallToken`)

const builds = new Bull(`builds`, {
  redis: {
    host: process.env.NODE_ENV === `development` ? `localhost` : `redis`,
  },
})

module.exports = async (job) => {
  try {
    const {
      rows: [repo],
    } = await db.query(
      `select *, (select install_id from intramural_accounts acc where acc.id = owner) from intramural_repos where id = $1`,
      [job.data.repo]
    )
    const token = await getInstallToken(getToken(), repo.install_id)
    const { body: branches } = await got(`/repos/${repo.full_name}/branches`, {
      token,
      json: true,
    })
    branches.forEach((branch) => {
      builds.add({
        repo: repo.id,
        branch: branch.name,
        commit: branch.commit.sha,
        origin: `branch`,
      })
    })
  } catch (e) {
    console.log(e)
  }
}
