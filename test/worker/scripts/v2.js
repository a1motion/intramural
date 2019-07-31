import test from "ava";
import { promises as fs } from "fs";
import { join } from "path";
import generateScript from "../../../src/worker/utils/generateScript";

const genScript = async (t) => {
  let s = await generateScript(
    {
      full_name: `a1motion/reware`,
    },
    {
      branch: `master`,
      commit: `d5e8f9c7d252600b5f5c253681f9dea8c37a9d9b`,
    },
    t
  );
  // remove startup uncertainy
  s = s.split(`\n`);
  s = [].concat(s.slice(0, 4), s.slice(5)).join(`\n`);
  return s;
};

test(`simple`, async (t) => {
  const s = await genScript({
    version: 2,
    deps: {},
    env: {},
    uses: {
      node: 10,
    },
    steps: [`yarn test`],
  });
  t.snapshot(s);
});

test(`should add apt deps`, async (t) => {
  const s = await genScript({
    version: 2,
    deps: {
      apt: [`libpng-dev`],
    },
    env: {},
    uses: {
      node: 10,
    },
    steps: [`yarn test`],
  });
  t.snapshot(s);
});

test(`should add env var`, async (t) => {
  const s = await genScript({
    version: 2,
    deps: {},
    env: {
      TEST_ENV: true,
    },
    name: `Node 10`,
    uses: {
      node: 10,
    },
    steps: [`yarn test`],
  });
  t.snapshot(s);
});
