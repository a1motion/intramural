const db = require(`../../../db`)
const getREposForUser = require(`../getReposForUser`)
const addBuildProperties = require(`../build/common`)
console.log(addBuildProperties)
module.exports = (repo, req) => {
  repo.builds = async () => {
    if (repo.private === true) {
      if (
        !(await getREposForUser(req.session.ACCESS_TOKEN, repo.id)).includes(
          repo.id
        )
      ) {
        throw new Error(`No`)
      }
    }
    const { rows: builds } = await db.query(
      `select distinct on (branch) *, (select count(*) from intramural_builds t where t.branch = b.branch) as total_builds from intramural_builds b where repo = $1 order by branch, "id" desc`,
      [repo.id]
    )
    builds.forEach((build) => {
      addBuildProperties(build)
    })
    return builds
  }
  return repo
}
