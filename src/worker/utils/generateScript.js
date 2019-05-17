module.exports = (repo, build, job) => {
  let script = `
echo "Worker Info:\n"
echo "Hostname:\t$(hostname)"
echo "Startup:\t$(cut -d " " -f1 /proc/uptime)"
echo ""

export CI
export NODE_ENV
export PULL_REQUEST=${build.pull_request || `false`}

[[ -s $NVM_DIR/nvm.sh ]] && . $NVM_DIR/nvm.sh
echo "$ git clone --depth=50 --branch=${build.branch} https://github.com/${
    build.pull_request ? build.full_name : repo.full_name
  }.git ${build.pull_request ? build.full_name : repo.full_name}"

git clone --depth=50 --branch=${build.branch} https://github.com/${
    build.pull_request ? build.full_name : repo.full_name
  }.git ${build.pull_request ? build.full_name : repo.full_name}

echo "$ cd ${build.pull_request ? build.full_name : repo.full_name}"

cd ${build.pull_request ? build.full_name : repo.full_name}

echo "$ git checkout -qf ${build.commit}"

git checkout -qf ${build.commit}

`
  if (job.node) {
    script += `
echo "$ nvm install ${job.node}"

nvm install ${job.node}

echo "$ nvm use ${job.node}"

nvm use ${job.node}

echo
`
  }
  job.steps.forEach((step) => {
    script += `
echo "$ ${step}"

${step}

echo
`
  })
  return script
}
