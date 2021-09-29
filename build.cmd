@echo off
echo esbuild
node buildJQ.js
echo docs
jsdoc ./src -t ./docs -d ./api -R ./src/readme.md
echo done!