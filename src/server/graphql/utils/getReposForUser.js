const got = require(`gh-got`);
const CACHE = {};
module.exports = async function getRepos(accessToken) {
  if (CACHE[accessToken] && CACHE[accessToken].expires > Date.now()) {
    return CACHE[accessToken].data;
  }
  const {
    body: { installations },
  } = await got(`/user/installations`, {
    token: accessToken,
    json: true,
    headers: {
      Accept: `application/vnd.github.machine-man-preview+json`,
    },
  });
  const repos = [].concat(
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
        });
        return repositories;
      })
    ))
  );
  CACHE[accessToken] = {
    data: repos,
    expires: Date.now() + 1000 * 60 * 5,
  };
  return repos;
};
