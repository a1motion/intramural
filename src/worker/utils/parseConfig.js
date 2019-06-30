const yml = require(`js-yaml`);

function normalizeSteps(oldSteps) {
  const newSteps = Object.assign({}, oldSteps);
  for (const [key, steps] of Object.entries(newSteps)) {
    let s;
    if (typeof steps === `string`) {
      s = [steps];
    } else if (Array.isArray(steps)) {
      s = Array.from(steps);
    } else {
      throw new Error(`Steps must be a string or an array of strings.`);
    }

    if (s.some((a) => typeof a !== `string`)) {
      throw new Error(`Currently only supporting simple bash scripts.`);
    }

    newSteps[key] = s;
  }

  return newSteps;
}

module.exports = (doc) => {
  const config = yml.safeLoad(doc);
  if (!config.version) {
    return undefined;
  }

  if (config.version === 1) {
    const c = {
      version: 1,
      jobs: [],
    };
    if (config.node) {
      if (!Array.isArray(config.node)) {
        config.node = [config.node];
      }

      config.node.forEach((version) => {
        c.jobs.push({
          version: 1,
          node: version,
          steps: config.steps,
        });
      });
    }

    return c;
  }

  if (config.version === 2) {
    const c = {
      version: 2,
      jobs: [],
    };
    const GLOBAL_VARIABLES = { ...config.env };
    const GLOBAL_USES = { ...config.uses };
    const GLOBAL_STEPS = normalizeSteps({ ...config.steps });
    const GLOBAL_DEPS = normalizeSteps({ ...config.deps });
    config.jobs = config.jobs || [];
    config.jobs.forEach((job) => {
      const j = {
        version: 2,
        env: { ...GLOBAL_VARIABLES, ...job.env },
        uses: { ...GLOBAL_USES, ...job.uses },
        deps: GLOBAL_DEPS,
      };
      let s = [];
      job.steps = normalizeSteps({ $: job.steps }).$;
      job.steps.forEach((step) => {
        let alias = /^&([\w]+)$/.exec(step);
        if (alias !== null) {
          [, alias] = alias // eslint-disable-line
          if (GLOBAL_STEPS[alias]) {
            s = s.concat(GLOBAL_STEPS[alias]);
          }
        } else {
          s.push(step);
        }
      });
      j.steps = s;
      c.jobs.push(j);
    });
    return c;
  }

  return undefined;
};
