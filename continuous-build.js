import * as builder from "esbuild";
import fs from "fs";
import process from "node:process";
import dtFormat from "../DateFormat/index.js";
const log = console.log.bind(console);
const isDev = fs.existsSync(`./.DEV`);
const esContext = {
  entryPoints: ['./index.js'],
  bundle: true,
  outfile: './bundle/jql.min.js',
  treeShaking: true,
  sourcemap: isDev,
  minify: true,
  format: 'esm',
  target: ['esnext'],
};

const plugins = [{
  name: 'pluggedin',
  setup(build) {
    let count = 0;
    build.onEnd(result => {
      count += 1;
      return onRebuild(result.errors, count < 1);
    });
  },
}];
const onRebuild = (errors, first) => {
  const now = dtFormat(new Date(), `dd-mm-yyyy hh:mmi:ss`, `l:nl`);
  if (errors.length) {
    return log(`${first ? `first ` : ``}esbuild [JQL class free] ${now} -> not ok!`);
  }
  log(`${first ? `first ` : ``}esbuild [JQL class free] ${now} -> ok`);
};
const ctx = await builder.context({...esContext, plugins });
await ctx.watch();
process.on(`exit`, () => ctx.dispose());
