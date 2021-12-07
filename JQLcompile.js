require('esbuild')
  .build({
    entryPoints: ['./src/JQueryLike.js'],
    bundle: true,
    outfile: './lib/JQLBundle.js',
    sourcemap: false,
    minify: true,
    treeShaking: true,
    format: 'esm',
    target: ['esnext'],
    incremental: true, }
  ).then( _ => {
    console.log(`esbuild ok`);
    process.exit(0);
  })
  .catch((err) => {
    console.log(`ebuild not ok: ${err.message}`);
    process.exit(1);
  }
);
