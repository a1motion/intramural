const got = require(`gh-got`)
module.exports = async function getRepos(accessToken) {
  const {
    body: { installations },
  } = await got(`/user/installations`, {
    token: accessToken,
    json: true,
    headers: {
      Accept: `application/vnd.github.machine-man-preview+json`,
    },
  })
  return []
    .concat(
      ...(await Promise.all(
        installations.map(async (install) => {
          const {
            body: { repositories },
          } = await got(`/user/installations/${install.id}/repositories`, {
            token: accessToken,
            headers: {
              Accept: `application/vnd.github.machine-man-preview+json`,
            },
            json: true,
          })
          return repositories
        })
      ))
    )
    .map((repo) => repo.id)
}
