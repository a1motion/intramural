const got = require(`gh-got`)
const db = require(`../../server/db`)
const getToken = require(`./getToken`)
const getInstallToken = require(`./getInstallToken`)

module.exports = async (
  build_id,
  repo_id,
  type,
  commit,
  status,
  jobsMin,
  jobsMax
) => {
  const {
    rows: [repo],
  } = await db.query(
    `select *, (select install_id from intramural_accounts acc where acc.id = owner) from intramural_repos where id = $1`,
    [repo_id]
  )
  const token = await getInstallToken(getToken(), repo.install_id)
  await got.post(`/repos/${repo.full_name}/statuses/${commit}`, {
    json: true,
    token,
    body: {
      state: status,
      context: `continuous-integration/intramural/${type}`,
      description: [`error`, `failure`].includes(status)
        ? `Intramural build failed.`
        : `(${jobsMin}/${jobsMax})`,
      target_url: `https://intramural.arcstatus.com/${
        repo.full_name
      }/builds/${build_id}`,
    },
  })
}
