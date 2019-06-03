const app = require(`express`).Router();

app.get(`/`, (req, res) => {
  if (req.session && req.session.USER) {
    return res.json(req.session.USER);
  }
  return res.json(null);
});

module.exports = app;
