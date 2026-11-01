@echo off
node "%~dp0..\packages\cli\bin\pramanasutra.mjs" init %*
exit /b %errorlevel%
