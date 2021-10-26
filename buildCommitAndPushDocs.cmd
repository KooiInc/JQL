@echo off
cmd /c jsdoc ./src -t ../JQLDocs/docs -d ../JQLDocs/API -R ./src/Readme.md
ping -n 1 127.0.0.1 > nul
copy .\src\Readme.md .\Readme.md > nul
echo Documents done, copied readme.md to root
set dd=%date:~9,4%/%date:~6,2%/%date:~3,2% %time:~0,8%
cd \web.data\JQLDocs\API
cmd /c git commit -a -m "Auto update %dd%"
cmd /c git push
cd \web.data\JQL
echo Committed and pushed docs to git
