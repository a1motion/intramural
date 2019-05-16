const got = require(`gh-got`)

module.exports = async (jwt, install_id) => {
  const {
    body: { token },
  } = await got.post(`/app/installations/${install_id}/access_tokens`, {
    json: true,
    headers: {
      Accept: `application/vnd.github.machine-man-preview+json`,
      Authorization: `Bearer ${jwt}`,
    },
  })
  return token
}
