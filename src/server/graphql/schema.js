const fs = require(`fs`);
const path = require(`path`);
const { buildSchema } = require(`graphql`);

module.exports = {
  schema: buildSchema(
    fs.readFileSync(path.join(__dirname, `schema.gql`)).toString()
  ),
  rootValue: {
    viewer: (_, req) => {
      return req.session.USER;
    },
    repository: require(`./queries/repository`),
    repositories: require(`./queries/repositories`),
    build: require(`./queries/build`),
    job: require(`./queries/job`),
  },
};
