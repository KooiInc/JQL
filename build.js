import builder from 'esbuild';
import process from 'node:process';
const log = console.log.bind(console);
const esContext = {
  entryPoints: ['./index.js'],
  bundle: true,
  outfile: './Bundle/jql.min.js',
  treeShaking: true,
  sourcemap: false, // don't need it
  minify: true,
  format: 'esm',
  target: ['esnext'],
};

const ctx = await builder.context(esContext);
await ctx.rebuild().then(r => ctx.dispose());
process.exit();