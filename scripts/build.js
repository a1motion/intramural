const aws = require('aws-sdk') //eslint-disable-line
const fs = require(`fs`)
const path = require(`path`)
const mime = require(`mime`)
const execa = require(`execa`)
require(`dotenv`).config()

const start = Date.now()

const bin = path.join(__dirname, `..`, `node_modules`, `.bin`)

const s3 = new aws.S3()
function promisify(func, dir) {
  return new Promise((resolve, reject) => {
    func(dir, (err, data) => {
      if (err) {
        return reject(err)
      }
      return resolve(data)
    })
  })
}
const lstat = (dir) => promisify(fs.lstat, dir)
const readdir = (dir) => promisify(fs.readdir, dir)
const readFile = (file) => promisify(fs.readFile, file)
const upload = (opts) => promisify(s3.putObject.bind(s3), opts)

function flattenDeep(arr) {
  return arr.reduce(
    (acc, e) => (Array.isArray(e) ? acc.concat(flattenDeep(e)) : acc.concat(e)),
    []
  )
}
async function getFilesInDir(dir) {
  let files = await readdir(dir)
  files = files.map((file) => path.join(dir, file))
  const stats = await Promise.all(files.map((file) => lstat(file)))
  const data = await Promise.all(
    files.map((file, i) => {
      if (stats[i].isDirectory()) {
        return getFilesInDir(file)
      }
      return file
    })
  )
  return flattenDeep(data)
}
function contentType(src, ext) {
  return (mime.getType(ext || src) || ``).replace(`-`, ``)
}

const deploy = async () => {
  const files = await getFilesInDir(`./build/client`)
  await files.map(async (file) => {
    let Key = path.relative(`./build/client`, file)
    const Body = await readFile(file)
    if (Key.endsWith(`.map`)) {
      return false
    }
    const CacheControl =
      Key === `index.html`
        ? `no-cache, no-store, must-revalidate`
        : `public, max-age=31536000`
    const Bucket = `public.a1motion.com`
    Key = Key.replace(/\\/g, `/`)
    Key = `mural/${Key}`
    return upload({
      Body,
      CacheControl,
      Key,
      Bucket,
      ContentLength: Body.length,
      ContentType: contentType(file),
    })
  })
}

const release = async () => {
  const sentryCli = path.join(bin, `sentry-cli`)

  const VERSION = require(`../package.json`).version

  await execa(`${sentryCli} releases new -p a1motion ${VERSION}`, {
    shell: true,
    env: process.env,
  })
  await execa(`${sentryCli} releases set-commits --auto ${VERSION}`, {
    shell: true,
    env: process.env,
  })
  const dur = Math.floor((Date.now() - start) / 1000)
  await execa(
    `${sentryCli} releases deploys ${VERSION} new -e production -t ${dur}`,
    {
      shell: true,
      env: process.env,
    }
  )
}

const build = async () => {
  const reactAppRewired = path.join(bin, `react-app-rewired`)
  await execa(reactAppRewired, [`build`], {
    shell: true,
    env: { ...process.env, PUBLIC_URL: `https://cdn.a1motion.com/` },
  })
}

const main = async () => {
  try {
    //await build()
    await deploy()
    //await release()
  } catch (e) {
    console.log()
    console.log(e)
  }
}
main()
