import test from "ava";
import { promises as fs } from "fs";
import { join } from "path";
import generateScript from "../../../src/worker/utils/generateScript";

const genScript = (t) =>
  generateScript(
    {
      full_name: `a1motion/reware`,
    },
    {
      branch: `master`,
      commit: `d5e8f9c7d252600b5f5c253681f9dea8c37a9d9b`,
    },
    t
  );
const getFixtures = async (f) =>
  (await fs.readFile(join(__dirname, `..`, `fixtures`, f))).toString();

test(`simple`, async (t) => {
  const s = await genScript({
    version: 1,
    node: 10,
    steps: [`yarn test`],
  });
  t.is(s, await getFixtures(`simple.v1.script.txt`));
});
