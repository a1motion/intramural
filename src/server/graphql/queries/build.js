const db = require(`../../db`)
const getReposForUser = require(`../utils/getReposForUser`)
const addBuildProps = require(`../utils/build/common`)

module.exports = async ({ id }, req) => {
  const { rows: builds } = await db.query(
    `select * from intramural_builds where id = $1`,
    [id]
  )
  if (builds.length === 0) {
    return null
  }
  const [build] = builds
  const {
    rows: [repo],
  } = await db.query(`select * from intramural_repos where id = $1`, [
    build.repo,
  ])
  if (repo.private) {
    if (
      !req.session.ACCESS_TOKEN ||
      !(await getReposForUser(req.session.ACCESS_TOKEN)).includes(
        Number(repo.id)
      )
    ) {
      return null
    }
  }
  addBuildProps(build)
  return build
}
