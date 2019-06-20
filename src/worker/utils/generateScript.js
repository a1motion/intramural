const dotenv = require(`dotenv`);
module.exports = async (repo, build, job) => {
  let ACCESS_TOKEN = ``;
  if (repo.private) {
    const getToken = require(`./getToken`);
    const getInstallToken = require(`./getInstallToken`);
    ACCESS_TOKEN = await getInstallToken(getToken(), repo.install_id);
  }
  if (job.version === 1) {
    const full_name = build.pull_request ? build.full_name : repo.full_name;
    let script = `
    echo "Worker Info:"
    echo ""
    echo "Hostname:\t$(hostname)"
    echo "Startup:\t$(cut -d " " -f1 /proc/uptime)"
    echo ""

    export CI
    export NODE_ENV
    export PULL_REQUEST=${build.pull_request || `false`}

    [[ -s $NVM_DIR/nvm.sh ]] && . $NVM_DIR/nvm.sh
    echo "$ git clone --depth=50 --branch=${
      build.branch
    } https://github.com/${full_name}.git ${full_name}"

    git clone --depth=50 --branch=${build.branch} https://${
      repo.private ? `x-access-token:${ACCESS_TOKEN}@` : ``
    }github.com/${full_name}.git ${full_name}

    echo "$ cd ${full_name}"

    cd ${full_name}

    echo "$ git checkout -qf ${build.commit}"

    git checkout -qf ${build.commit}

    `;
    if (job.node) {
      script += `
    echo "$ nvm install ${job.node}"

    nvm install ${job.node}

    echo "$ nvm use ${job.node}"

    nvm use ${job.node}

    echo
    `;
    }
    job.steps.forEach((step) => {
      script += `
    echo "$ ${step}"

    ${step}

    echo
    `;
    });
    return script;
  }
  if (job.version === 2) {
    const full_name = build.pull_request ? build.full_name : repo.full_name;
    let script = align(`
    echo "Worker Info:"
    echo
    echo "Hostname:\t$(hostname)"
    echo "Startup:\t$(echo $(($(date +%s%3N) - ${Date.now()})))ms"
    echo
    `);
    script += `echo\n`;
    script += generateDeps(job.deps);
    script += `\necho\n`;
    script += align(`
    export CI=true
    export NODE_ENV=test
    export PULL_REQUEST=${build.pull_request || `false`}
    `);
    script += `echo\n`;
    script += generateEnv(
      dotenv.parse(repo.environment_variables || {}),
      false
    );
    script += `\necho\n`;
    script += `echo\n`;
    script += generateEnv(job.env);
    script += `\necho\n`;
    script += align(`
    [[ -s $NVM_DIR/nvm.sh ]] && . $NVM_DIR/nvm.sh
    echo "$ git clone --depth=50 --branch=${
      build.branch
    } https://github.com/${full_name}.git ${full_name}"
    git clone --depth=50 --branch=${build.branch} https://${
      repo.private ? `x-access-token:${ACCESS_TOKEN}@` : ``
    }github.com/${full_name}.git ${full_name}
    echo "$ cd ${full_name}"
    cd ${full_name}
    echo "$ git checkout -qf ${build.commit}"
    git checkout -qf ${build.commit}
    `);
    script += `echo\n`;
    script += generateUses(job.uses);
    script += `echo\n`;
    script += generateSteps(job.steps);
    script += `echo\n`;
    return align(script);
  }
  return ``;
};

function generateUses(uses) {
  let s = ``;
  for (const [name, version] of Object.entries(uses)) {
    if (name === `node`) {
      s += `
      echo "$ nvm install ${version}"
      nvm install ${version}
      `;
    }
  }
  return align(s);
}
function generateDeps(dep) {
  let s = ``;
  for (const [source, packages] of Object.entries(dep)) {
    if (source === `apt`) {
      s += packages
        .map(
          (a) => `sudo apt-get install -qqy -o=Dpkg::Use-Pty=0 ${a} > /dev/null`
        )
        .join(`\n`);
    }
  }
  return s;
}
function generateEnv(env, echo = true) {
  return Object.entries(env)
    .map(
      ([name, value]) =>
        `${
          echo ? `echo "export ${name}=${value}"\n` : ``
        }export ${name}=${value}`
    )
    .join(`\n`);
}
function generateSteps(steps) {
  return align(
    steps
      .map(
        (step) => `
      echo "$ ${step}"
      ${step} || exit $?
      `
      )
      .join(`\n`)
  );
}
const align = (string) => {
  const min = Math.min(
    ...string.split(`\n`).map((s) => {
      if (s.length === 0) {
        return Number.MAX_SAFE_INTEGER;
      }
      const r = /^( *).*/.exec(s);
      if (r === null) {
        return 0;
      }
      return r[1].length;
    })
  );
  return string
    .split(`\n`)
    .map((s) => s.substring(min))
    .join(`\n`);
};
