const app = require(`express`).Router();
const db = require(`../db`);

const BUILD_PASSING = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="88" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="88" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h37v20H0z"/><path fill="#4c1" d="M37 0h51v20H37z"/><path fill="url(#b)" d="M0 0h88v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="195" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="270">build</text><text x="195" y="140" transform="scale(.1)" textLength="270">build</text><text x="615" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="410">passing</text><text x="615" y="140" transform="scale(.1)" textLength="410">passing</text></g> </svg>`;
const BUILD_FAILING = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="80" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="80" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h37v20H0z"/><path fill="#e05d44" d="M37 0h43v20H37z"/><path fill="url(#b)" d="M0 0h80v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="195" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="270">build</text><text x="195" y="140" transform="scale(.1)" textLength="270">build</text><text x="575" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="330">failing</text><text x="575" y="140" transform="scale(.1)" textLength="330">failing</text></g> </svg>`;
const BUILD_NOT_FOUND = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="142" height="20"><linearGradient id="b" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient><clipPath id="a"><rect width="142" height="20" rx="3" fill="#fff"/></clipPath><g clip-path="url(#a)"><path fill="#555" d="M0 0h37v20H0z"/><path fill="#9f9f9f" d="M37 0h105v20H37z"/><path fill="url(#b)" d="M0 0h142v20H0z"/></g><g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="110"> <text x="195" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="270">build</text><text x="195" y="140" transform="scale(.1)" textLength="270">build</text><text x="885" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="950">project not found</text><text x="885" y="140" transform="scale(.1)" textLength="950">project not found</text></g> </svg>`;

const STATUSES = {
  0: `waiting`,
  1: `pending`,
  2: `success`,
  3: `error`,
  4: `failure`,
  waiting: 0,
  pending: 1,
  success: 2,
  error: 3,
  failure: 4,
};

const sendBadge = (branch) => async (req, res) => {
  const { rows: repos } = await db.query(
    `select * from intramural_repos where full_name = $1`,
    [`${req.params.owner}/${req.params.repo}`]
  );
  if (repos.length === 0) {
    return res.type(`image/svg+xml`).send(BUILD_NOT_FOUND);
  }
  const [repo] = repos;
  const { rows: builds } = await db.query(
    `select * from intramural_builds where repo = $1 and branch = $2 order by id desc limit 1`,
    [repo.id, branch]
  );
  if (builds.length === 0) {
    return res.type(`image/svg+xml`).send(BUILD_NOT_FOUND);
  }
  const [build] = builds;
  const { rows: jobs } = await db.query(
    `select * from intramural_jobs where repo = $1 and build = $2`,
    [repo.id, build.num]
  );
  let status = STATUSES[Math.max(...jobs.map((t) => STATUSES[t.status]))];
  if (jobs.some((j) => [`waiting`, `pending`].includes(j.status))) {
    status = `pending`;
  }
  if (status === `success`) {
    return res.type(`image/svg+xml`).send(BUILD_PASSING);
  }
  if ([`failure`, `error`].includes(status)) {
    return res.type(`image/svg+xml`).send(BUILD_FAILING);
  }
  return res.send(``);
};

app.get(`/:owner/:repo`, sendBadge(`master`));

module.exports = app;
