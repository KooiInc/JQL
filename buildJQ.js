// remove 'splitting'
require('esbuild')
  .build({
      entryPoints: ['./src/JQueryLike.js'],
      bundle: true,
      outfile: './lib/JQLBundle.js',
      sourcemap: true,
      minify: true,
      format: 'esm',
      target: ['esnext'],
      watch: false,
  })
  .catch((err) => {
    console.log(err.message);
    process.exit(1);
  }
);