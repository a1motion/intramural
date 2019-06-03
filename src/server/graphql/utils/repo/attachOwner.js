const db = require(`../../../db`);

module.exports = (repo) => {
  repo.old_owner_id = repo.owner;
  repo.owner = async () => {
    const {
      rows: [owner],
    } = await db.query(`select * from intramural_accounts where "id" = $1`, [
      repo.old_owner_id,
    ]);
    return owner;
  };
  return repo;
};
