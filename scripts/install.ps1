$ErrorActionPreference = 'Stop'
$scriptFile = Join-Path $PSScriptRoot '..\packages\cli\bin\pramanasutra.mjs'
& node $scriptFile init @args
exit $LASTEXITCODE
