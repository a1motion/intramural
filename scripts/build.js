const aws = require('aws-sdk') //eslint-disable-line
const fs = require(`fs`);
const path = require(`path`);
const mime = require(`mime`);
const execa = require(`execa`);
require(`dotenv`).config();

const start = Date.now();

const bin = path.join(__dirname, `..`, `node_modules`, `.bin`);

const s3 = new aws.S3();
function promisify(func, dir) {
  return new Promise((resolve, reject) => {
    func(dir, (err, data) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}
const lstat = (dir) => promisify(fs.lstat, dir);
const readdir = (dir) => promisify(fs.readdir, dir);
const readFile = (file) => promisify(fs.readFile, file);
const upload = (opts) => promisify(s3.putObject.bind(s3), opts);

function flattenDeep(arr) {
  return arr.reduce(
    (acc, e) => (Array.isArray(e) ? acc.concat(flattenDeep(e)) : acc.concat(e)),
    []
  );
}
async function getFilesInDir(dir) {
  let files = await readdir(dir);
  files = files.map((file) => path.join(dir, file));
  const stats = await Promise.all(files.map((file) => lstat(file)));
  const data = await Promise.all(
    files.map((file, i) => {
      if (stats[i].isDirectory()) {
        return getFilesInDir(file);
      }
      return file;
    })
  );
  return flattenDeep(data);
}
function contentType(src, ext) {
  return (mime.getType(ext || src) || ``).replace(`-`, ``);
}

const deploy = async () => {
  const files = await getFilesInDir(`./build/client`);
  await files.map(async (file) => {
    let Key = path.relative(`./build/client`, file);
    const Body = await readFile(file);
    if (Key.endsWith(`.map`)) {
      return false;
    }
    const CacheControl =
      Key === `index.html`
        ? `no-cache, no-store, must-revalidate`
        : `public, max-age=31536000`;
    const Bucket = `public.a1motion.com`;
    Key = Key.replace(/\\/g, `/`);
    Key = `mural/${Key}`;
    try {
      return await upload({
        Body,
        CacheControl,
        Key,
        Bucket,
        ContentLength: Body.length,
        ContentType: contentType(file),
      });
    } catch {
      return null;
    }
  });
};

const main = async () => {
  try {
    await deploy();
  } catch (e) {
    console.log();
    console.log(e);
  }
};
main();
