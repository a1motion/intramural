import test from "ava";
import { promises as fs } from "fs";
import { join } from "path";
import parseConfig from "../../../src/worker/utils/parseConfig";

const getFixtures = async (f) =>
  (await fs.readFile(
    join(__dirname, `..`, `fixtures`, `config`, f)
  )).toString();

test(`simple`, async (t) => {
  const c = parseConfig(await getFixtures(`simple.v1.config.yml`));
  t.deepEqual(c, {
    version: 1,
    jobs: [
      {
        version: 1,
        node: 10,
        steps: [`yarn`],
      },
    ],
  });
});

test(`multiple steps`, async (t) => {
  const c = parseConfig(await getFixtures(`multiple-steps.v1.config.yml`));
  t.deepEqual(c, {
    version: 1,
    jobs: [
      {
        version: 1,
        node: 10,
        steps: [`yarn`, `yarn lint`, `yarn test`],
      },
    ],
  });
});

test(`multiple node versions`, async (t) => {
  const c = parseConfig(await getFixtures(`multiple-node.v1.config.yml`));
  t.deepEqual(c, {
    version: 1,
    jobs: [
      {
        version: 1,
        node: 10,
        steps: [`yarn`],
      },
      {
        version: 1,
        node: 12,
        steps: [`yarn`],
      },
    ],
  });
});
