const fs = require(`fs`);
const path = require(`path`);
const jwt = require(`jsonwebtoken`);

const PRIVATE_KEY = fs
  .readFileSync(path.join(__dirname, `../../..`, `private-key.pem`))
  .toString();

module.exports = () =>
  jwt.sign({}, PRIVATE_KEY, {
    issuer: process.env.APP_ID,
    expiresIn: `10m`,
    algorithm: `RS256`,
  });
