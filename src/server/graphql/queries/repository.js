const db = require(`../../db`)
const renameProperties = require(`../utils/repo/renameProperties`)
const attachLastBuild = require(`../utils/repo/attachLastBuild`)
const attachOwner = require(`../utils/repo/attachOwner`)
const attachBuilds = require(`../utils/repo/attachBuilds`)

module.exports = async ({ fullName }, req) => {
  const { rows: repos } = await db.query(
    `SELECT * FROM intramural_repos WHERE full_name = $1`,
    [fullName]
  )
  if (repos.length === 0) {
    return null
  }
  const [repo] = repos
  renameProperties(repo)
  attachOwner(repo)
  attachLastBuild(repo)
  attachBuilds(repo, req)
  return repo
}
