$ErrorActionPreference = "Stop"

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$launcher = Join-Path $projectDir "Start_Game.ps1"

& $launcher
