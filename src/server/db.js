const { Pool } = require(`pg`);

const db = Pool({
  user: process.env.MAIN_DB_USER,
  host: process.env.MAIN_DB_HOST,
  password: process.env.MAIN_DB_PASSWORD,
  database: process.env.MAIN_DB_DATABASE,
});

module.exports = db;
