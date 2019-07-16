import test from "ava";
import { promises as fs } from "fs";
import { join } from "path";
import parseConfig from "../../../src/worker/utils/parseConfig";

const getFixtures = async (f) =>
  (await fs.readFile(join(__dirname, `..`, `fixtures`, f))).toString();

test(`simple`, async (t) => {
  const c = parseConfig(await getFixtures(`simple.v2.config.yml`));
  t.deepEqual(c, {
    version: 2,
    jobs: [
      {
        version: 2,
        deps: {},
        env: {},
        name: `Node 10`,
        uses: {
          node: 10,
        },
        steps: [`yarn`],
      },
    ],
  });
});

test(`named jobs`, async (t) => {
  const c = parseConfig(await getFixtures(`namedJobs.v2.config.yml`));
  t.deepEqual(c, {
    version: 2,
    jobs: [
      {
        version: 2,
        deps: {},
        env: {},
        name: `Test Name`,
        uses: {
          node: 10,
        },
        steps: [`yarn`],
      },
    ],
  });
});
