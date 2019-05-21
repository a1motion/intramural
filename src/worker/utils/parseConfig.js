const yml = require(`js-yaml`)

module.exports = (doc) => {
  const config = yml.safeLoad(doc)
  if (!config.version) {
    return undefined
  }
  if (config.version === 1) {
    const c = {
      version: 1,
      jobs: [],
    }
    if (config.node) {
      if (!Array.isArray(config.node)) {
        config.node = [config.node]
      }
      config.node.forEach((version) => {
        c.jobs.push({
          version: 1,
          node: version,
          steps: config.steps,
        })
      })
    }
    return c
  }
  if (config.version === 2) {
  }
  return undefined
}
