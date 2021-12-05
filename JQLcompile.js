require('esbuild')
  .build({
      entryPoints: ['./src/JQueryLike.js'],
      bundle: true,
      outfile: './lib/JQLBundle.js',
      sourcemap: false,
      minify: true,
      format: 'esm',
      target: ['esnext'],
      incremental: true,
    }
  ).then( _ => {
    console.log(`esbuild ok`);
    process.exit(0);
  })
  .catch((err) => {
    console.log(`ebuild not ok: ${err.message}`);
    process.exit(1);
  }
);

// disabled, over to chokidar. Watch is very expensive!
// watch: {
//   onRebuild(error, result) {
//     if (error) {
//       console.error('watch build failed:', error);
//     }
//     else {
//       console.log('watch build ok');
//     }
//   }
// }